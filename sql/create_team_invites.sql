-- Pending team invite workflow
-- Run this in Supabase SQL editor or as a migration before using team invites.

create table if not exists public.team_invites (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (team_id, user_id)
);

create index if not exists idx_team_invites_team_id
  on public.team_invites(team_id);

create index if not exists idx_team_invites_user_id
  on public.team_invites(user_id);

create index if not exists idx_team_invites_status
  on public.team_invites(status);

create or replace function public.touch_team_invites_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger team_invites_updated_at
before update on public.team_invites
for each row
execute function public.touch_team_invites_updated_at();

-- Optional: allow accepted invites to count as active membership when the invited user accepts
-- The app logic handles adding the user to team_members after acceptance.
