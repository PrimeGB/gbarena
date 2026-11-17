-- Ambassador program: founder-managed creators with tracked referrals,
-- special profiles, vanity links and tiered awards.
begin;

-- Tier awards shown on ambassador profiles.
insert into public.staff_award_catalog (name, award_group, purpose, exclusive, auto_award) values
  ('GB Affiliate', 'Ambassador Program', 'Held by GameBattles Affiliates: creators bringing new players into the community.', false, true),
  ('GB Ambassador', 'Ambassador Program', 'Held by GameBattles Ambassadors: standout creators growing the community with events and content.', false, true),
  ('GB Icon', 'Ambassador Program', 'The highest creator honor: GameBattles Icons shape the community and host events in their name.', false, true)
on conflict (name) do update set
  award_group = excluded.award_group,
  purpose = excluded.purpose,
  auto_award = excluded.auto_award;

create table if not exists public.ambassadors (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  tier text not null default 'affiliate' check (tier in ('affiliate', 'ambassador', 'icon')),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,23}$'),
  tagline text not null default '' check (length(tagline) <= 80),
  blurb text not null default '' check (length(blurb) <= 500),
  twitch text not null default '' check (length(twitch) <= 200),
  youtube text not null default '' check (length(youtube) <= 200),
  tiktok text not null default '' check (length(tiktok) <= 200),
  kick text not null default '' check (length(kick) <= 200),
  instagram text not null default '' check (length(instagram) <= 200),
  discord text not null default '' check (length(discord) <= 200),
  featured boolean not null default false,
  active boolean not null default true,
  appointed_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ambassadors enable row level security;
revoke all on public.ambassadors from public, anon, authenticated;

create or replace function public.gb_require_founder()
returns uuid
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null or not exists (
    select 1 from public.profiles where id = v_uid and role = 'owner'
  ) then
    raise exception 'Founder access required';
  end if;
  return v_uid;
end;
$$;

revoke all on function public.gb_require_founder() from public, anon;
grant execute on function public.gb_require_founder() to authenticated;

