create table if not exists public.gaming_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  platform text not null check (platform in ('xbox', 'playstation', 'nintendo', 'pc')),
  category text not null,
  game text not null,
  account_id text not null check (length(trim(account_id)) between 1 and 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, platform, category, game)
);

create index if not exists idx_gaming_accounts_game_platform
  on public.gaming_accounts(platform, category, game);

alter table public.gaming_accounts enable row level security;

drop policy if exists gaming_accounts_public_read on public.gaming_accounts;
create policy gaming_accounts_public_read
  on public.gaming_accounts for select
  to anon, authenticated
  using (true);

drop policy if exists gaming_accounts_manage_own on public.gaming_accounts;
create policy gaming_accounts_manage_own
  on public.gaming_accounts for all
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

revoke all on public.gaming_accounts from anon, authenticated;
grant select on public.gaming_accounts to anon, authenticated;
grant insert, update, delete on public.gaming_accounts to authenticated;

alter table public.match_posts
  add column if not exists posting_roster uuid[] not null default '{}';

-- Existing open posts have no verified participants or game-specific IDs, so they must be reposted.
update public.match_posts
set status = 'expired'
where status = 'open';

create index if not exists idx_matches_locked_posting_roster
  on public.matches using gin(locked_posting_roster);
create index if not exists idx_matches_locked_accepting_roster
  on public.matches using gin(locked_accepting_roster);
create index if not exists idx_match_posts_posting_roster
  on public.match_posts using gin(posting_roster);

create table if not exists public.match_participants (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  team_id uuid not null,
  team_name_at_match text not null,
  user_id uuid not null references public.profiles(id),
  username_at_match text not null,
  platform text not null,
  category text not null,
  game text not null,
  account_id_at_match text,
  created_at timestamptz not null default now(),
  unique (match_id, user_id)
);

create index if not exists idx_match_participants_user_history
  on public.match_participants(user_id, created_at desc);

alter table public.match_participants enable row level security;

drop policy if exists match_participants_public_read on public.match_participants;
create policy match_participants_public_read
  on public.match_participants for select
  to anon, authenticated
  using (true);

revoke all on public.match_participants from anon, authenticated;
grant select on public.match_participants to anon, authenticated;

create or replace function public.enforce_gaming_account_commitments()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'UPDATE' then
    perform pg_advisory_xact_lock(hashtextextended(old.user_id::text, 0));
  else
    perform pg_advisory_xact_lock(hashtextextended(new.user_id::text, 0));
  end if;

  if tg_op <> 'INSERT' and (exists (
    select 1
    from public.match_posts
    where status = 'open'
      and posting_roster @> array[old.user_id]
      and platform = old.platform
      and category = old.category
      and game = old.game
  ) or exists (
    select 1
    from public.matches
    join public.match_participants
      on match_participants.match_id = matches.id
    where match_participants.user_id = old.user_id
      and matches.platform = old.platform
      and matches.category = old.category
      and matches.game = old.game
      and coalesce(lower(matches.status), '') not in ('completed', 'cancelled')
  ) or exists (
    select 1
    from public.matches
    where (old.user_id = any(coalesce(locked_posting_roster, '{}'))
        or old.user_id = any(coalesce(locked_accepting_roster, '{}')))
      and matches.platform = old.platform
      and matches.category = old.category
      and matches.game = old.game
      and coalesce(lower(matches.status), '') not in ('completed', 'cancelled')
  )) then
    raise exception 'Gaming ID is locked by an open or active match commitment.';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists gaming_accounts_enforce_commitments on public.gaming_accounts;
create trigger gaming_accounts_enforce_commitments
before insert or update or delete on public.gaming_accounts
for each row
execute function public.enforce_gaming_account_commitments();

create or replace function public.enforce_team_member_roster_rules()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid;
  v_previous_team_id uuid;
  v_team public.teams%rowtype;
