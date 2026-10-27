-- Account integrity (one email per person, gamertag locks) and anti-boosting for XP / rating.

------------------------------------------------------------------
-- Helpers
------------------------------------------------------------------
create or replace function public.gb_is_db_role()
returns boolean
language sql
stable
as $$
  select current_user in ('postgres', 'supabase_admin', 'service_role');
$$;

-- Treats Gmail dots and "+tag" aliases as the same mailbox so one person cannot
-- register name+1@x.com, name+2@x.com or n.a.m.e@gmail.com as separate accounts.
create or replace function public.normalize_email(p_email text)
returns text
language sql
immutable
as $$
  select case
    when p_email is null or position('@' in p_email) = 0 then lower(trim(p_email))
    when split_part(lower(trim(p_email)), '@', 2) in ('gmail.com', 'googlemail.com')
      then replace(split_part(split_part(lower(trim(p_email)), '@', 1), '+', 1), '.', '') || '@gmail.com'
    else split_part(split_part(lower(trim(p_email)), '@', 1), '+', 1) || '@' || split_part(lower(trim(p_email)), '@', 2)
  end;
$$;

------------------------------------------------------------------
-- 1. One account per email
------------------------------------------------------------------
do $$
begin
  if exists (
    select 1 from public.profiles
    where email is not null and email <> ''
    group by public.normalize_email(email)
    having count(*) > 1
  ) then
    raise notice 'Existing duplicate normalized emails found; unique index on profiles skipped.';
  else
    create unique index if not exists profiles_email_normalized_unique
      on public.profiles (public.normalize_email(email))
      where email is not null and email <> '';
  end if;
end $$;

create or replace function public.gb_block_duplicate_email()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.email is null then
    return new;
  end if;

  if exists (
    select 1 from auth.users u
    where u.id <> new.id
      and public.normalize_email(u.email) = public.normalize_email(new.email)
  ) then
    raise exception 'An account with this email already exists.' using errcode = '23505';
  end if;

  return new;
end;
$$;

drop trigger if exists gb_block_duplicate_email on auth.users;
create trigger gb_block_duplicate_email
  before insert or update of email on auth.users
  for each row execute function public.gb_block_duplicate_email();

------------------------------------------------------------------
-- 2. Gamertag locks (30 days)
------------------------------------------------------------------
alter table public.gaming_accounts add column if not exists locked_until timestamptz;
update public.gaming_accounts
  set locked_until = created_at + interval '30 days'
  where locked_until is null;

alter table public.profiles add column if not exists gamertag_locks jsonb not null default '{}'::jsonb;

create or replace function public.gb_guard_gaming_account()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_override boolean := public.gb_is_db_role()
    or (auth.uid() is not null and public.has_staff_permission('team_enforcement'));
begin
  if tg_op = 'INSERT' then
    new.account_id := trim(new.account_id);
    if exists (
      select 1 from public.gaming_accounts g
      where g.user_id <> new.user_id
        and g.platform = new.platform
        and lower(trim(g.account_id)) = lower(new.account_id)
    ) then
      raise exception 'This gaming ID is already linked to another account.';
    end if;
    new.locked_until := now() + interval '30 days';
    return new;
  end if;

  if tg_op = 'DELETE' then
    -- Cascades from deleting a user run at trigger depth > 1 and are allowed.
    if old.locked_until > now() and pg_trigger_depth() = 1 and not v_override then
      raise exception 'This gaming ID is locked to your account until %. It cannot be removed or changed before then.',
        to_char(old.locked_until, 'Mon DD, YYYY');
    end if;
    return old;
  end if;

  if new.user_id is distinct from old.user_id and not v_override then
    raise exception 'A gaming ID cannot be moved to another account.';
  end if;

  if (new.account_id, new.platform, new.category, new.game)
     is distinct from (old.account_id, old.platform, old.category, old.game) then
    if old.locked_until > now() and not v_override then
      raise exception 'This gaming ID is locked to your account until %. It cannot be removed or changed before then.',
        to_char(old.locked_until, 'Mon DD, YYYY');
    end if;
    new.account_id := trim(new.account_id);
    if exists (
      select 1 from public.gaming_accounts g
      where g.user_id <> new.user_id
        and g.platform = new.platform
        and lower(trim(g.account_id)) = lower(new.account_id)
    ) then
      raise exception 'This gaming ID is already linked to another account.';
    end if;
    new.locked_until := now() + interval '30 days';
  else
    -- Re-saving the same ID must never extend or shorten the lock.
    new.locked_until := old.locked_until;
  end if;

  return new;
