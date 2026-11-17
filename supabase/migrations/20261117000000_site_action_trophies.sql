-- Everyday trophies are built around real things players do on the site, count all past activity,
-- and are re-checked automatically whenever the matching action happens.
begin;

-- 1. Replace the vague trophies with specific actions.
delete from public.staff_award_requests r using public.staff_award_catalog c
where c.id = r.award_id and c.name in ('First Word Trophy', 'Watchful Eye Trophy');
delete from public.staff_user_awards u using public.staff_award_catalog c
where c.id = u.award_id and c.name in ('First Word Trophy', 'Watchful Eye Trophy');
delete from public.staff_award_catalog where name in ('First Word Trophy', 'Watchful Eye Trophy');

insert into public.staff_award_catalog (name, award_group, purpose, exclusive, auto_award) values
  ('Thread Starter Trophy', 'Site Interaction', 'Start your first forum thread.', false, true),
  ('Chime In Trophy', 'Site Interaction', 'Comment on a forum thread started by another player.', false, true),
  ('Eagle Eye Trophy', 'Site Interaction', 'Follow 3 players.', false, true),
  ('Rising Star Trophy', 'Site Interaction', 'Get your first follower.', false, true),
  ('Hype Squad Trophy', 'Site Interaction', 'React to a post in the community activity feed.', false, true),
  ('Call to Arms Trophy', 'Site Interaction', 'Post on the recruiting board.', false, true),
  ('Gauntlet Thrown Trophy', 'Site Interaction', 'Be on the roster of a ladder match posted to the Match Finder.', false, true),
  ('Into the Bracket Trophy', 'Site Interaction', 'Sign up for a tournament.', false, true),
  ('Playoff Champion Trophy', 'Playoffs', 'Win the end-of-season playoffs.', false, false),
  ('Playoff Finalist Trophy', 'Playoffs', 'Reach the final of the end-of-season playoffs.', false, false),
  ('Playoff Qualifier Badge', 'Playoffs', 'Qualify for the end-of-season playoffs.', false, false)
on conflict (name) do update set award_group = excluded.award_group, purpose = excluded.purpose,
  auto_award = excluded.auto_award;

update public.staff_award_catalog c set purpose = v.purpose
from (values
  ('Conversation Starter Trophy', 'Start a forum thread that gets replies from 2 different players.'),
  ('Squad Up Trophy', 'Add your first friend on GameBattles.'),
  ('Inner Circle Trophy', 'Have 5 friends on GameBattles.'),
  ('First Message Trophy', 'Send your first message to another player.'),
  ('Sideline Voice Trophy', 'Leave your first comment on a match.'),
  ('Bug Reporter Trophy', 'Report your first bug to help improve GameBattles.'),
  ('Bright Idea Trophy', 'Send your first site suggestion.')
) as v(name, purpose)
where c.name = v.name;

-- 2. Sign-ins and activity from before launch count toward streaks too.
create or replace function public.gb_player_active_dates(p_user uuid)
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

