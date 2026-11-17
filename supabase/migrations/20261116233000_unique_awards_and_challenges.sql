-- One award per distinct task: retire duplicate and counted-step awards, give founders only Community Origin,
-- redesign Player Challenges so every trophy is a different task, and only count activity from launch onward.
begin;

-- 1. Retire duplicate / counted-step awards (and any grants or requests for them).
create temporary table retired_awards (name text primary key) on commit drop;
insert into retired_awards (name) values
  -- Counted steps of total wins (First Win Badge remains).
  ('10 Wins Badge'), ('50 Wins Badge'), ('100 Wins Badge'), ('500 Wins Badge'), ('1000 Wins Badge'),
  ('Double Victory Trophy'), ('Triple Threat Trophy'), ('High Five Trophy'), ('Victory Surge Trophy'),
  ('Winning Edge Trophy'), ('Victory Vanguard Trophy'), ('Triumph Elite Trophy'), ('Victory Legend Trophy'),
  -- Counted steps of matches played (First Match Played Badge remains).
  ('First Steps Trophy'), ('Game On Trophy'), ('Battle Ready Trophy'), ('Momentum Trophy'), ('On the Grind Trophy'),
  ('Battle Tested Trophy'), ('Veteran Run Trophy'), ('Unstoppable Journey Trophy'),
  ('100 Matches Played Badge'), ('500 Matches Played Badge'), ('Multi-Platform Linker Badge'),
  -- Same task in different months / seasons.
  ('Autumn Harvest Trophy'), ('Spring Bloom Trophy'), ('Summer Heat Trophy'), ('Winter Frost Trophy'),
  ('Season Starter Trophy'), ('Season Challenger Trophy'), ('Season Contender Trophy'), ('Season Warrior Trophy'),
  ('Season Spark Trophy'), ('Season Surge Trophy'), ('Season Elite Trophy'), ('Season Conqueror Trophy'),
  ('Season Champion Shield'), ('Undefeated Season Shield'), ('Season Podium Medal'), ('Grinder Badge'),
  ('Dynasty Crest'), ('Consistent Contender'),
  -- Tiered steps of streaks, ranks, service, bugs and referrals.
  ('Win Streak 5 Badge'), ('Win Streak 25 Shield'),
  ('Top 5 Team Ribbon'), ('Top 10 Team Ribbon'), ('Top 25 Team Ribbon'), ('Top 50 Team Ribbon'), ('Top 100 Team Ribbon'),
  ('Ladder Champion Shield'), ('3 Year Service Medal'), ('5 Year Service Medal'),
  ('Bug Finder — Emerald'), ('Bug Finder — Diamond'), ('Bug Finder — Mythic'),
  ('Bug Hunter'), ('Bug Hunter Medal'), ('Critical Discovery'), ('Early Warning'), ('Fix Investigator'), ('Quality Vanguard'),
  ('Community Recruiter'), ('Recruitment Captain'), ('Recruitment Legend'), ('Recruiting Ally'), ('Recruiter Badge'),
  ('Community Pioneer'), ('Community Trailblazer'), ('Launch Supporter Medal'),
  -- Near-duplicates of another award that remains.
  ('Clean Sweep Trophy'), ('Clutch Victory Medal'), ('Perfect Record Shield'), ('Top Fragger Medal'), ('MVP Trophy'),
  ('Clutch Ace Medal'), ('Roster Leader Medal'), ('Team Builder Trophy'), ('Captain''s Honor Shield'),
  ('Helpful Hand Trophy'), ('Helpful Member Medal'), ('Problem Solver'), ('Newcomer Guide'), ('Welcome Wagon Trophy'),
  ('Sportsmanship Ribbon'), ('Positive Play Trophy'), ('Sportsmanship Standard'), ('Rivalry Respect Trophy'),
  ('Creative Mind Trophy'), ('Game Changer Trophy'), ('Community Architect'), ('Feedback Veteran Medal'),
  ('Community Contributor Plaque'), ('Community Spark Trophy'), ('Community Champion Trophy'), ('Forum Veteran Badge'),
  ('Last Stand'), ('Final Round Hero'), ('Clutch Moment Trophy'), ('Comeback Story Trophy'), ('Breakthrough'),
  ('Tactical Commander'), ('Team Synergy'), ('Squad Spirit Trophy'), ('Bracket Breaker'), ('Rivalry Victor'),
  ('Upset Slayer Shield'), ('Veteran Competitor'),
  ('Fair Decision'), ('Investigation Excellence'), ('Staff Vanguard'), ('Service Above Self'), ('Staff Reliability'),
  ('Event Commander'), ('Staff Mentor'), ('Community Steward'), ('Match Integrity Officer'), ('Tournament Operations'),
  ('Grand Champion Crown'), ('Major Champion Shield'), ('Tournament Finalist Trophy'), ('Tournament Third Place Medal'),
  ('Playoff Champion Trophy'), ('Playoff Finalist Medal'), ('Monthly Team Champion'), ('Weekly Cup Winner'),
  ('Elite Division Shield'), ('Pro Division Medal'), ('Founder Badge'), ('Early Access Shield'), ('Alpha Tester Medal'),
  ('Community Legend Crown'), ('GameBattles Immortal Crystal'), ('Featured Player Plaque'), ('Streamer Spotlight Medal'),
  ('Profile Pioneer Badge'), ('Rookie Breakout Badge'), ('Holiday Event Medal'),
  -- Old challenge trophies that were counted steps of the same task.
  ('Daily Spark Trophy'), ('Daily Devotion Trophy'), ('Dawn Immortal Trophy'),
  ('Weekly Warrior Trophy'), ('Weekly Vanguard Trophy'), ('Weekly Warlord Trophy'),
  ('Monthly Mainstay Trophy'), ('Lunar Legend Trophy'), ('Eclipse Eternal Trophy'),
  ('Hot Streak Trophy'), ('Inferno Trophy'), ('Eternal Flame Trophy'),
  ('Familiar Face Trophy'), ('Loyal Legion Trophy'), ('Year of Battles Trophy'),
  ('Forum Voice Trophy'), ('Forum Legend Trophy'), ('Social Butterfly Trophy');