-- Public directory for the Ambassadors page.
create or replace function public.gb_ambassador_directory()
returns table (
  user_id uuid,
  username text,
  tier text,
  slug text,
  tagline text,
  blurb text,
  twitch text,
  youtube text,
  tiktok text,
  kick text,
  instagram text,
  discord text,
  featured boolean,
  recruits integer,
  qualified integer,
  since timestamptz
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    amb.user_id,
    prof.username,
    amb.tier,
    amb.slug,
    amb.tagline,
    amb.blurb,
    amb.twitch,
    amb.youtube,
    amb.tiktok,
    amb.kick,
    amb.instagram,
    amb.discord,
    amb.featured,
    count(refs.invited_user_id)::integer as recruits,
    count(refs.invited_user_id) filter (
      where public.gb_is_qualified_referral(refs.invited_user_id)
    )::integer as qualified,
    amb.created_at as since
  from public.ambassadors amb
  join public.profiles prof on prof.id = amb.user_id
  left join public.community_referrals refs on refs.referrer_id = amb.user_id
  where amb.active
  group by amb.user_id, prof.username, amb.tier, amb.slug, amb.tagline, amb.blurb,
    amb.twitch, amb.youtube, amb.tiktok, amb.kick, amb.instagram, amb.discord,
    amb.featured, amb.created_at
  order by
    case amb.tier when 'icon' then 0 when 'ambassador' then 1 else 2 end,
    qualified desc,
    recruits desc,
    prof.username;
$$;

revoke all on function public.gb_ambassador_directory() from public;
grant execute on function public.gb_ambassador_directory() to anon, authenticated;

-- Ambassador flair for one profile.
create or replace function public.gb_ambassador_for(p_user uuid)
returns table (tier text, slug text, twitch text, youtube text, tiktok text, kick text)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select amb.tier, amb.slug, amb.twitch, amb.youtube, amb.tiktok, amb.kick
  from public.ambassadors amb
  where amb.user_id = p_user and amb.active;
$$;

revoke all on function public.gb_ambassador_for(uuid) from public;
grant execute on function public.gb_ambassador_for(uuid) to anon, authenticated;

-- Resolve a vanity link (/amb/slug) to the ambassador's referral code.
create or replace function public.gb_ambassador_resolve(p_slug text)
returns table (referral_code text, username text)
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid;
begin
  select amb.user_id into v_user
  from public.ambassadors amb
  where amb.slug = lower(trim(p_slug)) and amb.active;

  if v_user is null then
    return;
  end if;

  insert into public.community_referral_codes(owner_id, code)
  values (v_user, lower(replace(gen_random_uuid()::text, '-', '')))
  on conflict (owner_id) do nothing;

  return query
    select codes.code, prof.username
    from public.community_referral_codes codes
    join public.profiles prof on prof.id = codes.owner_id
    where codes.owner_id = v_user;
end;
$$;

revoke all on function public.gb_ambassador_resolve(text) from public;
grant execute on function public.gb_ambassador_resolve(text) to anon, authenticated;

-- Founder: list everyone including inactive.
create or replace function public.staff_ambassador_list()
returns table (
  user_id uuid,
  username text,
  tier text,
  slug text,
  tagline text,
  blurb text,
  twitch text,
  youtube text,
  tiktok text,
  kick text,
  instagram text,
  discord text,
  featured boolean,
  active boolean,
  recruits integer,
  qualified integer,
  since timestamptz
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.gb_require_founder();
  return query
    select
      amb.user_id,
      prof.username,
      amb.tier,
      amb.slug,
      amb.tagline,
      amb.blurb,
      amb.twitch,
      amb.youtube,
      amb.tiktok,
      amb.kick,
      amb.instagram,
      amb.discord,
      amb.featured,
      amb.active,
      count(refs.invited_user_id)::integer,
      count(refs.invited_user_id) filter (
        where public.gb_is_qualified_referral(refs.invited_user_id)
      )::integer,
      amb.created_at
    from public.ambassadors amb
    join public.profiles prof on prof.id = amb.user_id
    left join public.community_referrals refs on refs.referrer_id = amb.user_id
    group by amb.user_id, prof.username, amb.tier, amb.slug, amb.tagline, amb.blurb,
      amb.twitch, amb.youtube, amb.tiktok, amb.kick, amb.instagram, amb.discord,
      amb.featured, amb.active, amb.created_at
    order by amb.active desc,
      case amb.tier when 'icon' then 0 when 'ambassador' then 1 else 2 end,
      prof.username;
end;
$$;

revoke all on function public.staff_ambassador_list() from public, anon;
grant execute on function public.staff_ambassador_list() to authenticated;

-- Founder: appoint or update an ambassador. Perks (tier award, referral code,
-- directory listing, profile flair) apply immediately.
create or replace function public.staff_ambassador_upsert(
  p_username text,
  p_tier text,
  p_slug text,
  p_tagline text default '',
  p_blurb text default '',
  p_twitch text default '',
  p_youtube text default '',
  p_tiktok text default '',
  p_kick text default '',
  p_instagram text default '',
  p_discord text default '',
  p_featured boolean default false,
  p_active boolean default true
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
  v_award text;
begin
  v_founder := public.gb_require_founder();

  select id into v_user from public.profiles
  where lower(username) = lower(trim(p_username));
  if v_user is null then
    raise exception 'No player found with username %', trim(p_username);
  end if;

  if p_tier not in ('affiliate', 'ambassador', 'icon') then
    raise exception 'Tier must be affiliate, ambassador or icon';
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
    v_user, p_tier, v_slug,
    left(coalesce(p_tagline, ''), 80),
    left(coalesce(p_blurb, ''), 500),
    left(coalesce(p_twitch, ''), 200),
    left(coalesce(p_youtube, ''), 200),
    left(coalesce(p_tiktok, ''), 200),
    left(coalesce(p_kick, ''), 200),
    left(coalesce(p_instagram, ''), 200),
    left(coalesce(p_discord, ''), 200),
    coalesce(p_featured, false),
    coalesce(p_active, true),
    v_founder
  )
  on conflict (user_id) do update set
    tier = excluded.tier,
    slug = excluded.slug,
    tagline = excluded.tagline,
    blurb = excluded.blurb,
    twitch = excluded.twitch,
    youtube = excluded.youtube,
    tiktok = excluded.tiktok,
    kick = excluded.kick,
    instagram = excluded.instagram,
    discord = excluded.discord,
    featured = excluded.featured,
    active = excluded.active,
    updated_at = now();

  -- Make sure their referral link exists so recruits are tracked from day one.
  insert into public.community_referral_codes(owner_id, code)
  values (v_user, lower(replace(gen_random_uuid()::text, '-', '')))
  on conflict (owner_id) do nothing;

  -- Tier award: affiliates get GB Affiliate, and higher tiers stack the ones below.
  if coalesce(p_active, true) then
    perform public.gb_grant_auto_award(v_user, 'GB Affiliate');
    if p_tier in ('ambassador', 'icon') then
      perform public.gb_grant_auto_award(v_user, 'GB Ambassador');
    end if;
    if p_tier = 'icon' then
      perform public.gb_grant_auto_award(v_user, 'GB Icon');
    end if;
  end if;
end;
$$;

revoke all on function public.staff_ambassador_upsert(text, text, text, text, text, text, text, text, text, text, text, boolean, boolean) from public, anon;
grant execute on function public.staff_ambassador_upsert(text, text, text, text, text, text, text, text, text, text, text, boolean, boolean) to authenticated;

-- Founder: remove someone from the program entirely.
create or replace function public.staff_ambassador_remove(p_user uuid)
returns void
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.gb_require_founder();
  delete from public.ambassadors where user_id = p_user;
end;
$$;

revoke all on function public.staff_ambassador_remove(uuid) from public, anon;
grant execute on function public.staff_ambassador_remove(uuid) to authenticated;

commit;
