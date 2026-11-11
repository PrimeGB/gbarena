do $$
declare
  m public.matches%rowtype;
  player uuid;
  outsider uuid;
  moderator uuid;
  result jsonb;
  comment_id uuid;
  visible_count integer;
begin
  select * into m from public.matches
    where posting_team_id is not null and accepting_team_id is not null limit 1;
  select id into player from public.profiles
    where coalesce(role, '') not in ('owner', 'admin', 'staff', 'senior_staff') limit 1;
  select id into outsider from public.profiles
    where id <> player and coalesce(role, '') not in ('owner', 'admin', 'staff', 'senior_staff') limit 1;
  select id into moderator from public.profiles
    where role in ('owner', 'admin', 'staff', 'senior_staff') limit 1;
  if m.id is null or player is null or outsider is null or moderator is null then
    raise exception 'Missing rollback test fixtures';
  end if;

  insert into public.match_participants(match_id, team_id, team_name_at_match, user_id,
    username_at_match, platform, category, game)
  values (m.id, m.posting_team_id, 'Test team', player, 'Test player',
    'pc', coalesce(m.category, 'test'), coalesce(m.game, 'test'))
  on conflict (match_id, user_id) do update set team_id = excluded.team_id;

  perform set_config('request.jwt.claim.sub', outsider::text, true);
  result := public.post_match_comment(m.id, outsider, m.posting_team_id, 'Not a participant');
  if result->>'ok' <> 'false' then raise exception 'Outsider comment accepted: %', result; end if;
  result := public.post_match_comment(m.id, player, m.posting_team_id, 'Impersonation');
  if result->>'ok' <> 'false' then raise exception 'Impersonation accepted: %', result; end if;

  perform set_config('request.jwt.claim.sub', player::text, true);
  result := public.post_match_comment(m.id, player, m.posting_team_id, 'Player comment');
  if result->>'ok' <> 'true' then raise exception 'Player comment rejected: %', result; end if;
  result := public.post_match_comment(m.id, player, m.posting_team_id, 'Second comment');
  if result->>'ok' <> 'false' then raise exception 'Duplicate player comment accepted'; end if;
  select id into comment_id from public.match_comments
    where match_id = m.id and user_id = player and not staff_comment;
  result := public.moderate_match_comment(comment_id, 'hide');
  if result->>'ok' <> 'false' then raise exception 'Player moderation accepted'; end if;

  perform set_config('request.jwt.claim.sub', moderator::text, true);
  result := public.post_match_comment(m.id, moderator, null, 'Staff comment one');
  if result->>'ok' <> 'true' then raise exception 'Staff comment rejected: %', result; end if;
  result := public.post_match_comment(m.id, moderator, null, 'Staff comment two');
  if result->>'ok' <> 'true' then raise exception 'Second staff comment rejected: %', result; end if;
  result := public.moderate_match_comment(comment_id, 'hide');
  if result->>'ok' <> 'true' then raise exception 'Staff hide failed: %', result; end if;

  perform set_config('request.jwt.claim.sub', player::text, true);
  select count(*) into visible_count from public.get_match_comments(m.id) where id = comment_id;
  if visible_count <> 0 then raise exception 'Hidden comment exposed'; end if;
  result := public.post_match_comment(m.id, player, m.posting_team_id, 'After hide');
  if result->>'ok' <> 'false' then raise exception 'Hidden comment bypassed limit'; end if;
  perform set_config('request.jwt.claim.sub', moderator::text, true);
  result := public.moderate_match_comment(comment_id, 'remove');
  if result->>'ok' <> 'true' then raise exception 'Staff removal failed: %', result; end if;
  perform set_config('request.jwt.claim.sub', player::text, true);
  result := public.post_match_comment(m.id, player, m.posting_team_id, 'After removal');
  if result->>'ok' <> 'false' then raise exception 'Removed comment bypassed limit'; end if;

  update public.matches set match_time = (now() - interval '14 minutes 59 seconds')::text where id = m.id;
  result := public.report_match_score(m.id, m.posting_team_id, 2, 0);
  if result->>'message' not like '%15 minutes%' then raise exception 'Early report not blocked: %', result; end if;
  result := public.dispute_match_score(m.id, 'test');
  if result->>'message' not like '%15 minutes%' then raise exception 'Early dispute not blocked: %', result; end if;
  update public.matches set match_time = (now() - interval '15 minutes')::text where id = m.id;
  result := public.report_match_score(m.id, m.posting_team_id, 2, 0);
  if result->>'message' like '%15 minutes%' then raise exception 'Report blocked at boundary: %', result; end if;
  result := public.dispute_match_score(m.id, 'test');
  if result->>'message' like '%15 minutes%' then raise exception 'Dispute blocked at boundary: %', result; end if;
  if public.dispute_ticket_window_ends_at(m.id) <> now() + interval '105 minutes' then
    raise exception 'Incorrect ticket deadline';
  end if;
  if has_table_privilege('authenticated', 'public.match_comments', 'INSERT')
      or has_function_privilege('authenticated', 'public.gb_dispute_match_score_before_delay(uuid,text)', 'EXECUTE') then
    raise exception 'Direct comment or unchecked reporting access remains';
  end if;