delete from public.staff_award_requests r using public.staff_award_catalog c, retired_awards x
where c.id = r.award_id and c.name = x.name;
delete from public.staff_user_awards u using public.staff_award_catalog c, retired_awards x
where c.id = u.award_id and c.name = x.name;
delete from public.staff_award_catalog c using retired_awards x where c.name = x.name;

-- 2. Early community: founders and the first 100 members earn Community Origin only.
update public.staff_award_catalog
set purpose = 'One of the first 100 members of GameBattles.'
where name = 'Community Origin';

create or replace function public.gb_early_community_desired_awards()
returns table (user_id uuid, award_name text)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with members as (
    select profile_id, is_owner, row_number() over (partition by is_owner order by signup_order) as member_number
    from public.early_community_signups
  )
  select profile_id, 'Community Origin'::text
  from members
  where profile_id is not null and (is_owner or member_number <= 100);
$$;
revoke all on function public.gb_early_community_desired_awards() from public, anon, authenticated;

create or replace function public.gb_early_community_profile_insert()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  member_number bigint;
begin
  perform pg_advisory_xact_lock(hashtextextended('gb_early_community_signups', 0));
  insert into public.early_community_signups (profile_id, is_owner)
  values (new.id, new.role = 'owner');

  select count(*) into member_number from public.early_community_signups where not is_owner;
  if new.role = 'owner' or member_number <= 100 then
    perform public.gb_grant_auto_award(new.id, 'Community Origin');
  end if;
  return new;
end;
$$;
revoke all on function public.gb_early_community_profile_insert() from public, anon, authenticated;

select public.gb_reconcile_early_community_awards();

-- 3. Player Challenges: every trophy is a different task, sized for a growing community.
update public.staff_award_catalog set name = 'Second Wind Trophy' where name = 'Iron Will Trophy';
update public.player_challenges set id = '2027-w02-second-wind', title = 'Second Wind' where id = '2027-w02-iron-will';

-- No Founders' Month event while the community is still growing.
delete from public.player_challenge_completions where challenge_id = '2026-11-founders-month';
delete from public.player_challenges where id = '2026-11-founders-month';
delete from public.staff_user_awards u using public.staff_award_catalog c
where c.id = u.award_id and c.name = 'Founders'' Month Trophy';
delete from public.staff_award_catalog where name = 'Founders'' Month Trophy';

