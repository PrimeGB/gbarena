-- Run against an isolated migrated database. All fixtures and rewards roll back.
begin;

do $$
declare
  creator uuid := gen_random_uuid();
  first_recruit uuid := gen_random_uuid();
  late_recruit uuid := gen_random_uuid();
  legacy_recruit uuid := gen_random_uuid();
  normal_recruit uuid := gen_random_uuid();
  recruit uuid;
  code text := replace(gen_random_uuid()::text, '-', '');
  amount integer;
  i integer;
begin
  insert into auth.users(id, raw_user_meta_data)
  values (creator, jsonb_build_object('username', 'creator' || substr(creator::text, 1, 8)));
  insert into public.ambassadors(user_id, tier, slug)
  values (creator, 'affiliate', 'test-' || substr(creator::text, 1, 8));
  insert into public.community_referral_codes(owner_id, code) values (creator, code);

  insert into auth.users(id, email_confirmed_at, raw_user_meta_data)
  values (first_recruit, now(), jsonb_build_object('username', 'first' || substr(first_recruit::text, 1, 8), 'referral_code', code)),
         (late_recruit, now(), jsonb_build_object('username', 'late' || substr(late_recruit::text, 1, 8), 'referral_code', code));
  perform set_config('request.jwt.claim.sub', first_recruit::text, true);
  perform public.gb_attribute_referral();
  perform set_config('request.jwt.claim.sub', late_recruit::text, true);
  perform public.gb_attribute_referral();
  perform public.gb_reconcile_referral_awards(creator);
  if exists (select 1 from public.ambassador_recruit_bonuses where invited_user_id in (first_recruit, late_recruit)) then
    raise exception 'Unqualified recruits must not receive bonuses';
  end if;

  insert into public.gaming_accounts(user_id, platform, category, game, account_id)
  values (first_recruit, 'pc', 'fixture', 'fixture', first_recruit::text);
  select recruit_credits into amount from public.ambassador_recruit_bonuses where invited_user_id = first_recruit;
  if amount is distinct from 2 then raise exception 'Affiliate recruit must receive 2 credits'; end if;

  -- Reach 64 qualified recruits. The second original recruit remains pending.
  for i in 1..63 loop
    recruit := gen_random_uuid();
    insert into auth.users(id, email_confirmed_at, raw_user_meta_data)
    values (recruit, now(), jsonb_build_object('username', 'p' || substr(recruit::text, 1, 8), 'referral_code', code));
    perform set_config('request.jwt.claim.sub', recruit::text, true);
    perform public.gb_attribute_referral();
    insert into public.gaming_accounts(user_id, platform, category, game, account_id)
    values (recruit, 'pc', 'fixture', 'fixture', recruit::text);
  end loop;
  if (select tier from public.ambassadors where user_id = creator) <> 'affiliate' then
    raise exception 'Promotion must not occur at 64';
  end if;

  recruit := gen_random_uuid();
  insert into auth.users(id, email_confirmed_at, raw_user_meta_data)
  values (recruit, now(), jsonb_build_object('username', 'p' || substr(recruit::text, 1, 8), 'referral_code', code));
  perform set_config('request.jwt.claim.sub', recruit::text, true);
  perform public.gb_attribute_referral();
  insert into public.gaming_accounts(user_id, platform, category, game, account_id)
  values (recruit, 'pc', 'fixture', 'fixture', recruit::text);
  if (select tier from public.ambassadors where user_id = creator) <> 'ambassador' then
    raise exception 'Promotion must occur at 65';
  end if;

  insert into public.gaming_accounts(user_id, platform, category, game, account_id)
  values (late_recruit, 'pc', 'fixture', 'fixture', late_recruit::text);
  if (select recruit_credits from public.ambassador_recruit_bonuses where invited_user_id = late_recruit) <> 2 then
    raise exception 'A pending recruit must keep the tier captured at signup';
  end if;

  recruit := gen_random_uuid();
  insert into auth.users(id, email_confirmed_at, raw_user_meta_data)
  values (recruit, now(), jsonb_build_object('username', 'p' || substr(recruit::text, 1, 8), 'referral_code', code));
  perform set_config('request.jwt.claim.sub', recruit::text, true);
  perform public.gb_attribute_referral();
  insert into public.gaming_accounts(user_id, platform, category, game, account_id)
  values (recruit, 'pc', 'fixture', 'fixture', recruit::text);
  if (select recruit_credits from public.ambassador_recruit_bonuses where invited_user_id = recruit) <> 3 then
    raise exception 'Ambassador recruit must receive 3 credits';
  end if;

  insert into auth.users(id, email_confirmed_at, raw_user_meta_data)
  values (legacy_recruit, now(), jsonb_build_object('username', 'legacy' || substr(legacy_recruit::text, 1, 8)));
  insert into public.community_referrals(invited_user_id, referrer_id, program_recruit_credits)
  values (legacy_recruit, creator, 5);
  insert into public.gaming_accounts(user_id, platform, category, game, account_id)
  values (legacy_recruit, 'pc', 'fixture', 'fixture', legacy_recruit::text);
  if (select recruit_credits from public.ambassador_recruit_bonuses where invited_user_id = legacy_recruit) <> 5 then
    raise exception 'Previously promised recruit bonus must remain 5 credits';
  end if;

  insert into auth.users(id, email_confirmed_at, raw_user_meta_data)
  values (normal_recruit, now(), jsonb_build_object('username', 'normal' || substr(normal_recruit::text, 1, 8)));
  insert into public.community_referrals(invited_user_id, referrer_id) values (normal_recruit, creator);
  insert into public.gaming_accounts(user_id, platform, category, game, account_id)
  values (normal_recruit, 'pc', 'fixture', 'fixture', normal_recruit::text);
  if exists (select 1 from public.ambassador_recruit_bonuses where invited_user_id = normal_recruit) then
    raise exception 'A referral without a program reward must not receive a bonus';
  end if;

  select credits into amount from public.profiles where id = creator;
  perform public.gb_reconcile_referral_awards(creator);
  if (select credits from public.profiles where id = creator) is distinct from amount
     or (select sum(creator_credits) from public.ambassador_recruit_bonuses where referrer_id = creator) <> 68 then
    raise exception 'Creator must receive one credit per eligible recruit, without duplicates';
  end if;
  if (select count(*) from public.credit_transactions where user_id = creator and reason = 'Qualified Affiliate or Ambassador recruit') <> 68
     or not exists (select 1 from public.credit_transactions tx where tx.user_id = recruit and tx.amount = 3 and tx.reason = 'Affiliate or Ambassador welcome bonus') then
    raise exception 'Both sides of each bonus must appear in credit history';
  end if;
end;
$$;

rollback;
