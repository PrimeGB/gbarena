-- Site-wide player XP for rank badges, derived from completed matches so
-- overturned results and past matches are always reflected.
begin;

create or replace function public.gb_player_xp(p_users uuid[])
returns table (user_id uuid, xp integer, wins integer, losses integer)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select u.id,
    (coalesce(r.wins, 0) * 25 + coalesce(r.losses, 0) * 5)::integer,
    coalesce(r.wins, 0)::integer,
    coalesce(r.losses, 0)::integer
  from unnest(coalesce(p_users, '{}'::uuid[])) as u(id)
  left join lateral (
    select
      count(*) filter (where u.id = any(coalesce(m.winning_user_ids, '{}'::uuid[]))) as wins,
      count(*) filter (where u.id = any(coalesce(m.losing_user_ids, '{}'::uuid[]))) as losses
    from public.matches m
    where m.completed_at is not null
      and m.winning_team_id is not null
      and (
        u.id = any(coalesce(m.winning_user_ids, '{}'::uuid[]))
        or u.id = any(coalesce(m.losing_user_ids, '{}'::uuid[]))
      )
  ) r on true
  limit 200;
$$;

revoke all on function public.gb_player_xp(uuid[]) from public;
grant execute on function public.gb_player_xp(uuid[]) to anon, authenticated;

commit;
