alter table public.tournaments
  add column if not exists competition_type text not null default 'standard'
  check (competition_type in ('standard', 'weekly_cup'));

alter table public.tournaments
  add column if not exists prize_per_player boolean not null default false;

alter table public.tournaments
  drop constraint if exists tournaments_weekly_cup_configuration;
alter table public.tournaments
  add constraint tournaments_weekly_cup_configuration
  check (
    competition_type <> 'weekly_cup'
    or (
      is_free
      and entry_fee = 0
      and entry_fee_credits = 0
      and prize_credits = 5
      and prize_per_player
    )
  );

create unique index if not exists weekly_cup_starts_unique
  on public.tournaments (starts_at)
  where competition_type = 'weekly_cup' and status <> 'cancelled';

insert into public.staff_award_catalog (name, award_group, purpose, exclusive)
values
  ('Weekly Cup Winner', 'Competition', 'Awarded to the players and team that win a weekly free cup.', false),
  ('Monthly Team Champion', 'Competition', 'Awarded to the players and team that finish first in the monthly team leaderboard.', false)
on conflict (name) do update
set award_group = excluded.award_group,
    purpose = excluded.purpose;

create table if not exists public.competition_rewards (
  id bigint generated always as identity primary key,
  reward_type text not null check (reward_type in ('weekly_cup', 'monthly')),
  reward_period text not null,
  tournament_id uuid references public.tournaments(id) on delete set null,
  team_id uuid not null references public.teams(id),
  credits_per_player integer not null check (credits_per_player > 0),
  awarded_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (reward_type, reward_period)
);

alter table public.competition_rewards enable row level security;
revoke all on public.competition_rewards from public, anon, authenticated;

create table if not exists public.community_follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null check (target_type in ('player', 'team')),
  target_id text not null,
  created_at timestamptz not null default now(),
  primary key (follower_id, target_type, target_id)
);

alter table public.community_follows enable row level security;
drop policy if exists community_follows_read_own on public.community_follows;
create policy community_follows_read_own on public.community_follows
  for select to authenticated using (follower_id = auth.uid());
grant select on public.community_follows to authenticated;
revoke insert, update, delete on public.community_follows from public, anon, authenticated;

create or replace function public.gb_community_follow_counts(
  p_target_type text,
  p_target_id text
)
returns table (following_count bigint, followers_count bigint)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_target_id text;
begin
  if coalesce(p_target_type, '') not in ('player', 'team')
     or coalesce(p_target_id, '') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    raise exception 'Choose a valid player or team.';
  end if;

  v_target_id := lower(p_target_id);
  if p_target_type = 'player' and not exists (
    select 1 from public.profiles where id::text = v_target_id
  ) then
    raise exception 'Player not found.';
  elsif p_target_type = 'team' and not exists (
    select 1 from public.teams where id::text = v_target_id
  ) then
    raise exception 'Team not found.';
  end if;

  return query
  select
    case when p_target_type = 'player' then (
      select count(*) from public.community_follows
      where follower_id::text = v_target_id
    ) else 0::bigint end,
    (
      select count(*) from public.community_follows
      where target_type = p_target_type and target_id = v_target_id
    );
end;
$$;

revoke all on function public.gb_community_follow_counts(text, text) from public;
grant execute on function public.gb_community_follow_counts(text, text) to anon, authenticated;

create table if not exists public.community_activity_reactions (
  activity_id text not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reaction text not null check (reaction in ('gg', 'fire', 'heart')),
  created_at timestamptz not null default now(),
  primary key (activity_id, user_id, reaction)
);

alter table public.community_activity_reactions enable row level security;
revoke all on public.community_activity_reactions from public, anon, authenticated;