begin
  if tg_op = 'DELETE' then
    perform 1 from public.teams where id = old.team_id for update;
    perform pg_advisory_xact_lock(hashtextextended(old.user_id::text, 0));

    if exists (
      select 1 from public.matches
      where (posting_team_id = old.team_id or accepting_team_id = old.team_id)
        and coalesce(lower(status), '') not in ('completed', 'cancelled')
    ) or exists (
      select 1 from public.match_posts
      where team_id = old.team_id and status = 'open'
    ) then
      raise exception 'Roster is locked by an active or pending match commitment.';
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
    perform id
    from public.teams
    where id in (old.team_id, new.team_id)
    order by id
    for update;

    for v_user_id in
      select distinct users.user_id
      from (values (old.user_id), (new.user_id)) as users(user_id)
      where users.user_id is not null
      order by users.user_id
    loop
      perform pg_advisory_xact_lock(hashtextextended(v_user_id::text, 0));
    end loop;

    if exists (
      select 1 from public.matches
      where (posting_team_id = old.team_id or accepting_team_id = old.team_id)
        and coalesce(lower(status), '') not in ('completed', 'cancelled')
    ) or exists (
      select 1 from public.match_posts
      where team_id = old.team_id and status = 'open'
    ) then
      raise exception 'Roster is locked by an active or pending match commitment.';
    end if;
  else
    perform 1 from public.teams where id = new.team_id for update;
    perform pg_advisory_xact_lock(hashtextextended(new.user_id::text, 0));
  end if;

  if exists (
    select 1 from public.matches
    where (posting_team_id = new.team_id or accepting_team_id = new.team_id)
      and coalesce(lower(status), '') not in ('completed', 'cancelled')
  ) or exists (
    select 1 from public.match_posts
    where team_id = new.team_id and status = 'open'
  ) then
    raise exception 'Roster is locked by an active or pending match commitment.';
  end if;

  select * into v_team from public.teams where id = new.team_id;
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
    select 1 from public.teams as competing_team
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

create or replace function public.enforce_team_ladder_roster_rules()
returns trigger
language plpgsql
security definer
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

  else
    v_team_id := new.id;
  end if;

  for v_user_id in
    select distinct players.user_id
    from (
      select user_id from public.team_members where team_id = v_team_id
      union
      select new.owner_id where new.owner_id is not null
      union all
      select v_previous_owner_id where v_previous_owner_id is not null
    ) as players
    order by players.user_id
  loop
    perform pg_advisory_xact_lock(hashtextextended(v_user_id::text, 0));
  end loop;

  if tg_op = 'UPDATE' and (
    exists (
      select 1 from public.matches
      where (posting_team_id = old.id or accepting_team_id = old.id)
        and coalesce(lower(status), '') not in ('completed', 'cancelled')
    ) or exists (
      select 1 from public.match_posts
      where team_id = old.id and status = 'open'
    )
  ) then
    raise exception 'Team roster is locked by an active or pending match commitment.';
  end if;

  if exists (
    select 1
    from (
      select user_id from public.team_members where team_id = v_team_id
      union
      select new.owner_id where new.owner_id is not null
    ) as roster
    join public.teams as competing_team
      on competing_team.id <> v_team_id
     and competing_team.platform is not distinct from new.platform
     and competing_team.category is not distinct from new.category
     and competing_team.game is not distinct from new.game
     and competing_team.ladder is not distinct from new.ladder
    where exists (
      select 1 from public.team_members as competing_member
      where competing_member.team_id = competing_team.id
        and competing_member.user_id = roster.user_id
    ) or competing_team.owner_id = roster.user_id
  ) then
    raise exception 'Player is already on a team competing on this ladder.';
  end if;

  return new;
end;
$$;

create or replace function public.enforce_match_post_roster()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid;
  v_required integer;
