-- Preserve promised bonuses for existing signups and capture new rewards at signup.
begin;

alter table public.community_referral_signups
  add column program_recruit_credits integer check (program_recruit_credits in (2, 3, 5));
alter table public.community_referrals
  add column program_recruit_credits integer check (program_recruit_credits in (2, 3, 5));

update public.community_referrals refs
set program_recruit_credits = 5
from public.ambassadors amb
where refs.referrer_id = amb.user_id and refs.created_at >= amb.created_at;

update public.community_referral_signups signups
set program_recruit_credits = 5
from public.community_referral_codes codes
join public.ambassadors amb on amb.user_id = codes.owner_id and amb.active
where signups.referral_code = codes.code and signups.user_id <> codes.owner_id;

update public.ambassadors set tier = 'ambassador', updated_at = now() where tier = 'icon';
alter table public.ambassadors drop constraint ambassadors_tier_check;
alter table public.ambassadors add constraint ambassadors_tier_check check (tier in ('affiliate', 'ambassador'));

create or replace function public.staff_ambassador_upsert(
  p_username text, p_tier text, p_slug text, p_tagline text default '',
  p_blurb text default '', p_twitch text default '', p_youtube text default '',
  p_tiktok text default '', p_kick text default '', p_instagram text default '',
  p_discord text default '', p_featured boolean default false, p_active boolean default true
)
returns void
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_founder uuid;
  v_user uuid;
  v_slug text := lower(trim(p_slug));
begin
  v_founder := public.gb_require_founder();
  select id into v_user from public.profiles where lower(username) = lower(trim(p_username));
  if v_user is null then raise exception 'No player found with username %', trim(p_username); end if;
  if p_tier is null or p_tier not in ('affiliate', 'ambassador') then
    raise exception 'Tier must be affiliate or ambassador';
  end if;
  if v_slug !~ '^[a-z0-9][a-z0-9-]{1,23}$' then
    raise exception 'Link name must be 2-24 characters: letters, numbers and dashes';
  end if;
  if exists (select 1 from public.ambassadors where slug = v_slug and user_id <> v_user) then
    raise exception 'That link name is already taken';
  end if;
  insert into public.ambassadors (
    user_id, tier, slug, tagline, blurb, twitch, youtube, tiktok, kick,
    instagram, discord, featured, active, appointed_by
  ) values (
    v_user, p_tier, v_slug, left(coalesce(p_tagline, ''), 80),
    left(coalesce(p_blurb, ''), 500), left(coalesce(p_twitch, ''), 200),
    left(coalesce(p_youtube, ''), 200), left(coalesce(p_tiktok, ''), 200),
    left(coalesce(p_kick, ''), 200), left(coalesce(p_instagram, ''), 200),
    left(coalesce(p_discord, ''), 200), coalesce(p_featured, false),
    coalesce(p_active, true), v_founder
  )
  on conflict (user_id) do update set
    tier = excluded.tier, slug = excluded.slug, tagline = excluded.tagline,
    blurb = excluded.blurb, twitch = excluded.twitch, youtube = excluded.youtube,
    tiktok = excluded.tiktok, kick = excluded.kick, instagram = excluded.instagram,
    discord = excluded.discord, featured = excluded.featured, active = excluded.active,
    updated_at = now();

  insert into public.community_referral_codes(owner_id, code)
  values (v_user, lower(replace(gen_random_uuid()::text, '-', '')))
  on conflict (owner_id) do nothing;
  if coalesce(p_active, true) then
    perform public.gb_grant_auto_award(v_user, 'GB Affiliate');
    if p_tier = 'ambassador' then
      perform public.gb_grant_auto_award(v_user, 'GB Ambassador');
    end if;
  end if;
end;
$$;

create or replace function public.gb_capture_referral_on_signup()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_code text := lower(trim(coalesce(new.raw_user_meta_data ->> 'referral_code', '')));
  v_credits integer;
begin
  if v_code ~ '^[0-9a-f]{32}$' then
    select case amb.tier when 'affiliate' then 2 when 'ambassador' then 3 end
    into v_credits
    from public.community_referral_codes codes
    join public.ambassadors amb on amb.user_id = codes.owner_id and amb.active
    where codes.code = v_code and codes.owner_id <> new.id;

    insert into public.community_referral_signups(user_id, referral_code, program_recruit_credits)
    values (new.id, v_code, v_credits)
    on conflict (user_id) do nothing;
  end if;
  return new;
end;
$$;

create or replace function public.gb_attribute_referral()
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_referrer_id uuid;
  v_existing_referrer uuid;
  v_credits integer;
  v_rows_inserted integer;
begin
  if auth.uid() is null then
    raise exception 'Sign in to apply a referral';
  end if;
  if not exists (select 1 from auth.users where id = auth.uid() and email_confirmed_at is not null) then
    raise exception 'Verify your email before applying a referral';
  end if;
  if not exists (select 1 from public.profiles where id = auth.uid()) then
    raise exception 'Complete account setup before applying a referral';
  end if;

  select codes.owner_id, signups.program_recruit_credits into v_referrer_id, v_credits
  from public.community_referral_signups signups
  join public.community_referral_codes codes on codes.code = signups.referral_code
  where signups.user_id = auth.uid();
  if v_referrer_id is null or v_referrer_id = auth.uid() then
    delete from public.community_referral_signups where user_id = auth.uid();
    return false;
  end if;

  select referrer_id into v_existing_referrer
  from public.community_referrals where invited_user_id = auth.uid();
  if v_existing_referrer is not null then
    delete from public.community_referral_signups where user_id = auth.uid();
    return v_existing_referrer = v_referrer_id;
  end if;

  insert into public.community_referrals(invited_user_id, referrer_id, program_recruit_credits)
  values (auth.uid(), v_referrer_id, v_credits)
  on conflict (invited_user_id) do nothing;
  get diagnostics v_rows_inserted = row_count;

  if v_rows_inserted = 1 then
    perform public.gb_reconcile_referral_awards(v_referrer_id);
    delete from public.community_referral_signups where user_id = auth.uid();
    return true;
  end if;
  select referrer_id into v_existing_referrer
  from public.community_referrals where invited_user_id = auth.uid();
  delete from public.community_referral_signups where user_id = auth.uid();
  return v_existing_referrer = v_referrer_id;
