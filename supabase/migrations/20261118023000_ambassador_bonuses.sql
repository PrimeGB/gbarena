-- Ambassador recruit bonuses and automatic tier promotion.
-- Recruits who join through an ambassador link get 5 credits once qualified;
-- the ambassador earns 5 credits per qualified recruit. Tiers auto-promote:
-- 25 qualified recruits -> Ambassador, 75 -> Icon.
begin;

create table if not exists public.ambassador_recruit_bonuses (
  invited_user_id uuid primary key references public.profiles(id) on delete cascade,
  referrer_id uuid not null references public.profiles(id) on delete cascade,
  recruit_credits integer not null,
  creator_credits integer not null,
  created_at timestamptz not null default now()
);

alter table public.ambassador_recruit_bonuses enable row level security;
revoke all on public.ambassador_recruit_bonuses from public, anon, authenticated;

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
  v_recruit_name text;
begin
  if p_referrer_id is null then
    return;
  end if;

  select count(*) into v_qualified_count
  from public.community_referrals referrals
  where referrals.referrer_id = p_referrer_id
    and public.gb_is_qualified_referral(referrals.invited_user_id);

  for v_tier in
    select * from (values
      (1, 'Recruitment Recruit'),
      (3, 'Community Recruiter'),
      (5, 'Recruitment Captain'),
      (10, 'Recruitment Legend')
    ) as tiers(required_count, award_name)
  loop
    if v_qualified_count >= v_tier.required_count then
      perform public.gb_grant_auto_award(p_referrer_id, v_tier.award_name);
    end if;
  end loop;

  -- Ambassador program: credit bonuses and automatic promotion.
  select * into v_amb from public.ambassadors
  where user_id = p_referrer_id and active;
  if not found then
    return;
  end if;

  select id into v_founder from public.profiles where role = 'owner' limit 1;
  select coalesce(username, 'Your ambassador') into v_amb_name
  from public.profiles where id = p_referrer_id;

  -- One-time 5 + 5 credit bonus for each recruit who qualified after the
  -- creator joined the program.
  for v_recruit in
    select refs.invited_user_id
    from public.community_referrals refs
    where refs.referrer_id = p_referrer_id
      and refs.created_at >= v_amb.created_at
      and public.gb_is_qualified_referral(refs.invited_user_id)
      and not exists (
        select 1 from public.ambassador_recruit_bonuses bonus
        where bonus.invited_user_id = refs.invited_user_id
      )
  loop
    insert into public.ambassador_recruit_bonuses (invited_user_id, referrer_id, recruit_credits, creator_credits)
    values (v_recruit.invited_user_id, p_referrer_id, 5, 5);

    update public.profiles set credits = coalesce(credits, 0) + 5
    where id = v_recruit.invited_user_id;
    update public.profiles set credits = coalesce(credits, 0) + 5
    where id = p_referrer_id;

    select coalesce(username, 'A new player') into v_recruit_name
    from public.profiles where id = v_recruit.invited_user_id;

    insert into public.messages (sender_id, recipient_id, sender_type, subject, body, message_type, related_type, related_id, is_read, is_archived)
    values (
      coalesce(v_founder, p_referrer_id), v_recruit.invited_user_id, 'staff',
      'Welcome bonus: 5 free credits',
      'You joined GameBattles through ' || v_amb_name || ', one of our Ambassadors - so 5 free credits were just added to your account.'
        || E'\n\nCredits can be used to enter paid tournaments, including events with cash prizes. Check out /tournaments to put them to work.'
        || E'\n\nWelcome to GameBattles!',
      'staff', 'ambassador_bonus', v_recruit.invited_user_id, false, false
    );

    insert into public.messages (sender_id, recipient_id, sender_type, subject, body, message_type, related_type, related_id, is_read, is_archived)
    values (
      coalesce(v_founder, v_recruit.invited_user_id), p_referrer_id, 'staff',
      'Ambassador bonus: +5 credits',
      v_recruit_name || ' joined through your ambassador link and qualified, so 5 credits were added to your account.'
        || E'\n\nEvery player who joins through your link and qualifies (verified email plus a linked gaming account) earns you 5 more credits - and they get 5 free credits too.',
      'staff', 'ambassador_bonus', v_recruit.invited_user_id, false, false
    );
  end loop;

  -- Automatic promotion as qualified recruits stack up. Never demotes.
  if v_qualified_count >= 75 and v_amb.tier <> 'icon' then
    update public.ambassadors set tier = 'icon', updated_at = now()
    where user_id = p_referrer_id;
    perform public.gb_grant_auto_award(p_referrer_id, 'GB Ambassador');
    perform public.gb_grant_auto_award(p_referrer_id, 'GB Icon');
    insert into public.messages (sender_id, recipient_id, sender_type, subject, body, message_type, related_type, related_id, is_read, is_archived)
    values (
      coalesce(v_founder, p_referrer_id), p_referrer_id, 'staff',
      'You are now a GB Icon',
      'You have brought 75 qualified players to GameBattles. You have been promoted to Icon - the highest creator tier. The GB Icon award is on your profile, and events can now be hosted in your name.',
      'staff', 'ambassador_promotion', p_referrer_id, false, false
    );
  elsif v_qualified_count >= 25 and v_amb.tier = 'affiliate' then
    update public.ambassadors set tier = 'ambassador', updated_at = now()
    where user_id = p_referrer_id;
    perform public.gb_grant_auto_award(p_referrer_id, 'GB Ambassador');
    insert into public.messages (sender_id, recipient_id, sender_type, subject, body, message_type, related_type, related_id, is_read, is_archived)
    values (
      coalesce(v_founder, p_referrer_id), p_referrer_id, 'staff',
      'You are now a GB Ambassador',
      'You have brought 25 qualified players to GameBattles and have been promoted to Ambassador. The GB Ambassador award is on your profile and your gold status is live.',
      'staff', 'ambassador_promotion', p_referrer_id, false, false
    );
  end if;
end;
$$;

revoke all on function public.gb_reconcile_referral_awards(uuid) from public, anon, authenticated;

commit;
