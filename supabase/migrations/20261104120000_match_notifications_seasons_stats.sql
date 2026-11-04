-- 1. More in-site notifications (score reported, disputed, completed, team invites)
-- 2. Monthly seasons with standings and per-player season history
-- 3. Player stats (record, win rate, streaks, per-game breakdown)

------------------------------------------------------------------
-- Realtime for the notification bell (ignored if already enabled)
------------------------------------------------------------------
do $$
begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object or undefined_object then
  null;
end $$;

------------------------------------------------------------------
-- Match progress notifications
------------------------------------------------------------------
create or replace function public.gb_on_match_progress()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_a text;
  v_b text;
  v_label text;
  v_winner text;
  v_was_disputed boolean;
begin
  select name into v_a from public.teams where id = new.posting_team_id;
  select name into v_b from public.teams where id = new.accepting_team_id;
  v_label := coalesce(v_a, 'Team') || ' vs ' || coalesce(v_b, 'Team');

  if new.reporting_status is distinct from old.reporting_status then
    if lower(coalesce(new.reporting_status, '')) = 'awaiting_confirmation' then
      perform public.gb_notify_team(
        new.confirmation_team_id,
        'Confirm the score: ' || v_label,
        'The other team reported the score. Open the match page to confirm it or dispute it.',
        'match', new.id
      );
      perform public.gb_notify_team(
        new.reported_by_team_id,
        'Score submitted: ' || v_label,
        'Your score was submitted. Waiting for the other team to confirm it.',
        'match', new.id
      );
    elsif lower(coalesce(new.reporting_status, '')) = 'disputed' then
      perform public.gb_notify_team(
        new.posting_team_id,
        'Score disputed: ' || v_label,
        'The reported score was disputed. Submit your dispute ticket and proof so staff can review the match.',
        'match', new.id
      );
      perform public.gb_notify_team(
        new.accepting_team_id,
        'Score disputed: ' || v_label,
        'The reported score was disputed. Submit your dispute ticket and proof so staff can review the match.',
        'match', new.id
      );
    end if;
  end if;

  if lower(coalesce(new.status, '')) = 'completed'
     and lower(coalesce(old.status, '')) <> 'completed' then
    v_was_disputed := lower(coalesce(old.status, '')) = 'disputed'
      or lower(coalesce(old.reporting_status, '')) = 'disputed';

    select name into v_winner
    from public.teams
    where id = coalesce(new.winning_team_id, new.reported_winner_team_id);

    perform public.gb_notify_team(
      new.posting_team_id,
      case when v_was_disputed then 'Dispute resolved: ' else 'Match completed: ' end || v_label,
      coalesce(v_winner, 'A team') || ' won. Your record and rank have been updated.',
      'match', new.id
    );
    perform public.gb_notify_team(
      new.accepting_team_id,
      case when v_was_disputed then 'Dispute resolved: ' else 'Match completed: ' end || v_label,
      coalesce(v_winner, 'A team') || ' won. Your record and rank have been updated.',
      'match', new.id
    );
  end if;

  return new;
end;
$$;

drop trigger if exists matches_notify_progress on public.matches;
create trigger matches_notify_progress
  after update on public.matches
  for each row
  when (
    old.status is distinct from new.status
    or old.reporting_status is distinct from new.reporting_status
  )
  execute function public.gb_on_match_progress();

------------------------------------------------------------------
-- Team invite notifications
------------------------------------------------------------------
create or replace function public.gb_on_team_invite()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_team text;
  v_owner uuid;
  v_user text;
begin
  select name, owner_id into v_team, v_owner from public.teams where id = new.team_id;

  if tg_op = 'INSERT' then
    if new.status = 'pending' then
      perform public.gb_notify(
        new.user_id,
        'Team invite: ' || coalesce(v_team, 'a team'),
        'You have been invited to join ' || coalesce(v_team, 'a team') || '. Open My Teams to accept or decline.',
        'team_invite', new.id
      );
    end if;
    return new;
  end if;

  if new.status is distinct from old.status and new.status in ('accepted', 'declined') then
    select username into v_user from public.profiles where id = new.user_id;
    perform public.gb_notify(
      v_owner,
      'Invite ' || new.status || ': ' || coalesce(v_user, 'A player'),
      coalesce(v_user, 'A player') || ' ' || new.status || ' your invite to ' || coalesce(v_team, 'your team') || '.',
      'team_invite', new.id
    );
  end if;

  return new;
