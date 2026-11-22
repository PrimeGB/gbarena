-- Run against an isolated migrated database. All fixtures roll back.
begin;

do $$
declare
  founder uuid := gen_random_uuid();
  player uuid := gen_random_uuid();
  second_player uuid := gen_random_uuid();
  recruit uuid;
  player_name text := 'creator' || substr(player::text, 1, 8);
  second_name text := 'creator' || substr(second_player::text, 1, 8);
  original_slug text;
  i integer;
begin
  insert into auth.users(id, raw_user_meta_data) values
    (founder, jsonb_build_object('username', 'founder' || substr(founder::text, 1, 8))),
    (player, jsonb_build_object('username', player_name)),
    (second_player, jsonb_build_object('username', second_name));
  update public.profiles set role = 'owner' where id = founder;
  perform set_config('request.jwt.claim.sub', player::text, true);
  begin
    perform public.staff_set_creator_tier(player_name, 'ambassador');
    raise exception 'Non-founders must not change tiers';
  exception when others then
    if sqlerrm <> 'Founder access required' then raise; end if;
  end;
  begin
    perform public.staff_save_creator_idea('affiliate', 'private');
    raise exception 'Non-founders must not save ideas';
  exception when others then
    if sqlerrm <> 'Founder access required' then raise; end if;
  end;
  if has_table_privilege('authenticated', 'public.creator_program_ideas', 'select') then
    raise exception 'Idea table must not be readable directly';
  end if;

  perform set_config('request.jwt.claim.sub', founder::text, true);
  insert into public.ambassador_applications(user_id, status, games, twitch)
    values (player, 'approved', 'Battlefield', 'https://twitch.tv/test');
  perform public.staff_set_creator_tier(player_name, 'ambassador');
  select slug into original_slug from public.ambassadors where user_id = player;
  if original_slug is null or not exists (
    select 1 from public.ambassadors where user_id = player and tier = 'ambassador'
      and tagline = 'Battlefield' and twitch = 'https://twitch.tv/test' and active
  ) or not exists (select 1 from public.community_referral_codes where owner_id = player) then
    raise exception 'Appointment must preserve approved application details and create a link';
  end if;
  update public.ambassadors set blurb = 'Keep this', featured = true where user_id = player;
  perform public.staff_set_creator_tier(player_name, 'affiliate');
  if not exists (select 1 from public.ambassadors where user_id = player and tier = 'affiliate'
    and slug = original_slug and blurb = 'Keep this' and featured and not automatic_promotion_paused) then
    raise exception 'Changing tiers must preserve creator details and allow future promotion';
  end if;
  for i in 1..65 loop
    recruit := gen_random_uuid();
    insert into auth.users(id, email_confirmed_at, raw_user_meta_data)
      values (recruit, now(), jsonb_build_object('username', 'recruit' || substr(recruit::text, 1, 8)));
    insert into public.community_referrals(invited_user_id, referrer_id) values (recruit, player);
    insert into public.gaming_accounts(user_id, platform, category, game, account_id)
      values (recruit, 'pc', 'fixture', 'fixture', recruit::text);
  end loop;
  if (select tier from public.ambassadors where user_id = player) <> 'ambassador' then
    raise exception 'Automatic promotion at 65 must still work';
  end if;
  perform public.staff_set_creator_tier(player_name, 'affiliate');
  perform public.gb_reconcile_referral_awards(player);
  if not exists (select 1 from public.ambassadors where user_id = player and tier = 'affiliate'
    and automatic_promotion_paused and slug = original_slug) then
    raise exception 'Founder tier override must survive reconciliation';
  end if;
  perform public.staff_set_creator_tier(player_name, 'ambassador');
  if not exists (select 1 from public.ambassadors where user_id = player and tier = 'ambassador' and not automatic_promotion_paused) then
    raise exception 'Founder must be able to change the tier again';
  end if;
  perform public.staff_set_creator_tier(second_name, 'affiliate');
  if not exists (select 1 from public.ambassadors where user_id = second_player and tier = 'affiliate' and active) then
    raise exception 'Founder must be able to appoint a player without an application';
  end if;
  perform public.staff_save_creator_idea('affiliate', 'Banner idea');
  perform public.staff_save_creator_idea('ambassador', 'Profile idea');
  perform public.staff_save_creator_idea('affiliate', 'Updated banner idea');
  if (select notes from public.staff_creator_ideas() where tier = 'affiliate') <> 'Updated banner idea'
    or (select notes from public.staff_creator_ideas() where tier = 'ambassador') <> 'Profile idea' then
    raise exception 'Ideas must persist independently';
  end if;
end;
$$;
rollback;