create or replace function public.gb_toggle_community_follow(
  p_target_type text,
  p_target_id text
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_target uuid;
begin
  if auth.uid() is null then
    raise exception 'Sign in to follow players and teams.';
  end if;
  if coalesce(p_target_type, '') not in ('player', 'team')
     or coalesce(p_target_id, '') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    raise exception 'Choose a valid player or team.';
  end if;

  v_target := p_target_id::uuid;
  if p_target_type = 'player' then
    if not exists (select 1 from public.profiles where id = v_target) then
      raise exception 'Player not found.';
    end if;
    if v_target = auth.uid() then
      raise exception 'You cannot follow yourself.';
    end if;
  elsif not exists (select 1 from public.teams where id = v_target) then
    raise exception 'Team not found.';
  end if;

  delete from public.community_follows
  where follower_id = auth.uid()
    and target_type = p_target_type
    and target_id = v_target::text;
  if found then
    return false;
  end if;

  insert into public.community_follows (follower_id, target_type, target_id)
  values (auth.uid(), p_target_type, v_target::text);
  return true;
end;
$$;

revoke all on function public.gb_toggle_community_follow(text, text) from public, anon;
grant execute on function public.gb_toggle_community_follow(text, text) to authenticated;

create or replace function public.gb_toggle_activity_reaction(
  p_activity_id text,
  p_reaction text
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_kind text;
  v_id text;
begin
  if auth.uid() is null then
    raise exception 'Sign in to react to community activity.';
  end if;
  if coalesce(p_reaction, '') not in ('gg', 'fire', 'heart')
     or not (
       coalesce(p_activity_id, '') ~ '^(match|team):[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
       or coalesce(p_activity_id, '') ~ '^award:[0-9]+$'
     ) then
    raise exception 'Choose a valid activity item and reaction.';
  end if;

  v_kind := split_part(p_activity_id, ':', 1);
  v_id := split_part(p_activity_id, ':', 2);
  if v_kind = 'match' and not exists (
    select 1 from public.matches
    where id = v_id::uuid and completed_at is not null and winning_team_id is not null
  ) then
    raise exception 'That match is no longer available.';
  elsif v_kind = 'team' and not exists (
    select 1 from public.teams where id = v_id::uuid
  ) then
    raise exception 'That team is no longer available.';
  elsif v_kind = 'award' and not exists (
    select 1 from public.staff_user_awards
    where id = v_id::bigint and revoked_at is null
  ) then
    raise exception 'That award is no longer available.';
  end if;

  delete from public.community_activity_reactions
  where activity_id = p_activity_id
    and user_id = auth.uid()
    and reaction = p_reaction;
  if found then
    return false;
  end if;

  insert into public.community_activity_reactions (activity_id, user_id, reaction)
  values (p_activity_id, auth.uid(), p_reaction);
  return true;
end;
$$;

revoke all on function public.gb_toggle_activity_reaction(text, text) from public, anon;
grant execute on function public.gb_toggle_activity_reaction(text, text) to authenticated;

create or replace function public.gb_activity_reaction_summary(p_activity_ids text[])
returns setof jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'activity_id', r.activity_id,
    'reaction', r.reaction,
    'count', count(*),
    'reacted', bool_or(r.user_id = auth.uid())
  )
  from public.community_activity_reactions r
  where r.activity_id = any(coalesce(p_activity_ids, array[]::text[]))
  group by r.activity_id, r.reaction;
$$;

revoke all on function public.gb_activity_reaction_summary(text[]) from public;
grant execute on function public.gb_activity_reaction_summary(text[]) to anon, authenticated;

drop function if exists public.gb_recent_activity(integer);
create or replace function public.gb_recent_activity(
  p_limit integer default 12,
  p_following_only boolean default false
)
returns setof jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with activity as (
    select
      'match:' || m.id::text as id,
      'match'::text as kind,
      coalesce(w.name, 'A team') || ' defeated ' || coalesce(l.name, 'a team') || ' in ' || public.gb_pretty(m.game) as txt,
      '/matches/' || m.id::text as href,
      m.completed_at as at,
      m.winning_team_id as team_id,
      (m.winning_user_ids)[1] as user_id,
      coalesce(m.winning_user_ids, array[]::uuid[]) as user_ids
    from public.matches m
    left join public.teams w on w.id = m.winning_team_id
    left join public.teams l on l.id = m.losing_team_id
    where m.completed_at is not null and m.winning_team_id is not null

    union all

    select
      'team:' || t.id::text,
      'team',
      'New team ' || t.name || ' entered ' || public.gb_pretty(t.game),
      '/teams/' || t.id::text,
      t.created_at,
      t.id,
      t.owner_id,
      case when t.owner_id is null then array[]::uuid[] else array[t.owner_id] end
    from public.teams t

    union all

    select
      'award:' || ua.id::text,
      'award',
      case when ua.recipient_team_id is not null
        then coalesce(team.name, 'A team') || ' earned ' || c.name
        else coalesce(p.username, 'A player') || ' earned ' || c.name end,
      case when ua.recipient_team_id is not null
        then '/teams/' || ua.recipient_team_id::text
        when p.username is not null then '/players/' || p.username else '/awards' end,
      ua.granted_at,
      ua.recipient_team_id,
      ua.recipient_id,
      case when ua.recipient_id is null then array[]::uuid[] else array[ua.recipient_id] end
    from public.staff_user_awards ua
    join public.staff_award_catalog c on c.id = ua.award_id
    left join public.profiles p on p.id = ua.recipient_id
    left join public.teams team on team.id = ua.recipient_team_id
    where ua.revoked_at is null
      and (ua.recipient_id is not null or ua.recipient_team_id is not null)
  )
  select jsonb_build_object(
    'id', a.id,
    'kind', a.kind,
    'text', a.txt,
    'href', a.href,
    'at', a.at,
    'team_id', a.team_id,
    'user_id', a.user_id,
    'user_ids', a.user_ids
  )
  from activity a
  where a.at is not null
    and (
      not coalesce(p_following_only, false)
      or (
        auth.uid() is not null
        and exists (
          select 1
          from public.community_follows f
          where f.follower_id = auth.uid()
            and (
              (f.target_type = 'team' and f.target_id = a.team_id::text)
              or (
                f.target_type = 'player'
                and f.target_id::uuid = any(a.user_ids)
              )
            )
        )
      )
    )
  order by a.at desc
  limit greatest(1, least(coalesce(p_limit, 12), 50));
$$;

grant execute on function public.gb_recent_activity(integer, boolean) to anon, authenticated;

create or replace function public.staff_award_competition_champion(
  p_reward_type text,
  p_tournament_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_team uuid;
  v_tournament public.tournaments%rowtype;
  v_period text;
  v_credits integer;
  v_award_name text;
  v_award_id bigint;
  v_user uuid;
  v_players uuid[];
  v_reward_id bigint;
  v_match_count integer;
begin
  if auth.uid() is null or not public.has_staff_permission('staff_access') then
    raise exception 'Only authorized staff can award competition champions.';
  end if;

  if p_reward_type = 'weekly_cup' then
    if p_tournament_id is null then
      raise exception 'Choose a weekly cup.';
    end if;
    select * into v_tournament from public.tournaments
    where id = p_tournament_id and competition_type = 'weekly_cup'
    for update;
    if not found or v_tournament.status <> 'completed' then
      raise exception 'Complete the weekly cup before awarding its winner.';
    end if;

    select count(*) into v_match_count
    from public.tournament_matches
    where tournament_id = p_tournament_id
      and round = (select max(round) from public.tournament_matches where tournament_id = p_tournament_id)
      and winner_id is not null;
    if v_match_count <> 1 then
      raise exception 'The weekly cup needs a decided final match before its winner can be awarded.';
    end if;

    select winner_id into v_team
    from public.tournament_matches
    where tournament_id = p_tournament_id
      and round = (select max(round) from public.tournament_matches where tournament_id = p_tournament_id)
      and winner_id is not null
    limit 1;
    v_period := p_tournament_id::text;
    v_credits := 5;
    v_award_name := 'Weekly Cup Winner';
  elsif p_reward_type = 'monthly' then
    with period_matches as (
      select winning_team_id as team_id, true as won
      from public.matches
      where completed_at >= date_trunc('month', now()) - interval '1 month'
        and completed_at < date_trunc('month', now())
        and winning_team_id is not null
      union all
      select losing_team_id, false
      from public.matches
      where completed_at >= date_trunc('month', now()) - interval '1 month'
        and completed_at < date_trunc('month', now())
        and winning_team_id is not null
        and losing_team_id is not null
    ),
    standings as (
      select team_id,
        count(*) filter (where won) as wins,
        count(*) filter (where not won) as losses
      from period_matches
      group by team_id
    )
    select standings.team_id into v_team
    from standings
    join public.teams on teams.id = standings.team_id
    where standings.wins > 0
    order by standings.wins desc, standings.losses asc, teams.name
    limit 1;
    if v_team is null then
      raise exception 'No team has completed a match in the last full calendar month.';
    end if;
    v_period := to_char(date_trunc('month', now()) - interval '1 month', 'YYYY-MM');
    v_credits := 25;
    v_award_name := 'Monthly Team Champion';
  else
    raise exception 'Choose a supported competition reward.';
  end if;

  insert into public.competition_rewards (
    reward_type, reward_period, tournament_id, team_id, credits_per_player, awarded_by
  ) values (
    p_reward_type, v_period, p_tournament_id, v_team, v_credits, auth.uid()
  )
  on conflict (reward_type, reward_period) do nothing
  returning id into v_reward_id;
  if v_reward_id is null then
    raise exception 'Rewards for this competition have already been paid.';
  end if;

  select array_agg(distinct member_id) into v_players
  from (
    select owner_id as member_id from public.teams where id = v_team
    union all
    select user_id from public.team_members where team_id = v_team
  ) members
  where member_id is not null;
  if coalesce(array_length(v_players, 1), 0) = 0 then
    raise exception 'The winning team has no eligible players to reward.';
  end if;

  if p_reward_type = 'weekly_cup' then
    insert into public.tournament_prize_payouts (
      tournament_id, team_id, placement, total_credits, paid_by
    ) values (
      p_tournament_id, v_team, 1, v_credits * array_length(v_players, 1), auth.uid()
    );
  end if;

  select id into v_award_id from public.staff_award_catalog
  where name = v_award_name;
  if v_award_id is null then
    raise exception 'The champion award is missing from the award catalog.';
  end if;

  foreach v_user in array v_players loop
    perform public.apply_credit_change(
      v_user,
      v_credits,
      case when p_reward_type = 'weekly_cup' then 'Weekly Cup winner: ' || v_tournament.title
        else 'Monthly team champion: ' || v_period end,
      'prize',
      auth.uid()
    );
    insert into public.staff_user_awards (award_id, recipient_id, granted_by, reason)
    values (
      v_award_id,
      v_user,
      auth.uid(),
      case when p_reward_type = 'weekly_cup' then 'Winner of weekly cup: ' || v_tournament.title
        else 'Monthly team leaderboard champion for ' || v_period end
    );
  end loop;

  insert into public.staff_user_awards (award_id, recipient_team_id, granted_by, reason)
  values (
    v_award_id,
    v_team,
    auth.uid(),
    case when p_reward_type = 'weekly_cup' then 'Winning team of weekly cup: ' || v_tournament.title
      else 'Monthly team leaderboard champion for ' || v_period end
  );

  return jsonb_build_object(
    'team_id', v_team,
    'players_rewarded', array_length(v_players, 1),
    'credits_per_player', v_credits,
    'award', v_award_name
  );
end;
$$;

revoke all on function public.staff_award_competition_champion(text, uuid) from public, anon;
grant execute on function public.staff_award_competition_champion(text, uuid) to authenticated;

create or replace function public.gb_create_next_weekly_cup()
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_template public.tournaments%rowtype;
  v_next_start timestamptz;
begin
  select * into v_template
  from public.tournaments
  where competition_type = 'weekly_cup'
  order by starts_at desc, created_at desc
  limit 1;
  if not found then
    return;
  end if;

  v_next_start :=
    ((v_template.starts_at at time zone 'America/New_York') + interval '7 days')
    at time zone 'America/New_York';
  while v_next_start <= now() loop
    v_next_start :=
      ((v_next_start at time zone 'America/New_York') + interval '7 days')
      at time zone 'America/New_York';
  end loop;

  if exists (
    select 1 from public.tournaments
    where competition_type = 'weekly_cup'
      and starts_at = v_next_start
      and status <> 'cancelled'
  ) then
    return;
  end if;

  insert into public.tournaments (
    title, platform, game, format, team_size, starts_at, check_in_minutes,
    max_teams, is_free, entry_fee, prize, rules, status, created_by,
    entry_fee_credits, prize_credits, prize_per_player, competition_type
  ) values (
    v_template.title, v_template.platform, v_template.game, v_template.format,
    v_template.team_size, v_next_start, v_template.check_in_minutes,
    v_template.max_teams, true, 0, v_template.prize, v_template.rules,
    'upcoming', v_template.created_by, 0, 5, true, 'weekly_cup'
  );
end;
$$;

revoke all on function public.gb_create_next_weekly_cup() from public, anon, authenticated;

select cron.unschedule(jobid)
from cron.job
where jobname = 'gb-weekly-community-cup';
select cron.schedule(
  'gb-weekly-community-cup',
  '15 4 * * 0',
  'select public.gb_create_next_weekly_cup()'
);

update public.forum_posts
set message = concat_ws(
  E'\n\n',
  nullif(trim(message), ''),
  'Community is getting livelier: follow players and teams, react to match results and awards, and share big moments. We are adding free Saturday Community Cups with credits and winner awards, plus monthly champion rewards. New players can find events and get started more easily on mobile.'
)
where id = (
  select id
  from public.forum_posts
  where author = 'Prime'
    and category = 'News & Updates'
    and pinned
    and not hidden
    and subject ilike '%Site Updates%'
  order by created_at desc
  limit 1
)
and coalesce(message, '') not like '%Community is getting livelier%';

notify pgrst, 'reload schema';