end;
$$;

create or replace function public.gb_reconcile_referral_awards(p_referrer_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_qualified_count integer;
  v_tier record;
  v_amb record;
  v_recruit record;
  v_founder uuid;
  v_amb_name text;
  v_rows integer;
begin
  if p_referrer_id is null then return; end if;

  -- Serialize reconciliation for a creator, including promotion decisions.
  perform 1 from public.profiles where id = p_referrer_id for update;
  if not found then return; end if;

  select count(*) into v_qualified_count
  from public.community_referrals refs
  where refs.referrer_id = p_referrer_id
    and public.gb_is_qualified_referral(refs.invited_user_id);

  for v_tier in
    select * from (values (1, 'Recruitment Recruit'), (3, 'Community Recruiter'),
      (5, 'Recruitment Captain'), (10, 'Recruitment Legend')) as tiers(required_count, award_name)
  loop
    if v_qualified_count >= v_tier.required_count then
      perform public.gb_grant_auto_award(p_referrer_id, v_tier.award_name);
    end if;
  end loop;

  select id into v_founder from public.profiles where role = 'owner' limit 1;
  select coalesce(username, 'a GameBattles creator') into v_amb_name
  from public.profiles where id = p_referrer_id;

  for v_recruit in
    select refs.invited_user_id, refs.program_recruit_credits
    from public.community_referrals refs
    where refs.referrer_id = p_referrer_id
      and refs.program_recruit_credits is not null
      and public.gb_is_qualified_referral(refs.invited_user_id)
      and not exists (select 1 from public.ambassador_recruit_bonuses b where b.invited_user_id = refs.invited_user_id)
  loop
    insert into public.ambassador_recruit_bonuses(invited_user_id, referrer_id, recruit_credits, creator_credits)
    values (v_recruit.invited_user_id, p_referrer_id, v_recruit.program_recruit_credits, 1)
    on conflict (invited_user_id) do nothing;
    get diagnostics v_rows = row_count;
    if v_rows = 0 then continue; end if;

    perform public.apply_credit_change(v_recruit.invited_user_id, v_recruit.program_recruit_credits,
      'Affiliate or Ambassador welcome bonus', 'award', null);
    perform public.apply_credit_change(p_referrer_id, 1,
      'Qualified Affiliate or Ambassador recruit', 'award', null);

    insert into public.messages (sender_id, recipient_id, sender_type, subject, body, message_type, related_type, related_id, is_read, is_archived)
    values (
      coalesce(v_founder, p_referrer_id), v_recruit.invited_user_id, 'staff',
      'Welcome bonus: ' || v_recruit.program_recruit_credits || ' credits',
      'You joined through ' || v_amb_name || ' and qualified, so ' || v_recruit.program_recruit_credits || ' credits were added to your account. Welcome to GameBattles!',
      'staff', 'ambassador_bonus', v_recruit.invited_user_id, false, false
    );
    insert into public.messages (sender_id, recipient_id, sender_type, subject, body, message_type, related_type, related_id, is_read, is_archived)
    values (
      coalesce(v_founder, v_recruit.invited_user_id), p_referrer_id, 'staff',
      'Recruit bonus: +1 credit',
      'A player who joined through your link has qualified. One credit has been added to your account.',
      'staff', 'ambassador_bonus', v_recruit.invited_user_id, false, false
    );
  end loop;

  select * into v_amb from public.ambassadors where user_id = p_referrer_id and active;
  if found and v_amb.tier = 'affiliate' and v_qualified_count >= 65 then
    update public.ambassadors set tier = 'ambassador', updated_at = now()
    where user_id = p_referrer_id and tier = 'affiliate';
    perform public.gb_grant_auto_award(p_referrer_id, 'GB Ambassador');
    insert into public.messages (sender_id, recipient_id, sender_type, subject, body, message_type, related_type, related_id, is_read, is_archived)
    values (
      coalesce(v_founder, p_referrer_id), p_referrer_id, 'staff',
      'You are now a GB Ambassador',
      'You have brought 65 qualified players to GameBattles and have been promoted to Ambassador. Your GB Ambassador award and gold status are now live.',
      'staff', 'ambassador_promotion', p_referrer_id, false, false
    );
  end if;
end;
$$;

-- Existing affiliates who already meet the new threshold should not need another signup.
do $$
declare v_member record;
begin
  for v_member in select user_id from public.ambassadors where active and tier = 'affiliate'
  loop
    perform public.gb_reconcile_referral_awards(v_member.user_id);
  end loop;
end;
$$;

with site_updates as (
  select id from public.forum_posts
  where author = 'Prime' and category = 'News & Updates' and pinned and not hidden
    and subject ilike '%Site Updates%'
  order by created_at desc limit 1
)
update public.forum_posts post
set message = concat_ws(E'\n\n', nullif(trim(post.message), ''),
  'Our Affiliate and Ambassador program has a fresh new look! Explore the perks, share your link, earn credits for qualified recruits and work toward Ambassador status.')
from site_updates where post.id = site_updates.id;

commit;