-- 3. Lifetime totals for one-time trophies (Daily Challenges themselves only exist since launch).
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
    'threads_started', (select count(*) from public.forum_posts where user_id = p_user and not hidden),
    'threads_replied', (select count(distinct r.post_id) from public.forum_replies r
      join public.forum_posts p on p.id = r.post_id
      where r.user_id = p_user and not r.hidden and not p.hidden and p.user_id is distinct from p_user),
    'engaged_threads', (select count(*) from public.forum_posts p
      where p.user_id = p_user and not p.hidden
        and (select count(distinct r.user_id) from public.forum_replies r
          where r.post_id = p.id and not r.hidden and r.user_id is distinct from p_user) >= 2),
    'friends', (select count(distinct case when f.requester_id = p_user then f.recipient_id else f.requester_id end)
      from public.friend_requests f where f.status = 'accepted' and (f.requester_id = p_user or f.recipient_id = p_user)),
    'suggestions', (select count(*) from public.community_suggestions where submitter_id = p_user),
    'bug_reports', (select count(*) from public.community_bug_reports where reporter_id = p_user),
    'messages_sent', (select count(*) from public.messages where sender_id = p_user and sender_type = 'player'
      and recipient_id is distinct from p_user),
    'players_followed', (select count(distinct target_id) from public.community_follows
      where follower_id = p_user and target_type = 'player' and target_id <> p_user::text),
    'followers', (select count(distinct follower_id) from public.community_follows
      where target_type = 'player' and target_id = p_user::text and follower_id <> p_user),
    'reactions', (select count(*) from public.community_activity_reactions where user_id = p_user),
    'recruit_posts', (select count(*) from public.recruit_posts where user_id = p_user and not coalesce(hidden, false)),
    'match_posts', (select count(*) from public.match_posts where p_user = any(posting_roster)),
    'tournament_entries', (select count(*) from public.tournament_player_registrations where player_id = p_user)
      + (select count(*) from public.tournament_registrations where registered_by = p_user),
    'match_comments', (select count(*) from public.match_comments where user_id = p_user
      and not coalesce(hidden, false) and not coalesce(removed, false)),
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
      ('Thread Starter Trophy', 'threads_started', 1),
      ('Chime In Trophy', 'threads_replied', 1),
      ('Conversation Starter Trophy', 'engaged_threads', 1),
      ('Squad Up Trophy', 'friends', 1),
      ('Inner Circle Trophy', 'friends', 5),
      ('First Message Trophy', 'messages_sent', 1),
      ('Eagle Eye Trophy', 'players_followed', 3),
      ('Rising Star Trophy', 'followers', 1),
      ('Hype Squad Trophy', 'reactions', 1),
      ('Sideline Voice Trophy', 'match_comments', 1),
      ('Call to Arms Trophy', 'recruit_posts', 1),
      ('Gauntlet Thrown Trophy', 'match_posts', 1),
      ('Into the Bracket Trophy', 'tournament_entries', 1),
      ('Bug Reporter Trophy', 'bug_reports', 1),
      ('Bright Idea Trophy', 'suggestions', 1)
    ) as awards(name, stat, need)
    where coalesce((v_totals ->> awards.stat)::bigint, 0) >= awards.need
  loop
    perform public.gb_grant_auto_award(p_user, v_award.name);
  end loop;
end;
$$;
revoke all on function public.gb_reconcile_challenge_trophies(uuid) from public, anon, authenticated;

-- 4. Re-check the right players whenever a tracked action happens.
create or replace function public.gb_challenges_on_user_row()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_other uuid;
begin
  if tg_table_name in ('forum_posts', 'forum_replies') then
    if not coalesce(new.hidden, false) then
      perform public.gb_reconcile_challenge_trophies(new.user_id);
      if tg_table_name = 'forum_replies' then
        select user_id into v_other from public.forum_posts where id = new.post_id;
        if v_other is distinct from new.user_id then
          perform public.gb_reconcile_challenge_trophies(v_other);
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
    if new.target_type = 'player' then
      select id into v_other from public.profiles where id::text = new.target_id;
      if v_other is distinct from new.follower_id then
        perform public.gb_reconcile_challenge_trophies(v_other);
      end if;
    end if;
  elsif tg_table_name in ('match_comments', 'community_activity_reactions', 'recruit_posts') then
    perform public.gb_reconcile_challenge_trophies(new.user_id);
  elsif tg_table_name = 'match_posts' then
    for v_other in select distinct player_id from unnest(coalesce(new.posting_roster, '{}'::uuid[])) as roster(player_id)
      where player_id is not null order by player_id
    loop
      perform public.gb_reconcile_challenge_trophies(v_other);
    end loop;
  elsif tg_table_name = 'tournament_player_registrations' then
    perform public.gb_reconcile_challenge_trophies(new.player_id);
  elsif tg_table_name = 'tournament_registrations' then
    perform public.gb_reconcile_challenge_trophies(new.registered_by);
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

drop trigger if exists community_activity_reactions_challenge_trophies on public.community_activity_reactions;
create trigger community_activity_reactions_challenge_trophies after insert on public.community_activity_reactions
  for each row execute function public.gb_challenges_on_user_row();
drop trigger if exists recruit_posts_challenge_trophies on public.recruit_posts;
create trigger recruit_posts_challenge_trophies after insert on public.recruit_posts
  for each row execute function public.gb_challenges_on_user_row();
drop trigger if exists match_posts_challenge_trophies on public.match_posts;
create trigger match_posts_challenge_trophies after insert on public.match_posts
  for each row execute function public.gb_challenges_on_user_row();
drop trigger if exists tournament_player_registrations_challenge_trophies on public.tournament_player_registrations;
create trigger tournament_player_registrations_challenge_trophies after insert on public.tournament_player_registrations
  for each row execute function public.gb_challenges_on_user_row();
drop trigger if exists tournament_registrations_challenge_trophies on public.tournament_registrations;
create trigger tournament_registrations_challenge_trophies after insert on public.tournament_registrations
  for each row execute function public.gb_challenges_on_user_row();

-- 5. Give everyone every trophy their past activity has already earned.
select public.gb_reconcile_challenge_trophies(p.id) from public.profiles p order by p.id;

commit;
