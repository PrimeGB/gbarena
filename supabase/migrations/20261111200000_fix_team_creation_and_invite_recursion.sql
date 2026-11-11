create or replace function public.gb_has_pending_team_invite(p_team_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.team_invites
    where team_id = p_team_id
      and user_id = auth.uid()
      and status = 'pending'
  );
$$;

revoke all on function public.gb_has_pending_team_invite(uuid) from public;
grant execute on function public.gb_has_pending_team_invite(uuid) to authenticated;

drop policy if exists "Invited users can join teams" on public.team_members;
create policy "Invited users can join teams"
on public.team_members
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and role = 'member'
  and public.gb_has_pending_team_invite(team_id)
);

create or replace function public.gb_add_team_owner_to_roster()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is not null and new.owner_id is distinct from auth.uid() then
    raise exception 'You can only create a team for your own account.';
  end if;

  if new.owner_id is not null then
    insert into public.team_members (team_id, user_id, role)
    values (new.id, new.owner_id, 'leader');
  end if;
  return new;
end;
$$;

revoke all on function public.gb_add_team_owner_to_roster() from public;
create trigger teams_add_owner_to_roster
after insert on public.teams
for each row execute function public.gb_add_team_owner_to_roster();

notify pgrst, 'reload schema';
