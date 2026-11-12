-- Run against an isolated database after the early-community migration and fixture.
create function pg_temp.assert_true(ok boolean, message text) returns void language plpgsql as $$
begin
  if ok is distinct from true then raise exception 'Assertion failed: %', message; end if;
end;
$$;
create function pg_temp.active_award(p_user uuid, p_name text) returns boolean language sql as $$
  select exists (
    select 1 from public.staff_user_awards a join public.staff_award_catalog c on c.id = a.award_id
    where a.recipient_id = p_user and c.name = p_name and a.revoked_at is null
  );
$$;

select pg_temp.assert_true(
  (select count(*) = 14 from public.staff_user_awards where revoked_at is null),
  'backfill gives eight members one award and both owners three');
select pg_temp.assert_true(
  (select array_agg(profile_id order by signup_order) =
    array(select md5('profile' || n)::uuid from generate_series(1,10) n)
   from public.early_community_signups),
  'backfill follows auth signup time, not profile insertion order');
select pg_temp.assert_true(
  (select count(*) = 6 from public.staff_user_awards a join public.profiles p on p.id = a.recipient_id
   where p.role = 'owner' and a.revoked_at is null),
  'owners receive all three awards');
select pg_temp.assert_true(not has_table_privilege('authenticated', 'public.early_community_signups', 'select')
  and not has_function_privilege('anon', 'public.gb_early_community_desired_awards()', 'execute'),
  'signup positions and internal allocator are private');

insert into auth.users
select md5('profile' || n)::uuid, now() + n * interval '1 second'
from generate_series(11, 103) n;
insert into public.profiles
select md5('profile' || n)::uuid, 'member'
from generate_series(11, 103) n order by n;

select pg_temp.assert_true(pg_temp.active_award(md5('profile12')::uuid, 'Community Origin'), 'member 10');
select pg_temp.assert_true(pg_temp.active_award(md5('profile13')::uuid, 'Community Pioneer'), 'member 11');
select pg_temp.assert_true(pg_temp.active_award(md5('profile52')::uuid, 'Community Pioneer'), 'member 50');
select pg_temp.assert_true(pg_temp.active_award(md5('profile53')::uuid, 'Community Trailblazer'), 'member 51');
select pg_temp.assert_true(pg_temp.active_award(md5('profile102')::uuid, 'Community Trailblazer'), 'member 100');
select pg_temp.assert_true(not exists (select 1 from public.staff_user_awards where recipient_id = md5('profile103')::uuid),
  'member 101 receives no award');

update public.staff_user_awards
set revoked_at = now(), revoked_by = recipient_id, revoke_reason = 'Staff decision'
where recipient_id = md5('profile13')::uuid
  and award_id = (select id from public.staff_award_catalog where name = 'Community Pioneer');
update public.profiles set role = 'owner' where id = md5('profile1')::uuid;
select pg_temp.assert_true(
  (select count(*) = 3 from public.staff_user_awards where recipient_id = md5('profile1')::uuid and revoked_at is null),
  'promoted owner receives all three awards');
select pg_temp.assert_true(pg_temp.active_award(md5('profile13')::uuid, 'Community Origin'), 'promotion frees a top-ten slot');
select pg_temp.assert_true(pg_temp.active_award(md5('profile53')::uuid, 'Community Pioneer'), 'promotion adjusts middle boundary');
select pg_temp.assert_true(pg_temp.active_award(md5('profile103')::uuid, 'Community Trailblazer'), 'promotion frees a top-100 slot');
update public.profiles set role = 'member' where id = md5('profile1')::uuid;
select pg_temp.assert_true(
  (select count(*) = 1 from public.staff_user_awards where recipient_id = md5('profile1')::uuid and revoked_at is null),
  'former owner receives only the matching member tier');
select pg_temp.assert_true(not pg_temp.active_award(md5('profile13')::uuid, 'Community Pioneer'),
  'staff-revoked award is not restored by a tier adjustment');
select pg_temp.assert_true(pg_temp.active_award(md5('profile53')::uuid, 'Community Trailblazer'),
  'automatic tier adjustments can be restored');
select pg_temp.assert_true(not pg_temp.active_award(md5('profile103')::uuid, 'Community Trailblazer'),
  'former top-100 member loses the automatic tier after a demotion');

delete from public.profiles where id = md5('profile12')::uuid;
select pg_temp.assert_true((select count(*) = 101 from public.early_community_signups where not is_owner),
  'deletion preserves the signup slot');
insert into auth.users values (md5('profile104')::uuid, now());
insert into public.profiles values (md5('profile104')::uuid, 'member');
select pg_temp.assert_true(not exists (select 1 from public.staff_user_awards where recipient_id = md5('profile104')::uuid),
  'deleted member does not free a new slot');