begin
  if tg_op = 'UPDATE' then
    if old.status = 'open'
       and (new.team_id, new.platform, new.category, new.game, new.ladder,
            new.players, new.posting_roster)
           is distinct from
           (old.team_id, old.platform, old.category, old.game, old.ladder,
            old.players, old.posting_roster) then
      raise exception 'An open match post roster and settings cannot be changed.';
    end if;

    return new;
  end if;

  v_required := coalesce(
    nullif((regexp_match(lower(coalesce(new.players, '')), '^([0-9]+)v'))[1], '')::integer,
    1
  );

  for v_user_id in
    select distinct roster.user_id
    from unnest(new.posting_roster) as roster(user_id)
    order by roster.user_id
  loop
    perform pg_advisory_xact_lock(hashtextextended(v_user_id::text, 0));
  end loop;

  if coalesce(cardinality(new.posting_roster), 0) <> v_required
     or cardinality(array(select distinct unnest(new.posting_roster))) <> v_required then
    raise exception 'Select exactly % distinct players for the match roster.', v_required;
  end if;

  if not exists (
    select 1 from public.teams
    where id = new.team_id
      and platform = new.platform
      and category = new.category
      and game = new.game
      and ladder = new.ladder
  ) then
    raise exception 'Match post team does not compete on the selected ladder.';
  end if;

  if exists (
    select 1
    from public.match_posts
    where team_id = new.team_id and status = 'open'
  ) or exists (
    select 1
    from public.matches
    where (posting_team_id = new.team_id or accepting_team_id = new.team_id)
      and coalesce(lower(status), '') not in ('completed', 'cancelled')
  ) then
    raise exception 'This team already has an open or active match commitment.';
  end if;

  if exists (
    select 1 from unnest(new.posting_roster) as roster(user_id)
    where not exists (
      select 1 from public.team_members
      where team_id = new.team_id and user_id = roster.user_id
    ) or not exists (
      select 1 from public.gaming_accounts
      where user_id = roster.user_id
        and platform = new.platform
        and category = new.category
        and game = new.game
    )
  ) then
    raise exception 'Every match player must be rostered and have a saved gaming ID for this game and platform.';
  end if;

  return new;
end;
$$;

drop trigger if exists match_posts_enforce_roster on public.match_posts;
create trigger match_posts_enforce_roster
before insert or update on public.match_posts
for each row
execute function public.enforce_match_post_roster();

create or replace function public.capture_match_rosters()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid;
  v_required integer;
begin
  if tg_op = 'UPDATE' then
    if (new.locked_posting_roster, new.locked_accepting_roster)
       is distinct from
       (old.locked_posting_roster, old.locked_accepting_roster) then
      raise exception 'Accepted match rosters cannot be changed.';
    end if;

    return new;
  end if;

  v_required := coalesce(
    nullif((regexp_match(lower(coalesce(new.players, '')), '^([0-9]+)v'))[1], '')::integer,
    1
  );

  if coalesce(cardinality(new.locked_posting_roster), 0) <> v_required
     or coalesce(cardinality(new.locked_accepting_roster), 0) <> v_required
     or cardinality(array(select distinct unnest(new.locked_posting_roster))) <> v_required
     or cardinality(array(select distinct unnest(new.locked_accepting_roster))) <> v_required then
    raise exception 'Both teams must submit exactly % distinct match participants.', v_required;
  end if;

  for v_user_id in
    select distinct roster.user_id
    from (
      select unnest(new.locked_posting_roster) as user_id
      union
      select unnest(new.locked_accepting_roster) as user_id
    ) as roster
    order by roster.user_id
  loop
    perform pg_advisory_xact_lock(hashtextextended(v_user_id::text, 0));
  end loop;

  if exists (
    select 1
    from unnest(new.locked_posting_roster) as roster(user_id)
    where not exists (
      select 1 from public.team_members
      where team_id = new.posting_team_id and user_id = roster.user_id
    ) or not exists (
      select 1 from public.gaming_accounts
      where user_id = roster.user_id
        and platform = new.platform
        and category = new.category
        and game = new.game
    )
  ) or exists (
    select 1
    from unnest(new.locked_accepting_roster) as roster(user_id)
    where not exists (
      select 1 from public.team_members
      where team_id = new.accepting_team_id and user_id = roster.user_id
    ) or not exists (
      select 1 from public.gaming_accounts
      where user_id = roster.user_id
        and platform = new.platform
        and category = new.category
        and game = new.game
    )
  ) then
    raise exception 'Every match player must be rostered and have a saved gaming ID for this game and platform.';
  end if;

  return new;
end;
$$;

