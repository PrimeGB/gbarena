create or replace function public.staff_email_is_allowed()
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select coalesce((
    select encode(
      sha256(convert_to(lower(trim(users.email)), 'UTF8')),
      'hex'
    ) in (
      '4b9768f5cd965042c2fd6a2abe9bd7d1a45b220f789470df8003345a84f1f1bb',
      'fb4c902423af4bed135982df947b79f9b902aa5db9852904a744e21d0e5d9ce7'
    )
    from auth.users
    where users.id = (select auth.uid())
  ), false);
$$;

revoke all on function public.staff_email_is_allowed() from public, anon;
grant execute on function public.staff_email_is_allowed() to authenticated;

create or replace function public.staff_has_portal_access()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select auth.uid() is not null and public.staff_email_is_allowed();
$$;

revoke all on function public.staff_has_portal_access() from public, anon;
grant execute on function public.staff_has_portal_access() to authenticated;

create or replace function public.has_staff_permission(permission_key text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.staff_email_is_allowed()
    and (
      exists (
        select 1
        from public.profiles
        where id = (select auth.uid())
          and role = 'owner'
      )
      or exists (
        select 1
        from public.staff_access_grants
        join public.profiles
          on profiles.id = staff_access_grants.user_id
        where user_id = (select auth.uid())
          and profiles.role = 'staff'
          and staff_access_grants.permission_key = $1
      )
    );
$$;

revoke all on function public.has_staff_permission(text) from public, anon;
grant execute on function public.has_staff_permission(text) to authenticated;

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
  if auth.uid() is null
    or not public.staff_email_is_allowed()
    or not exists (
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
    raise exception 'Approved staff access is required to view the staff roster';
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
