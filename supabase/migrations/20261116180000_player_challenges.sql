-- Player Challenges: daily/weekly/monthly challenges, login rewards and site-interaction trophies.

insert into public.staff_award_catalog (name, award_group, purpose, exclusive, auto_award) values
  ('Daily Spark Trophy', 'Daily Challenges', 'Complete your first Daily Challenge: one ladder match or forum post in a UTC day.', false, true),
  ('Daily Grind Trophy', 'Daily Challenges', 'Complete 7 Daily Challenges.', false, true),
  ('Daily Devotion Trophy', 'Daily Challenges', 'Complete 30 Daily Challenges.', false, true),
  ('Dawn Immortal Trophy', 'Daily Challenges', 'Complete 100 Daily Challenges.', false, true),
  ('Weekly Warrior Trophy', 'Weekly Challenges', 'Complete 1 weekly challenge.', false, true),
  ('Weekly Vanguard Trophy', 'Weekly Challenges', 'Complete 4 weekly challenges.', false, true),
  ('Weekly Warlord Trophy', 'Weekly Challenges', 'Complete 8 weekly challenges.', false, true),
  ('Monthly Mainstay Trophy', 'Monthly Challenges', 'Complete 1 monthly challenge.', false, true),
  ('Lunar Legend Trophy', 'Monthly Challenges', 'Complete 3 monthly challenges.', false, true),
  ('Eclipse Eternal Trophy', 'Monthly Challenges', 'Complete 6 monthly challenges.', false, true),
  ('Hot Streak Trophy', 'Login Rewards', 'Be active on GameBattles 3 days in a row.', false, true),
  ('On Fire Trophy', 'Login Rewards', 'Be active on GameBattles 7 days in a row.', false, true),
  ('Inferno Trophy', 'Login Rewards', 'Be active on GameBattles 30 days in a row.', false, true),
  ('Eternal Flame Trophy', 'Login Rewards', 'Be active on GameBattles 100 days in a row.', false, true),
  ('Familiar Face Trophy', 'Login Rewards', 'Be active on GameBattles on 25 different days.', false, true),
  ('Loyal Legion Trophy', 'Login Rewards', 'Be active on GameBattles on 100 different days.', false, true),
  ('Year of Battles Trophy', 'Login Rewards', 'Be active on GameBattles on 365 different days.', false, true),
  ('First Word Trophy', 'Site Interaction', 'Create your first forum thread or reply.', false, true),
  ('Forum Voice Trophy', 'Site Interaction', 'Make 25 forum threads or replies.', false, true),
  ('Forum Legend Trophy', 'Site Interaction', 'Make 100 forum threads or replies.', false, true),
  ('Conversation Starter Trophy', 'Site Interaction', 'Start 5 forum threads.', false, true),
  ('Squad Up Trophy', 'Site Interaction', 'Add your first friend.', false, true),
  ('Social Butterfly Trophy', 'Site Interaction', 'Have 10 accepted friends.', false, true),
  ('Bright Idea Trophy', 'Site Interaction', 'Send your first suggestion to GameBattles.', false, true),
  ('Launch Week Trophy', 'Limited Edition Challenges', 'Limited edition, Nov 16-22, 2026: play 3 ladder matches.', true, true),
  ('Harvest Brawl Trophy', 'Limited Edition Challenges', 'Limited edition, Nov 23-29, 2026: win 2 ladder matches.', true, true),
  ('Forum Frontline Trophy', 'Limited Edition Challenges', 'Limited edition, Nov 30-Dec 6, 2026: make 3 forum threads or replies and play 2 ladder matches.', true, true),
  ('Squad Link Trophy', 'Limited Edition Challenges', 'Limited edition, Dec 7-13, 2026: add 1 new friend and play 3 ladder matches.', true, true),
  ('Frostbite Trophy', 'Limited Edition Challenges', 'Limited edition, Dec 14-20, 2026: win 3 ladder matches.', true, true),
  ('Holiday Siege Trophy', 'Limited Edition Challenges', 'Limited edition, Dec 21-27, 2026: be active on 5 different days.', true, true),
  ('Countdown Clash Trophy', 'Limited Edition Challenges', 'Limited edition, Dec 28, 2026-Jan 3, 2027: play 5 ladder matches.', true, true),
  ('New Year Rush Trophy', 'Limited Edition Challenges', 'Limited edition, Jan 4-10, 2027: win 3 ladder matches and be active on 4 days.', true, true),
  ('Iron Will Trophy', 'Limited Edition Challenges', 'Limited edition, Jan 11-17, 2027: play 6 ladder matches.', true, true),
  ('Founders'' Month Trophy', 'Limited Edition Challenges', 'Limited edition, launch month Nov 16-30, 2026: play 5 ladder matches and be active on 7 days.', true, true),
  ('Winter Warfare Trophy', 'Limited Edition Challenges', 'Limited edition, December 2026: play 15 ladder matches, be active on 12 days and make 1 forum post.', true, true),
  ('New Dawn Trophy', 'Limited Edition Challenges', 'Limited edition, January 2027: win 8 ladder matches and be active on 12 days.', true, true)
