revoke all on public.staff_assignments from public, anon, authenticated;

drop policy if exists staff_assignments_public_directory_read
  on public.staff_assignments;

create or replace function public.get_staff_directory()
returns table (
  user_id uuid,
  username text,
  "position" text,
  duties text,
  is_owner boolean
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null or not exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and (
        profiles.role = 'owner'
        or (
          profiles.role = 'staff'
          and exists (
            select 1
            from public.staff_access_grants
            where staff_access_grants.user_id = profiles.id
          )
        )
      )
  ) then
    raise exception 'Staff access is required to view the staff roster';
  end if;

  return query
    select directory.user_id, directory.username, directory.position,
           directory.duties, directory.is_owner
    from (
      select
        staff_assignments.user_id,
        coalesce(profiles.username, 'Staff member') as username,
        staff_assignments.position,
        staff_assignments.duties,
        profiles.role = 'owner' as is_owner
      from public.staff_assignments
      join public.profiles
        on profiles.id = staff_assignments.user_id
       and profiles.role in ('staff', 'owner')

      union all

      select profiles.id,
             coalesce(profiles.username, 'Owner'),
             'Owner',
             'Site administration and staff oversight',
             true
      from public.profiles
      where profiles.role = 'owner'
        and not exists (
          select 1 from public.staff_assignments
          where staff_assignments.user_id = profiles.id
        )
    ) as directory
    order by directory.position, directory.username;
end;
$$;

revoke all on function public.get_staff_directory() from public, anon;
grant execute on function public.get_staff_directory() to authenticated;
