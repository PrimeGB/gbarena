alter table public.profiles
  add column if not exists profile_views integer not null default 0;

create table if not exists public.profile_view_log (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  viewer_id uuid not null references auth.users(id) on delete cascade,
  last_viewed_at timestamptz not null default now(),
  primary key (profile_id, viewer_id)
);

alter table public.profile_view_log enable row level security;

-- Counts one view per viewer per profile every 24 hours. Own views are ignored.
create or replace function public.record_profile_view(target_profile_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  viewer uuid := auth.uid();
  new_total integer;
  counted boolean := false;
begin
  if viewer is not null and viewer <> target_profile_id then
    insert into public.profile_view_log (profile_id, viewer_id, last_viewed_at)
    values (target_profile_id, viewer, now())
    on conflict (profile_id, viewer_id) do update
      set last_viewed_at = excluded.last_viewed_at
      where public.profile_view_log.last_viewed_at <= now() - interval '24 hours'
    returning true into counted;

    if counted then
      update public.profiles
      set profile_views = profile_views + 1
      where id = target_profile_id;
    end if;
  end if;

  select profile_views into new_total from public.profiles where id = target_profile_id;
  return coalesce(new_total, 0);
end;
$$;

grant execute on function public.record_profile_view(uuid) to authenticated;
