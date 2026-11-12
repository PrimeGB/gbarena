-- Run against an isolated database after the award autofill migration and community fixture.
create function pg_temp.assert_true(ok boolean, message text) returns void language plpgsql as $$
begin
  if ok is distinct from true then raise exception 'Assertion failed: %', message; end if;
end;
$$;
select pg_temp.assert_true(
  (select cardinality(display_awards) = 3 from public.profiles where id = md5('profile2')::uuid),
  'backfill preserves awards that were already shown by default');
select pg_temp.assert_true(
  not has_function_privilege('anon', 'public.gb_save_profile_award_slots(text[],text[])', 'execute')
  and not has_function_privilege('authenticated', 'public.gb_valid_profile_award_slots(uuid,text[])', 'execute'),
  'only authenticated users can call the save function');

insert into public.staff_award_catalog (name, award_group, purpose) values
  ('Test A', 'Test', 'Test award A'), ('Test B', 'Test', 'Test award B'),
  ('Test C', 'Test', 'Test award C'), ('Test D', 'Test', 'Test award D'),
  ('Test E', 'Test', 'Test award E'), ('Test F', 'Test', 'Test award F'),
  ('Test G', 'Test', 'Test award G');
select public.gb_grant_auto_award(md5('profile1')::uuid, 'Test A');
select pg_temp.assert_true((select cardinality(display_awards) = 2 from public.profiles where id = md5('profile1')::uuid),
  'new awards fill an open slot');
select public.gb_grant_auto_award(md5('profile1')::uuid, 'Test B');
select public.gb_grant_auto_award(md5('profile1')::uuid, 'Test C');
select public.gb_grant_auto_award(md5('profile1')::uuid, 'Test D');
select public.gb_grant_auto_award(md5('profile1')::uuid, 'Test E');
select public.gb_grant_auto_award(md5('profile1')::uuid, 'Test F');
select pg_temp.assert_true((select cardinality(display_awards) = 6 from public.profiles where id = md5('profile1')::uuid),
  'a full selection is never overwritten');

select set_config('request.jwt.claim.sub', md5('profile1')::uuid::text, false);
do $$
declare saved text[]; reordered text[];
begin
  select display_awards into saved from public.profiles where id = auth.uid();
  reordered := array[saved[2], saved[1], saved[3], saved[4], saved[5], saved[6]];
  if public.gb_save_profile_award_slots(saved, reordered) <> reordered then
    raise exception 'The selected order was not saved';
  end if;
  begin
    perform public.gb_save_profile_award_slots(saved, saved);
    raise exception 'Expected stale save to fail';
  exception when raise_exception then
    if sqlerrm not like 'Your awards changed elsewhere%' then raise; end if;
  end;
  begin
    perform public.gb_save_profile_award_slots(reordered, array[reordered[1], reordered[1]]);
    raise exception 'Expected duplicate save to fail';
  exception when raise_exception then
    if sqlerrm not like 'Only your active awards%' then raise; end if;
  end;
  perform public.gb_save_profile_award_slots(reordered, '{}'::text[]);
end;
$$;
select pg_temp.assert_true((select cardinality(display_awards) = 0 from public.profiles where id = auth.uid()),
  'removing every selection remains saved');
select public.gb_grant_auto_award(md5('profile1')::uuid, 'Test G');
select pg_temp.assert_true((select cardinality(display_awards) = 1 from public.profiles where id = auth.uid()),
  'a later award fills an intentionally emptied selection');

update public.staff_user_awards set revoked_at = now()
where recipient_id = auth.uid() and id::text = (select display_awards[1] from public.profiles where id = auth.uid());
update public.profiles set display_awards = '{}' where id = auth.uid();
update public.staff_user_awards set revoked_at = null
where recipient_id = auth.uid() and award_id = (select id from public.staff_award_catalog where name = 'Test G');
select pg_temp.assert_true((select cardinality(display_awards) = 1 from public.profiles where id = auth.uid()),
  'restoring an award fills an open slot without duplicates');

insert into auth.users values (md5('profile11')::uuid, now());
insert into public.profiles (id, role) values (md5('profile11')::uuid, 'member');
select pg_temp.assert_true((select cardinality(display_awards) = 1 from public.profiles where id = md5('profile11')::uuid),
  'an award granted during profile creation fills the slot without breaking signup');
