-- Test with ordinary authenticated privileges and temporary copies; no profile is changed.
begin;

create temporary table test_gaming_accounts as
select * from public.gaming_accounts limit 1;
create temporary table test_profile as
select * from public.profiles limit 1;
grant select, insert, update, delete on test_gaming_accounts, test_profile to authenticated;

update test_gaming_accounts set locked_until = now() + interval '30 days';
update test_profile set gt_xbox = 'Before testing', gamertag_locks = jsonb_build_object('gt_xbox', (now() + interval '30 days')::text);
create trigger test_gaming_guard before insert or update or delete on test_gaming_accounts
  for each row execute function public.gb_guard_gaming_account();
create trigger test_profile_guard before insert or update on test_profile
  for each row execute function public.gb_guard_profile_columns();

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);
do $$
declare
  rejected boolean := false;
begin
  if not exists (select 1 from test_gaming_accounts) or not exists (select 1 from test_profile) then
    raise exception 'Missing gaming account or profile test fixture';
  end if;
  update test_gaming_accounts set account_id = 'temporary-testing-id-' || gen_random_uuid()::text;
  delete from test_gaming_accounts;
  insert into test_gaming_accounts select * from public.gaming_accounts limit 1;
  delete from test_gaming_accounts;
  begin
    insert into test_gaming_accounts
    select (jsonb_populate_record(null::public.gaming_accounts, to_jsonb(g) || jsonb_build_object(
      'user_id', '00000000-0000-0000-0000-000000000001'
    ))).*
    from public.gaming_accounts g limit 1;
  exception when raise_exception then
    if sqlerrm not like '%already linked to another account%' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'Duplicate gaming ID guard was bypassed'; end if;
  update test_profile set gt_xbox = 'After testing';
  update test_profile set gt_xbox = null;
  rejected := false;
  begin
    update test_profile set xp = coalesce(xp, 0) + 1;
  exception when raise_exception then
    if sqlerrm not like '%only be changed by verified match results%' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'Player statistics guard was bypassed'; end if;
end;
$$;

rollback;
