begin;

alter table public.ambassadors
  add column automatic_promotion_paused boolean not null default false;

create table public.creator_program_ideas (
  tier text primary key check (tier in ('affiliate', 'ambassador')),
  notes text not null default '' check (length(notes) <= 10000),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id)
);
alter table public.creator_program_ideas enable row level security;
revoke all on public.creator_program_ideas from public, anon, authenticated;

create function public.staff_creator_ideas()
returns table (tier text, notes text)
language plpgsql stable security definer set search_path = public, pg_temp
as $$
begin
  perform public.gb_require_founder();
  return query select ideas.tier, ideas.notes from public.creator_program_ideas ideas;
end;
$$;

create function public.staff_save_creator_idea(p_tier text, p_notes text)
returns void
language plpgsql volatile security definer set search_path = public, pg_temp
as $$
declare v_founder uuid;
begin
  v_founder := public.gb_require_founder();
  if p_tier is null or p_tier not in ('affiliate', 'ambassador') then
    raise exception 'Choose affiliate or ambassador';
  end if;
  if p_notes is null or length(p_notes) > 10000 then
    raise exception 'Notes must be 10,000 characters or fewer';
  end if;
  insert into public.creator_program_ideas(tier, notes, updated_at, updated_by)
  values (p_tier, p_notes, now(), v_founder)
  on conflict (tier) do update set notes = excluded.notes, updated_at = excluded.updated_at, updated_by = excluded.updated_by;
end;
$$;

revoke all on function public.staff_creator_ideas() from public, anon;
revoke all on function public.staff_save_creator_idea(text, text) from public, anon;
grant execute on function public.staff_creator_ideas() to authenticated;
grant execute on function public.staff_save_creator_idea(text, text) to authenticated;

create function public.staff_set_creator_tier(p_username text, p_tier text)
returns void
language plpgsql volatile security definer set search_path = public, pg_temp
as $$
declare
  v_user uuid;
  v_member public.ambassadors%rowtype;
  v_app public.ambassador_applications%rowtype;
  v_slug text;
  v_qualified integer;
begin
  perform public.gb_require_founder();
  if p_tier is null or p_tier not in ('affiliate', 'ambassador') then
    raise exception 'Choose affiliate or ambassador';
  end if;
  select id into v_user from public.profiles where lower(username) = lower(trim(p_username));
  if v_user is null then raise exception 'No player found with username %', trim(p_username); end if;

  -- Match the lock order used by referral reconciliation.
  perform 1 from public.profiles where id = v_user for update;
  select * into v_member from public.ambassadors where user_id = v_user;
  if found then
    v_slug := v_member.slug;
  else
    select * into v_app from public.ambassador_applications
      where user_id = v_user and status = 'approved' order by reviewed_at desc nulls last, id desc limit 1;
    loop
      v_slug := 'gb-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 21);
      exit when not exists (select 1 from public.ambassadors where slug = v_slug);
    end loop;
  end if;

  perform public.staff_ambassador_upsert(
    p_username, p_tier, v_slug,
    coalesce(v_member.tagline, left(v_app.games, 80), ''), coalesce(v_member.blurb, ''),
    coalesce(v_member.twitch, v_app.twitch, ''), coalesce(v_member.youtube, v_app.youtube, ''),
    coalesce(v_member.tiktok, v_app.tiktok, ''), coalesce(v_member.kick, v_app.kick, ''),
    coalesce(v_member.instagram, v_app.instagram, ''), coalesce(v_member.discord, v_app.discord, ''),
    coalesce(v_member.featured, false), true
  );
  select count(*) into v_qualified from public.community_referrals refs
    where refs.referrer_id = v_user and public.gb_is_qualified_referral(refs.invited_user_id);
  update public.ambassadors
    set automatic_promotion_paused = (p_tier = 'affiliate' and v_qualified >= 65)
    where user_id = v_user;
end;
$$;

revoke all on function public.staff_set_creator_tier(text, text) from public, anon;
grant execute on function public.staff_set_creator_tier(text, text) to authenticated;

