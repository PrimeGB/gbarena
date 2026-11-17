-- Run after the challenge migrations in a transaction; roll everything back.
do $$
declare
  player uuid;
  friend uuid;
  totals jsonb;
  stats jsonb;
  launch timestamptz := public.gb_challenge_launch();
begin
  select id into player from public.profiles order by created_at limit 1;
  select id into friend from public.profiles where id <> player order by created_at limit 1;
  if player is null then raise exception 'Need at least one profile'; end if;

  if exists (select 1 from public.staff_award_catalog where name in ('Community Pioneer', 'Daily Spark Trophy', '10 Wins Badge', 'Bug Finder — Emerald', 'Iron Will Trophy')) then
    raise exception 'Retired awards still in catalog';
  end if;
  if exists (select 1 from public.staff_user_awards ua join public.profiles p on p.id = ua.recipient_id
      join public.staff_award_catalog c on c.id = ua.award_id
      where p.role = 'owner' and c.award_group = 'Community' and c.name like 'Community %' and c.name <> 'Community Origin' and ua.revoked_at is null) then
    raise exception 'Founders still hold extra early community awards';
  end if;
  if (select count(*) from public.staff_award_catalog where award_group in ('Daily Challenges', 'Login Rewards', 'Site Interaction', 'Limited Edition Challenges')) <> 28 then
    raise exception 'Expected 28 challenge trophies';
  end if;

  -- Past sign-ins count toward streaks, but Daily Challenges only exist since launch.
  delete from public.player_activity_days where user_id = player;
  insert into public.player_activity_days (user_id, activity_date)
  select player, (launch at time zone 'UTC')::date - offs from generate_series(1, 10) offs;
  totals := public.gb_challenge_totals(player);
  if (totals ->> 'longest_streak')::int < 10 then raise exception 'Past days not counted: %', totals; end if;
  if (totals ->> 'daily_completions')::int <> 0 then raise exception 'Pre-launch dailies counted: %', totals; end if;
  if not exists (select 1 from public.staff_user_awards u join public.staff_award_catalog c on c.id = u.award_id
    where u.recipient_id = player and c.name = 'On Fire Trophy') then
    perform public.gb_reconcile_challenge_trophies(player);
    if not exists (select 1 from public.staff_user_awards u join public.staff_award_catalog c on c.id = u.award_id
      where u.recipient_id = player and c.name = 'On Fire Trophy') then raise exception 'Past streak did not earn On Fire'; end if;
  end if;

  -- Three consecutive days after launch, a gap, then one: longest streak 3.
  delete from public.player_activity_days where user_id = player;
  insert into public.player_activity_days (user_id, activity_date)
  select player, (launch at time zone 'UTC')::date + offs from unnest(array[0, 1, 2, 5]) offs;
  totals := public.gb_challenge_totals(player);
  if (totals ->> 'longest_streak')::int <> 3 then raise exception 'Longest streak wrong: %', totals; end if;

  -- Each weekday has a different challenge.
  if (select count(distinct public.gb_daily_challenge(current_date + i) ->> 'title') from generate_series(0, 6) i) <> 7 then
    raise exception 'Daily challenges repeat';
  end if;

  stats := public.gb_challenge_window_stats(player, launch, launch + interval '10 days');
  if not public.gb_challenge_requirements_met(stats, '{"active_days":4}') then raise exception 'Requirement not met: %', stats; end if;
  if public.gb_challenge_requirements_met(stats, '{"active_days":4,"wins":999}') then raise exception 'Unmet requirement passed'; end if;
  foreach player in array array[player] loop
    if not (stats ? 'win_streak' and stats ? 'rival_wins' and stats ? 'bounce_backs' and stats ? 'hosted' and stats ? 'friend_matches') then
      raise exception 'Missing metrics: %', stats;
    end if;
  end loop;

  -- A friendship accepted now grants Squad Up to both players.
  if friend is not null then
    delete from public.friend_requests f
    where (f.requester_id = player and f.recipient_id = friend) or (f.requester_id = friend and f.recipient_id = player);
    delete from public.staff_user_awards ua using public.staff_award_catalog c
    where c.id = ua.award_id and c.name = 'Squad Up Trophy' and ua.recipient_id in (player, friend);
    alter table public.friend_requests disable trigger user;
    insert into public.friend_requests (requester_id, recipient_id, status) values (player, friend, 'pending');
    alter table public.friend_requests enable trigger user;
    update public.friend_requests set status = 'accepted', responded_at = now()
    where requester_id = player and recipient_id = friend;
    if (select count(distinct ua.recipient_id) from public.staff_user_awards ua join public.staff_award_catalog c on c.id = ua.award_id
        where c.name = 'Squad Up Trophy' and ua.recipient_id in (player, friend)) <> 2 then
      raise exception 'Squad Up not granted to both friends';
    end if;

    -- Following a player also gives the followed player Rising Star.
    delete from public.community_follows where follower_id = player and target_type = 'player' and target_id = friend::text;
    delete from public.staff_user_awards ua using public.staff_award_catalog c
    where c.id = ua.award_id and c.name = 'Rising Star Trophy' and ua.recipient_id = friend;
    insert into public.community_follows (follower_id, target_type, target_id) values (player, 'player', friend::text);
    if not exists (select 1 from public.staff_user_awards ua join public.staff_award_catalog c on c.id = ua.award_id
        where c.name = 'Rising Star Trophy' and ua.recipient_id = friend) then
      raise exception 'Rising Star not granted to followed player';
    end if;
  end if;

  perform set_config('request.jwt.claims', json_build_object('sub', player, 'role', 'authenticated')::text, true);
  if jsonb_array_length(public.gb_challenge_overview() -> 'daily_schedule') <> 7 then raise exception 'Daily schedule missing'; end if;
  if public.gb_challenge_overview() -> 'today' -> 'challenge' ->> 'title' is null then raise exception 'Today missing'; end if;
  if jsonb_array_length(public.gb_challenge_overview() -> 'challenges') <> 11 then raise exception 'Schedule wrong'; end if;
  perform set_config('request.jwt.claims', '', true);
  if public.gb_challenge_overview() -> 'totals' <> 'null'::jsonb then raise exception 'Anonymous overview leaked totals'; end if;

  if exists (select 1 from public.player_challenges where id = '2026-11-founders-month') then raise exception 'Founders month still scheduled'; end if;
  if (select count(*) from public.player_challenges where locked) <> 8 then raise exception 'Expected 8 locked challenges'; end if;
  raise notice 'unique awards ok';
end;
$$;
