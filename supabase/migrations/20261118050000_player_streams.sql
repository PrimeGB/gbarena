-- Player stream links: any player can save their stream links in settings.
-- Ambassadors choose which platforms the one-click Go Live announces.
begin;

create table if not exists public.player_streams (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  twitch text not null default '' check (length(twitch) <= 200),
  youtube text not null default '' check (length(youtube) <= 200),
  tiktok text not null default '' check (length(tiktok) <= 200),
  kick text not null default '' check (length(kick) <= 200),
  announce_twitch boolean not null default true,
  announce_youtube boolean not null default true,
  announce_tiktok boolean not null default true,
  announce_kick boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.player_streams enable row level security;
revoke all on public.player_streams from public, anon, authenticated;

-- Own settings (links + announce toggles).
create or replace function public.gb_my_streams()
returns table (twitch text, youtube text, tiktok text, kick text,
  announce_twitch boolean, announce_youtube boolean, announce_tiktok boolean, announce_kick boolean)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select ps.twitch, ps.youtube, ps.tiktok, ps.kick,
    ps.announce_twitch, ps.announce_youtube, ps.announce_tiktok, ps.announce_kick
  from public.player_streams ps
  where ps.user_id = auth.uid();
$$;

revoke all on function public.gb_my_streams() from public, anon;
grant execute on function public.gb_my_streams() to authenticated;

create or replace function public.gb_set_my_streams(
  p_twitch text default '',
  p_youtube text default '',
  p_tiktok text default '',
  p_kick text default '',
  p_announce_twitch boolean default true,
  p_announce_youtube boolean default true,
  p_announce_tiktok boolean default true,
  p_announce_kick boolean default true
)
returns void
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then
    raise exception 'Sign in first';
  end if;
  insert into public.player_streams (
    user_id, twitch, youtube, tiktok, kick,
    announce_twitch, announce_youtube, announce_tiktok, announce_kick, updated_at
  ) values (
    auth.uid(),
    left(trim(coalesce(p_twitch, '')), 200),
    left(trim(coalesce(p_youtube, '')), 200),
    left(trim(coalesce(p_tiktok, '')), 200),
    left(trim(coalesce(p_kick, '')), 200),
    coalesce(p_announce_twitch, true),
    coalesce(p_announce_youtube, true),
    coalesce(p_announce_tiktok, true),
    coalesce(p_announce_kick, true),
    now()
  )
  on conflict (user_id) do update set
    twitch = excluded.twitch,
    youtube = excluded.youtube,
    tiktok = excluded.tiktok,
    kick = excluded.kick,
    announce_twitch = excluded.announce_twitch,
    announce_youtube = excluded.announce_youtube,
    announce_tiktok = excluded.announce_tiktok,
    announce_kick = excluded.announce_kick,
    updated_at = now();
end;
$$;

revoke all on function public.gb_set_my_streams(text, text, text, text, boolean, boolean, boolean, boolean) from public, anon;
grant execute on function public.gb_set_my_streams(text, text, text, text, boolean, boolean, boolean, boolean) to authenticated;

-- Public: a player's stream links for their profile.
create or replace function public.gb_player_streams(p_user uuid)
returns table (twitch text, youtube text, tiktok text, kick text)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select ps.twitch, ps.youtube, ps.tiktok, ps.kick
  from public.player_streams ps
  where ps.user_id = p_user;
$$;

revoke all on function public.gb_player_streams(uuid) from public;
grant execute on function public.gb_player_streams(uuid) to anon, authenticated;

-- Directory now prefers self-managed links over founder-set ones.
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
  live boolean,
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
    coalesce(nullif(ps.twitch, ''), amb.twitch) as twitch,
    coalesce(nullif(ps.youtube, ''), amb.youtube) as youtube,
    coalesce(nullif(ps.tiktok, ''), amb.tiktok) as tiktok,
    coalesce(nullif(ps.kick, ''), amb.kick) as kick,
    amb.instagram,
    amb.discord,
    amb.featured,
    amb.live,
    count(refs.invited_user_id)::integer as recruits,
    count(refs.invited_user_id) filter (
      where public.gb_is_qualified_referral(refs.invited_user_id)
    )::integer as qualified,
    amb.created_at as since
  from public.ambassadors amb
  join public.profiles prof on prof.id = amb.user_id
  left join public.player_streams ps on ps.user_id = amb.user_id
  left join public.community_referrals refs on refs.referrer_id = amb.user_id
  where amb.active
  group by amb.user_id, prof.username, amb.tier, amb.slug, amb.tagline, amb.blurb,
    ps.twitch, ps.youtube, ps.tiktok, ps.kick,
    amb.twitch, amb.youtube, amb.tiktok, amb.kick, amb.instagram, amb.discord,
    amb.featured, amb.live, amb.created_at
  order by
    amb.live desc,
    case amb.tier when 'icon' then 0 when 'ambassador' then 1 else 2 end,
    qualified desc,
    recruits desc,
    prof.username;
$$;

revoke all on function public.gb_ambassador_directory() from public;
grant execute on function public.gb_ambassador_directory() to anon, authenticated;

-- Go Live announces every enabled platform the creator has set.
create or replace function public.gb_ambassador_go_live(p_live boolean)
returns table (is_live boolean, alerted integer)
language plpgsql
volatile
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_amb record;
  v_ps record;
  v_links text[] := '{}';
  v_stream text;
  v_url text;
  v_secret text;
  v_count integer := 0;
  v_follower record;
  v_name text;
begin
  if v_uid is null then
    raise exception 'Sign in first';
  end if;
  select * into v_amb from public.ambassadors where user_id = v_uid and active;
  if not found then
    raise exception 'Only ambassadors can use the live toggle';
  end if;

  select * into v_ps from public.player_streams where user_id = v_uid;
  if found then
    if v_ps.announce_twitch and v_ps.twitch <> '' then v_links := v_links || v_ps.twitch; end if;
    if v_ps.announce_youtube and v_ps.youtube <> '' then v_links := v_links || v_ps.youtube; end if;
    if v_ps.announce_kick and v_ps.kick <> '' then v_links := v_links || v_ps.kick; end if;
    if v_ps.announce_tiktok and v_ps.tiktok <> '' then v_links := v_links || v_ps.tiktok; end if;
  end if;
  if coalesce(array_length(v_links, 1), 0) = 0 then
    v_stream := coalesce(nullif(v_amb.twitch, ''), nullif(v_amb.youtube, ''), nullif(v_amb.kick, ''));
    if v_stream is not null then
      v_links := array[v_stream];
    end if;
  end if;

  if p_live and coalesce(array_length(v_links, 1), 0) = 0 then
    raise exception 'Add your stream links first: Edit Profile > Settings > My Streams.';
  end if;

  update public.ambassadors
  set live = p_live,
      live_started_at = case when p_live then now() else live_started_at end,
      updated_at = now()
  where user_id = v_uid;

  if p_live
    and (v_amb.last_live_alert_at is null or v_amb.last_live_alert_at < now() - interval '6 hours')
    and not public.gb_emails_paused()
  then
    select value into v_url from public.app_settings where key = 'email_webhook_url';
    select value into v_secret from public.app_settings where key = 'email_webhook_secret';
    select coalesce(username, 'A GameBattles Ambassador') into v_name
    from public.profiles where id = v_uid;

    if coalesce(v_url, '') <> '' and coalesce(v_secret, '') <> '' then
      for v_follower in
        select u.email
        from public.community_follows f
        join public.profiles p on p.id = f.follower_id
        join auth.users u on u.id = f.follower_id
        where f.target_type = 'player'
          and f.target_id = v_uid::text
          and f.follower_id <> v_uid
          and coalesce(p.email_notifications, true)
          and u.email is not null
        limit 500
      loop
        perform net.http_post(
          url := v_url,
          body := jsonb_build_object(
            'type', 'ambassador_live',
            'to', v_follower.email,
            'subject', v_name || ' is LIVE right now',
            'body', array_to_string(v_links, E'\n'),
            'related_type', 'ambassador_live',
            'related_id', v_uid::text
          ),
          headers := jsonb_build_object('Content-Type', 'application/json', 'x-webhook-secret', v_secret)
        );
        v_count := v_count + 1;
      end loop;
      update public.ambassadors set last_live_alert_at = now() where user_id = v_uid;
    end if;
  end if;

  return query select p_live, v_count;
end;
$$;

revoke all on function public.gb_ambassador_go_live(boolean) from public, anon;
grant execute on function public.gb_ambassador_go_live(boolean) to authenticated;

commit;