on conflict (name) do update set
  award_group = excluded.award_group,
  purpose = excluded.purpose,
  exclusive = excluded.exclusive,
  auto_award = excluded.auto_award;

create table public.player_activity_days (
  user_id uuid not null references public.profiles(id) on delete cascade,
  activity_date date not null,
  created_at timestamptz not null default now(),
  primary key (user_id, activity_date)
);
alter table public.player_activity_days enable row level security;
revoke all on public.player_activity_days from public, anon, authenticated;

create table public.player_challenges (
  id text primary key,
  cadence text not null check (cadence in ('weekly', 'monthly')),
  title text not null,
  description text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null check (ends_at > starts_at),
  requirements jsonb not null check (jsonb_typeof(requirements) = 'object'),
  award_name text not null references public.staff_award_catalog(name) on update cascade
);
alter table public.player_challenges enable row level security;
revoke all on public.player_challenges from public, anon, authenticated;

create table public.player_challenge_completions (
  user_id uuid not null references public.profiles(id) on delete cascade,
  challenge_id text not null references public.player_challenges(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (user_id, challenge_id)
);
alter table public.player_challenge_completions enable row level security;
revoke all on public.player_challenge_completions from public, anon, authenticated;

insert into public.player_challenges (id, cadence, title, description, starts_at, ends_at, requirements, award_name) values
  ('2026-w47-launch-week', 'weekly', 'Launch Week', 'Kick off the new GameBattles. Play 3 ladder matches.', '2026-11-16 00:00+00', '2026-11-23 00:00+00', '{"matches":3}', 'Launch Week Trophy'),
  ('2026-w48-harvest-brawl', 'weekly', 'Harvest Brawl', 'Reap the rewards. Win 2 ladder matches.', '2026-11-23 00:00+00', '2026-11-30 00:00+00', '{"wins":2}', 'Harvest Brawl Trophy'),
  ('2026-w49-forum-frontline', 'weekly', 'Forum Frontline', 'Speak up and show up. Make 3 forum threads or replies and play 2 ladder matches.', '2026-11-30 00:00+00', '2026-12-07 00:00+00', '{"forum_items":3,"matches":2}', 'Forum Frontline Trophy'),
  ('2026-w50-squad-link', 'weekly', 'Squad Link', 'Grow your circle. Add 1 new friend and play 3 ladder matches.', '2026-12-07 00:00+00', '2026-12-14 00:00+00', '{"friends":1,"matches":3}', 'Squad Link Trophy'),
  ('2026-w51-frostbite', 'weekly', 'Frostbite', 'Ice-cold under pressure. Win 3 ladder matches.', '2026-12-14 00:00+00', '2026-12-21 00:00+00', '{"wins":3}', 'Frostbite Trophy'),
  ('2026-w52-holiday-siege', 'weekly', 'Holiday Siege', 'Hold the fort through the holidays. Be active on 5 different days.', '2026-12-21 00:00+00', '2026-12-28 00:00+00', '{"active_days":5}', 'Holiday Siege Trophy'),
  ('2026-w53-countdown-clash', 'weekly', 'Countdown Clash', 'Finish the year strong. Play 5 ladder matches.', '2026-12-28 00:00+00', '2027-01-04 00:00+00', '{"matches":5}', 'Countdown Clash Trophy'),
  ('2027-w01-new-year-rush', 'weekly', 'New Year Rush', 'Start the year with a bang. Win 3 ladder matches and be active on 4 days.', '2027-01-04 00:00+00', '2027-01-11 00:00+00', '{"wins":3,"active_days":4}', 'New Year Rush Trophy'),
  ('2027-w02-iron-will', 'weekly', 'Iron Will', 'Forge your resolve. Play 6 ladder matches.', '2027-01-11 00:00+00', '2027-01-18 00:00+00', '{"matches":6}', 'Iron Will Trophy'),
  ('2026-11-founders-month', 'monthly', 'Founders'' Month', 'Be part of launch month. Play 5 ladder matches and be active on 7 days before December.', '2026-11-16 00:00+00', '2026-12-01 00:00+00', '{"matches":5,"active_days":7}', 'Founders'' Month Trophy'),
  ('2026-12-winter-warfare', 'monthly', 'Winter Warfare', 'Battle through December. Play 15 ladder matches, be active on 12 days and make 1 forum thread or reply.', '2026-12-01 00:00+00', '2027-01-01 00:00+00', '{"matches":15,"active_days":12,"forum_items":1}', 'Winter Warfare Trophy'),
  ('2027-01-new-dawn', 'monthly', 'New Dawn', 'A new year of battles. Win 8 ladder matches and be active on 12 days in January.', '2027-01-01 00:00+00', '2027-02-01 00:00+00', '{"wins":8,"active_days":12}', 'New Dawn Trophy');

create function public.gb_player_active_dates(p_user uuid)
returns setof date
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select activity_date from public.player_activity_days where user_id = p_user
  union
  select (m.completed_at at time zone 'UTC')::date from public.matches m
  where m.result_processed and m.rankings_applied and m.completed_at is not null
    and (m.winning_user_ids @> array[p_user] or m.losing_user_ids @> array[p_user])
  union
  select (p.created_at at time zone 'UTC')::date from public.forum_posts p where p.user_id = p_user and not p.hidden
  union
  select (r.created_at at time zone 'UTC')::date from public.forum_replies r where r.user_id = p_user and not r.hidden;
$$;
revoke all on function public.gb_player_active_dates(uuid) from public, anon, authenticated;

create function public.gb_challenge_window_stats(p_user uuid, p_from timestamptz, p_to timestamptz)
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'matches', m.matches,
    'wins', m.wins,
    'forum_items',
      (select count(*) from public.forum_posts where user_id = p_user and not hidden and created_at >= p_from and created_at < p_to)
      + (select count(*) from public.forum_replies where user_id = p_user and not hidden and created_at >= p_from and created_at < p_to),
    'friends', (select count(*) from public.friend_requests f where f.status = 'accepted'
      and (f.requester_id = p_user or f.recipient_id = p_user)
      and coalesce(f.responded_at, f.created_at) >= p_from and coalesce(f.responded_at, f.created_at) < p_to),
    'active_days', (select count(*) from public.gb_player_active_dates(p_user) d
      where d >= (p_from at time zone 'UTC')::date and d < (p_to at time zone 'UTC')::date)
  )
  from (
    select count(*) as matches, count(*) filter (where winning_user_ids @> array[p_user]) as wins
    from public.matches
    where result_processed and rankings_applied and completed_at >= p_from and completed_at < p_to
      and (winning_user_ids @> array[p_user] or losing_user_ids @> array[p_user])
  ) m;
