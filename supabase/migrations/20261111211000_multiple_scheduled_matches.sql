create function public.gb_check_team_match_schedule(p_team uuid, p_time text, p_excluded_post uuid default null)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  scheduled timestamptz := public.gb_match_scheduled_at(p_time);
begin
  if scheduled is null then raise exception 'A valid scheduled match date and time is required.'; end if;
  if exists (
    select 1 from public.match_posts p
    where p.team_id = p_team and p.status = 'open' and p.id is distinct from p_excluded_post
      and (public.gb_match_scheduled_at(p.match_time) is null
           or abs(extract(epoch from (public.gb_match_scheduled_at(p.match_time) - scheduled))) < 900)
  ) or exists (
    select 1 from public.matches m
    where (m.posting_team_id = p_team or m.accepting_team_id = p_team)
      and coalesce(lower(m.status), '') not in ('completed', 'cancelled')
      and (public.gb_match_scheduled_at(m.match_time) is null
           or abs(extract(epoch from (public.gb_match_scheduled_at(m.match_time) - scheduled))) < 900)
  ) then
    raise exception 'Your team has another match or open post within 15 minutes of this start time, or a match with an unknown time.';
  end if;
end;
$$;
revoke all on function public.gb_check_team_match_schedule(uuid, text, uuid) from public, anon, authenticated;

drop index if exists public.idx_match_posts_unique_open_ladder_time;

create or replace function public.enforce_match_post_roster()
returns trigger language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_user_id uuid;
  v_required integer;
begin
  if tg_op = 'UPDATE' then
    if old.status = 'open'
       and (new.team_id, new.platform, new.category, new.game, new.ladder,
            new.players, new.posting_roster, new.match_time)
           is distinct from
           (old.team_id, old.platform, old.category, old.game, old.ladder,
            old.players, old.posting_roster, old.match_time) then
      raise exception 'An open match post roster and settings cannot be changed.';
    end if;
    if new.status = 'open' and old.status is distinct from 'open' then
      perform pg_advisory_xact_lock(hashtextextended('match-schedule:' || new.team_id::text, 0));
      perform public.gb_check_team_match_schedule(new.team_id, new.match_time, new.id);
    end if;
    return new;
  end if;
  perform pg_advisory_xact_lock(hashtextextended('match-schedule:' || new.team_id::text, 0));
  v_required := coalesce(nullif((regexp_match(lower(coalesce(new.players, '')), '^([0-9]+)v'))[1], '')::integer, 1);
  for v_user_id in select distinct roster.user_id from unnest(new.posting_roster) roster(user_id) order by roster.user_id loop
    perform pg_advisory_xact_lock(hashtextextended(v_user_id::text, 0));
  end loop;
  if coalesce(cardinality(new.posting_roster), 0) <> v_required
     or cardinality(array(select distinct unnest(new.posting_roster))) <> v_required then
    raise exception 'Select exactly % distinct players for the match roster.', v_required;
  end if;
  if not exists (
    select 1 from public.teams where id = new.team_id and platform = new.platform
      and category = new.category and game = new.game and ladder = new.ladder
  ) then raise exception 'Match post team does not compete on the selected ladder.'; end if;
  perform public.gb_check_team_match_schedule(new.team_id, new.match_time, null);
  if exists (
    select 1 from unnest(new.posting_roster) roster(user_id)
    where not exists (select 1 from public.team_members where team_id = new.team_id and user_id = roster.user_id)
       or public.gb_gaming_account_id(roster.user_id, new.platform, new.category, new.game) is null
  ) then raise exception 'Every match player must be rostered and have a gaming ID linked to their platform.'; end if;
  return new;
end;
$$;

create or replace function public.accept_match_post(post_id uuid, accepting_team uuid, accepting_roster uuid[])
returns table(match_id uuid)
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_post public.match_posts%rowtype;
  v_team public.teams%rowtype;
  v_match_id uuid;
  v_team_id uuid;
begin
  if auth.uid() is null then raise exception 'You must be signed in to accept a match.'; end if;
  select * into v_post from public.match_posts where id = $1 for update;
  if not found or v_post.status is distinct from 'open' then raise exception 'Match post not found or no longer open.'; end if;
  select * into v_team from public.teams where id = $2;
  if not found or v_team.category is distinct from v_post.category
    or v_team.game is distinct from v_post.game or v_team.ladder is distinct from v_post.ladder
    or (v_team.platform is distinct from v_post.platform and (
      not coalesce(v_post.crossplay, false)
      or not (v_team.platform = any(public.gb_ladder_platforms(v_post.category, v_post.game, v_post.platform)))
    )) then raise exception 'Accepting team is not eligible for this match or cross-play is disabled.'; end if;
  if v_post.team_id = $2 then raise exception 'You cannot accept your own match post.'; end if;
  if v_team.owner_id is distinct from auth.uid() and not exists (
    select 1 from public.team_members where team_id = $2 and user_id = auth.uid()
      and lower(coalesce(role, '')) in ('leader', 'co-leader', 'coleader', 'co_leader', 'captain')
  ) then raise exception 'Only team leaders, co-leaders, and captains can accept matches.'; end if;
  for v_team_id in select unnest(array[v_post.team_id, $2]) order by 1 loop
    perform pg_advisory_xact_lock(hashtextextended('match-schedule:' || v_team_id::text, 0));
  end loop;
  perform public.gb_check_team_match_schedule(v_post.team_id, v_post.match_time, v_post.id);
  perform public.gb_check_team_match_schedule($2, v_post.match_time, v_post.id);
  if coalesce(cardinality($3), 0) <> cardinality(v_post.posting_roster)
    or cardinality(array(select distinct unnest($3))) <> cardinality(v_post.posting_roster) then
    raise exception 'Select the same number of players as the posting team.';
  end if;
  if exists (
    select 1 from unnest($3) roster(user_id)
    where not exists (select 1 from public.team_members where team_id = $2 and user_id = roster.user_id)
      or public.gb_gaming_account_id(roster.user_id, v_team.platform, v_post.category, v_post.game) is null
  ) then raise exception 'Every selected player must be rostered and have a gaming ID linked to their platform.'; end if;
  update public.match_posts set status = 'accepted' where id = v_post.id and status = 'open';
  if not found then raise exception 'Match post is no longer open.'; end if;
  insert into public.matches (
    match_post_id, posting_team_id, accepting_team_id, platform, category, game, ladder,
    game_mode, players, match_time, best_of, preset, crossplay, perks, launchers, killstreaks, field_upgrades,
    hardcore, friendly_fire, radar, spectating, third_person, round_length, score_limit, health,
    respawn_delay, bomb_timer, plant_time, defuse_time, attachments,
    locked_posting_roster, locked_accepting_roster, status, accepted_at
  ) values (
    v_post.id, v_post.team_id, $2, v_post.platform, v_post.category, v_post.game, v_post.ladder,
    v_post.game_mode, v_post.players, v_post.match_time, v_post.best_of, v_post.preset,
    case when v_post.crossplay then 'On' else 'Off' end,
    v_post.perks, v_post.launchers, v_post.killstreaks, v_post.field_upgrades,
    v_post.hardcore, v_post.friendly_fire, v_post.radar, v_post.spectating, v_post.third_person,
    v_post.round_length, v_post.score_limit, v_post.health, v_post.respawn_delay, v_post.bomb_timer,
    v_post.plant_time, v_post.defuse_time, v_post.attachments,
    v_post.posting_roster, $3, 'upcoming', now()
  ) returning id into v_match_id;
  return query select v_match_id;
end;
$$;

notify pgrst, 'reload schema';
