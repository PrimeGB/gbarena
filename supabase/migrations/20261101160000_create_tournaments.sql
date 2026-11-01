create table if not exists public.tournaments (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  platform text,
  game text,
  format text,
  team_size text,
  starts_at timestamptz not null,
  check_in_minutes integer not null default 30,
  max_teams integer,
  is_free boolean not null default true,
  entry_fee numeric(10,2) not null default 0,
  prize text,
  rules text,
  status text not null default 'upcoming'
    check (status in ('upcoming', 'live', 'completed', 'cancelled')),
  created_at timestamptz not null default now()
);

alter table public.tournaments enable row level security;

drop policy if exists "Tournaments are public" on public.tournaments;
create policy "Tournaments are public"
  on public.tournaments for select
  using (true);