end;
$$;

drop trigger if exists gaming_accounts_guard_lock on public.gaming_accounts;
create trigger gaming_accounts_guard_lock
  before insert or update or delete on public.gaming_accounts
  for each row execute function public.gb_guard_gaming_account();

------------------------------------------------------------------
-- 3. Profile columns: stats are server-controlled, legacy gamertags lock, email is fixed
------------------------------------------------------------------
create or replace function public.gb_guard_profile_columns()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_db boolean := public.gb_is_db_role();
  v_override boolean;
  v_old jsonb;
  v_new jsonb;
  v_locks jsonb;
  v_field text;
  v_o text;
  v_n text;
begin
  if tg_op = 'INSERT' then
    if not v_db then
      new.xp := 0; new.wins := 0; new.losses := 0;
      new.rating_points := 0; new.rank_points := 0;
      new.gb_wins := 0; new.gb_losses := 0; new.gb_rank_points := 0;
      new.overall_wins := 0; new.overall_losses := 0;
      new.gamertag_locks := '{}'::jsonb;
    end if;
    return new;
  end if;

  if not v_db and (
    new.xp, new.wins, new.losses, new.rating_points, new.rank_points,
    new.gb_wins, new.gb_losses, new.gb_rank_points, new.overall_wins, new.overall_losses
  ) is distinct from (
    old.xp, old.wins, old.losses, old.rating_points, old.rank_points,
    old.gb_wins, old.gb_losses, old.gb_rank_points, old.overall_wins, old.overall_losses
  ) then
    raise exception 'Player XP, rank and records can only be changed by verified match results.';
  end if;

  v_override := v_db or (auth.uid() is not null and public.has_staff_permission('team_enforcement'));

  if new.email is distinct from old.email
     and coalesce(old.email, '') <> ''
     and not v_override then
    raise exception 'Your email is locked to this account.';
  end if;

  v_old := to_jsonb(old);
  v_new := to_jsonb(new);
  v_locks := coalesce(old.gamertag_locks, '{}'::jsonb);

  foreach v_field in array array[
    'xbox_gt', 'psn_gt', 'nintendo_gt', 'pc_gt',
    'gt_xbox', 'gt_playstation', 'gt_nintendo', 'gt_pc'
  ] loop
    v_o := nullif(trim(coalesce(v_old ->> v_field, '')), '');
    v_n := nullif(trim(coalesce(v_new ->> v_field, '')), '');

    if v_o is distinct from v_n then
      if v_o is not null
         and coalesce((v_locks ->> v_field)::timestamptz, 'epoch'::timestamptz) > now()
         and not v_override then
        raise exception 'This gamertag is locked to your account until %. It cannot be changed or removed before then.',
          to_char((v_locks ->> v_field)::timestamptz, 'Mon DD, YYYY');
      end if;

      v_locks := case
        when v_n is null then v_locks - v_field
        else jsonb_set(v_locks, array[v_field], to_jsonb((now() + interval '30 days')::text))
      end;
    end if;
  end loop;

  new.gamertag_locks := v_locks;
  return new;
end;
$$;

-- Existing legacy gamertags start their 30 day lock from the profile creation date.
update public.profiles p
set gamertag_locks = coalesce((
  select jsonb_object_agg(f.field, to_jsonb((coalesce(p.created_at, now()) + interval '30 days')::text))
  from (
    select unnest(array['xbox_gt','psn_gt','nintendo_gt','pc_gt','gt_xbox','gt_playstation','gt_nintendo','gt_pc']) as field
  ) f
  where nullif(trim(coalesce(to_jsonb(p) ->> f.field, '')), '') is not null
), '{}'::jsonb)
where p.gamertag_locks = '{}'::jsonb;

drop trigger if exists profiles_guard_columns on public.profiles;
create trigger profiles_guard_columns
  before insert or update on public.profiles
  for each row execute function public.gb_guard_profile_columns();

------------------------------------------------------------------
-- 4. Team stats are server-controlled
------------------------------------------------------------------
create or replace function public.gb_guard_team_stats()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if public.gb_is_db_role() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.wins := 0; new.losses := 0; new.xp := 0; new.streak := '0'; new.rating_points := 100;
    return new;
  end if;

  if (new.wins, new.losses, new.xp, new.streak, new.rating_points)
     is distinct from (old.wins, old.losses, old.xp, old.streak, old.rating_points) then
    raise exception 'Team XP, rank and records can only be changed by verified match results.';
  end if;

  return new;
