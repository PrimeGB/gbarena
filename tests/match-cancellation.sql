-- Run inside a transaction, then roll back; uses an existing historical match as a fixture.
do $$
declare
  m public.matches%rowtype;
  owner_a uuid;
  owner_b uuid;
  outsider uuid;
  rejected boolean;
begin
  select * into m from public.matches
    where posting_team_id is not null and accepting_team_id is not null limit 1;
  select owner_id into owner_a from public.teams where id = m.posting_team_id;
  select owner_id into owner_b from public.teams where id = m.accepting_team_id;
  select id into outsider from public.profiles where id not in (owner_a, owner_b) limit 1;
  if m.id is null or owner_a is null or owner_b is null or outsider is null or owner_a = owner_b then
    raise exception 'Missing cancellation test fixtures';
  end if;
  update public.matches set status = 'upcoming', reporting_status = 'none', finalized = false
    where id = m.id;
  perform set_config('request.jwt.claim.sub', outsider::text, true);
  rejected := false;
  begin
    perform public.gb_manage_match_cancellation(m.id, m.posting_team_id, 'request');
  exception when raise_exception then rejected := true;
  end;
  if not rejected then raise exception 'Outsider requested cancellation'; end if;

  perform set_config('request.jwt.claim.sub', owner_a::text, true);
  perform public.gb_manage_match_cancellation(m.id, m.posting_team_id, 'request');
  rejected := false;
  begin
    perform public.gb_manage_match_cancellation(m.id, m.posting_team_id, 'accept');
  exception when raise_exception then rejected := true;
  end;
  if not rejected then raise exception 'Requesting team accepted its own request'; end if;

  perform set_config('request.jwt.claim.sub', owner_b::text, true);
  perform public.gb_manage_match_cancellation(m.id, m.accepting_team_id, 'deny');
  if (select status from public.matches where id = m.id) <> 'upcoming' then
    raise exception 'Denial cancelled the match';
  end if;
  perform public.gb_manage_match_cancellation(m.id, m.accepting_team_id, 'request');
  perform set_config('request.jwt.claim.sub', owner_a::text, true);
  perform public.gb_manage_match_cancellation(m.id, m.posting_team_id, 'accept');
  if (select status from public.matches where id = m.id) <> 'cancelled' then
    raise exception 'Approval did not cancel the match';
  end if;
  rejected := false;
  begin
    perform public.gb_manage_match_cancellation(m.id, m.posting_team_id, 'request');
  exception when raise_exception then rejected := true;
  end;
  if not rejected then raise exception 'Cancelled match accepted another request'; end if;
  update public.matches set status = 'awaiting_confirmation', reporting_status = 'awaiting_confirmation'
    where id = m.id;
  rejected := false;
  begin
    perform public.gb_manage_match_cancellation(m.id, m.posting_team_id, 'request');
  exception when raise_exception then rejected := true;
  end;
  if not rejected then raise exception 'Reported match accepted a cancellation request'; end if;
  if has_table_privilege('authenticated', 'public.match_cancellation_requests', 'INSERT')
     or has_table_privilege('authenticated', 'public.match_cancellation_requests', 'UPDATE') then
    raise exception 'Direct cancellation request writes are allowed';
  end if;
end;
$$;

set local role authenticated;
do $$
declare
  target uuid;
  ordinary_user uuid;
  rejected boolean := false;
begin
  select id into target from public.matches where status = 'awaiting_confirmation' limit 1;
  select id into ordinary_user from public.profiles
    where coalesce(role, '') not in ('owner', 'admin', 'staff', 'senior_staff') limit 1;
  if target is null or ordinary_user is null then raise exception 'Missing direct update test fixture'; end if;
  perform set_config('request.jwt.claim.sub', ordinary_user::text, true);
  begin
    update public.matches set status = 'cancelled' where id = target;
  exception when raise_exception then
    if sqlerrm not like '%requires both teams%' then raise; end if;
    rejected := true;
  when insufficient_privilege then
    rejected := true;
  end;
  if not rejected then raise exception 'Direct unilateral cancellation was allowed'; end if;
end;
$$;
reset role;
