-- In-site notifications (system inbox messages), Discord announcements,
-- the public activity feed, and weekly / monthly leaderboards.

create extension if not exists pg_net with schema extensions;

-- Private settings table. RLS is on with no policies, so only security definer functions can read it.
create table if not exists public.app_settings (
  key text primary key,
  value text
);
alter table public.app_settings enable row level security;
revoke all on public.app_settings from public, anon, authenticated;

create or replace function public.gb_notify(
  p_user uuid,
  p_subject text,
  p_body text,
  p_related_type text default null,
  p_related_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_user is null then
    return;
  end if;

  insert into public.messages (sender_id, recipient_id, sender_type, subject, body, message_type, related_type, related_id, is_read, is_archived)
  values (null, p_user, 'system', p_subject, p_body, 'system', p_related_type, p_related_id, false, false);
exception when others then
  null;
end;
$$;

create or replace function public.gb_notify_team(
  p_team uuid,
  p_subject text,
  p_body text,
  p_related_type text default null,
  p_related_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid;
begin
  if p_team is null then
    return;
  end if;

  for v_user in
    select owner_id from public.teams where id = p_team and owner_id is not null
    union
    select user_id from public.team_members where team_id = p_team and user_id is not null
  loop
    perform public.gb_notify(v_user, p_subject, p_body, p_related_type, p_related_id);
  end loop;
end;
$$;

create or replace function public.gb_discord_post(p_content text)
returns void
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_url text;
begin
  select value into v_url from public.app_settings where key = 'discord_webhook_url';
  if v_url is null or v_url = '' then
    return;
  end if;

  perform net.http_post(
    url := v_url,
    body := jsonb_build_object('content', left(p_content, 1900), 'allowed_mentions', jsonb_build_object('parse', jsonb_build_array())),
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
exception when others then
  null;
end;
$$;

revoke all on function public.gb_notify(uuid, text, text, text, uuid) from public, anon, authenticated;
revoke all on function public.gb_notify_team(uuid, text, text, text, uuid) from public, anon, authenticated;
revoke all on function public.gb_discord_post(text) from public, anon, authenticated;

create or replace function public.gb_pretty(p_value text)
returns text
language sql
immutable
as $$
  select coalesce(initcap(replace(p_value, '-', ' ')), 'Unknown');
$$;

-- Match accepted
create or replace function public.gb_on_match_created()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_a text;
  v_b text;
  v_label text;
begin
  select name into v_a from public.teams where id = new.posting_team_id;
  select name into v_b from public.teams where id = new.accepting_team_id;
  v_label := coalesce(v_a, 'Team') || ' vs ' || coalesce(v_b, 'Team');

  perform public.gb_notify_team(
    new.posting_team_id,
    'Match accepted: ' || v_label,
    'Your match was accepted. ' || public.gb_pretty(new.game) || ' - ' || public.gb_pretty(new.ladder) || ' on ' || public.gb_pretty(new.platform) || '. Open the match page for details.',
    'match', new.id
  );
  perform public.gb_notify_team(
    new.accepting_team_id,
    'Match accepted: ' || v_label,
    'You accepted a match. ' || public.gb_pretty(new.game) || ' - ' || public.gb_pretty(new.ladder) || ' on ' || public.gb_pretty(new.platform) || '. Open the match page for details.',
    'match', new.id
  );

  perform public.gb_discord_post(
    E'\u2694\uFE0F **Match accepted:** ' || v_label || ' (' || public.gb_pretty(new.game) || ' - ' || public.gb_pretty(new.ladder) || ', ' || public.gb_pretty(new.platform) || ')'
  );
  return new;
end;
$$;

drop trigger if exists matches_notify_created on public.matches;
create trigger matches_notify_created
  after insert on public.matches
  for each row execute function public.gb_on_match_created();

-- Dispute opened
create or replace function public.gb_on_dispute_created()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_a text;
  v_b text;
  v_label text;
begin
  select name into v_a from public.teams where id = new.team_id;
  select name into v_b from public.teams where id = new.opponent_team_id;
  v_label := coalesce(v_a, 'Team') || ' vs ' || coalesce(v_b, 'Team');

  perform public.gb_notify_team(
    new.team_id,
    'Dispute opened: ' || v_label,
    'A dispute ticket was opened for your match. Staff will review the evidence from both teams.',
    'match', new.match_id
  );
  perform public.gb_notify_team(
    new.opponent_team_id,
    'Dispute opened: ' || v_label,
    'A dispute ticket was opened for your match. Submit your ticket and proof before the window closes.',
    'match', new.match_id
  );

  perform public.gb_discord_post(
    E'\U0001F6A8 **Dispute opened:** ' || v_label || ' (' || public.gb_pretty(new.game) || ')'
  );
  return new;
end;
$$;

drop trigger if exists dispute_tickets_notify_created on public.dispute_tickets;
create trigger dispute_tickets_notify_created
  after insert on public.dispute_tickets
  for each row execute function public.gb_on_dispute_created();

-- Award earned
create or replace function public.gb_on_award_granted()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_name text;
begin
  select name into v_name from public.staff_award_catalog where id = new.award_id;

  if new.recipient_id is not null then
    perform public.gb_notify(
      new.recipient_id,
      'You earned an award: ' || coalesce(v_name, 'Award'),
      'Congratulations! "' || coalesce(v_name, 'Award') || '" was added to your profile.',
      'award', null
    );
  end if;

  if new.recipient_team_id is not null then
    perform public.gb_notify_team(
      new.recipient_team_id,
      'Your team earned an award: ' || coalesce(v_name, 'Award'),
      'Congratulations! "' || coalesce(v_name, 'Award') || '" was added to your team.',
      'award', null
    );
  end if;

  return new;
end;
$$;

drop trigger if exists staff_user_awards_notify on public.staff_user_awards;
create trigger staff_user_awards_notify
  after insert on public.staff_user_awards
  for each row execute function public.gb_on_award_granted();

-- Public activity feed for the home page
create or replace function public.gb_recent_activity(p_limit integer default 12)
returns setof jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select jsonb_build_object('kind', a.kind, 'text', a.txt, 'href', a.href, 'at', a.at)
  from (
    select 'match' as kind,
      coalesce(w.name, 'A team') || ' defeated ' || coalesce(l.name, 'a team') || ' in ' || public.gb_pretty(m.game) as txt,
      '/matches/' || m.id::text as href,
      m.completed_at as at
    from public.matches m
    left join public.teams w on w.id = m.winning_team_id
    left join public.teams l on l.id = m.losing_team_id
    where m.completed_at is not null and m.winning_team_id is not null

    union all

    select 'team',
      'New team ' || t.name || ' entered ' || public.gb_pretty(t.game),
      '/teams/' || t.id::text,
      t.created_at
    from public.teams t

    union all

    select 'award',
      coalesce(p.username, 'A player') || ' earned ' || c.name,
      case when p.username is not null then '/players/' || p.username else '/awards' end,
      ua.granted_at
    from public.staff_user_awards ua
    join public.staff_award_catalog c on c.id = ua.award_id
    left join public.profiles p on p.id = ua.recipient_id
    where ua.revoked_at is null and ua.recipient_id is not null
  ) a
  where a.at is not null
  order by a.at desc
  limit greatest(1, least(coalesce(p_limit, 12), 50));
$$;

grant execute on function public.gb_recent_activity(integer) to anon, authenticated;

-- Weekly / monthly (season) / all-time leaderboards built from completed matches
create or replace function public.gb_leaderboard(p_period text, p_kind text, p_limit integer default 25)
returns setof jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_start timestamptz;
begin
  v_start := case lower(coalesce(p_period, 'week'))
    when 'month' then date_trunc('month', now())
    when 'all' then '-infinity'::timestamptz
    else date_trunc('week', now())
  end;

  if lower(coalesce(p_kind, 'players')) = 'teams' then
    return query
    select jsonb_build_object('id', r.id, 'name', t.name, 'wins', r.wins, 'losses', r.losses, 'rank', row_number() over (order by r.wins desc, r.losses asc, t.name))
    from (
      select u.team_id as id, count(*) filter (where u.won) as wins, count(*) filter (where not u.won) as losses
      from (
        select winning_team_id as team_id, true as won from public.matches where completed_at >= v_start and winning_team_id is not null
        union all
        select losing_team_id, false from public.matches where completed_at >= v_start and winning_team_id is not null and losing_team_id is not null
      ) u
      group by u.team_id
    ) r
    join public.teams t on t.id = r.id
    order by r.wins desc, r.losses asc, t.name
    limit greatest(1, least(coalesce(p_limit, 25), 100));
  else
    return query
    select jsonb_build_object('id', r.id, 'name', p.username, 'wins', r.wins, 'losses', r.losses, 'rank', row_number() over (order by r.wins desc, r.losses asc, p.username))
    from (
      select u.uid as id, count(*) filter (where u.won) as wins, count(*) filter (where not u.won) as losses
      from (
        select unnest(winning_user_ids) as uid, true as won from public.matches where completed_at >= v_start and winning_team_id is not null
        union all
        select unnest(losing_user_ids), false from public.matches where completed_at >= v_start and winning_team_id is not null
      ) u
      where u.uid is not null
      group by u.uid
    ) r
    join public.profiles p on p.id = r.id
    order by r.wins desc, r.losses asc, p.username
    limit greatest(1, least(coalesce(p_limit, 25), 100));
  end if;
end;
$$;

grant execute on function public.gb_leaderboard(text, text, integer) to anon, authenticated;