$$;
revoke all on function public.gb_challenge_window_stats(uuid, timestamptz, timestamptz) from public, anon, authenticated;

create function public.gb_challenge_requirements_met(p_stats jsonb, p_requirements jsonb)
returns boolean
language sql
immutable
set search_path = public, pg_temp
as $$
  select not exists (
    select 1 from jsonb_each_text(p_requirements) req
    where coalesce((p_stats ->> req.key)::bigint, 0) < req.value::bigint
  );
$$;
revoke all on function public.gb_challenge_requirements_met(jsonb, jsonb) from public, anon, authenticated;

create function public.gb_challenge_totals(p_user uuid)
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with active as (
    select d, d - (row_number() over (order by d))::int as island from public.gb_player_active_dates(p_user) d
  ),
  islands as (
    select count(*) as length, max(d) as last_day from active group by island
  ),
  daily as (
    select (m.completed_at at time zone 'UTC')::date from public.matches m
    where m.result_processed and m.rankings_applied and m.completed_at is not null
      and (m.winning_user_ids @> array[p_user] or m.losing_user_ids @> array[p_user])
    union
    select (p.created_at at time zone 'UTC')::date from public.forum_posts p where p.user_id = p_user and not p.hidden
    union
    select (r.created_at at time zone 'UTC')::date from public.forum_replies r where r.user_id = p_user and not r.hidden
  )
  select jsonb_build_object(
    'daily_completions', (select count(*) from daily),
    'active_days', (select count(*) from active),
    'longest_streak', coalesce((select max(length) from islands), 0),
    'current_streak', coalesce((select length from islands
      where last_day >= (now() at time zone 'UTC')::date - 1 order by last_day desc limit 1), 0),
    'weekly_completions', (select count(*) from public.player_challenge_completions c
      join public.player_challenges pc on pc.id = c.challenge_id where c.user_id = p_user and pc.cadence = 'weekly'),
    'monthly_completions', (select count(*) from public.player_challenge_completions c
      join public.player_challenges pc on pc.id = c.challenge_id where c.user_id = p_user and pc.cadence = 'monthly'),
    'forum_items', (select count(*) from public.forum_posts where user_id = p_user and not hidden)
      + (select count(*) from public.forum_replies where user_id = p_user and not hidden),
    'forum_threads', (select count(*) from public.forum_posts where user_id = p_user and not hidden),
    'friends', (select count(distinct case when f.requester_id = p_user then f.recipient_id else f.requester_id end)
      from public.friend_requests f where f.status = 'accepted' and (f.requester_id = p_user or f.recipient_id = p_user)),
    'suggestions', (select count(*) from public.community_suggestions where submitter_id = p_user)
  );
