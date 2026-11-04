alter table public.profiles
  add column if not exists display_friends text[] default null;
