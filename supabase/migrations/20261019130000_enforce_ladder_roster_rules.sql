alter table public.matches
  add column if not exists locked_posting_roster uuid[],
  add column if not exists locked_accepting_roster uuid[];

update public.matches as match
set
  locked_posting_roster = coalesce((
    select array_agg(team_members.user_id order by team_members.user_id)
    from public.team_members
    where team_members.team_id = match.posting_team_id
  ), '{}'::uuid[]),
  locked_accepting_roster = coalesce((
    select array_agg(team_members.user_id order by team_members.user_id)
    from public.team_members
    where team_members.team_id = match.accepting_team_id
  ), '{}'::uuid[])
where coalesce(lower(match.status), '') not in ('completed', 'cancelled')
  and (match.locked_posting_roster is null or match.locked_accepting_roster is null);

create or replace function public.enforce_team_member_roster_rules()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid;
  v_previous_team_id uuid;
  v_team public.teams%rowtype;
begin
  if tg_op = 'DELETE' then
    if exists (
      select 1
      from public.matches
      where (posting_team_id = old.team_id or accepting_team_id = old.team_id)
        and coalesce(lower(status), '') not in ('completed', 'cancelled')
    ) then
      raise exception 'Roster is locked by an active or pending match.';
    end if;

    return old;
  end if;

  if tg_op = 'UPDATE'
     and old.team_id = new.team_id
     and old.user_id = new.user_id then
    return new;
  end if;

  if tg_op = 'UPDATE' then
    v_previous_team_id := old.team_id;

    if exists (
      select 1
      from public.matches
      where (posting_team_id = old.team_id or accepting_team_id = old.team_id)
        and coalesce(lower(status), '') not in ('completed', 'cancelled')
    ) then
      raise exception 'Roster is locked by an active or pending match.';
    end if;

    for v_user_id in
      select distinct users.user_id
      from (values (old.user_id), (new.user_id)) as users(user_id)
      where users.user_id is not null
      order by users.user_id
    loop
      perform pg_advisory_xact_lock(hashtextextended(v_user_id::text, 0));
    end loop;
  else
    perform pg_advisory_xact_lock(hashtextextended(new.user_id::text, 0));
  end if;

  if exists (
    select 1
    from public.matches
    where (posting_team_id = new.team_id or accepting_team_id = new.team_id)
      and coalesce(lower(status), '') not in ('completed', 'cancelled')
  ) then
    raise exception 'Roster is locked by an active or pending match.';
  end if;

  select * into v_team
  from public.teams
  where id = new.team_id;

  if not found then
    return new;
  end if;

  if exists (
    select 1
    from public.team_members as member
    join public.teams as competing_team on competing_team.id = member.team_id
    where member.user_id = new.user_id
      and member.team_id <> new.team_id
      and (v_previous_team_id is null or member.team_id <> v_previous_team_id)
      and competing_team.platform is not distinct from v_team.platform
      and competing_team.category is not distinct from v_team.category
      and competing_team.game is not distinct from v_team.game
      and competing_team.ladder is not distinct from v_team.ladder
  ) or exists (
    select 1
    from public.teams as competing_team
    where competing_team.id <> new.team_id
      and competing_team.owner_id = new.user_id
      and competing_team.platform is not distinct from v_team.platform
      and competing_team.category is not distinct from v_team.category
      and competing_team.game is not distinct from v_team.game
      and competing_team.ladder is not distinct from v_team.ladder
  ) then
    raise exception 'Player is already on a team competing on this ladder.';
  end if;

  return new;
end;
$$;

drop trigger if exists team_members_enforce_roster_rules on public.team_members;
create trigger team_members_enforce_roster_rules
before insert or update or delete on public.team_members
for each row
execute function public.enforce_team_member_roster_rules();

create or replace function public.enforce_team_ladder_roster_rules()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid;
  v_team_id uuid;
  v_previous_owner_id uuid;
begin
  if tg_op = 'UPDATE' then
    if (new.owner_id, new.platform, new.category, new.game, new.ladder)
       is not distinct from
       (old.owner_id, old.platform, old.category, old.game, old.ladder) then
      return new;
    end if;

    v_team_id := old.id;
    v_previous_owner_id := old.owner_id;

    if exists (
      select 1
      from public.matches
      where (posting_team_id = old.id or accepting_team_id = old.id)
        and coalesce(lower(status), '') not in ('completed', 'cancelled')
    ) then
      raise exception 'Team roster and ladder cannot change during an active or pending match.';
    end if;
  else
    v_team_id := new.id;
  end if;

  for v_user_id in
    select distinct players.user_id
    from (
      select user_id
      from public.team_members
      where team_id = v_team_id
      union
      select new.owner_id
      where new.owner_id is not null
      union all
      select v_previous_owner_id
      where v_previous_owner_id is not null
    ) as players
    order by players.user_id
  loop
    perform pg_advisory_xact_lock(hashtextextended(v_user_id::text, 0));
  end loop;

  if exists (
    select 1
    from (
      select user_id
      from public.team_members
      where team_id = v_team_id
      union
      select new.owner_id
      where new.owner_id is not null
    ) as roster
    join public.teams as competing_team
      on competing_team.id <> v_team_id
     and competing_team.platform is not distinct from new.platform
     and competing_team.category is not distinct from new.category
     and competing_team.game is not distinct from new.game
     and competing_team.ladder is not distinct from new.ladder
    where exists (
      select 1
      from public.team_members as competing_member
      where competing_member.team_id = competing_team.id
        and competing_member.user_id = roster.user_id
    ) or competing_team.owner_id = roster.user_id
  ) then
    raise exception 'Player is already on a team competing on this ladder.';
  end if;

  return new;