-- Epic challenges that need a busy ladder stay locked (visible, not earnable) until staff unlock them.
alter table public.player_challenges add column if not exists locked boolean not null default false;
update public.player_challenges set locked = true
where id in ('2026-w50-squad-link', '2026-w51-frostbite', '2026-w52-holiday-siege', '2026-w53-countdown-clash', '2026-12-winter-warfare');

-- Easy everyday trophies anyone can earn by using the site.
insert into public.staff_award_catalog (name, award_group, purpose, exclusive, auto_award) values
  ('Bug Reporter Trophy', 'Site Interaction', 'Report your first bug to help improve GameBattles.', false, true),
  ('Inner Circle Trophy', 'Site Interaction', 'Have 5 friends on GameBattles.', false, true),
  ('First Message Trophy', 'Site Interaction', 'Send your first message to another player.', false, true),
  ('Watchful Eye Trophy', 'Site Interaction', 'Follow a player or team.', false, true),
  ('Sideline Voice Trophy', 'Site Interaction', 'Leave your first comment on a match.', false, true)
on conflict (name) do update set award_group = excluded.award_group, purpose = excluded.purpose, auto_award = true;

update public.staff_award_catalog c set purpose = v.purpose, award_group = v.award_group, auto_award = true
from (values
  ('Daily Grind Trophy', 'Daily Challenges', 'Complete 3 Daily Challenges. Each day of the week has a different challenge.'),
  ('On Fire Trophy', 'Login Rewards', 'Sign in to GameBattles 3 days in a row.'),
  ('First Word Trophy', 'Site Interaction', 'Post your first forum thread or reply.'),
  ('Conversation Starter Trophy', 'Site Interaction', 'Start a forum thread that gets replies from 2 different players.'),
  ('Squad Up Trophy', 'Site Interaction', 'Add your first friend on GameBattles.'),
  ('Bright Idea Trophy', 'Site Interaction', 'Send your first site suggestion.'),
  ('Launch Week Trophy', 'Limited Edition Challenges', 'Limited edition · Launch Week (Nov 16–22, 2026): play a ladder match.'),
  ('Harvest Brawl Trophy', 'Limited Edition Challenges', 'Limited edition · Harvest Brawl (Nov 23–29, 2026): win a ladder match.'),
  ('Forum Frontline Trophy', 'Limited Edition Challenges', 'Limited edition · Forum Frontline (Nov 30–Dec 6, 2026): reply to 2 different forum threads started by other players.'),
  ('Squad Link Trophy', 'Limited Edition Challenges', 'Limited edition · Squad Link (Dec 7–13, 2026): play 2 ladder matches with a friend on your team.'),
  ('Frostbite Trophy', 'Limited Edition Challenges', 'Limited edition · Frostbite (Dec 14–20, 2026): win 2 ladder matches in a row.'),
  ('Holiday Siege Trophy', 'Limited Edition Challenges', 'Limited edition · Holiday Siege (Dec 21–27, 2026): post 3 ladder matches that get played.'),
  ('Countdown Clash Trophy', 'Limited Edition Challenges', 'Limited edition · Countdown Clash (Dec 28, 2026–Jan 3, 2027): play ladder matches in 2 different games.'),
  ('New Year Rush Trophy', 'Limited Edition Challenges', 'Limited edition · New Year Rush (Jan 4–10, 2027): play ladder matches against 2 different opponents.'),
  ('Second Wind Trophy', 'Limited Edition Challenges', 'Limited edition · Second Wind (Jan 11–17, 2027): win a ladder match straight after a loss.'),
  ('Winter Warfare Trophy', 'Limited Edition Challenges', 'Limited edition · Winter Warfare (December 2026): beat the same opponent twice.'),
  ('New Dawn Trophy', 'Limited Edition Challenges', 'Limited edition · New Dawn (January 2027): sign in on 10 different days.')
) as v(name, award_group, purpose)
where c.name = v.name;

