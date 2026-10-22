alter table public.profiles
  add column if not exists role text not null default 'member';

update public.profiles
set role = 'member'
where role is null;

alter table public.profiles
  alter column role set default 'member',
  alter column role set not null;

alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('member', 'staff', 'referee', 'admin', 'owner'));

create or replace function public.guard_profile_role_changes()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  actor_role text;
begin
  if tg_op = 'INSERT' then
    if new.role is distinct from 'member'
      and current_user not in ('postgres', 'supabase_admin', 'service_role') then
      raise exception 'New profiles must have the member role';
    end if;
    return new;
  end if;

  if new.role is distinct from old.role
    and current_user not in ('postgres', 'supabase_admin', 'service_role') then
    select profiles.role
      into actor_role
      from public.profiles
      where profiles.id = auth.uid();

    if coalesce(actor_role, 'member') not in ('owner', 'admin') then
      raise exception 'Only an owner or admin can change profile roles';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists guard_profile_role_changes on public.profiles;

create trigger guard_profile_role_changes
before insert or update of role on public.profiles
for each row
execute function public.guard_profile_role_changes();
