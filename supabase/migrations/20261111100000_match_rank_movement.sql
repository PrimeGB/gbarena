alter table public.teams
  add column current_win_streak integer not null default 0,
  add column best_win_streak integer not null default 0;

with results as (
  select team_id, won, completed_at, match_id,
    sum(case when won then 0 else 1 end) over
      (partition by team_id order by completed_at, match_id) as loss_group,
    row_number() over (partition by team_id order by completed_at desc, match_id desc) as newest
  from (
    select winning_team_id as team_id, true as won, coalesce(completed_at, created_at) as completed_at, id as match_id
    from public.matches where result_processed and rankings_applied and winning_team_id is not null
    union all
    select losing_team_id, false, coalesce(completed_at, created_at), id
    from public.matches where result_processed and rankings_applied and losing_team_id is not null
  ) settled
),
runs as (
  select team_id, loss_group, count(*)::integer as wins
  from results where won group by team_id, loss_group
),
history as (
  select r.team_id, max(r.wins) as best,
    max(r.wins) filter (where latest.won and latest.loss_group = r.loss_group) as current
  from runs r join results latest on latest.team_id = r.team_id and latest.newest = 1
  group by r.team_id
)
update public.teams t set
  current_win_streak = case
    when coalesce(t.losses, 0) = 0 then coalesce(t.wins, 0)
    when t.streak = 'W' then greatest(coalesce(h.current, 0), 1)
    else 0 end,
  best_win_streak = case
    when coalesce(t.losses, 0) = 0 then coalesce(t.wins, 0)
    else greatest(coalesce(h.best, 0), case when coalesce(t.wins, 0) > 0 then 1 else 0 end) end
from (select id from public.teams) all_teams
left join history h on h.team_id = all_teams.id
where t.id = all_teams.id;

create or replace function public.gb_guard_team_stats()
returns trigger language plpgsql set search_path = public, pg_temp
as $$
begin
  if public.gb_is_db_role() then return new; end if;
  if tg_op = 'INSERT' then
    new.wins := 0; new.losses := 0; new.xp := 0; new.streak := '0'; new.rating_points := 100;
    new.current_win_streak := 0; new.best_win_streak := 0;
    return new;
  end if;
  if (new.wins, new.losses, new.xp, new.streak, new.rating_points, new.current_win_streak, new.best_win_streak)
     is distinct from (old.wins, old.losses, old.xp, old.streak, old.rating_points, old.current_win_streak, old.best_win_streak) then
    raise exception 'Team XP, rank and records can only be changed by verified match results.';
  end if;
  return new;
end;
$$;

create function public.gb_update_team_win_streak()
returns trigger language plpgsql set search_path = public, pg_temp
as $$
begin
  if coalesce(new.wins, 0) = coalesce(old.wins, 0) + 1 and new.losses is not distinct from old.losses then
    new.current_win_streak := old.current_win_streak + 1;
    new.best_win_streak := greatest(old.best_win_streak, new.current_win_streak);
  elsif coalesce(new.losses, 0) = coalesce(old.losses, 0) + 1 and new.wins is not distinct from old.wins then
    new.current_win_streak := 0;
    new.best_win_streak := old.best_win_streak;
  end if;
  return new;
end;
$$;
create trigger teams_update_win_streak before update of wins, losses on public.teams
  for each row execute function public.gb_update_team_win_streak();

create table public.team_match_rank_movement (
  team_id uuid primary key references public.teams(id) on delete cascade,
  match_id uuid not null references public.matches(id) on delete cascade,
  previous_place bigint,
  current_place bigint,
  recorded_at timestamptz not null default now()
);

alter table public.team_match_rank_movement enable row level security;
create policy team_match_rank_movement_public_read on public.team_match_rank_movement
  for select to anon, authenticated using (true);
revoke all on public.team_match_rank_movement from anon, authenticated;
grant select on public.team_match_rank_movement to anon, authenticated;

revoke all on function public.apply_final_match_result(uuid, uuid, uuid[], uuid[], boolean)
  from public, anon, authenticated;

create function public.gb_team_ladder_place(team_uuid uuid)
returns bigint language sql stable security definer set search_path = public, pg_temp
as $$
  with target as (select * from public.teams where id = team_uuid),
  standings as (
    select t.id, row_number() over (order by coalesce(t.rating_points,100) desc,
      coalesce(t.wins,0) desc, coalesce(t.losses,0), t.created_at nulls first, t.id) as place
    from public.teams t join target x
      on t.platform = x.platform and t.category = x.category and t.game = x.game and t.ladder = x.ladder
    where t.wins > 0 or t.losses > 0
  )
  select place from standings where id = team_uuid;