create or replace function public.gb_reconcile_referral_awards(p_referrer_id uuid)
returns void
language plpgsql security definer set search_path = public, pg_temp
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
  perform 1 from public.profiles where id = p_referrer_id for update;
  if not found then return; end if;
  select count(*) into v_qualified_count from public.community_referrals refs
    where refs.referrer_id = p_referrer_id and public.gb_is_qualified_referral(refs.invited_user_id);
  for v_tier in
    select * from (values (1, 'Recruitment Recruit'), (3, 'Community Recruiter'),
      (5, 'Recruitment Captain'), (10, 'Recruitment Legend')) as tiers(required_count, award_name)
  loop
    if v_qualified_count >= v_tier.required_count then
      perform public.gb_grant_auto_award(p_referrer_id, v_tier.award_name);
    end if;
  end loop;
  select id into v_founder from public.profiles where role = 'owner' limit 1;
  select coalesce(username, 'a GameBattles creator') into v_amb_name from public.profiles where id = p_referrer_id;
  for v_recruit in
    select refs.invited_user_id, refs.program_recruit_credits from public.community_referrals refs
    where refs.referrer_id = p_referrer_id and refs.program_recruit_credits is not null
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
    perform public.apply_credit_change(p_referrer_id, 1, 'Qualified Affiliate or Ambassador recruit', 'award', null);
    insert into public.messages (sender_id, recipient_id, sender_type, subject, body, message_type, related_type, related_id, is_read, is_archived)
    values (coalesce(v_founder, p_referrer_id), v_recruit.invited_user_id, 'staff',
      'Welcome bonus: ' || v_recruit.program_recruit_credits || ' credits',
      'You joined through ' || v_amb_name || ' and qualified, so ' || v_recruit.program_recruit_credits || ' credits were added to your account. Welcome to GameBattles!',
      'staff', 'ambassador_bonus', v_recruit.invited_user_id, false, false);
    insert into public.messages (sender_id, recipient_id, sender_type, subject, body, message_type, related_type, related_id, is_read, is_archived)
    values (coalesce(v_founder, v_recruit.invited_user_id), p_referrer_id, 'staff',
      'Recruit bonus: +1 credit',
      'A player who joined through your link has qualified. One credit has been added to your account.',
      'staff', 'ambassador_bonus', v_recruit.invited_user_id, false, false);
  end loop;
  select * into v_amb from public.ambassadors where user_id = p_referrer_id and active;
  if found and v_amb.tier = 'affiliate' and not v_amb.automatic_promotion_paused and v_qualified_count >= 65 then
    update public.ambassadors set tier = 'ambassador', updated_at = now()
    where user_id = p_referrer_id and tier = 'affiliate';
    perform public.gb_grant_auto_award(p_referrer_id, 'GB Ambassador');
    insert into public.messages (sender_id, recipient_id, sender_type, subject, body, message_type, related_type, related_id, is_read, is_archived)
    values (coalesce(v_founder, p_referrer_id), p_referrer_id, 'staff',
      'You are now a GB Ambassador',
      'You have brought 65 qualified players to GameBattles and have been promoted to Ambassador. Your GB Ambassador award and gold status are now live.',
      'staff', 'ambassador_promotion', p_referrer_id, false, false);
  end if;
end;
$$;

create or replace function public.staff_ambassador_application_review(p_id bigint, p_status text, p_note text default '')
returns void language plpgsql volatile security definer set search_path = public, pg_temp
as $$
declare v_founder uuid; v_app record;
begin
  v_founder := public.gb_require_founder();
  if p_status not in ('approved', 'declined') then raise exception 'Status must be approved or declined'; end if;
  select * into v_app from public.ambassador_applications where id = p_id for update;
  if not found or v_app.status <> 'pending' then raise exception 'This application is no longer open'; end if;
  update public.ambassador_applications set status = p_status, reviewed_by = v_founder, reviewed_at = now(),
    review_note = left(trim(coalesce(p_note, '')), 500) where id = p_id;
  insert into public.messages (sender_id, recipient_id, sender_type, subject, body, message_type, related_type, related_id, is_read, is_archived)
  values (v_founder, v_app.user_id, 'staff',
    case when p_status = 'approved' then 'Your creator application is approved' else 'Your Ambassador application' end,
    case when p_status = 'approved'
      then 'Congratulations! Your application to the GameBattles creator program has been approved. Your program membership is being set up now.'
      else 'Thanks for applying to the GameBattles Ambassador program. We are not able to bring you on right now, but keep playing and streaming - you can apply again any time.'
        || case when length(trim(coalesce(p_note, ''))) > 0 then E'\n\nNote from the Founder: ' || trim(p_note) else '' end
    end, 'staff', 'ambassador_application', v_app.user_id, false, false);
end;
$$;

commit;