update public.player_challenges pc set description = v.description, requirements = v.requirements::jsonb
from (values
  ('2026-w47-launch-week', 'Kick off the new GameBattles. Play a ladder match.', '{"matches":1}'),
  ('2026-w48-harvest-brawl', 'Reap the rewards. Win a ladder match.', '{"wins":1}'),
  ('2026-w49-forum-frontline', 'Join the conversation. Reply to 2 different forum threads started by other players.', '{"threads_replied":2}'),
  ('2026-w50-squad-link', 'Team up with a friend. Play 2 ladder matches with a friend on your team.', '{"friend_matches":2}'),
  ('2026-w51-frostbite', 'Ice-cold under pressure. Win 2 ladder matches in a row.', '{"win_streak":2}'),
  ('2026-w52-holiday-siege', 'Bring the battle to them. Post 3 ladder matches that get played.', '{"hosted":3}'),
  ('2026-w53-countdown-clash', 'Finish the year on more than one front. Play ladder matches in 2 different games.', '{"games":2}'),
  ('2027-w01-new-year-rush', 'New year, new rivals. Play ladder matches against 2 different opponents.', '{"opponents":2}'),
  ('2027-w02-second-wind', 'Bounce back. Win a ladder match straight after a loss.', '{"bounce_backs":1}'),
  ('2026-12-winter-warfare', 'Settle the score. Beat the same opponent twice in December.', '{"rival_wins":2}'),
  ('2027-01-new-dawn', 'Show up for the new year. Sign in on 10 different days in January.', '{"active_days":10}')
) as v(id, description, requirements)
where pc.id = v.id;

create or replace function public.gb_challenge_launch()
returns timestamptz
language sql
immutable
set search_path = public, pg_temp
as $$ select timestamptz '2026-11-16 00:00:00+00' $$;
revoke all on function public.gb_challenge_launch() from public, anon, authenticated;

-- Each weekday has its own Daily Challenge (UTC).
create or replace function public.gb_daily_challenge(p_day date)
returns jsonb
language sql
immutable
set search_path = public, pg_temp
as $$
  select case extract(dow from p_day)::int
    when 1 then '{"title":"Match Day Monday","description":"Play a ladder match.","requirements":{"matches":1}}'
    when 2 then '{"title":"Talk Tuesday","description":"Post a forum thread or reply.","requirements":{"forum_items":1}}'
    when 3 then '{"title":"Check-in Wednesday","description":"Sign in to GameBattles.","requirements":{"active_days":1}}'
    when 4 then '{"title":"Thread Thursday","description":"Reply to a forum thread started by another player.","requirements":{"threads_replied":1}}'
    when 5 then '{"title":"Feedback Friday","description":"Send a site suggestion or idea.","requirements":{"suggestions":1}}'
    when 6 then '{"title":"Victory Saturday","description":"Win a ladder match.","requirements":{"wins":1}}'
    else '{"title":"Social Sunday","description":"Add a new friend on GameBattles.","requirements":{"friends":1}}'
  end::jsonb;
$$;
revoke all on function public.gb_daily_challenge(date) from public, anon, authenticated;

create or replace function public.gb_player_active_dates(p_user uuid)
returns setof date
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select d from (
    select activity_date as d from public.player_activity_days where user_id = p_user
    union
    select (m.completed_at at time zone 'UTC')::date from public.matches m
    where m.result_processed and m.rankings_applied and m.completed_at is not null
      and (m.winning_user_ids @> array[p_user] or m.losing_user_ids @> array[p_user])
    union
    select (p.created_at at time zone 'UTC')::date from public.forum_posts p where p.user_id = p_user and not p.hidden
    union
    select (r.created_at at time zone 'UTC')::date from public.forum_replies r where r.user_id = p_user and not r.hidden
  ) days
  where d >= (public.gb_challenge_launch() at time zone 'UTC')::date;
$$;
revoke all on function public.gb_player_active_dates(uuid) from public, anon, authenticated;

