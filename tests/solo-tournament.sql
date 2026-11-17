-- Run after the solo tournament migration in a transaction; roll everything back.
do $$
declare
  founder uuid;
  test_id uuid := gen_random_uuid();
  players uuid[];
  player uuid;
  reporter uuid;
  confirmer uuid;
  m public.tournament_player_matches%rowtype;
  champion uuid;
  original_credits integer;
  visible_count integer;
  rejected boolean;
  disputed boolean := false;
  completed_count integer := 0;
  i integer;
begin
  if has_table_privilege('authenticated', 'public.tournament_player_matches', 'update')
     or has_function_privilege('anon', 'public.confirm_player_tournament_match(uuid)', 'execute')
     or has_function_privilege('authenticated', 'public.gb_finish_player_tournament_match(uuid,uuid,uuid)', 'execute') then
    raise exception 'Direct bracket mutation or an internal function is exposed';
  end if;
  select id into founder from public.profiles where role = 'owner' limit 1;
  if founder is null then raise exception 'A founder is required for this test'; end if;

  -- Null emails ensure test profiles do not send welcome messages.
  insert into auth.users (id, raw_user_meta_data)
    values (gen_random_uuid(), jsonb_build_object('username', 'Tournament fixture ' || gen_random_uuid())),
           (gen_random_uuid(), jsonb_build_object('username', 'Tournament fixture ' || gen_random_uuid())),
           (gen_random_uuid(), jsonb_build_object('username', 'Tournament fixture ' || gen_random_uuid()));
  select array_agg(id) into players from
    (select id from public.profiles where id <> founder and coalesce(role, '') not in ('owner', 'admin') limit 12) p;
  if coalesce(array_length(players, 1), 0) <> 12 then raise exception 'Twelve profiles are required for the bracket test'; end if;

  perform set_config('request.jwt.claim.sub', '', true);
  insert into public.tournaments (id, title, game, format, team_size, starts_at, max_teams, is_free, entry_fee,
    entry_fee_credits, prize_credits, prize, status, entry_kind, min_players, winner_award, target_score)
  values (test_id, 'Rollback-only solo tournament', 'Battlefield 6', 'Single Elimination', '1v1', null, 12, true, 0,
    0, 10, 'Tournament Winner Trophy', 'upcoming', 'player', 12, 'Tournament Winner Trophy', 25);

  for i in 1..11 loop
    perform set_config('request.jwt.claim.sub', players[i]::text, true);
    perform public.register_player_for_tournament(test_id);
  end loop;
  rejected := false;
  begin
    perform public.register_player_for_tournament(test_id);
  exception when raise_exception then
    if sqlerrm not like '%already registered%' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'Duplicate registration was accepted'; end if;

  perform set_config('request.jwt.claim.sub', '', true);
  update public.tournaments set starts_at = now() - interval '1 minute' where id = test_id;
  perform set_config('request.jwt.claim.sub', founder::text, true);
  rejected := false;
  begin
    perform public.generate_player_tournament_bracket(test_id);
  exception when raise_exception then
    if sqlerrm not like '%At least 12 players%' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'Bracket started below the 12-player minimum'; end if;

  perform set_config('request.jwt.claim.sub', '', true);
  update public.tournaments set starts_at = null where id = test_id;
  perform set_config('request.jwt.claim.sub', players[12]::text, true);
  perform public.register_player_for_tournament(test_id);
  perform set_config('request.jwt.claim.sub', founder::text, true);
  rejected := false;
  begin
    perform public.generate_player_tournament_bracket(test_id);
  exception when raise_exception then
    if sqlerrm not like '%start time%' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'A bracket started before its date was set'; end if;
  rejected := false;
  begin
    perform public.register_player_for_tournament(test_id);
  exception when raise_exception then
    if sqlerrm not like '%full%' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'Tournament exceeded its player limit'; end if;

  perform set_config('request.jwt.claim.sub', '', true);
  update public.tournaments set starts_at = now() - interval '1 minute' where id = test_id;
  perform set_config('request.jwt.claim.sub', founder::text, true);
  perform public.generate_player_tournament_bracket(test_id);
  if (select count(*) from public.tournament_player_matches where tournament_id = test_id and round = 1) <> 8
     or (select count(*) from public.tournament_player_matches where tournament_id = test_id and status = 'bye') <> 4 then
    raise exception 'Twelve players did not produce the expected sixteen-slot bracket and four byes';
  end if;

  loop
    select * into m from public.tournament_player_matches
    where tournament_id = test_id and status = 'pending' and player_a is not null and player_b is not null
    order by round, slot limit 1;
    exit when not found;
    reporter := m.player_a;
    confirmer := m.player_b;
    if m.round = (select max(round) from public.tournament_player_matches where tournament_id = test_id) then
      perform set_config('request.jwt.claim.sub', confirmer::text, true);
      if public.has_staff_permission('staff_access') then
        reporter := m.player_b;
        confirmer := m.player_a;
      end if;
      perform set_config('request.jwt.claim.sub', confirmer::text, true);
      if public.has_staff_permission('staff_access') then raise exception 'Final confirmation test needs a non-staff player'; end if;
    end if;
    perform set_config('request.jwt.claim.sub', reporter::text, true);
    if completed_count = 0 then
      perform set_config('request.jwt.claim.sub', founder::text, true);
      rejected := false;
      begin
        perform public.report_player_tournament_match(m.id, 25, 7);
      exception when raise_exception then
        if sqlerrm not like '%Only the players%' then raise; end if;
        rejected := true;
      end;
      if not rejected then raise exception 'A nonparticipant reported a match'; end if;
      perform set_config('request.jwt.claim.sub', reporter::text, true);
      rejected := false;
      begin
        perform public.report_player_tournament_match(m.id, 24, 23);
      exception when raise_exception then
        if sqlerrm not like '%winner must reach 25%' then raise; end if;
        rejected := true;
      end;
      if not rejected then raise exception 'An invalid winning score was accepted'; end if;
    end if;
    perform public.report_player_tournament_match(m.id, 25, 7);
    rejected := false;
    begin
      perform public.confirm_player_tournament_match(m.id);
      rejected := false;
      begin
        perform public.confirm_player_tournament_match(m.id);
      exception when raise_exception then
        if sqlerrm not like '%other player%' then raise; end if;
        rejected := true;
      end;
      if not rejected then raise exception 'A completed result was confirmed twice'; end if;
    exception when raise_exception then
      if sqlerrm not like '%other player%' then raise; end if;
      rejected := true;
    end;
    if not rejected then raise exception 'Reporter confirmed their own result'; end if;
    perform set_config('request.jwt.claim.sub', confirmer::text, true);
    if not disputed then
      perform public.dispute_player_tournament_match(m.id, 'The submitted score is incorrect.');
      if (select winner_id from public.tournament_player_matches where id = m.id) is not null then
        raise exception 'A disputed result advanced prematurely';
      end if;
      execute 'set local role authenticated';
      select count(*) into visible_count from public.tournament_player_disputes where match_id = m.id;
      if visible_count <> 1 then raise exception 'The participant cannot view the dispute'; end if;
      player := (select p from unnest(players) p where p not in (m.player_a, m.player_b) limit 1);
      perform set_config('request.jwt.claim.sub', player::text, true);
      select count(*) into visible_count from public.tournament_player_disputes where match_id = m.id;
      if visible_count <> 0 then raise exception 'Another tournament player can see a private dispute'; end if;
      perform set_config('request.jwt.claim.sub', founder::text, true);
      select count(*) into visible_count from public.tournament_player_disputes where match_id = m.id;
      if visible_count <> 1 then raise exception 'Match staff cannot review the dispute'; end if;
      execute 'reset role';
      perform public.resolve_player_tournament_dispute(m.id, 8, 25, 'Evidence confirms the second player won.');
      if (select winner_id from public.tournament_player_matches where id = m.id) <> m.player_b then
        raise exception 'Staff decision did not advance the corrected winner';
      end if;
      disputed := true;
    else
      if m.round = (select max(round) from public.tournament_player_matches where tournament_id = test_id) then
        champion := m.player_a;
        select credits into original_credits from public.profiles where id = champion;
      end if;
      perform public.confirm_player_tournament_match(m.id);
    end if;
    completed_count := completed_count + 1;
  end loop;
  if completed_count <> 11 or champion is null then raise exception 'The bracket did not reach a final winner'; end if;
  if (select status from public.tournaments where id = test_id) <> 'completed'
     or (select credits from public.profiles where id = champion) <> original_credits + 10
     or not exists (select 1 from public.tournament_player_prizes where tournament_id = test_id and winner_id = champion)
     or not exists (select 1 from public.staff_user_awards a join public.staff_award_catalog c on c.id = a.award_id
       where a.recipient_id = champion and c.name = 'Tournament Winner Trophy' and a.reason like '%Rollback-only solo tournament%') then
    raise exception 'Final winner, credits, or profile award was not recorded';
  end if;
end;
$$;
