-- Ambassador "Go Live": one-click live toggle. Going live emails all of the
-- ambassador's followers a custom alert (max once per 6 hours, respects the
-- global email pause and each player's email preference).
begin;

alter table public.ambassadors
  add column if not exists live boolean not null default false,
  add column if not exists live_started_at timestamptz,
  add column if not exists last_live_alert_at timestamptz;

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

  v_stream := coalesce(nullif(v_amb.twitch, ''), nullif(v_amb.youtube, ''), nullif(v_amb.kick, ''));
  if p_live and v_stream is null then
    raise exception 'No stream link is set on your ambassador profile yet. Ask the Founder to add your Twitch, YouTube or Kick link.';
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
            'body', v_stream,
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

-- Directory and flair lookups now include live status.
drop function if exists public.gb_ambassador_directory();
create function public.gb_ambassador_directory()
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
    amb.twitch,
    amb.youtube,
    amb.tiktok,
    amb.kick,
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
  left join public.community_referrals refs on refs.referrer_id = amb.user_id
  where amb.active
  group by amb.user_id, prof.username, amb.tier, amb.slug, amb.tagline, amb.blurb,
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

commit;
