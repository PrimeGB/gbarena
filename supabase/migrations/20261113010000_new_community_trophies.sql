insert into public.staff_award_catalog (name, award_group, purpose, exclusive, auto_award) values
  ('First Steps Trophy', 'Milestones', 'Complete 2 ladder matches.', false, true),
  ('Game On Trophy', 'Milestones', 'Complete 5 ladder matches.', false, true),
  ('Battle Ready Trophy', 'Milestones', 'Complete 10 ladder matches.', false, true),
  ('Momentum Trophy', 'Milestones', 'Complete 20 ladder matches.', false, true),
  ('On the Grind Trophy', 'Milestones', 'Complete 35 ladder matches.', false, true),
  ('Battle Tested Trophy', 'Milestones', 'Complete 50 ladder matches.', false, true),
  ('Veteran Run Trophy', 'Milestones', 'Complete 75 ladder matches.', false, true),
  ('Unstoppable Journey Trophy', 'Milestones', 'Complete 125 ladder matches.', false, true),
  ('Double Victory Trophy', 'Wins', 'Win 2 ladder matches.', false, true),
  ('Triple Threat Trophy', 'Wins', 'Win 3 ladder matches.', false, true),
  ('High Five Trophy', 'Wins', 'Win 5 ladder matches.', false, true),
  ('Victory Surge Trophy', 'Wins', 'Win 15 ladder matches.', false, true),
  ('Winning Edge Trophy', 'Wins', 'Win 25 ladder matches.', false, true),
  ('Victory Vanguard Trophy', 'Wins', 'Win 40 ladder matches.', false, true),
  ('Triumph Elite Trophy', 'Wins', 'Win 75 ladder matches.', false, true),
  ('Victory Legend Trophy', 'Wins', 'Win 125 ladder matches.', false, true),
  ('Spring Bloom Trophy', 'Calendar Seasons', 'Complete a ladder match in March, April or May (UTC).', false, true),
  ('Summer Heat Trophy', 'Calendar Seasons', 'Complete a ladder match in June, July or August (UTC).', false, true),
  ('Autumn Harvest Trophy', 'Calendar Seasons', 'Complete a ladder match in September, October or November (UTC).', false, true),
  ('Winter Frost Trophy', 'Calendar Seasons', 'Complete a ladder match in December, January or February (UTC).', false, true),
  ('Season Starter Trophy', 'Competitive Seasons', 'Complete 2 ladder matches in one monthly season.', false, true),
  ('Season Challenger Trophy', 'Competitive Seasons', 'Complete 5 ladder matches in one monthly season.', false, true),
  ('Season Contender Trophy', 'Competitive Seasons', 'Complete 10 ladder matches in one monthly season.', false, true),
  ('Season Warrior Trophy', 'Competitive Seasons', 'Complete 20 ladder matches in one monthly season.', false, true),
  ('Season Spark Trophy', 'Competitive Seasons', 'Win 2 ladder matches in one monthly season.', false, true),
  ('Season Surge Trophy', 'Competitive Seasons', 'Win 5 ladder matches in one monthly season.', false, true),
  ('Season Elite Trophy', 'Competitive Seasons', 'Win 10 ladder matches in one monthly season.', false, true),
  ('Season Conqueror Trophy', 'Competitive Seasons', 'Win 20 ladder matches in one monthly season.', false, true),
  ('Community Spark Trophy', 'Community', 'For a helpful contribution that brightens the community.', false, false),
  ('Welcome Wagon Trophy', 'Community', 'For helping a new player feel welcome and get started.', false, false),
  ('Team Builder Trophy', 'Community', 'For bringing players together to build an active team.', false, false),
  ('Creative Mind Trophy', 'Community', 'For a creative suggestion adopted to improve the site.', false, false),
  ('Positive Play Trophy', 'Community', 'For showing great sportsmanship toward other players.', false, false),
  ('Helpful Hand Trophy', 'Community', 'For helping another player solve a problem or learn the site.', false, false),
  ('Clutch Moment Trophy', 'Highlights', 'For a standout clutch moment verified by staff.', false, false),
  ('Rivalry Respect Trophy', 'Highlights', 'For a memorable rivalry played with outstanding sportsmanship.', false, false),
  ('Comeback Story Trophy', 'Highlights', 'For a notable comeback in a staff-verified match.', false, false),
  ('Squad Spirit Trophy', 'Highlights', 'For exceptional teamwork in a staff-reviewed match.', false, false),
  ('Community Champion Trophy', 'Highlights', 'For making a sustained positive impact on the community.', false, false),
  ('Game Changer Trophy', 'Highlights', 'For an exceptional idea or contribution that improves GameBattles.', false, false);