end;
$$;

drop trigger if exists teams_guard_stats on public.teams;
create trigger teams_guard_stats
  before insert or update on public.teams
  for each row execute function public.gb_guard_team_stats();

------------------------------------------------------------------
-- 5. Audit tables
------------------------------------------------------------------
create table if not exists public.xp_ledger (
  id uuid primary key default gen_random_uuid(),
  match_id uuid,
  user_id uuid,
  team_id uuid,
  xp integer not null default 0,
  rating integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists xp_ledger_user_recent on public.xp_ledger (user_id, created_at desc);
create index if not exists xp_ledger_team_recent on public.xp_ledger (team_id, created_at desc);
alter table public.xp_ledger enable row level security;
drop policy if exists xp_ledger_read on public.xp_ledger;
create policy xp_ledger_read on public.xp_ledger for select
  using (user_id = (select auth.uid()) or public.has_staff_permission('match_review'));

create table if not exists public.boost_flags (
  id uuid primary key default gen_random_uuid(),
  match_id uuid,
  winner_team_id uuid,
  loser_team_id uuid,
  reasons text[] not null default '{}',
  multiplier numeric not null default 1,
  severity text not null default 'low',
  reviewed boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists boost_flags_recent on public.boost_flags (created_at desc);
alter table public.boost_flags enable row level security;
drop policy if exists boost_flags_staff_read on public.boost_flags;
create policy boost_flags_staff_read on public.boost_flags for select
  using (public.has_staff_permission('match_review'));
drop policy if exists boost_flags_staff_update on public.boost_flags;
create policy boost_flags_staff_update on public.boost_flags for update
  using (public.has_staff_permission('match_review'))
  with check (public.has_staff_permission('match_review'));

------------------------------------------------------------------
-- 6. The single place XP / rating / records are awarded
------------------------------------------------------------------
create or replace function public.gb_award_match_result(
  p_match uuid,
  p_winner uuid,
  p_loser uuid,
  p_w_users uuid[],
  p_l_users uuid[],
  p_forfeit boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  c_profile_daily_xp constant integer := 150;
  c_team_daily_xp constant integer := 250;
  v_w uuid[] := coalesce(p_w_users, '{}');
  v_l uuid[] := coalesce(p_l_users, '{}');
  v_mult numeric := 1;
  v_reasons text[] := '{}';
  v_pair24 integer := 0;
  v_pair7 integer := 0;
  v_fwd7 integer := 0;
  v_rev7 integer := 0;
  v_total integer := 0;
  v_vs integer := 0;
  v_win_xp integer;
  v_win_rt integer;
  v_loss_xp integer;
  v_u uuid;
  v_used integer;
  v_give integer;
begin
  if p_winner is null or p_loser is null or p_winner = p_loser then
    return jsonb_build_object('ok', false, 'message', 'Invalid winner or loser.');
  end if;

  if v_w && v_l then
    v_mult := 0; v_reasons := v_reasons || 'shared_player';
  end if;

  if exists (
    select 1 from public.teams a
    join public.teams b on b.owner_id = a.owner_id
    where a.id = p_winner and b.id = p_loser and a.owner_id is not null
  ) then
    v_mult := 0; v_reasons := v_reasons || 'same_owner';
  end if;

  -- Opponent pairing between the same players over the last 7 days (any teams).
  with prior as (
    select
      coalesce(m.completed_at, m.created_at) as t,
      (coalesce(m.winning_user_ids, '{}') && v_w and coalesce(m.losing_user_ids, '{}') && v_l) as fw,
      (coalesce(m.winning_user_ids, '{}') && v_l and coalesce(m.losing_user_ids, '{}') && v_w) as rv
    from public.matches m
    where m.id <> p_match
      and coalesce(m.result_processed, false)
      and coalesce(m.completed_at, m.created_at) > now() - interval '7 days'
  )
  select
    count(*) filter (where (fw or rv) and t > now() - interval '24 hours'),
    count(*) filter (where fw or rv),
    count(*) filter (where fw),
    count(*) filter (where rv)
  into v_pair24, v_pair7, v_fwd7, v_rev7
  from prior;

  if v_pair24 = 1 then
    v_mult := least(v_mult, 0.5); v_reasons := v_reasons || 'rematch_24h';
  elsif v_pair24 >= 2 then
    v_mult := 0; v_reasons := v_reasons || 'rematch_limit_24h';
  end if;

  if v_pair7 >= 6 then
    v_mult := 0; v_reasons := v_reasons || 'pair_farming_7d';
  elsif v_pair7 >= 3 then
    v_mult := least(v_mult, 0.25); v_reasons := v_reasons || 'frequent_opponent_7d';
  end if;

  if v_fwd7 >= 2 and v_rev7 >= 2 then
    v_mult := 0; v_reasons := v_reasons || 'win_trading';
  end if;

  -- Opponent diversity: most of the winning side's recent games against this same opponent.
  with recent as (
    select case
      when coalesce(m.winning_user_ids, '{}') && v_w then coalesce(m.losing_user_ids, '{}')
      else coalesce(m.winning_user_ids, '{}')
    end as opp
    from public.matches m
    where m.id <> p_match
      and coalesce(m.result_processed, false)
      and (coalesce(m.winning_user_ids, '{}') || coalesce(m.losing_user_ids, '{}')) && v_w
      and coalesce(m.completed_at, m.created_at) > now() - interval '14 days'
    order by coalesce(m.completed_at, m.created_at) desc
    limit 10
  )
  select count(*), count(*) filter (where opp && v_l) into v_total, v_vs from recent;

  if v_total >= 5 and v_vs::numeric / v_total >= 0.6 then
    v_mult := least(v_mult, 0.25); v_reasons := v_reasons || 'low_opponent_diversity';
  end if;

  -- Two brand-new rosters playing each other is the classic alt-account farm.
  if cardinality(v_w) > 0 and cardinality(v_l) > 0
     and not exists (
       select 1 from public.profiles
       where id = any(v_w || v_l) and created_at <= now() - interval '48 hours'
     ) then
    v_mult := least(v_mult, 0.25); v_reasons := v_reasons || 'new_accounts_only';
  end if;

  if cardinality(v_reasons) > 0 then
    insert into public.boost_flags (match_id, winner_team_id, loser_team_id, reasons, multiplier, severity)
    values (
      p_match, p_winner, p_loser, v_reasons, v_mult,
      case when v_mult = 0 then 'high' when v_mult <= 0.25 then 'medium' else 'low' end
    );
  end if;

  if v_mult = 0 then
    return jsonb_build_object('ok', true, 'voided', true, 'multiplier', 0, 'reasons', v_reasons);
  end if;

  v_win_xp := round((case when p_forfeit then 15 else 25 end) * v_mult);
  v_win_rt := round(25 * v_mult);
  v_loss_xp := case when p_forfeit then 0 else round(5 * v_mult) end;

  -- Teams
  select coalesce(sum(xp), 0) into v_used
  from public.xp_ledger where team_id = p_winner and user_id is null and created_at > now() - interval '24 hours';
  v_give := greatest(0, least(v_win_xp, c_team_daily_xp - v_used));
  update public.teams
    set wins = coalesce(wins, 0) + 1, xp = coalesce(xp, 0) + v_give,
        rating_points = coalesce(rating_points, 100) + v_win_rt, streak = 'W'
    where id = p_winner;
  insert into public.xp_ledger (match_id, team_id, xp, rating) values (p_match, p_winner, v_give, v_win_rt);

  select coalesce(sum(xp), 0) into v_used
  from public.xp_ledger where team_id = p_loser and user_id is null and created_at > now() - interval '24 hours';
  v_give := greatest(0, least(v_loss_xp, c_team_daily_xp - v_used));
  update public.teams
    set losses = coalesce(losses, 0) + 1, xp = coalesce(xp, 0) + v_give,
        rating_points = greatest(0, coalesce(rating_points, 100) - 10), streak = 'L'
    where id = p_loser;
  insert into public.xp_ledger (match_id, team_id, xp, rating) values (p_match, p_loser, v_give, -10);

  -- Players
  foreach v_u in array v_w loop
    select coalesce(sum(xp), 0) into v_used
    from public.xp_ledger where user_id = v_u and created_at > now() - interval '24 hours';
    v_give := greatest(0, least(v_win_xp, c_profile_daily_xp - v_used));
    update public.profiles
      set wins = coalesce(wins, 0) + 1, gb_wins = coalesce(gb_wins, 0) + 1,
          overall_wins = coalesce(overall_wins, 0) + 1,
          xp = coalesce(xp, 0) + v_give,
          rating_points = coalesce(rating_points, 0) + v_win_rt,
          rank_points = coalesce(rank_points, 0) + v_win_rt,
          gb_rank_points = coalesce(gb_rank_points, 0) + v_win_rt
      where id = v_u;
    insert into public.xp_ledger (match_id, user_id, xp, rating) values (p_match, v_u, v_give, v_win_rt);
  end loop;

  foreach v_u in array v_l loop
    select coalesce(sum(xp), 0) into v_used
    from public.xp_ledger where user_id = v_u and created_at > now() - interval '24 hours';
    v_give := greatest(0, least(v_loss_xp, c_profile_daily_xp - v_used));
    update public.profiles
      set losses = coalesce(losses, 0) + 1, gb_losses = coalesce(gb_losses, 0) + 1,
          overall_losses = coalesce(overall_losses, 0) + 1,
          xp = coalesce(xp, 0) + v_give,
          rating_points = greatest(0, coalesce(rating_points, 0) - 10),
          rank_points = greatest(0, coalesce(rank_points, 0) - 10),
          gb_rank_points = greatest(0, coalesce(gb_rank_points, 0) - 10)
      where id = v_u;
    insert into public.xp_ledger (match_id, user_id, xp, rating) values (p_match, v_u, v_give, -10);
  end loop;

  return jsonb_build_object('ok', true, 'voided', false, 'multiplier', v_mult, 'reasons', v_reasons);
end;
$$;

revoke all on function public.gb_award_match_result(uuid, uuid, uuid, uuid[], uuid[], boolean) from public, anon, authenticated;

------------------------------------------------------------------
-- 7. Normal result path: opposing team confirms
------------------------------------------------------------------
create or replace function public.confirm_match_and_apply(match_uuid uuid, confirming_user_uuid uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  m public.matches%rowtype;
  winner uuid;
  loser uuid;
  confirmer_team uuid;
  winning_users uuid[];
  losing_users uuid[];
  award jsonb;
begin
  if auth.uid() is not null and auth.uid() is distinct from confirming_user_uuid then
    return jsonb_build_object('ok', false, 'message', 'You can only confirm a result as yourself.');
  end if;

  select * into m from public.matches where id = match_uuid for update;

  if not found then
    return jsonb_build_object('ok', false, 'message', 'Match not found.');
  end if;

  if coalesce(m.result_processed, false) then
    return jsonb_build_object('ok', true, 'message', 'Already processed.');
  end if;

  winner := m.reported_winner_team_id;
  loser := m.reported_loser_team_id;
  confirmer_team := m.confirmation_team_id;

  if winner is null or loser is null or confirmer_team is null then
    return jsonb_build_object('ok', false, 'message', 'Winner, loser, or confirming team missing.');
  end if;

  if winner = loser
     or not (winner in (m.posting_team_id, m.accepting_team_id))
     or not (loser in (m.posting_team_id, m.accepting_team_id)) then
    return jsonb_build_object('ok', false, 'message', 'The reported result does not match the teams in this match.');
  end if;

  if confirmer_team = m.reported_by_team_id
     or not (confirmer_team in (m.posting_team_id, m.accepting_team_id)) then
    return jsonb_build_object('ok', false, 'message', 'The opposing team must confirm the result.');
  end if;

  if not exists (
    select 1 from public.team_members
    where team_id = confirmer_team and user_id = confirming_user_uuid
  ) then
    return jsonb_build_object('ok', false, 'message', 'Confirming user is not on the confirming team.');
  end if;

  select coalesce(
    nullif(case when winner = m.posting_team_id then m.locked_posting_roster else m.locked_accepting_roster end, '{}'),
    (select array_agg(user_id) from public.team_members where team_id = winner),
    '{}'
  ) into winning_users;

  select coalesce(
    nullif(case when loser = m.posting_team_id then m.locked_posting_roster else m.locked_accepting_roster end, '{}'),
    (select array_agg(user_id) from public.team_members where team_id = loser),
    '{}'
  ) into losing_users;

  award := public.gb_award_match_result(match_uuid, winner, loser, winning_users, losing_users, false);

  update public.matches
  set
    winning_team_id = winner,
    losing_team_id = loser,
    status = 'completed',
    reporting_status = 'completed',
    score_confirmed_at = now(),
    score_verified = true,
    score_verified_at = now(),
    completed_at = now(),
    finalized = true,
    finalized_at = now(),
    finalized_by = confirming_user_uuid,
    rankings_applied = not coalesce((award ->> 'voided')::boolean, false),
    result_processed = true,
    ranking_change_applied_at = now(),
    winning_user_ids = winning_users,
    losing_user_ids = losing_users
  where id = match_uuid;

  return jsonb_build_object(
    'ok', true,
    'message', case
      when coalesce((award ->> 'voided')::boolean, false)
        then 'Match completed. No XP or rank was awarded because this matchup was flagged for review.'
      when coalesce((award ->> 'multiplier')::numeric, 1) < 1
        then 'Match completed. Reduced XP was awarded because of repeat-opponent limits.'
      else 'Match completed and rankings applied.'
    end
  );
end;
$$;

------------------------------------------------------------------
-- 8. Direct completion is not a way around the rules
------------------------------------------------------------------
create or replace function public.gb_apply_match_result_from_row()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  winner uuid;
  loser uuid;
  winning_users uuid[];
  losing_users uuid[];
  award jsonb;
begin
  if new.status <> 'completed' or coalesce(new.result_processed, false) then
    return new;
  end if;

  -- Only staff or the database itself may complete a match outside the confirm flow.
  if auth.uid() is not null and not public.has_staff_permission('match_review') then
    raise exception 'Match results must be reported and confirmed by the opposing team.';
  end if;

  winner := coalesce(new.winning_team_id, new.reported_winner_team_id);
  loser := coalesce(new.losing_team_id, new.reported_loser_team_id);

  if winner is null or loser is null then
    new.result_processed := true;
    return new;
  end if;

  if winner = loser
     or not (winner in (new.posting_team_id, new.accepting_team_id))
     or not (loser in (new.posting_team_id, new.accepting_team_id)) then
    raise exception 'The result does not match the teams in this match.';
  end if;

  select coalesce(
    nullif(case when winner = new.posting_team_id then new.locked_posting_roster else new.locked_accepting_roster end, '{}'),
    (select array_agg(user_id) from public.team_members where team_id = winner),
    '{}'
  ) into winning_users;

  select coalesce(
    nullif(case when loser = new.posting_team_id then new.locked_posting_roster else new.locked_accepting_roster end, '{}'),
    (select array_agg(user_id) from public.team_members where team_id = loser),
    '{}'
  ) into losing_users;

  award := public.gb_award_match_result(new.id, winner, loser, winning_users, losing_users, false);

  new.winning_team_id := winner;
  new.losing_team_id := loser;
  new.winning_user_ids := winning_users;
  new.losing_user_ids := losing_users;
  new.result_processed := true;
  new.rankings_applied := not coalesce((award ->> 'voided')::boolean, false);
  return new;
end;
$$;

-- Result columns on a match can only be written by server functions or staff.
create or replace function public.gb_guard_match_results()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if public.gb_is_db_role() or (auth.uid() is not null and public.has_staff_permission('match_review')) then
    return new;
  end if;

  if (new.result_processed, new.rankings_applied, new.finalized, new.winning_team_id,
      new.losing_team_id, new.winning_user_ids, new.losing_user_ids, new.score_verified)
     is distinct from
     (old.result_processed, old.rankings_applied, old.finalized, old.winning_team_id,
      old.losing_team_id, old.winning_user_ids, old.losing_user_ids, old.score_verified)
     or (new.status = 'completed' and old.status is distinct from 'completed') then
    raise exception 'Match results can only be finalized through score confirmation.';
  end if;

  return new;
end;
$$;

drop trigger if exists matches_guard_results on public.matches;
create trigger matches_guard_results
  before update on public.matches
  for each row execute function public.gb_guard_match_results();

-- One person cannot sit on both sides of a match.
create or replace function public.gb_block_self_play()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.posting_team_id is not null and new.posting_team_id = new.accepting_team_id then
    raise exception 'A team cannot play itself.';
  end if;

  if exists (
    select 1 from public.teams a
    join public.teams b on b.owner_id = a.owner_id
    where a.id = new.posting_team_id and b.id = new.accepting_team_id and a.owner_id is not null
  ) then
    raise exception 'You cannot play against a team owned by the same account.';
  end if;

  if coalesce(new.locked_posting_roster, '{}') && coalesce(new.locked_accepting_roster, '{}') then
    raise exception 'The same player cannot be on both teams in a match.';
  end if;

  return new;
end;
$$;

drop trigger if exists matches_block_self_play on public.matches;
create trigger matches_block_self_play
  before insert on public.matches
  for each row execute function public.gb_block_self_play();
