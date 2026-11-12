-- Run inside a transaction and roll back; a historical match is used as a fixture.
do $$
declare
  m public.matches%rowtype;
  owner_a uuid;
  owner_b uuid;
  result jsonb;
  wins integer;
  rejected boolean;
begin
  select matches.* into m from public.matches matches
  join public.teams a on a.id = matches.posting_team_id
  join public.teams b on b.id = matches.accepting_team_id
  where a.owner_id is not null and b.owner_id is not null and a.owner_id <> b.owner_id
    and exists (select 1 from public.team_members where team_id = a.id and user_id = a.owner_id)
  limit 1;
  if m.id is null then raise exception 'Missing reporting test fixture'; end if;
  select owner_id into owner_a from public.teams where id = m.posting_team_id;
  select owner_id into owner_b from public.teams where id = m.accepting_team_id;
  wins := case coalesce(nullif(regexp_replace(coalesce(m.best_of, ''), '[^0-9]', '', 'g'), '')::integer, 3)
    when 7 then 4 when 5 then 3 when 1 then 1 else 2 end;
  update public.matches set status = 'upcoming', reporting_status = 'none', finalized = false,
    match_time = (now() + interval '1 second')::text where id = m.id;
  perform set_config('request.jwt.claim.sub', owner_a::text, true);
  result := public.report_match_score(m.id, m.posting_team_id, wins, 0);
  if result->>'message' not like '%scheduled match time%' then raise exception 'Early report not blocked: %', result; end if;
  result := public.dispute_match_score(m.id, 'Wrong score');
  if result->>'message' not like '%scheduled match time%' then raise exception 'Early dispute not blocked: %', result; end if;

  update public.matches set match_time = now()::text where id = m.id;
  perform set_config('request.jwt.claim.sub', owner_b::text, true);
  result := public.report_match_score(m.id, m.posting_team_id, wins, 0);
  if result->>'ok' is distinct from 'false' then raise exception 'Opponent reported for other team: %', result; end if;
  perform set_config('request.jwt.claim.sub', owner_a::text, true);
  result := public.report_match_score(m.id, m.posting_team_id, wins, 0);
  if result->>'ok' is distinct from 'true' then raise exception 'Report rejected at start: %', result; end if;
  result := public.dispute_match_score(m.id, 'Wrong score');
  if result->>'ok' is distinct from 'false' then raise exception 'Reporting team disputed its own score: %', result; end if;
  perform set_config('request.jwt.claim.sub', owner_b::text, true);
  result := public.dispute_match_score(m.id, 'Wrong score');
  if result->>'ok' is distinct from 'true' then raise exception 'Dispute rejected at start: %', result; end if;

  perform set_config('request.jwt.claim.sub', owner_a::text, true);
  update public.matches set match_time = (now() + interval '1 second')::text where id = m.id;
  rejected := false;
  begin
    insert into public.dispute_tickets(match_id, team_id, opponent_team_id, created_by,
      dispute_reason, dispute_description, status, evidence_paths)
    values (m.id, m.posting_team_id, m.accepting_team_id, owner_a, 'test', 'test', 'open', '["test"]'::jsonb);
  exception when raise_exception then
    if sqlerrm not like '%scheduled match time%' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'Early dispute ticket was accepted'; end if;
  update public.matches set match_time = now()::text where id = m.id;
  insert into public.dispute_tickets(match_id, team_id, opponent_team_id, created_by,
    dispute_reason, dispute_description, status, evidence_paths)
  values (m.id, m.posting_team_id, m.accepting_team_id, owner_a, 'test', 'test', 'open', '["test"]'::jsonb);
  update public.matches set match_time = (now() - interval '2 hours')::text where id = m.id;
  rejected := false;
  begin
    insert into public.dispute_tickets(match_id, team_id, opponent_team_id, created_by,
      dispute_reason, dispute_description, status, evidence_paths)
    values (m.id, m.posting_team_id, m.accepting_team_id, owner_a, 'test', 'test', 'open', '["test"]'::jsonb);
  exception when raise_exception then
    if sqlerrm not like '%scheduled match time%' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'Expired dispute ticket was accepted'; end if;
end;
$$;