end;
$$;

create temporary table host_trigger_test (
  best_of text, posting_team_id uuid, accepting_team_id uuid, host_team_ids uuid[]
);
create trigger host_trigger_test before insert on host_trigger_test
  for each row execute function public.gb_assign_match_hosts();
insert into host_trigger_test(best_of, posting_team_id, accepting_team_id)
values ('Best of 3', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002');
do $$
begin
  if (select host_team_ids from host_trigger_test) <> array[
      '00000000-0000-0000-0000-000000000001'::uuid,
      '00000000-0000-0000-0000-000000000002'::uuid,
      '00000000-0000-0000-0000-000000000001'::uuid] then
    raise exception 'Host assignment trigger failed';
  end if;
end;
$$;

do $$
declare
  a uuid := '00000000-0000-0000-0000-000000000001';
  b uuid := '00000000-0000-0000-0000-000000000002';
begin
  if public.gb_match_host_rotation('Best of 1', a, b) <> array[a]
      or public.gb_match_host_rotation('Best of 2', a, b) <> array[a,b]
      or public.gb_match_host_rotation('Best of 3', a, b) <> array[a,b,a]
      or public.gb_match_host_rotation('Best of 5', a, b) <> array[a,b,a,b,a]
      or public.gb_match_host_rotation('Best of 7', a, b) <> array[a,b,a,b,a,b,a]
      or public.gb_match_host_rotation('Best of 3', a, null) is not null then
    raise exception 'Incorrect match host rotation';
  end if;
end;
$$;

do $$
declare
  m public.matches%rowtype;
  team uuid;
  opponent uuid;
  member uuid;
  rejected boolean;
begin
  select matches.* into m from public.matches matches join public.team_members tm
    on tm.team_id in (matches.posting_team_id, matches.accepting_team_id)
  where matches.posting_team_id is not null and matches.accepting_team_id is not null limit 1;
  if m.id is null then raise exception 'Missing ticket rollback fixture'; end if;
  select tm.team_id, tm.user_id into team, member from public.team_members tm
    where tm.team_id in (m.posting_team_id, m.accepting_team_id) limit 1;
  opponent := case when team = m.posting_team_id then m.accepting_team_id else m.posting_team_id end;
  perform set_config('request.jwt.claim.sub', member::text, true);
  update public.matches set status = 'disputed', reporting_status = 'disputed',
    match_time = (now() - interval '14 minutes 59 seconds')::text where id = m.id;
  rejected := false;
  begin
    insert into public.dispute_tickets(match_id, team_id, opponent_team_id, created_by,
      dispute_reason, dispute_description, status, evidence_paths)
    values (m.id, team, opponent, member, 'test', 'test', 'open', '["test"]'::jsonb);
  exception when others then
    if sqlerrm not like '%15 minutes%' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'Early ticket accepted'; end if;
  update public.matches set match_time = (now() - interval '15 minutes')::text where id = m.id;
  insert into public.dispute_tickets(match_id, team_id, opponent_team_id, created_by,
    dispute_reason, dispute_description, status, evidence_paths)
  values (m.id, team, opponent, member, 'test', 'test', 'open', '["test"]'::jsonb);
  update public.matches set match_time = (now() - interval '2 hours')::text where id = m.id;
  rejected := false;
  begin
    insert into public.dispute_tickets(match_id, team_id, opponent_team_id, created_by,
      dispute_reason, dispute_description, status, evidence_paths)
    values (m.id, team, opponent, member, 'test', 'test', 'open', '["test"]'::jsonb);
  exception when others then
    if sqlerrm not like '%15 minutes%' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'Late ticket accepted'; end if;
end;
$$;
