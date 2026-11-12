-- Keep the signup order private and retain vacant slots when a profile is deleted.
begin;

create table public.early_community_signups (
  signup_order bigint generated always as identity primary key,
  profile_id uuid unique references public.profiles(id) on delete set null,
  is_owner boolean not null
);
alter table public.early_community_signups enable row level security;
revoke all on public.early_community_signups from public, anon, authenticated;
revoke all on sequence public.early_community_signups_signup_order_seq from public, anon, authenticated;

insert into public.staff_award_catalog (name, award_group, purpose, exclusive, auto_award) values
  ('Community Origin', 'Community', 'Part of the community from the very beginning.', false, true),
  ('Community Pioneer', 'Community', 'Part of the community early on.', false, true),
  ('Community Trailblazer', 'Community', 'Part of the community in its early days.', false, true);

create function public.gb_early_community_desired_awards()
returns table (user_id uuid, award_name text)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with members as (
    select profile_id, row_number() over (order by signup_order) as member_number
    from public.early_community_signups
    where not is_owner
  )
  select profile_id, case
    when member_number <= 10 then 'Community Origin'
    when member_number <= 50 then 'Community Pioneer'
    else 'Community Trailblazer'
  end
  from members
  where profile_id is not null and member_number <= 100
  union all
  select s.profile_id, a.name
  from public.early_community_signups s
  cross join (values ('Community Origin'), ('Community Pioneer'), ('Community Trailblazer')) a(name)
  where s.is_owner and s.profile_id is not null;
$$;
revoke all on function public.gb_early_community_desired_awards() from public, anon, authenticated;

create function public.gb_reconcile_early_community_awards()
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  desired record;
begin
  perform pg_advisory_xact_lock(hashtextextended('gb_early_community_signups', 0));

  update public.staff_user_awards a
  set revoked_at = now(),
      revoked_by = coalesce(auth.uid(), a.recipient_id),
      revoke_reason = 'Automatic community tier adjustment'
  from public.staff_award_catalog c
  where c.id = a.award_id
    and c.name in ('Community Origin', 'Community Pioneer', 'Community Trailblazer')
    and a.reason = 'Awarded automatically: ' || c.name
    and a.revoked_at is null
    and not exists (
      select 1 from public.gb_early_community_desired_awards() d
      where d.user_id = a.recipient_id and d.award_name = c.name
    );

  update public.staff_user_awards a
  set revoked_at = null, revoked_by = null, revoke_reason = null
  from public.staff_award_catalog c, public.gb_early_community_desired_awards() d
  where c.id = a.award_id and c.name = d.award_name and a.recipient_id = d.user_id
    and a.reason = 'Awarded automatically: ' || c.name
    and a.revoke_reason = 'Automatic community tier adjustment'
    and a.revoked_at is not null
    and a.id = (
      select min(previous.id) from public.staff_user_awards previous
      where previous.award_id = a.award_id and previous.recipient_id = a.recipient_id
        and previous.reason = a.reason and previous.revoke_reason = 'Automatic community tier adjustment'
    )
    and not exists (
      select 1 from public.staff_user_awards other
      where other.award_id = a.award_id and other.recipient_id = a.recipient_id
        and (other.revoked_at is null or other.revoke_reason is distinct from 'Automatic community tier adjustment')
    );

  for desired in select * from public.gb_early_community_desired_awards()
  loop
    perform public.gb_grant_auto_award(desired.user_id, desired.award_name);
  end loop;
end;
$$;
revoke all on function public.gb_reconcile_early_community_awards() from public, anon, authenticated;

create function public.gb_early_community_profile_insert()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  member_number bigint;
begin
  perform pg_advisory_xact_lock(hashtextextended('gb_early_community_signups', 0));
  insert into public.early_community_signups (profile_id, is_owner)
  values (new.id, new.role = 'owner');

  if new.role = 'owner' then
    perform public.gb_grant_auto_award(new.id, 'Community Origin');
    perform public.gb_grant_auto_award(new.id, 'Community Pioneer');
    perform public.gb_grant_auto_award(new.id, 'Community Trailblazer');
  else
    select count(*) into member_number from public.early_community_signups where not is_owner;
    if member_number <= 10 then
      perform public.gb_grant_auto_award(new.id, 'Community Origin');
    elsif member_number <= 50 then
      perform public.gb_grant_auto_award(new.id, 'Community Pioneer');
    elsif member_number <= 100 then
      perform public.gb_grant_auto_award(new.id, 'Community Trailblazer');
    end if;
  end if;
  return new;
end;
$$;
revoke all on function public.gb_early_community_profile_insert() from public, anon, authenticated;

create function public.gb_early_community_role_changed()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if (old.role = 'owner') is distinct from (new.role = 'owner') then
    perform pg_advisory_xact_lock(hashtextextended('gb_early_community_signups', 0));
    update public.early_community_signups set is_owner = (new.role = 'owner') where profile_id = new.id;
    if not found then
      raise exception 'Missing early community signup record for profile %', new.id;
    end if;
    perform public.gb_reconcile_early_community_awards();
  end if;
  return new;
end;
$$;
revoke all on function public.gb_early_community_role_changed() from public, anon, authenticated;

-- Block concurrent profile inserts until the ordered backfill and triggers are in place.
lock table public.profiles in share row exclusive mode;
do $$
begin
  if exists (select 1 from public.profiles p left join auth.users u on u.id = p.id where u.id is null or u.created_at is null) then
    raise exception 'Cannot establish early community signup order for every existing profile';
  end if;
end;
$$;
insert into public.early_community_signups (profile_id, is_owner)
select p.id, p.role = 'owner'
from public.profiles p join auth.users u on u.id = p.id
order by u.created_at, u.id;

create trigger profiles_early_community_insert
  after insert on public.profiles
  for each row execute function public.gb_early_community_profile_insert();
create trigger profiles_early_community_role
  after update of role on public.profiles
  for each row execute function public.gb_early_community_role_changed();

select public.gb_reconcile_early_community_awards();

commit;