$$;
revoke all on function public.gb_challenge_totals(uuid) from public, anon, authenticated;

create function public.gb_reconcile_challenge_trophies(p_user uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_challenge record;
  v_totals jsonb;
  v_award record;
begin
  if p_user is null or not exists (select 1 from public.profiles where id = p_user) then return; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_user::text || ':challenge_trophies', 0));

  -- Late-confirmed matches can still count for a challenge that ended in the last week.
  for v_challenge in
    select pc.* from public.player_challenges pc
    where pc.starts_at <= now() and pc.ends_at > now() - interval '7 days'
      and not exists (select 1 from public.player_challenge_completions c where c.user_id = p_user and c.challenge_id = pc.id)
    order by pc.starts_at
  loop
    if public.gb_challenge_requirements_met(
      public.gb_challenge_window_stats(p_user, v_challenge.starts_at, v_challenge.ends_at), v_challenge.requirements
    ) then
      insert into public.player_challenge_completions (user_id, challenge_id) values (p_user, v_challenge.id)
      on conflict do nothing;
      perform public.gb_grant_auto_award(p_user, v_challenge.award_name);
    end if;
  end loop;

  v_totals := public.gb_challenge_totals(p_user);
  for v_award in
    select * from (values
      ('Daily Spark Trophy', 'daily_completions', 1), ('Daily Grind Trophy', 'daily_completions', 7),
      ('Daily Devotion Trophy', 'daily_completions', 30), ('Dawn Immortal Trophy', 'daily_completions', 100),
      ('Weekly Warrior Trophy', 'weekly_completions', 1), ('Weekly Vanguard Trophy', 'weekly_completions', 4),
      ('Weekly Warlord Trophy', 'weekly_completions', 8),
      ('Monthly Mainstay Trophy', 'monthly_completions', 1), ('Lunar Legend Trophy', 'monthly_completions', 3),
      ('Eclipse Eternal Trophy', 'monthly_completions', 6),
      ('Hot Streak Trophy', 'longest_streak', 3), ('On Fire Trophy', 'longest_streak', 7),
      ('Inferno Trophy', 'longest_streak', 30), ('Eternal Flame Trophy', 'longest_streak', 100),
      ('Familiar Face Trophy', 'active_days', 25), ('Loyal Legion Trophy', 'active_days', 100),
      ('Year of Battles Trophy', 'active_days', 365),
      ('First Word Trophy', 'forum_items', 1), ('Forum Voice Trophy', 'forum_items', 25),
      ('Forum Legend Trophy', 'forum_items', 100), ('Conversation Starter Trophy', 'forum_threads', 5),
      ('Squad Up Trophy', 'friends', 1), ('Social Butterfly Trophy', 'friends', 10),
      ('Bright Idea Trophy', 'suggestions', 1)
    ) as awards(name, stat, need)
    where coalesce((v_totals ->> awards.stat)::bigint, 0) >= awards.need
  loop
    perform public.gb_grant_auto_award(p_user, v_award.name);
  end loop;
end;
$$;
revoke all on function public.gb_reconcile_challenge_trophies(uuid) from public, anon, authenticated;

create function public.gb_challenge_checkin()
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_rows integer;
begin
  if v_user is null or not exists (select 1 from public.profiles where id = v_user) then return false; end if;
  insert into public.player_activity_days (user_id, activity_date)
  values (v_user, (now() at time zone 'UTC')::date)
  on conflict do nothing;
  get diagnostics v_rows = row_count;
  if v_rows > 0 then
    perform public.gb_reconcile_challenge_trophies(v_user);
  end if;
  return v_rows > 0;
