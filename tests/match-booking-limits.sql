-- Run inside a transaction with the booking limits migration and roll back.
do $$
#variable_conflict use_variable
declare
  posting public.teams%rowtype;
  accepting public.teams%rowtype;
  post_ids uuid[] := '{}';
  match_ids uuid[] := '{}';
  post_id uuid;
  match_id uuid;
  scheduled timestamptz := now() + interval '2 hours';
  rejected boolean;
  i integer;
begin
  select a.* into posting
  from public.teams a
  where a.owner_id is not null
    and exists (select 1 from public.team_members m where m.team_id = a.id and m.user_id = a.owner_id)
    and public.gb_gaming_account_id(a.owner_id, a.platform, a.category, a.game) is not null
    and not exists (select 1 from public.match_posts p where p.team_id = a.id and p.status = 'open')
    and not exists (select 1 from public.matches m where a.id in (m.posting_team_id, m.accepting_team_id) and m.status not in ('completed', 'cancelled'))
    and exists (
      select 1 from public.teams b
      where b.id <> a.id and b.owner_id <> a.owner_id and b.category = a.category
        and b.game = a.game and b.ladder = a.ladder
        and b.platform = any(public.gb_ladder_platforms(a.category, a.game, a.platform))
        and exists (select 1 from public.team_members m where m.team_id = b.id and m.user_id = b.owner_id)
        and public.gb_gaming_account_id(b.owner_id, b.platform, b.category, b.game) is not null
        and not exists (select 1 from public.match_posts p where p.team_id = b.id and p.status = 'open')
        and not exists (select 1 from public.matches m where b.id in (m.posting_team_id, m.accepting_team_id) and m.status not in ('completed', 'cancelled'))
    )
  limit 1;
  select b.* into accepting from public.teams b
  where b.id <> posting.id and b.owner_id <> posting.owner_id and b.category = posting.category
    and b.game = posting.game and b.ladder = posting.ladder
    and b.platform = any(public.gb_ladder_platforms(posting.category, posting.game, posting.platform))
    and exists (select 1 from public.team_members m where m.team_id = b.id and m.user_id = b.owner_id)
    and public.gb_gaming_account_id(b.owner_id, b.platform, b.category, b.game) is not null
    and not exists (select 1 from public.match_posts p where p.team_id = b.id and p.status = 'open')
    and not exists (select 1 from public.matches m where b.id in (m.posting_team_id, m.accepting_team_id) and m.status not in ('completed', 'cancelled'))
  limit 1;
  if posting.id is null or accepting.id is null then raise exception 'Missing eligible, unscheduled teams for booking tests'; end if;

  perform set_config('request.jwt.claim.sub', posting.owner_id::text, true);
  for i in 1..2 loop
    rejected := false;
    begin
      insert into public.match_posts (team_id, platform, category, game, ladder, game_mode, players, match_time, best_of, crossplay, posting_roster)
      values (posting.id, posting.platform, posting.category, posting.game, posting.ladder,
        'Search and Destroy', '1v1', (case when i = 1 then now() else now() + interval '24 hours 1 second' end)::text,
        'Best of 3', true, array[posting.owner_id]);
    exception when raise_exception then
      if sqlerrm not like '%within the next 24 hours%' then raise; end if;
      rejected := true;
    end;
    if not rejected then raise exception 'Invalid booking window was accepted'; end if;
  end loop;

  insert into public.match_posts (team_id, platform, category, game, ladder, game_mode, players, match_time, best_of, crossplay, posting_roster)
  values (posting.id, posting.platform, posting.category, posting.game, posting.ladder,
    'Search and Destroy', '1v1', (now() + interval '24 hours')::text, 'Best of 3', true, array[posting.owner_id])
  returning id into post_id;
  update public.match_posts set status = 'cancelled' where id = post_id;

  for i in 0..2 loop
    insert into public.match_posts (team_id, platform, category, game, ladder, game_mode, players, match_time, best_of, crossplay, posting_roster)
    values (posting.id, posting.platform, posting.category, posting.game, posting.ladder,
      'Search and Destroy', '1v1', (scheduled + i * interval '15 minutes')::text,
      'Best of 3', true, array[posting.owner_id])
    returning id into post_id;
    post_ids := array_append(post_ids, post_id);
    if i = 0 then
      rejected := false;
      begin
        insert into public.match_posts (team_id, platform, category, game, ladder, game_mode, players, match_time, best_of, crossplay, posting_roster)
        values (posting.id, posting.platform, posting.category, posting.game, posting.ladder,
          'Search and Destroy', '1v1', scheduled::text, 'Best of 3', true, array[posting.owner_id]);
      exception when raise_exception then
        if sqlerrm not like '%within 15 minutes%' then raise; end if;
        rejected := true;
      end;
      if not rejected then raise exception 'Duplicate time slot was accepted'; end if;
    end if;
  end loop;

  rejected := false;
  begin
    insert into public.match_posts (team_id, platform, category, game, ladder, game_mode, players, match_time, best_of, crossplay, posting_roster)
    values (posting.id, posting.platform, posting.category, posting.game, posting.ladder,
      'Search and Destroy', '1v1', (scheduled + interval '1 hour')::text,
      'Best of 3', true, array[posting.owner_id]);
  exception when raise_exception then
    if sqlerrm not like '%three open posts or unfinished matches%' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'A fourth booking was allowed'; end if;

  perform set_config('request.jwt.claim.sub', accepting.owner_id::text, true);
  foreach post_id in array post_ids loop
    select a.match_id into match_id from public.accept_match_post(post_id, accepting.id, array[accepting.owner_id]) a;
    if match_id is null then raise exception 'Acceptance of an existing post failed'; end if;
    match_ids := array_append(match_ids, match_id);
    if cardinality(match_ids) = 1 then
      rejected := false;
      begin
        perform public.gb_check_team_match_schedule(posting.id, (scheduled + interval '1 hour')::text, null);
      exception when raise_exception then
        if sqlerrm not like '%three open posts or unfinished matches%' then raise; end if;
        rejected := true;
      end;
      if not rejected then raise exception 'Open posts and accepted matches were not counted together'; end if;
    end if;
  end loop;
  update public.matches set status = 'disputed', reporting_status = 'disputed' where id = any(match_ids);
  for i in 1..2 loop
    rejected := false;
    begin
      perform public.gb_check_team_match_schedule(case when i = 1 then posting.id else accepting.id end,
        (scheduled + interval '1 hour')::text, null);
    exception when raise_exception then
      if sqlerrm not like '%three or more unresolved disputes%' then raise; end if;
      rejected := true;
    end;
    if not rejected then raise exception 'A team with three disputes was not locked'; end if;
  end loop;

  update public.matches set status = 'cancelled', reporting_status = 'none' where id = match_ids[1];
  perform public.gb_check_team_match_schedule(posting.id, (scheduled + interval '1 hour')::text, null);
  perform public.gb_check_team_match_schedule(accepting.id, (scheduled + interval '1 hour')::text, null);
end;
$$;