create or replace function public.gb_challenge_window_stats(p_user uuid, p_from timestamptz, p_to timestamptz)
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with bounds as (
    select greatest(p_from, public.gb_challenge_launch()) as from_at, p_to as to_at
  ),
  player_matches as (
    select m.id, m.completed_at, m.game, m.posting_team_id,
      m.winning_user_ids @> array[p_user] as won,
      case when m.winning_user_ids @> array[p_user] then m.winning_team_id else m.losing_team_id end as my_team,
      case when m.winning_user_ids @> array[p_user] then m.losing_team_id else m.winning_team_id end as opponent_team,
      case when m.winning_user_ids @> array[p_user] then m.winning_user_ids else m.losing_user_ids end as my_side,
      lag(m.winning_user_ids @> array[p_user]) over (order by m.completed_at, m.id) as previous_won
    from public.matches m
    where m.result_processed and m.rankings_applied and m.completed_at is not null
      and m.completed_at >= public.gb_challenge_launch()
      and (m.winning_user_ids @> array[p_user] or m.losing_user_ids @> array[p_user])
  ),
  window_matches as (
    select pm.*, row_number() over (order by pm.completed_at, pm.id)
      - row_number() over (partition by pm.won order by pm.completed_at, pm.id) as run
    from player_matches pm, bounds b
    where pm.completed_at >= b.from_at and pm.completed_at < b.to_at
  ),
  friends as (
    select case when f.requester_id = p_user then f.recipient_id else f.requester_id end as friend_id
    from public.friend_requests f
    where f.status = 'accepted' and (f.requester_id = p_user or f.recipient_id = p_user)
  )
  select jsonb_build_object(
    'matches', (select count(*) from window_matches),
    'wins', (select count(*) from window_matches where won),
    'win_streak', coalesce((select max(n) from (select count(*) as n from window_matches where won group by run) s), 0),
    'opponents', (select count(distinct opponent_team) from window_matches),
    'games', (select count(distinct game) from window_matches),
    'match_days', (select count(distinct (completed_at at time zone 'UTC')::date) from window_matches),
    'hosted', (select count(*) from window_matches where my_team = posting_team_id),
    'rival_wins', coalesce((select max(n) from (select count(*) as n from window_matches where won group by opponent_team) r), 0),
    'bounce_backs', (select count(*) from window_matches where won and previous_won = false),
    'friend_matches', (select count(*) from window_matches w
      where exists (select 1 from friends f where f.friend_id = any(w.my_side))),
    'threads_replied', (select count(distinct r.post_id) from public.forum_replies r
      join public.forum_posts p on p.id = r.post_id, bounds b
      where r.user_id = p_user and not r.hidden and p.user_id is distinct from p_user
        and r.created_at >= b.from_at and r.created_at < b.to_at),
    'forum_items',
      (select count(*) from public.forum_posts p, bounds b where p.user_id = p_user and not p.hidden
        and p.created_at >= b.from_at and p.created_at < b.to_at)
      + (select count(*) from public.forum_replies r, bounds b where r.user_id = p_user and not r.hidden
        and r.created_at >= b.from_at and r.created_at < b.to_at),
    'friends', (select count(*) from public.friend_requests f, bounds b where f.status = 'accepted'
      and (f.requester_id = p_user or f.recipient_id = p_user)
      and coalesce(f.responded_at, f.created_at) >= b.from_at and coalesce(f.responded_at, f.created_at) < b.to_at),
    'suggestions', (select count(*) from public.community_suggestions s, bounds b where s.submitter_id = p_user
      and s.created_at >= b.from_at and s.created_at < b.to_at),
    'active_days', (select count(*) from public.gb_player_active_dates(p_user) d, bounds b
      where d >= (b.from_at at time zone 'UTC')::date and d < (b.to_at at time zone 'UTC')::date)
  );
$$;
revoke all on function public.gb_challenge_window_stats(uuid, timestamptz, timestamptz) from public, anon, authenticated;

create or replace function public.gb_challenge_daily_completed(p_user uuid, p_day date)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select p_day >= (public.gb_challenge_launch() at time zone 'UTC')::date
    and public.gb_challenge_requirements_met(
      public.gb_challenge_window_stats(p_user, p_day::timestamp at time zone 'UTC', (p_day + 1)::timestamp at time zone 'UTC'),
      public.gb_daily_challenge(p_day) -> 'requirements'
    );
$$;
revoke all on function public.gb_challenge_daily_completed(uuid, date) from public, anon, authenticated;

