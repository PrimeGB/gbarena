-- Run together with the team-creation migration in a transaction; everything rolls back.
create temporary table team_creation_test (
  owner_id uuid, invitee_id uuid, team_id uuid, failed_team_id uuid, game text
);
insert into team_creation_test
select users[1], users[2], gen_random_uuid(), gen_random_uuid(), gen_random_uuid()::text
from (select array_agg(id) as users from (select id from public.profiles limit 2) p) fixture;
grant select on team_creation_test to authenticated;

create function pg_temp.reject_test_leader()
returns trigger language plpgsql as $$
begin
  if new.team_id = (select failed_team_id from team_creation_test) then
    raise exception 'test roster failure';
  end if;
  return new;
end;
$$;
create trigger reject_test_leader before insert on public.team_members
for each row execute function pg_temp.reject_test_leader();

set local role authenticated;
do $$
declare
  fixture record;
  rejected boolean;
begin
  select * into fixture from team_creation_test;
  if fixture.owner_id is null or fixture.invitee_id is null then
    raise exception 'Two profiles are required for the team creation test';
  end if;
  perform set_config('request.jwt.claim.sub', fixture.owner_id::text, true);

  insert into public.teams (id, name, owner_id, platform, category, game, ladder)
  values (fixture.team_id, 'Team test ' || fixture.team_id, fixture.owner_id, 'pc', 'test', fixture.game, 'singles');
  if not exists (
    select 1 from public.team_members
    where team_id = fixture.team_id and user_id = fixture.owner_id and role = 'leader'
  ) then raise exception 'Team owner was not added as leader'; end if;

  rejected := false;
  begin
    insert into public.teams (id, name, owner_id, platform, category, game, ladder)
    values (fixture.failed_team_id, 'Failed test ' || fixture.failed_team_id, fixture.owner_id, 'pc', 'test', fixture.game || '-failed', 'singles');
  exception when raise_exception then
    if sqlerrm <> 'test roster failure' then raise; end if;
    rejected := true;
  end;
  if not rejected or exists (select 1 from public.teams where id = fixture.failed_team_id) then
    raise exception 'Failed leader insertion did not roll back team creation';
  end if;

  rejected := false;
  begin
    insert into public.teams (name, owner_id, platform, category, game, ladder)
    values ('Forged test ' || fixture.team_id, fixture.invitee_id, 'pc', 'test', fixture.game || '-forged', 'singles');
  exception when raise_exception then
    if sqlerrm <> 'You can only create a team for your own account.' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'Created a team for another owner'; end if;

  perform set_config('request.jwt.claim.sub', fixture.invitee_id::text, true);
  rejected := false;
  begin
    insert into public.team_members (team_id, user_id, role)
    values (fixture.team_id, fixture.invitee_id, 'member');
  exception when insufficient_privilege then rejected := true;
  end;
  if not rejected then raise exception 'Uninvited player joined the team'; end if;

  perform set_config('request.jwt.claim.sub', fixture.owner_id::text, true);
  insert into public.team_invites (team_id, user_id) values (fixture.team_id, fixture.invitee_id);
  if not exists (select 1 from public.team_invites where team_id = fixture.team_id) then
    raise exception 'Owner cannot view the invitation';
  end if;

  perform set_config('request.jwt.claim.sub', fixture.invitee_id::text, true);
  rejected := false;
  begin
    insert into public.team_members (team_id, user_id, role)
    values (fixture.team_id, fixture.invitee_id, 'leader');
  exception when insufficient_privilege then rejected := true;
  end;
  if not rejected then raise exception 'Invitee joined as leader'; end if;
  insert into public.team_members (team_id, user_id, role)
  values (fixture.team_id, fixture.invitee_id, 'member');
  if not exists (
    select 1 from public.team_members
    where team_id = fixture.team_id and user_id = fixture.invitee_id and role = 'member'
  ) then raise exception 'Invited player was not added'; end if;
end;
$$;
