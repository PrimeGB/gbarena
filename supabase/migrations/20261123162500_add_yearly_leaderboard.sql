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
    when 'year' then date_trunc('year', now())
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