create or replace function public.gb_challenge_totals(p_user uuid)
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
  )
  select jsonb_build_object(
    'daily_completions', (select count(*) from active where public.gb_challenge_daily_completed(p_user, active.d)),
    'active_days', (select count(*) from active),
    'longest_streak', coalesce((select max(length) from islands), 0),
    'current_streak', coalesce((select length from islands
      where last_day >= (now() at time zone 'UTC')::date - 1 order by last_day desc limit 1), 0),
    'forum_items', (select count(*) from public.forum_posts where user_id = p_user and not hidden
        and created_at >= public.gb_challenge_launch())
      + (select count(*) from public.forum_replies where user_id = p_user and not hidden
        and created_at >= public.gb_challenge_launch()),
    'engaged_threads', (select count(*) from public.forum_posts p
      where p.user_id = p_user and not p.hidden and p.created_at >= public.gb_challenge_launch()
        and (select count(distinct r.user_id) from public.forum_replies r
          where r.post_id = p.id and not r.hidden and r.user_id is distinct from p_user) >= 2),
    'friends', (select count(distinct case when f.requester_id = p_user then f.recipient_id else f.requester_id end)
      from public.friend_requests f where f.status = 'accepted' and (f.requester_id = p_user or f.recipient_id = p_user)
        and coalesce(f.responded_at, f.created_at) >= public.gb_challenge_launch()),
    'suggestions', (select count(*) from public.community_suggestions where submitter_id = p_user
      and created_at >= public.gb_challenge_launch()),
    'bug_reports', (select count(*) from public.community_bug_reports where reporter_id = p_user
      and created_at >= public.gb_challenge_launch()),
    'messages_sent', (select count(*) from public.messages where sender_id = p_user and sender_type = 'player'
      and recipient_id is distinct from p_user and created_at >= public.gb_challenge_launch()),
    'follows', (select count(*) from public.community_follows where follower_id = p_user
      and created_at >= public.gb_challenge_launch()),
    'match_comments', (select count(*) from public.match_comments where user_id = p_user
      and not coalesce(hidden, false) and not coalesce(removed, false) and created_at >= public.gb_challenge_launch()),
    'weekly_completions', (select count(*) from public.player_challenge_completions c
      join public.player_challenges pc on pc.id = c.challenge_id where c.user_id = p_user and pc.cadence = 'weekly'),
    'monthly_completions', (select count(*) from public.player_challenge_completions c
      join public.player_challenges pc on pc.id = c.challenge_id where c.user_id = p_user and pc.cadence = 'monthly')
  );
$$;
revoke all on function public.gb_challenge_totals(uuid) from public, anon, authenticated;

create or replace function public.gb_reconcile_challenge_trophies(p_user uuid)
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
    where pc.starts_at <= now() and pc.ends_at > now() - interval '7 days' and not pc.locked
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
      ('Daily Grind Trophy', 'daily_completions', 3),
      ('On Fire Trophy', 'longest_streak', 3),
      ('First Word Trophy', 'forum_items', 1),
      ('Conversation Starter Trophy', 'engaged_threads', 1),
      ('Squad Up Trophy', 'friends', 1),
      ('Bright Idea Trophy', 'suggestions', 1),
      ('Bug Reporter Trophy', 'bug_reports', 1),
      ('Inner Circle Trophy', 'friends', 5),
      ('First Message Trophy', 'messages_sent', 1),
      ('Watchful Eye Trophy', 'follows', 1),
      ('Sideline Voice Trophy', 'match_comments', 1)
    ) as awards(name, stat, need)
    where coalesce((v_totals ->> awards.stat)::bigint, 0) >= awards.need
  loop
    perform public.gb_grant_auto_award(p_user, v_award.name);
  end loop;
end;
$$;
revoke all on function public.gb_reconcile_challenge_trophies(uuid) from public, anon, authenticated;

