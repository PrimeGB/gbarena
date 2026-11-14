begin;

-- Result aggregation must also tolerate legacy roster snapshots and duplicate IDs.
-- Bypass only new-match roster admission; result, audit and refresh triggers remain active.
alter table public.matches disable trigger matches_capture_rosters;
do $$
declare
  season_uuid uuid := gen_random_uuid();
  template public.matches%rowtype;
  player_a uuid;
  player_b uuid;
  player_c uuid;
  new_match public.matches%rowtype;
  match_ids uuid[] := '{}';
  match_uuid uuid;
  friend_uuid uuid;
  tournament_uuid uuid := gen_random_uuid();
  final_uuid uuid := gen_random_uuid();
  tournament_template public.tournaments%rowtype;
  earlier_season uuid;
  month_start timestamptz;
  tied_players uuid[] := '{}';
  count_before bigint;
  result jsonb;
  i integer;
begin
  select * into strict template from public.matches
    where finalized and status='completed' and winning_team_id is not null and losing_team_id is not null
    order by completed_at desc limit 1;
  select id into strict player_a from public.profiles order by created_at,id limit 1;
  select id into strict player_b from public.profiles where id<>player_a order by created_at,id limit 1;
  select id into strict player_c from public.profiles where id not in (player_a,player_b) order by created_at,id limit 1;
  insert into public.seasons(id,number,name,starts_at,ends_at)
    values(season_uuid,9999,'Test Season','2026-05-01Z','2026-06-01Z');
  for i in 1..5 loop
    match_uuid := gen_random_uuid();
    select * into new_match from jsonb_populate_record(null::public.matches,
      to_jsonb(template) || jsonb_build_object(
        'id',match_uuid,'match_post_id',null,'completed_at','2026-05-15T12:00:00Z',
        'created_at','2026-05-15T10:00:00Z','game','audit-test-game','ladder','audit-test-ladder',
        'winning_user_ids',array[player_a,player_a,player_c],'losing_user_ids',array[player_b],
        'status','completed','finalized',true
      ));
    insert into public.matches select new_match.*;
    match_ids := array_append(match_ids,match_uuid);
  end loop;
  perform public.gb_refresh_season(season_uuid);
  if (select count(*) from public.season_standings_archive where season_id=season_uuid
      and kind='players' and scope='global' and eligible_place=1 and wins=5)<>2 then
    raise exception 'Equal eligible records must share first place; duplicate roster IDs must not inflate wins';
  end if;
  if exists(select 1 from public.season_honours where season_id=season_uuid and entity_id=player_b and revoked_at is null)
    or (select count(*) from public.season_honours where season_id=season_uuid and kind='players'
      and scope='global' and honour='top10' and revoked_at is null)<>2 then
    raise exception 'Top 10 eligibility must require at least one win';
  end if;
  if (select count(*) from public.season_honours where season_id=season_uuid and entity_id=player_a
      and honour='champion' and revoked_at is null)<>3 then
    raise exception 'Global, game and game/ladder champions must be recognised';
  end if;
  select count(*) into count_before from public.season_honours where season_id=season_uuid;
  perform public.gb_refresh_season(season_uuid);
  if count_before<>(select count(*) from public.season_honours where season_id=season_uuid) then
    raise exception 'Refreshing a season duplicated honours';
  end if;
  update public.matches set finalized=false where id=match_ids[1];
  if not exists(select 1 from public.season_refresh_queue where season_id=season_uuid) then
    raise exception 'Result corrections must queue archive reconciliation';
  end if;
  perform public.gb_process_season_refreshes();
  if exists(select 1 from public.season_honours where season_id=season_uuid and revoked_at is null) then
    raise exception 'Corrected sub-five-match competitors kept their honours';
  end if;
  for i in 1..6 loop
    new_match.id:=gen_random_uuid();
    insert into public.matches select new_match.*;
  end loop;
  perform public.gb_refresh_season(season_uuid);
  if not exists(select 1 from public.season_honours where season_id=season_uuid and entity_id=player_a
    and honour='undefeated' and wins=10 and losses=0 and revoked_at is null) then
    raise exception 'Perfect season must unlock at exactly ten wins and no losses';
  end if;
  update public.matches set winning_team_id=template.losing_team_id,losing_team_id=template.winning_team_id,
    winning_user_ids=array[player_b],losing_user_ids=array[player_a,player_c] where id=match_ids[2];
  perform public.gb_process_season_refreshes();
  if exists(select 1 from public.season_honours where season_id=season_uuid and entity_id=player_a
    and honour='undefeated' and revoked_at is null) then
    raise exception 'A corrected loss must revoke the perfect-season relic';
  end if;
  select row into result from public.gb_season_board(season_uuid,'players','global',100) row
    where row->>'id'=player_a::text;
  if (result->>'wins')::integer<>9 or (result->>'losses')::integer<>1 then
    raise exception 'Archived board did not reflect the official correction';
  end if;
  if not exists(select 1 from public.gb_season_results(season_uuid)
    where kind='players' and scope='global' and entity_id=player_b and wins=1 and eligible_place is not null) then
    raise exception 'One win in at least five matches must satisfy win eligibility';
  end if;
  if has_table_privilege('authenticated','public.season_honours','INSERT')
    or has_function_privilege('authenticated','public.gb_refresh_season(uuid)','EXECUTE') then
    raise exception 'Clients must not grant honours or rewrite archived standings';
  end if;

  for i in 1..11 loop tied_players:=array_append(tied_players,gen_random_uuid()); end loop;
  new_match.winning_user_ids:=tied_players;
  for i in 1..5 loop
    new_match.id:=gen_random_uuid();
    insert into public.matches select new_match.*;
  end loop;
  perform public.gb_refresh_season(season_uuid);
  if (select count(*) from public.season_honours where season_id=season_uuid and honour='top10'
    and kind='players' and entity_id=any(tied_players) and place=3 and revoked_at is null)<>11 then
    raise exception 'The Top 10 boundary must include every competitor sharing an eligible place';
  end if;
  new_match.winning_user_ids:=array[player_a,player_c];
  for i in 1..35 loop
    new_match.id:=gen_random_uuid();
    insert into public.matches select new_match.*;
  end loop;
  perform public.gb_refresh_season(season_uuid);
  if not exists(select 1 from public.season_honours where season_id=season_uuid and kind='teams'
    and entity_id=template.winning_team_id and honour='iron_competitor'
    and wins+losses=50 and revoked_at is null) then
    raise exception 'Iron Competitor must unlock at fifty finalized matches';
  end if;
  foreach month_start in array array['2026-03-01Z'::timestamptz,'2026-04-01Z'::timestamptz] loop
    earlier_season:=gen_random_uuid();
    insert into public.seasons(id,number,name,starts_at,ends_at)
      values(earlier_season,9996+extract(month from month_start)::integer-3,
        'Test Earlier Season',month_start,month_start+interval '1 month');
    new_match.completed_at:=month_start+interval '1 day';
    for i in 1..5 loop
      new_match.id:=gen_random_uuid();
      insert into public.matches select new_match.*;
    end loop;
  end loop;
  perform public.gb_process_season_refreshes();
  if not exists(select 1 from public.season_honours where season_id=season_uuid and entity_id=player_a
    and honour='dynasty' and revoked_at is null) then
    raise exception 'The third global championship must unlock the Dynasty seal';
  end if;
  update public.matches set finalized=false
    where completed_at>='2026-03-01Z' and completed_at<'2026-04-01Z' and game='audit-test-game';
  perform public.gb_process_season_refreshes();
  if exists(select 1 from public.season_honours where season_id=season_uuid and entity_id=player_a
    and honour='dynasty' and revoked_at is null) then
    raise exception 'Overturning an earlier championship must reconcile later Dynasty honours';
  end if;

  select * into strict tournament_template from public.tournaments order by created_at limit 1;
  tournament_template.id:=tournament_uuid;
  tournament_template.status:='live';
  tournament_template.title:='Test Tournament Champion';
  insert into public.tournaments select tournament_template.*;
  insert into public.tournament_matches(id,tournament_id,round,slot,team_a,team_b,created_at)
    values(final_uuid,tournament_uuid,1,0,template.winning_team_id,template.losing_team_id,now()-interval '10 days');
  if exists(select 1 from public.gb_community_moments where id='tournament:' || tournament_uuid::text) then
    raise exception 'An undecided tournament must not announce a champion';
  end if;
  update public.tournament_matches set winner_id=template.winning_team_id where id=final_uuid;
  perform public.gb_advance_bracket_winner(final_uuid);
  if not exists(select 1 from public.gb_community_moments where id='tournament:' || tournament_uuid::text
    and at=now() and cardinality(user_ids)=0) then
    raise exception 'Tournament wins must use decision time without falsely crediting current team members';
  end if;

  -- Rivalry uses the previous finalized meeting, not an arbitrary earlier loss.
  new_match.id:=gen_random_uuid();
  new_match.completed_at:=now()-interval '2 hours';
  new_match.created_at:=now()-interval '3 hours';
  new_match.winning_team_id:=template.losing_team_id;
  new_match.losing_team_id:=template.winning_team_id;
  new_match.winning_user_ids:=array[player_b];
  new_match.losing_user_ids:=array[player_a,player_c];
  insert into public.matches select new_match.*;
  new_match.id:=gen_random_uuid();
  new_match.completed_at:=now()-interval '1 hour';
  new_match.winning_team_id:=template.winning_team_id;
  new_match.losing_team_id:=template.losing_team_id;
  new_match.winning_user_ids:=array[player_a,player_c];
  new_match.losing_user_ids:=array[player_b];
  insert into public.matches select new_match.*;
  insert into public.team_match_rank_movement(team_id,match_id,previous_place,current_place,recorded_at)
    values(new_match.winning_team_id,new_match.id,5,3,now())
    on conflict(team_id) do update set match_id=excluded.match_id,previous_place=5,current_place=3,recorded_at=now();
  if not exists(select 1 from public.gb_community_moments
    where id='climb:' || new_match.winning_team_id::text || ':' || new_match.id::text) then
    raise exception 'A verified team rank climb must appear in community activity';
  end if;
  if not exists(select 1 from public.gb_community_moments where id='rival:' || new_match.id::text) then
    raise exception 'A rematch win after losing the previous meeting must appear in the feed';
  end if;
  update public.matches set finalized=false where id=new_match.id;
  if exists(select 1 from public.gb_community_moments where id='rival:' || new_match.id::text
      or id='match:' || new_match.id::text
      or id='climb:' || new_match.winning_team_id::text || ':' || new_match.id::text) then
    raise exception 'Unfinalized/corrected results must not remain in the winning feed';
  end if;
  perform public.gb_process_season_refreshes();
  if exists(select 1 from public.season_honours h join public.seasons s on s.id=h.season_id
    where s.ends_at>now() and h.revoked_at is null) then
    raise exception 'An ongoing season must not grant final honours';
  end if;

  update public.profiles set friends_public=true,show_public_friends=true where id in (player_a,player_b);
  select id into friend_uuid from public.friend_requests
    where (requester_id=player_a and recipient_id=player_b) or (requester_id=player_b and recipient_id=player_a)
    limit 1;
  if friend_uuid is null then
    insert into public.friend_requests(requester_id,recipient_id,status,responded_at)
      values(player_a,player_b,'accepted',now()) returning id into friend_uuid;
  else
    update public.friend_requests set status='accepted',responded_at=now() where id=friend_uuid;
  end if;
  if not exists(select 1 from public.gb_community_moments where id='friend:' || friend_uuid::text) then
    raise exception 'Public accepted friendship was not included';
  end if;
  perform set_config('request.jwt.claim.sub',player_a::text,true);
  perform public.gb_toggle_activity_reaction('friend:' || friend_uuid::text,'gg');
  perform public.gb_toggle_activity_favorite('friend:' || friend_uuid::text);
  update public.profiles set friends_public=false where id=player_b;
  if exists(select 1 from public.gb_recent_activity(50,false) item where item->>'id'='friend:' || friend_uuid::text)
    or exists(select 1 from public.gb_user_activity_favorites() item where item->>'id'='friend:' || friend_uuid::text) then
    raise exception 'Private friendship leaked through the feed or saved Favorites';
  end if;
end;
$$;

alter table public.matches enable trigger matches_capture_rosters;
rollback;
