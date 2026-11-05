create or replace function public.get_public_staff_roster()
returns table (
  user_id uuid,
  username text,
  avatar_url text,
  role text,
  "position" text
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    profiles.id,
    profiles.username,
    profiles.avatar_url,
    profiles.role,
    coalesce(staff_assignments.position, '')
  from public.profiles
  left join public.staff_assignments
    on staff_assignments.user_id = profiles.id
  where profiles.role in ('owner', 'admin', 'senior_staff', 'staff', 'referee')
  order by
    case profiles.role
      when 'owner' then 1
      when 'admin' then 2
      when 'senior_staff' then 3
      when 'staff' then 4
      else 5
    end,
    lower(profiles.username);
$$;

revoke all on function public.get_public_staff_roster() from public;
grant execute on function public.get_public_staff_roster() to anon, authenticated;
