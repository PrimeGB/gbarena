create table if not exists public.team_invites (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_team_invites_team_id
  on public.team_invites(team_id);

create index if not exists idx_team_invites_user_id
  on public.team_invites(user_id);

create index if not exists idx_team_invites_status
  on public.team_invites(status);

alter table public.team_invites
  drop constraint if exists team_invites_team_id_user_id_key;

create unique index if not exists idx_team_invites_unique_pending
  on public.team_invites(team_id, user_id)
  where status = 'pending';

create or replace function public.touch_team_invites_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists team_invites_updated_at on public.team_invites;

create trigger team_invites_updated_at
before update on public.team_invites
for each row
execute function public.touch_team_invites_updated_at();

alter table public.team_invites enable row level security;

drop policy if exists team_invites_select_participants on public.team_invites;
create policy team_invites_select_participants
on public.team_invites
for select
to authenticated
using (
  user_id = (select auth.uid())
  or exists (
    select 1
    from public.teams
    where teams.id = team_invites.team_id
      and teams.owner_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.team_members
    where team_members.team_id = team_invites.team_id
      and team_members.user_id = (select auth.uid())
      and lower(team_members.role) in ('leader', 'co-leader', 'coleader', 'co_leader')
  )
);

drop policy if exists team_invites_insert_managers on public.team_invites;
create policy team_invites_insert_managers
on public.team_invites
for insert
to authenticated
with check (
  user_id <> (select auth.uid())
  and (
    exists (
      select 1
      from public.teams
      where teams.id = team_invites.team_id
        and teams.owner_id = (select auth.uid())
    )
    or exists (
      select 1
      from public.team_members
      where team_members.team_id = team_invites.team_id
        and team_members.user_id = (select auth.uid())
        and lower(team_members.role) in ('leader', 'co-leader', 'coleader', 'co_leader')
    )
  )
);

drop policy if exists team_invites_update_recipient on public.team_invites;
create policy team_invites_update_recipient
on public.team_invites
for update
to authenticated
using (
  user_id = (select auth.uid())
  and status = 'pending'
)
with check (
  user_id = (select auth.uid())
  and status in ('accepted', 'declined')
);

grant select, insert, update on public.team_invites to authenticated;