end;
$$;

drop trigger if exists teams_enforce_ladder_roster_rules on public.teams;
create trigger teams_enforce_ladder_roster_rules
before insert or update of owner_id, platform, category, game, ladder on public.teams
for each row
execute function public.enforce_team_ladder_roster_rules();

create or replace function public.capture_match_rosters()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid;
begin
  for v_user_id in
    select distinct team_members.user_id
    from public.team_members
    where team_members.team_id in (new.posting_team_id, new.accepting_team_id)
    order by team_members.user_id
  loop
    perform pg_advisory_xact_lock(hashtextextended(v_user_id::text, 0));
  end loop;

  new.locked_posting_roster := coalesce((
    select array_agg(team_members.user_id order by team_members.user_id)
    from public.team_members
    where team_members.team_id = new.posting_team_id
  ), '{}'::uuid[]);

  new.locked_accepting_roster := coalesce((
    select array_agg(team_members.user_id order by team_members.user_id)
    from public.team_members
    where team_members.team_id = new.accepting_team_id
  ), '{}'::uuid[]);

  return new;
end;
$$;

drop trigger if exists matches_capture_rosters on public.matches;
create trigger matches_capture_rosters
before insert on public.matches
for each row
execute function public.capture_match_rosters();

create or replace function public.prevent_match_roster_rewrites()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if (new.posting_team_id, new.accepting_team_id,
      new.locked_posting_roster, new.locked_accepting_roster)
     is distinct from
     (old.posting_team_id, old.accepting_team_id,
      old.locked_posting_roster, old.locked_accepting_roster) then
    raise exception 'Accepted match rosters cannot be changed.';
  end if;

  return new;
end;
$$;

drop trigger if exists matches_prevent_roster_rewrites on public.matches;
create trigger matches_prevent_roster_rewrites
before update of posting_team_id, accepting_team_id,
  locked_posting_roster, locked_accepting_roster on public.matches
for each row
execute function public.prevent_match_roster_rewrites();

drop function if exists public.accept_match_post(uuid, uuid);

create function public.accept_match_post(
  post_id uuid,
  accepting_team uuid
)
returns table(match_id uuid)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_post public.match_posts%rowtype;
  v_accepting_team public.teams%rowtype;
  v_match_id uuid;
begin
  if auth.uid() is null then
    raise exception 'You must be signed in to accept a match.';
  end if;

  select * into v_post
  from public.match_posts
  where id = $1
  for update;

  if not found then
    raise exception 'Match post not found.';
  end if;

  if v_post.status is distinct from 'open' then
    raise exception 'Match post is no longer open.';
  end if;

  if v_post.team_id = $2 then
    raise exception 'You cannot accept your own match post.';
  end if;

  select * into v_accepting_team
  from public.teams
  where id = $2;

  if not found then
    raise exception 'Accepting team not found.';
  end if;

  if v_accepting_team.platform is distinct from v_post.platform
     or v_accepting_team.category is distinct from v_post.category
     or v_accepting_team.game is distinct from v_post.game
     or v_accepting_team.ladder is distinct from v_post.ladder then
    raise exception 'Accepting team is not on the match post ladder.';
  end if;

  if v_accepting_team.owner_id is distinct from auth.uid()
     and not exists (
       select 1
       from public.team_members
       where team_id = $2
         and user_id = auth.uid()
         and lower(coalesce(role, '')) in (
           'leader', 'co-leader', 'coleader', 'co_leader', 'captain'
         )
     ) then
    raise exception 'Only team leaders, co-leaders, and captains can accept matches.';
  end if;

  update public.match_posts
  set status = 'accepted'
  where id = v_post.id
    and status = 'open';

  if not found then
    raise exception 'Match post is no longer open.';
  end if;

  insert into public.matches (
    match_post_id, posting_team_id, accepting_team_id,
    platform, category, game, ladder,
    game_mode, players, match_time, best_of,
    preset, perks, launchers, killstreaks, field_upgrades,
    hardcore, friendly_fire, radar, spectating, third_person,
    round_length, score_limit, health, respawn_delay, bomb_timer,
    plant_time, defuse_time, attachments,
    status, accepted_at
  ) values (
    v_post.id, v_post.team_id, $2,
    v_post.platform, v_post.category, v_post.game, v_post.ladder,
    v_post.game_mode, v_post.players, v_post.match_time, v_post.best_of,
    v_post.preset, v_post.perks, v_post.launchers, v_post.killstreaks, v_post.field_upgrades,
    v_post.hardcore, v_post.friendly_fire, v_post.radar, v_post.spectating, v_post.third_person,
    v_post.round_length, v_post.score_limit, v_post.health, v_post.respawn_delay, v_post.bomb_timer,
    v_post.plant_time, v_post.defuse_time, v_post.attachments,
    'upcoming', now()
  )
  returning id into v_match_id;

  return query select v_match_id;
end;
$$;

revoke all on function public.accept_match_post(uuid, uuid) from public, anon;
grant execute on function public.accept_match_post(uuid, uuid) to authenticated;

notify pgrst, 'reload schema';