end;
$$;

drop trigger if exists team_invites_notify on public.team_invites;
create trigger team_invites_notify
  after insert or update of status on public.team_invites
  for each row execute function public.gb_on_team_invite();

------------------------------------------------------------------
-- Seasons (one per calendar month, created automatically)
------------------------------------------------------------------
create table if not exists public.seasons (
  id uuid primary key default gen_random_uuid(),
  number integer not null,
  name text not null,
  starts_at timestamptz not null unique,
  ends_at timestamptz not null,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

alter table public.seasons enable row level security;

drop policy if exists seasons_read_all on public.seasons;
create policy seasons_read_all on public.seasons for select using (true);

create or replace function public.gb_ensure_seasons()
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_first timestamptz;
  v_month timestamptz;
  v_current timestamptz := date_trunc('month', now());
begin
  select date_trunc('month', min(completed_at)) into v_first
  from public.matches where completed_at is not null;

  v_month := least(coalesce(v_first, v_current), v_current);

  while v_month <= v_current loop
    insert into public.seasons (number, name, starts_at, ends_at)
    values (
      (select coalesce(max(number), 0) + 1 from public.seasons),
      to_char(v_month, 'FMMonth YYYY'),
      v_month,
      v_month + interval '1 month'
    )
    on conflict (starts_at) do nothing;

    v_month := v_month + interval '1 month';
  end loop;
end;
$$;

create or replace function public.gb_current_season()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.gb_ensure_seasons();

  return (
    select jsonb_build_object(
      'id', s.id, 'number', s.number, 'name', s.name,
      'starts_at', s.starts_at, 'ends_at', s.ends_at
    )
    from public.seasons s
    where s.starts_at <= now() and s.ends_at > now()
    limit 1
  );
end;
$$;

create or replace function public.gb_season_standings(
  p_season uuid,
  p_kind text default 'teams',
  p_limit integer default 25
)
returns setof jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_start timestamptz;
  v_end timestamptz;
begin
  select starts_at, ends_at into v_start, v_end from public.seasons where id = p_season;
  if v_start is null then
    return;
  end if;

  if lower(coalesce(p_kind, 'teams')) = 'players' then
    return query
    select jsonb_build_object(
      'id', r.id, 'name', p.username, 'wins', r.wins, 'losses', r.losses,
      'win_pct', round(100.0 * r.wins / nullif(r.wins + r.losses, 0)),
      'rank', row_number() over (order by r.wins desc, r.losses asc, p.username)
    )
    from (
      select u.uid as id, count(*) filter (where u.won) as wins, count(*) filter (where not u.won) as losses
      from (
        select unnest(winning_user_ids) as uid, true as won from public.matches
          where completed_at >= v_start and completed_at < v_end and winning_team_id is not null
        union all
        select unnest(losing_user_ids), false from public.matches
          where completed_at >= v_start and completed_at < v_end and winning_team_id is not null
      ) u
      where u.uid is not null
      group by u.uid
    ) r
    join public.profiles p on p.id = r.id
    order by r.wins desc, r.losses asc, p.username
    limit greatest(1, least(coalesce(p_limit, 25), 100));
  else
    return query
    select jsonb_build_object(
      'id', r.id, 'name', t.name, 'wins', r.wins, 'losses', r.losses,
      'win_pct', round(100.0 * r.wins / nullif(r.wins + r.losses, 0)),
      'rank', row_number() over (order by r.wins desc, r.losses asc, t.name)
    )
    from (
      select u.team_id as id, count(*) filter (where u.won) as wins, count(*) filter (where not u.won) as losses
      from (
        select winning_team_id as team_id, true as won from public.matches
          where completed_at >= v_start and completed_at < v_end and winning_team_id is not null
        union all
        select losing_team_id, false from public.matches
          where completed_at >= v_start and completed_at < v_end
            and winning_team_id is not null and losing_team_id is not null
      ) u
      group by u.team_id
    ) r
    join public.teams t on t.id = r.id
    order by r.wins desc, r.losses asc, t.name
    limit greatest(1, least(coalesce(p_limit, 25), 100));
  end if;
end;
$$;

-- A player's finish in every season they played
create or replace function public.gb_player_season_history(p_user uuid)
returns setof jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  return query
  with results as (
    select u.uid, s.id as season_id, s.number, s.name, s.starts_at,
      count(*) filter (where u.won) as wins,
      count(*) filter (where not u.won) as losses
    from public.seasons s
    join lateral (
      select unnest(m.winning_user_ids) as uid, true as won
        from public.matches m
        where m.completed_at >= s.starts_at and m.completed_at < s.ends_at and m.winning_team_id is not null
      union all
      select unnest(m.losing_user_ids), false
        from public.matches m
        where m.completed_at >= s.starts_at and m.completed_at < s.ends_at and m.winning_team_id is not null
    ) u on true
    where u.uid is not null
    group by u.uid, s.id, s.number, s.name, s.starts_at
  ),
  ranked as (
    select r.*, rank() over (partition by r.season_id order by r.wins desc, r.losses asc) as place,
      count(*) over (partition by r.season_id) as players
    from results r
  )
  select jsonb_build_object(
    'season_id', k.season_id, 'name', k.name, 'number', k.number,
    'wins', k.wins, 'losses', k.losses, 'place', k.place, 'players', k.players,
    'current', (k.starts_at <= now() and k.starts_at + interval '1 month' > now())
  )
  from ranked k
  where k.uid = p_user
  order by k.starts_at desc;
end;
$$;

------------------------------------------------------------------
-- Player stats
------------------------------------------------------------------
create or replace function public.gb_player_stats(p_user uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_result jsonb;
begin
  with played as (
    select m.id, m.game, m.completed_at,
      (p_user = any(coalesce(m.winning_user_ids, '{}'::uuid[]))) as won
    from public.matches m
    where m.completed_at is not null
      and m.winning_team_id is not null
      and (
        p_user = any(coalesce(m.winning_user_ids, '{}'::uuid[]))
        or p_user = any(coalesce(m.losing_user_ids, '{}'::uuid[]))
      )
  ),
  ordered as (
    select *,
      row_number() over (order by completed_at, id)
        - row_number() over (partition by won order by completed_at, id) as grp
    from played
  ),
  streaks as (
    select won, count(*) as len, max(completed_at) as last_at
    from ordered
    group by won, grp
  ),
  latest as (
    select won, len from streaks order by last_at desc limit 1
  )
  select jsonb_build_object(
    'wins', coalesce((select count(*) from played where won), 0),
    'losses', coalesce((select count(*) from played where not won), 0),
    'win_pct', (select round(100.0 * count(*) filter (where won) / nullif(count(*), 0)) from played),
    'current_streak', coalesce((select len from latest), 0),
    'current_streak_type', (select case when won then 'W' else 'L' end from latest),
    'best_win_streak', coalesce((select max(len) from streaks where won), 0),
    'last_10', coalesce((
      select jsonb_agg(case when w then 'W' else 'L' end order by at desc)
      from (select won as w, completed_at as at from played order by completed_at desc limit 10) l
    ), '[]'::jsonb),
    'by_game', coalesce((
      select jsonb_agg(jsonb_build_object('game', g.game, 'wins', g.wins, 'losses', g.losses) order by g.wins + g.losses desc)
      from (
        select game, count(*) filter (where won) as wins, count(*) filter (where not won) as losses
        from played group by game
      ) g
    ), '[]'::jsonb)
  ) into v_result;

  return v_result;
end;
$$;

grant execute on function public.gb_current_season() to anon, authenticated;
grant execute on function public.gb_season_standings(uuid, text, integer) to anon, authenticated;
grant execute on function public.gb_player_season_history(uuid) to anon, authenticated;
grant execute on function public.gb_player_stats(uuid) to anon, authenticated;
revoke all on function public.gb_ensure_seasons() from public, anon, authenticated;
revoke all on function public.gb_on_match_progress() from public, anon, authenticated;
revoke all on function public.gb_on_team_invite() from public, anon, authenticated;

select public.gb_ensure_seasons();