create or replace function public.capture_match_participants()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.match_participants (
    match_id, team_id, team_name_at_match, user_id, username_at_match,
    platform, category, game, account_id_at_match
  )
  select new.id, new.posting_team_id, coalesce(teams.name, 'Team'), roster.user_id, coalesce(profiles.username, 'Player'),
         new.platform, new.category, new.game, accounts.account_id
  from unnest(new.locked_posting_roster) as roster(user_id)
  join public.teams on teams.id = new.posting_team_id
  join public.profiles on profiles.id = roster.user_id
  join public.gaming_accounts as accounts
    on accounts.user_id = roster.user_id
   and accounts.platform = new.platform
   and accounts.category = new.category
   and accounts.game = new.game
  union all
  select new.id, new.accepting_team_id, coalesce(teams.name, 'Team'), roster.user_id, coalesce(profiles.username, 'Player'),
         new.platform, new.category, new.game, accounts.account_id
  from unnest(new.locked_accepting_roster) as roster(user_id)
  join public.teams on teams.id = new.accepting_team_id
  join public.profiles on profiles.id = roster.user_id
  join public.gaming_accounts as accounts
    on accounts.user_id = roster.user_id
   and accounts.platform = new.platform
   and accounts.category = new.category
   and accounts.game = new.game;

  return new;
end;
$$;

drop trigger if exists matches_capture_participants on public.matches;
create trigger matches_capture_participants
after insert on public.matches
for each row
execute function public.capture_match_participants();

create or replace function public.accept_match_post(
  post_id uuid,
  accepting_team uuid,
  accepting_roster uuid[]
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

  if not found or v_post.status is distinct from 'open' then
    raise exception 'Match post not found or no longer open.';
  end if;

  select * into v_accepting_team
  from public.teams
  where id = $2;

  if not found
     or v_accepting_team.platform is distinct from v_post.platform
     or v_accepting_team.category is distinct from v_post.category
     or v_accepting_team.game is distinct from v_post.game
     or v_accepting_team.ladder is distinct from v_post.ladder then
    raise exception 'Accepting team is not on the match post ladder.';
  end if;

  if v_post.team_id = $2 then
    raise exception 'You cannot accept your own match post.';
  end if;

  if exists (
    select 1 from public.match_posts
    where team_id = $2 and status = 'open' and id <> v_post.id
  ) or exists (
    select 1 from public.matches
    where (posting_team_id = $2 or accepting_team_id = $2)
      and coalesce(lower(status), '') not in ('completed', 'cancelled')
  ) then
    raise exception 'This team already has an open or active match commitment.';
  end if;

  if v_accepting_team.owner_id is distinct from auth.uid()
     and not exists (
       select 1 from public.team_members
       where team_id = $2
         and user_id = auth.uid()
         and lower(coalesce(role, '')) in (
           'leader', 'co-leader', 'coleader', 'co_leader', 'captain'
         )
     ) then
    raise exception 'Only team leaders, co-leaders, and captains can accept matches.';
  end if;

  if coalesce(cardinality($3), 0) <> cardinality(v_post.posting_roster)
     or cardinality(array(select distinct unnest($3))) <> cardinality(v_post.posting_roster) then
    raise exception 'Select the same number of players as the posting team.';
  end if;

  if exists (
    select 1 from unnest($3) as roster(user_id)
    where not exists (
      select 1 from public.team_members
      where team_id = $2 and user_id = roster.user_id
    ) or not exists (
      select 1 from public.gaming_accounts
      where user_id = roster.user_id
        and platform = v_post.platform
        and category = v_post.category
        and game = v_post.game
    )
  ) then
    raise exception 'Every selected player must be rostered and have a saved gaming ID for this game and platform.';
  end if;

  update public.match_posts set status = 'accepted'
  where id = v_post.id and status = 'open';

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
    locked_posting_roster, locked_accepting_roster,
    status, accepted_at
  ) values (
    v_post.id, v_post.team_id, $2,
    v_post.platform, v_post.category, v_post.game, v_post.ladder,
    v_post.game_mode, v_post.players, v_post.match_time, v_post.best_of,
    v_post.preset, v_post.perks, v_post.launchers, v_post.killstreaks, v_post.field_upgrades,
    v_post.hardcore, v_post.friendly_fire, v_post.radar, v_post.spectating, v_post.third_person,
    v_post.round_length, v_post.score_limit, v_post.health, v_post.respawn_delay, v_post.bomb_timer,
    v_post.plant_time, v_post.defuse_time, v_post.attachments,
    v_post.posting_roster, $3,
    'upcoming', now()
  )
  returning id into v_match_id;

  return query select v_match_id;
end;
$$;

drop function if exists public.accept_match_post(uuid, uuid);
revoke all on function public.accept_match_post(uuid, uuid, uuid[]) from public, anon;
grant execute on function public.accept_match_post(uuid, uuid, uuid[]) to authenticated;

notify pgrst, 'reload schema';