create or replace function public.gb_challenge_overview()
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with today as (select (now() at time zone 'UTC')::date as d)
  select jsonb_build_object(
    'now', now(),
    'launch', public.gb_challenge_launch(),
    'signed_in', auth.uid() is not null,
    'totals', case when auth.uid() is null then null else public.gb_challenge_totals(auth.uid()) end,
    'daily_schedule', (select jsonb_agg(public.gb_daily_challenge(today.d + i) || jsonb_build_object('date', today.d + i) order by i)
      from generate_series(0, 6) i),
    'today', jsonb_build_object(
      'challenge', public.gb_daily_challenge(today.d),
      'active', auth.uid() is not null and exists (select 1 from public.gb_player_active_dates(auth.uid()) a where a = today.d),
      'completed', auth.uid() is not null and public.gb_challenge_daily_completed(auth.uid(), today.d),
      'stats', case when auth.uid() is null then null else public.gb_challenge_window_stats(auth.uid(),
        today.d::timestamp at time zone 'UTC', (today.d + 1)::timestamp at time zone 'UTC') end
    ),
    'earned', case when auth.uid() is null then '[]'::jsonb else coalesce((
      select jsonb_agg(distinct catalog.name) from public.staff_user_awards ua
      join public.staff_award_catalog catalog on catalog.id = ua.award_id
      where ua.recipient_id = auth.uid() and ua.revoked_at is null
    ), '[]'::jsonb) end,
    'challenges', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', pc.id, 'cadence', pc.cadence, 'title', pc.title, 'description', pc.description,
        'starts_at', pc.starts_at, 'ends_at', pc.ends_at, 'requirements', pc.requirements, 'award_name', pc.award_name,
        'locked', pc.locked,
        'completed', auth.uid() is not null and exists (select 1 from public.player_challenge_completions c
          where c.user_id = auth.uid() and c.challenge_id = pc.id),
        'progress', case when auth.uid() is not null and pc.starts_at <= now() and pc.ends_at > now()
          then public.gb_challenge_window_stats(auth.uid(), pc.starts_at, pc.ends_at) end
      ) order by pc.starts_at, pc.cadence)
      from public.player_challenges pc
    ), '[]'::jsonb)
  )
  from today;
$$;
revoke all on function public.gb_challenge_overview() from public;
grant execute on function public.gb_challenge_overview() to anon, authenticated;

-- Replies also count toward the thread author's Conversation Starter trophy.
create or replace function public.gb_challenges_on_user_row()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_thread_author uuid;
begin
  if tg_table_name in ('forum_posts', 'forum_replies') then
    if not coalesce(new.hidden, false) then
      perform public.gb_reconcile_challenge_trophies(new.user_id);
      if tg_table_name = 'forum_replies' then
        select user_id into v_thread_author from public.forum_posts where id = new.post_id;
        if v_thread_author is distinct from new.user_id then
          perform public.gb_reconcile_challenge_trophies(v_thread_author);
        end if;
      end if;
    end if;
  elsif tg_table_name = 'community_suggestions' then
    perform public.gb_reconcile_challenge_trophies(new.submitter_id);
  elsif tg_table_name = 'community_bug_reports' then
    perform public.gb_reconcile_challenge_trophies(new.reporter_id);
  elsif tg_table_name = 'messages' then
    if new.sender_type = 'player' then perform public.gb_reconcile_challenge_trophies(new.sender_id); end if;
  elsif tg_table_name = 'community_follows' then
    perform public.gb_reconcile_challenge_trophies(new.follower_id);
  elsif tg_table_name = 'match_comments' then
    perform public.gb_reconcile_challenge_trophies(new.user_id);
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

drop trigger if exists community_bug_reports_challenge_trophies on public.community_bug_reports;
create trigger community_bug_reports_challenge_trophies after insert on public.community_bug_reports
  for each row execute function public.gb_challenges_on_user_row();
drop trigger if exists messages_challenge_trophies on public.messages;
create trigger messages_challenge_trophies after insert on public.messages
  for each row execute function public.gb_challenges_on_user_row();
drop trigger if exists community_follows_challenge_trophies on public.community_follows;
create trigger community_follows_challenge_trophies after insert on public.community_follows
  for each row execute function public.gb_challenges_on_user_row();
drop trigger if exists match_comments_challenge_trophies on public.match_comments;
create trigger match_comments_challenge_trophies after insert on public.match_comments
  for each row execute function public.gb_challenges_on_user_row();

-- 4. Remove challenge trophies earned from pre-launch activity, then re-check everyone under the new rules.
delete from public.player_challenge_completions;
delete from public.staff_user_awards u using public.staff_award_catalog c
where c.id = u.award_id and u.reason = 'Awarded automatically: ' || c.name
  and c.award_group in ('Daily Challenges', 'Login Rewards', 'Site Interaction', 'Limited Edition Challenges');
delete from public.staff_award_catalog c
where c.award_group in ('Weekly Challenges', 'Monthly Challenges')
  and not exists (select 1 from public.staff_user_awards u where u.award_id = c.id);

select public.gb_reconcile_challenge_trophies(p.id) from public.profiles p order by p.id;

commit;