$$;
revoke all on function public.gb_team_ladder_place(uuid) from public, anon, authenticated;

create function public.gb_record_match_rank_movement(match_uuid uuid, team_a uuid, team_b uuid, old_a bigint, old_b bigint)
returns void language sql security definer set search_path = public, pg_temp
as $$
  insert into public.team_match_rank_movement(team_id, match_id, previous_place, current_place)
  values (team_a, match_uuid, old_a, public.gb_team_ladder_place(team_a)),
         (team_b, match_uuid, old_b, public.gb_team_ladder_place(team_b))
  on conflict (team_id) do update set match_id = excluded.match_id,
    previous_place = excluded.previous_place, current_place = excluded.current_place, recorded_at = now();
$$;
revoke all on function public.gb_record_match_rank_movement(uuid, uuid, uuid, bigint, bigint) from public, anon, authenticated;

alter function public.gb_award_match_result(uuid, uuid, uuid, uuid[], uuid[], boolean)
  rename to gb_award_match_result_without_rank_movement;
revoke all on function public.gb_award_match_result_without_rank_movement(uuid, uuid, uuid, uuid[], uuid[], boolean)
  from public, anon, authenticated;

create function public.gb_award_match_result(p_match uuid, p_winner uuid, p_loser uuid, p_w_users uuid[], p_l_users uuid[], p_forfeit boolean default false)
returns jsonb language plpgsql security definer set search_path = public, pg_temp
as $$
declare before_winner bigint; before_loser bigint; outcome jsonb;
begin
  perform pg_advisory_xact_lock(hashtext('gb_match_rank_movement'));
  before_winner := public.gb_team_ladder_place(p_winner);
  before_loser := public.gb_team_ladder_place(p_loser);
  outcome := public.gb_award_match_result_without_rank_movement(p_match, p_winner, p_loser, p_w_users, p_l_users, p_forfeit);
  if outcome->>'ok' = 'true' and not coalesce((outcome->>'voided')::boolean, false) then
    perform public.gb_record_match_rank_movement(p_match, p_winner, p_loser, before_winner, before_loser);
  end if;
  return outcome;
end;
$$;
revoke all on function public.gb_award_match_result(uuid, uuid, uuid, uuid[], uuid[], boolean) from public, anon, authenticated;

alter function public.staff_finalize_disputed_match(uuid, integer, integer, text)
  rename to gb_staff_finalize_without_rank_movement;
revoke all on function public.gb_staff_finalize_without_rank_movement(uuid, integer, integer, text) from public, anon, authenticated;
create function public.staff_finalize_disputed_match(match_uuid uuid, posting_score integer, accepting_score integer, decision_note text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp
as $$
declare m public.matches%rowtype; old_a bigint; old_b bigint; outcome jsonb;
begin
  select * into m from public.matches where id = match_uuid for update;
  perform pg_advisory_xact_lock(hashtext('gb_match_rank_movement'));
  old_a := public.gb_team_ladder_place(m.posting_team_id);
  old_b := public.gb_team_ladder_place(m.accepting_team_id);
  outcome := public.gb_staff_finalize_without_rank_movement(match_uuid, posting_score, accepting_score, decision_note);
  if outcome->>'ok' = 'true' then
    perform public.gb_record_match_rank_movement(match_uuid, m.posting_team_id, m.accepting_team_id, old_a, old_b);
  end if;
  return outcome;
end;
$$;
revoke all on function public.staff_finalize_disputed_match(uuid, integer, integer, text) from public, anon;
grant execute on function public.staff_finalize_disputed_match(uuid, integer, integer, text) to authenticated;

with site_updates as (
  select id from public.forum_posts where author = 'Prime' and category = 'News & Updates'
    and pinned and not hidden and subject ilike '%Site Updates%' order by created_at desc limit 1
)
update public.forum_posts post set message = concat_ws(E'\n\n', nullif(trim(post.message), ''),
  'Team pages now combine upcoming and recent matches in one list. Team stats show rank movement and win streaks after confirmed or staff-decided matches.')
from site_updates where post.id = site_updates.id
  and coalesce(post.message, '') not like '%Team pages now combine upcoming and recent matches%';
notify pgrst, 'reload schema';