end;
$$;
revoke all on function public.gb_challenge_checkin() from public, anon;
grant execute on function public.gb_challenge_checkin() to authenticated;

create function public.gb_challenge_overview()
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'now', now(),
    'signed_in', auth.uid() is not null,
    'totals', case when auth.uid() is null then null else public.gb_challenge_totals(auth.uid()) end,
    'today', case when auth.uid() is null then null else jsonb_build_object(
      'active', exists (select 1 from public.gb_player_active_dates(auth.uid()) d where d = (now() at time zone 'UTC')::date),
      'stats', public.gb_challenge_window_stats(auth.uid(), date_trunc('day', now() at time zone 'UTC') at time zone 'UTC',
        (date_trunc('day', now() at time zone 'UTC') + interval '1 day') at time zone 'UTC')
    ) end,
    'earned', case when auth.uid() is null then '[]'::jsonb else coalesce((
      select jsonb_agg(distinct catalog.name) from public.staff_user_awards ua
      join public.staff_award_catalog catalog on catalog.id = ua.award_id
      where ua.recipient_id = auth.uid() and ua.revoked_at is null
    ), '[]'::jsonb) end,
    'challenges', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', pc.id, 'cadence', pc.cadence, 'title', pc.title, 'description', pc.description,
        'starts_at', pc.starts_at, 'ends_at', pc.ends_at, 'requirements', pc.requirements, 'award_name', pc.award_name,
        'completed', auth.uid() is not null and exists (select 1 from public.player_challenge_completions c
          where c.user_id = auth.uid() and c.challenge_id = pc.id),
        'progress', case when auth.uid() is not null and pc.starts_at <= now() and pc.ends_at > now()
          then public.gb_challenge_window_stats(auth.uid(), pc.starts_at, pc.ends_at) end
      ) order by pc.starts_at, pc.cadence)
      from public.player_challenges pc
    ), '[]'::jsonb)
  );
$$;
revoke all on function public.gb_challenge_overview() from public;
grant execute on function public.gb_challenge_overview() to anon, authenticated;

create function public.gb_challenges_on_match()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid;
begin
  if not (coalesce(new.result_processed, false) and coalesce(new.rankings_applied, false)
    and new.completed_at is not null) then return new; end if;
  if tg_op = 'UPDATE' then
    if coalesce(old.result_processed, false) and coalesce(old.rankings_applied, false)
      and old.completed_at is not null
      and old.completed_at is not distinct from new.completed_at
      and old.winning_user_ids is not distinct from new.winning_user_ids
      and old.losing_user_ids is not distinct from new.losing_user_ids then return new; end if;
  end if;
  for v_user in
    select distinct player_id from unnest(
      coalesce(new.winning_user_ids, '{}'::uuid[]) || coalesce(new.losing_user_ids, '{}'::uuid[])
    ) as players(player_id)
    where player_id is not null order by player_id
  loop
    perform public.gb_reconcile_challenge_trophies(v_user);
  end loop;
  return new;
end;
$$;
revoke all on function public.gb_challenges_on_match() from public, anon, authenticated;
create trigger matches_challenge_trophies
  after insert or update on public.matches
  for each row execute function public.gb_challenges_on_match();

create function public.gb_challenges_on_user_row()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_table_name in ('forum_posts', 'forum_replies') then
    if not coalesce(new.hidden, false) then perform public.gb_reconcile_challenge_trophies(new.user_id); end if;
  elsif tg_table_name = 'community_suggestions' then
    perform public.gb_reconcile_challenge_trophies(new.submitter_id);
  elsif tg_table_name = 'friend_requests' then
    if new.status = 'accepted' and (tg_op = 'INSERT' or old.status is distinct from 'accepted') then
      perform public.gb_reconcile_challenge_trophies(new.requester_id);
      perform public.gb_reconcile_challenge_trophies(new.recipient_id);
    end if;
  end if;
  return new;
end;
$$;
revoke all on function public.gb_challenges_on_user_row() from public, anon, authenticated;

create trigger forum_posts_challenge_trophies after insert on public.forum_posts
  for each row execute function public.gb_challenges_on_user_row();
create trigger forum_replies_challenge_trophies after insert on public.forum_replies
  for each row execute function public.gb_challenges_on_user_row();
create trigger community_suggestions_challenge_trophies after insert on public.community_suggestions
  for each row execute function public.gb_challenges_on_user_row();
create trigger friend_requests_challenge_trophies after insert or update of status on public.friend_requests
  for each row execute function public.gb_challenges_on_user_row();

select public.gb_reconcile_challenge_trophies(p.id) from public.profiles p order by p.id;
