alter table public.tournaments add column if not exists created_by uuid references auth.users(id);

drop policy if exists "Staff manage tournaments" on public.tournaments;
create policy "Staff manage tournaments"
  on public.tournaments for all
  to authenticated
  using (public.has_staff_permission('staff_access'))
  with check (public.has_staff_permission('staff_access'));

create table if not exists public.tournament_registrations (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  registered_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  unique (tournament_id, team_id)
);

alter table public.tournament_registrations enable row level security;

drop policy if exists "Registrations are public" on public.tournament_registrations;
create policy "Registrations are public"
  on public.tournament_registrations for select
  using (true);

drop policy if exists "Staff manage registrations" on public.tournament_registrations;
create policy "Staff manage registrations"
  on public.tournament_registrations for delete
  to authenticated
  using (public.has_staff_permission('staff_access'));

create or replace function public.register_team_for_tournament(
  p_tournament_id uuid,
  p_team_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  t public.tournaments%rowtype;
  v_count integer;
begin
  if auth.uid() is null then
    raise exception 'You must be signed in.';
  end if;

  select * into t from public.tournaments where id = p_tournament_id;
  if not found or t.status <> 'upcoming' then
    raise exception 'This tournament is not open for registration.';
  end if;
  if t.starts_at <= now() then
    raise exception 'This tournament has already started.';
  end if;
  if not t.is_free and t.entry_fee > 0 then
    raise exception 'Paid tournaments are not open for online registration yet.';
  end if;

  if not exists (
    select 1 from public.teams
    where id = p_team_id and owner_id = auth.uid()
  ) then
    raise exception 'Only the team owner can register a team.';
  end if;

  if t.platform is not null and not exists (
    select 1 from public.teams
    where id = p_team_id and platform = t.platform
  ) then
    raise exception 'This team is not on the % platform.', t.platform;
  end if;

  select count(*) into v_count
  from public.tournament_registrations
  where tournament_id = p_tournament_id;
  if t.max_teams is not null and v_count >= t.max_teams then
    raise exception 'This tournament is full.';
  end if;

  insert into public.tournament_registrations (tournament_id, team_id, registered_by)
  values (p_tournament_id, p_team_id, auth.uid());
exception
  when unique_violation then
    raise exception 'This team is already registered.';
end;
$$;

create or replace function public.unregister_team_from_tournament(
  p_tournament_id uuid,
  p_team_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not exists (
    select 1 from public.teams
    where id = p_team_id and owner_id = auth.uid()
  ) then
    raise exception 'Only the team owner can withdraw a team.';
  end if;

  delete from public.tournament_registrations
  where tournament_id = p_tournament_id and team_id = p_team_id;
end;
$$;

revoke all on function public.register_team_for_tournament(uuid, uuid) from public, anon;
revoke all on function public.unregister_team_from_tournament(uuid, uuid) from public, anon;
grant execute on function public.register_team_for_tournament(uuid, uuid) to authenticated;
grant execute on function public.unregister_team_from_tournament(uuid, uuid) to authenticated;
