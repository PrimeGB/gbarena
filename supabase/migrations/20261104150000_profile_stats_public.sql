alter table public.profiles
  add column if not exists stats_public boolean not null default true;
