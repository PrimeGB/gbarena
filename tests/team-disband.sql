-- Run in a transaction and roll back. Only temporary test teams are disbanded.
create temporary table disband_test (owner_id uuid, other_id uuid, blocked_id uuid, success_id uuid);
insert into disband_test
select users[1], users[2], gen_random_uuid(), gen_random_uuid()
from (select array_agg(id) users from (select id from public.profiles limit 2) p) fixture;
grant select on disband_test to authenticated;

do $$
declare f record;
begin
  select * into f from disband_test;
  if f.owner_id is null or f.other_id is null then raise exception 'Two profiles are required'; end if;
  perform set_config('request.jwt.claim.sub', f.owner_id::text, true);
  insert into public.teams (id, name, owner_id, platform, category, game, ladder)
  values
    (f.blocked_id, 'Disband test ' || f.blocked_id, f.owner_id, 'pc', 'test', f.blocked_id::text, 'singles'),
    (f.success_id, 'Disband test ' || f.success_id, f.owner_id, 'pc', 'test', f.success_id::text, 'singles');
  insert into public.staff_cases (id, report_type, title, description, target_team_id)
  overriding system value
  values (-floor(random() * 1000000000000)::bigint, 'team', 'Test case', 'Temporary test case', f.blocked_id);
end;
$$;

set local role authenticated;
do $$
declare
  f record;
  rejected boolean;
begin
  select * into f from disband_test;
  perform set_config('request.jwt.claim.sub', f.other_id::text, true);
  rejected := false;
  begin
    perform public.gb_disband_team(f.success_id);
  exception when raise_exception then
    if sqlerrm not like '%do not have permission%' then raise; end if;
    rejected := true;
  end;
  if not rejected or not exists (select 1 from public.team_members where team_id = f.success_id) then
    raise exception 'Unauthorized disband was not rejected safely';
  end if;

  perform set_config('request.jwt.claim.sub', f.owner_id::text, true);
  rejected := false;
  begin
    perform public.gb_disband_team(f.blocked_id);
  exception when foreign_key_violation then
    rejected := true;
  end;
  if not rejected or not exists (select 1 from public.teams where id = f.blocked_id)
    or not exists (select 1 from public.team_members where team_id = f.blocked_id) then
    raise exception 'Failed team deletion did not preserve the team and roster';
  end if;

  perform public.gb_disband_team(f.success_id);
  if exists (select 1 from public.teams where id = f.success_id)
    or exists (select 1 from public.team_members where team_id = f.success_id) then
    raise exception 'Successful disband left the test team or roster behind';
  end if;
end;
$$;