create index if not exists matches_ranked_winners_trophies_idx on public.matches using gin (winning_user_ids)
  where result_processed and rankings_applied and completed_at is not null;
create index if not exists matches_ranked_losers_trophies_idx on public.matches using gin (losing_user_ids)
  where result_processed and rankings_applied and completed_at is not null;

create function public.gb_reconcile_new_trophies(p_user uuid, p_month timestamptz)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_matches bigint;
  v_wins bigint;
  v_month_matches bigint;
  v_month_wins bigint;
  v_season text;
  v_award record;
begin
  if p_user is null or p_month is null then return; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_user::text || ':new_trophies', 0));
  select count(*), count(*) filter (where winning_user_ids @> array[p_user]),
    count(*) filter (where completed_at >= p_month and completed_at < ((p_month at time zone 'UTC') + interval '1 month') at time zone 'UTC'),
    count(*) filter (where winning_user_ids @> array[p_user]
      and completed_at >= p_month and completed_at < ((p_month at time zone 'UTC') + interval '1 month') at time zone 'UTC')
  into v_matches, v_wins, v_month_matches, v_month_wins
  from public.matches
  where result_processed and rankings_applied and completed_at is not null
    and (winning_user_ids @> array[p_user] or losing_user_ids @> array[p_user]);

  for v_award in
    select * from (values
      ('First Steps Trophy', v_matches, 2), ('Game On Trophy', v_matches, 5),
      ('Battle Ready Trophy', v_matches, 10), ('Momentum Trophy', v_matches, 20),
      ('On the Grind Trophy', v_matches, 35), ('Battle Tested Trophy', v_matches, 50),
      ('Veteran Run Trophy', v_matches, 75), ('Unstoppable Journey Trophy', v_matches, 125),
      ('Double Victory Trophy', v_wins, 2), ('Triple Threat Trophy', v_wins, 3),
      ('High Five Trophy', v_wins, 5), ('Victory Surge Trophy', v_wins, 15),
      ('Winning Edge Trophy', v_wins, 25), ('Victory Vanguard Trophy', v_wins, 40),
      ('Triumph Elite Trophy', v_wins, 75), ('Victory Legend Trophy', v_wins, 125),
      ('Season Starter Trophy', v_month_matches, 2), ('Season Challenger Trophy', v_month_matches, 5),
      ('Season Contender Trophy', v_month_matches, 10), ('Season Warrior Trophy', v_month_matches, 20),
      ('Season Spark Trophy', v_month_wins, 2), ('Season Surge Trophy', v_month_wins, 5),
      ('Season Elite Trophy', v_month_wins, 10), ('Season Conqueror Trophy', v_month_wins, 20)
    ) as awards(name, achieved, required)
    where achieved >= required
  loop
    perform public.gb_grant_auto_award(p_user, v_award.name);
  end loop;

  if v_month_matches > 0 then
    v_season := case
      when extract(month from p_month at time zone 'UTC') in (3, 4, 5) then 'Spring Bloom Trophy'
      when extract(month from p_month at time zone 'UTC') in (6, 7, 8) then 'Summer Heat Trophy'
      when extract(month from p_month at time zone 'UTC') in (9, 10, 11) then 'Autumn Harvest Trophy'
      else 'Winter Frost Trophy'
    end;
    perform public.gb_grant_auto_award(p_user, v_season);
  end if;
end;
$$;
revoke all on function public.gb_reconcile_new_trophies(uuid, timestamptz) from public, anon, authenticated;

create function public.gb_new_trophies_on_match()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid;
  v_month timestamptz;
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
  v_month := date_trunc('month', new.completed_at at time zone 'UTC') at time zone 'UTC';
  for v_user in
    select distinct player_id from unnest(
      coalesce(new.winning_user_ids, '{}'::uuid[]) || coalesce(new.losing_user_ids, '{}'::uuid[])
    ) as players(player_id)
    where player_id is not null order by player_id
  loop
    perform public.gb_reconcile_new_trophies(v_user, v_month);
  end loop;
  return new;
end;
$$;
revoke all on function public.gb_new_trophies_on_match() from public, anon, authenticated;

create trigger matches_new_trophies
  after insert or update on public.matches
  for each row execute function public.gb_new_trophies_on_match();

select public.gb_reconcile_new_trophies(history.player_id, history.month_start)
from (
  select distinct player_id,
    date_trunc('month', m.completed_at at time zone 'UTC') at time zone 'UTC' as month_start
  from public.matches m
  cross join lateral unnest(coalesce(m.winning_user_ids, '{}'::uuid[]) || coalesce(m.losing_user_ids, '{}'::uuid[])) as players(player_id)
  where m.result_processed and m.rankings_applied and m.completed_at is not null and player_id is not null
) history
order by history.player_id, history.month_start;
