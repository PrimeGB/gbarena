create table if not exists public.staff_assignments (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  position text not null check (length(trim(position)) between 2 and 60),
  duties text not null check (length(trim(duties)) between 5 and 400),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.staff_access_grants (
  user_id uuid not null references public.profiles(id) on delete cascade,
  permission_key text not null check (
    permission_key in ('match_review', 'forum_moderation', 'awards', 'staff_directory')
  ),
  created_at timestamptz not null default now(),
  primary key (user_id, permission_key)
);

create table if not exists public.staff_match_review_decisions (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null unique references public.matches(id) on delete restrict,
  ticket_id text,
  referee_id uuid not null references public.profiles(id),
  previous_posting_score integer,
  previous_accepting_score integer,
  official_posting_score integer not null,
  official_accepting_score integer not null,
  decision_note text not null check (length(trim(decision_note)) between 10 and 1000),
  created_at timestamptz not null default now()
);

alter table public.staff_assignments enable row level security;
alter table public.staff_access_grants enable row level security;
alter table public.staff_match_review_decisions enable row level security;

create or replace function public.has_staff_permission(permission_key text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    exists (
      select 1
      from public.profiles
      where id = (select auth.uid())
        and role = 'owner'
    )
    or exists (
      select 1
      from public.staff_access_grants
      join public.profiles
        on profiles.id = staff_access_grants.user_id
      where user_id = (select auth.uid())
        and profiles.role = 'staff'
        and staff_access_grants.permission_key = $1
    );
$$;

revoke all on function public.has_staff_permission(text) from public, anon;
grant execute on function public.has_staff_permission(text) to authenticated;

revoke all on public.staff_match_review_decisions from anon, authenticated;
grant select on public.staff_match_review_decisions to authenticated;

drop policy if exists staff_match_review_decisions_read on public.staff_match_review_decisions;
create policy staff_match_review_decisions_read
  on public.staff_match_review_decisions for select
  to authenticated
  using (public.has_staff_permission('match_review'));

create or replace function public.staff_finalize_disputed_match(
  match_uuid uuid,
  posting_score integer,
  accepting_score integer,
  decision_note text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  match_row public.matches%rowtype;
  required_wins integer;
  best_of_number integer;
  winner_team_id uuid;
  loser_team_id uuid;
  posting_users uuid[];
  accepting_users uuid[];
  winner_users uuid[];
  loser_users uuid[];
  all_users uuid[];
  review_ticket_id text;
  updated_team_count integer;
begin
  if auth.uid() is null
    or not public.has_staff_permission('match_review') then
    raise exception 'You do not have permission to finalize match results';
  end if;

  if posting_score is null or accepting_score is null then
    raise exception 'Enter both teams'' official scores';
  end if;

  if length(trim(coalesce(decision_note, ''))) not between 10 and 1000 then
    raise exception 'Enter a decision reason between 10 and 1000 characters';
  end if;

  select *
    into match_row
    from public.matches
    where id = match_uuid
    for update;

  if not found then
    raise exception 'Match not found';
  end if;

  if lower(coalesce(match_row.status, '')) <> 'disputed'
    or lower(coalesce(match_row.reporting_status, '')) <> 'disputed' then
    raise exception 'Only disputed matches can be finalized here';
  end if;

  if coalesce(match_row.finalized, false)
    or coalesce(match_row.rankings_applied, false)
    or coalesce(match_row.result_processed, false)
    or exists (
      select 1
      from public.staff_match_review_decisions
      where staff_match_review_decisions.match_id = match_uuid
    ) then
    raise exception 'This match result has already been finalized or processed';
  end if;

  if match_row.posting_team_id is null
    or match_row.accepting_team_id is null
    or match_row.posting_team_id = match_row.accepting_team_id then
    raise exception 'The match teams could not be verified';
  end if;

  best_of_number := coalesce(
    nullif((regexp_match(coalesce(match_row.best_of, ''), '[0-9]+'))[1], '')::integer,
    3
  );
  required_wins := case
    when best_of_number = 7 then 4
    when best_of_number = 5 then 3
    else 2
  end;
  if best_of_number not in (3, 5, 7) then
    raise exception 'This match has an unsupported best-of format';
  end if;

  if posting_score < 0
    or accepting_score < 0
    or greatest(posting_score, accepting_score) <> required_wins
    or least(posting_score, accepting_score) >= required_wins then
    raise exception 'The official score is not valid for this best-of series';
  end if;

  if posting_score > accepting_score then
    winner_team_id := match_row.posting_team_id;
    loser_team_id := match_row.accepting_team_id;
  else
    winner_team_id := match_row.accepting_team_id;
    loser_team_id := match_row.posting_team_id;
  end if;

  select array_agg(match_participants.user_id order by match_participants.user_id)
    into posting_users
    from public.match_participants
    where match_participants.match_id = match_uuid
      and match_participants.team_id = match_row.posting_team_id;

  select array_agg(match_participants.user_id order by match_participants.user_id)
    into accepting_users
    from public.match_participants
    where match_participants.match_id = match_uuid
      and match_participants.team_id = match_row.accepting_team_id;

  if coalesce(cardinality(posting_users), 0) = 0 then
    posting_users := coalesce(match_row.locked_posting_roster, '{}'::uuid[]);
  end if;
  if coalesce(cardinality(accepting_users), 0) = 0 then
    accepting_users := coalesce(match_row.locked_accepting_roster, '{}'::uuid[]);
  end if;

  if coalesce(cardinality(posting_users), 0) = 0
    or coalesce(cardinality(accepting_users), 0) = 0 then
    raise exception 'A verified match roster is unavailable; the result was not changed';
  end if;

  if exists (
    select 1
    from unnest(posting_users) as posting(user_id)
    join unnest(accepting_users) as accepting(user_id)
      on accepting.user_id = posting.user_id
  ) then
    raise exception 'The match rosters overlap; the result was not changed';
  end if;

  if auth.uid() = any(posting_users)
    or auth.uid() = any(accepting_users)
    or exists (
      select 1
      from public.teams
      where id in (match_row.posting_team_id, match_row.accepting_team_id)
        and owner_id = auth.uid()
    ) then
    raise exception 'You cannot finalize a match involving your team or roster';
  end if;

  if winner_team_id = match_row.posting_team_id then
    winner_users := posting_users;
    loser_users := accepting_users;
  else
    winner_users := accepting_users;
    loser_users := posting_users;
  end if;

  select array_agg(distinct roster.user_id order by roster.user_id)
    into all_users
    from unnest(winner_users || loser_users) as roster(user_id);

  select id::text
    into review_ticket_id
    from public.dispute_tickets
    where dispute_tickets.match_id = match_uuid
      and lower(coalesce(dispute_tickets.status, 'open')) = 'open'
    order by id
    limit 1;

  update public.teams
    set wins = coalesce(wins, 0) + case when id = winner_team_id then 1 else 0 end,
        losses = coalesce(losses, 0) + case when id = loser_team_id then 1 else 0 end,
        streak = case when id = winner_team_id then coalesce(streak, 0) + 1 else -1 end,
        xp = coalesce(xp, 0) + case when id = winner_team_id then 25 else 5 end,
        rating_points = case
          when id = winner_team_id then coalesce(rating_points, 0) + 25
          else greatest(0, coalesce(rating_points, 0) - 10)
        end
    where id in (match_row.posting_team_id, match_row.accepting_team_id);

  get diagnostics updated_team_count = row_count;
  if updated_team_count <> 2 then
    raise exception 'Both match teams must exist before the result can be finalized';
  end if;

  update public.profiles
    set gb_wins = coalesce(gb_wins, 0) + case when id = any(winner_users) then 1 else 0 end,
        gb_losses = coalesce(gb_losses, 0) + case when id = any(loser_users) then 1 else 0 end,
        gb_rank_points = case
          when id = any(winner_users) then coalesce(gb_rank_points, 0) + 25
          else greatest(0, coalesce(gb_rank_points, 0) - 10)
        end
    where id = any(all_users);

  update public.matches
    set posting_team_score = posting_score,
        accepting_team_score = accepting_score,
        reported_winner_team_id = winner_team_id,
        reported_loser_team_id = loser_team_id,
        winning_team_id = winner_team_id,
        losing_team_id = loser_team_id,
        status = 'completed',
        reporting_status = 'completed',
        score_confirmed_at = now(),
        score_verified = true,
        score_verified_at = now(),
        completed_at = now(),
        finalized = true,
        finalized_at = now(),
        finalized_by = auth.uid(),
        rankings_applied = true,
        result_processed = true,
        ranking_change_applied_at = now(),
        winning_user_ids = winner_users,
        losing_user_ids = loser_users
    where id = match_uuid;

  update public.dispute_tickets
    set status = 'resolved'
    where dispute_tickets.match_id = match_uuid
      and lower(coalesce(dispute_tickets.status, 'open')) = 'open';

  insert into public.staff_match_review_decisions (
    match_id,
    ticket_id,
    referee_id,
    previous_posting_score,
    previous_accepting_score,
    official_posting_score,
    official_accepting_score,
    decision_note
  ) values (
    match_uuid,
    review_ticket_id,
    auth.uid(),
    match_row.posting_team_score,
    match_row.accepting_team_score,
    posting_score,
    accepting_score,
    trim(decision_note)
  );

  return jsonb_build_object(
    'ok', true,
    'match_id', match_uuid,
    'winner_team_id', winner_team_id,
    'posting_team_score', posting_score,
    'accepting_team_score', accepting_score
  );
end;
$$;

revoke all on function public.staff_finalize_disputed_match(uuid, integer, integer, text) from public, anon;
grant execute on function public.staff_finalize_disputed_match(uuid, integer, integer, text) to authenticated;

create or replace function public.staff_get_match_review_queue()
returns setof jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'ticket_id', tickets.id,
    'match_id', matches.id,
    'game', coalesce(tickets.game, matches.game),
    'platform', coalesce(tickets.platform, matches.platform),
    'ladder', coalesce(tickets.ladder, matches.ladder),
    'best_of', matches.best_of,
    'posting_team_id', matches.posting_team_id,
    'accepting_team_id', matches.accepting_team_id,
    'posting_team_name', posting_team.name,
    'accepting_team_name', accepting_team.name,
    'dispute_reason', coalesce(tickets.dispute_reason, matches.dispute_reason),
    'dispute_description', coalesce(tickets.dispute_description, matches.dispute_reason, ''),
    'ticket_status', coalesce(tickets.status, 'open'),
    'posting_team_score', matches.posting_team_score,
    'accepting_team_score', matches.accepting_team_score,
    'posting_team_reported_score', matches.posting_team_reported_score,
    'accepting_team_reported_score', matches.accepting_team_reported_score
  )
  from public.matches as matches
  left join lateral (
    select
      dispute_tickets.id,
      dispute_tickets.game,
      dispute_tickets.platform,
      dispute_tickets.ladder,
      dispute_tickets.dispute_reason,
      dispute_tickets.dispute_description,
      dispute_tickets.status
    from public.dispute_tickets
    where dispute_tickets.match_id = matches.id
      and lower(coalesce(dispute_tickets.status, 'open')) = 'open'
    order by dispute_tickets.id
    limit 1
  ) as tickets on true
  left join public.teams as posting_team
    on posting_team.id = matches.posting_team_id
  left join public.teams as accepting_team
    on accepting_team.id = matches.accepting_team_id
  where public.has_staff_permission('match_review')
    and lower(coalesce(matches.status, '')) = 'disputed'
    and lower(coalesce(matches.reporting_status, '')) = 'disputed'
    and not coalesce(matches.finalized, false)
    and not (
      auth.uid() = any(coalesce(matches.locked_posting_roster, '{}'::uuid[]))
      or auth.uid() = any(coalesce(matches.locked_accepting_roster, '{}'::uuid[]))
      or exists (
        select 1
        from public.teams
        where id in (matches.posting_team_id, matches.accepting_team_id)
          and owner_id = auth.uid()
      )
    )
  order by tickets.id;
$$;

revoke all on function public.staff_get_match_review_queue() from public, anon;
grant execute on function public.staff_get_match_review_queue() to authenticated;

revoke all on public.staff_assignments from anon, authenticated;
grant select on public.staff_assignments to anon, authenticated;

revoke all on public.staff_access_grants from anon, authenticated;
grant select on public.staff_access_grants to authenticated;

drop policy if exists staff_assignments_public_directory_read on public.staff_assignments;
create policy staff_assignments_public_directory_read
  on public.staff_assignments for select
  to anon, authenticated
  using (true);

drop policy if exists staff_access_grants_read_own_or_owner on public.staff_access_grants;
create policy staff_access_grants_read_own_or_owner
  on public.staff_access_grants for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or public.has_staff_permission('staff_access')
  );

create or replace function public.get_staff_directory()
returns table (
  user_id uuid,
  username text,
  "position" text,
  duties text,
  is_owner boolean
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select directory.user_id, directory.username, directory.position,
         directory.duties, directory.is_owner
  from (
    select
      staff_assignments.user_id,
      coalesce(profiles.username, 'Staff member') as username,
      staff_assignments.position,
      staff_assignments.duties,
      profiles.role = 'owner' as is_owner
    from public.staff_assignments
    join public.profiles
      on profiles.id = staff_assignments.user_id
     and profiles.role in ('staff', 'owner')

    union all

    select profiles.id,
           coalesce(profiles.username, 'Owner'),
           'Owner',
           'Site administration and staff oversight',
           true
    from public.profiles
    where profiles.role = 'owner'
      and not exists (
        select 1 from public.staff_assignments
        where staff_assignments.user_id = profiles.id
      )
  ) as directory
  order by directory.position, directory.username;
$$;

revoke all on function public.get_staff_directory() from public;
grant execute on function public.get_staff_directory() to anon, authenticated;

create or replace function public.staff_owner_count()
returns bigint
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select count(*)
  from public.profiles
  where role = 'owner';
$$;

revoke all on function public.staff_owner_count() from public, anon;
grant execute on function public.staff_owner_count() to authenticated;

create or replace function public.guard_profile_role_changes()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  actor_role text;
  owner_count bigint;
begin
  if tg_op = 'INSERT' then
    if new.role is distinct from 'member'
      and current_user not in ('postgres', 'supabase_admin', 'service_role') then
      raise exception 'New profiles must have the member role';
    end if;
    return new;
  end if;

  if new.role is distinct from old.role
    and current_user not in ('postgres', 'supabase_admin', 'service_role') then
    select profiles.role
      into actor_role
      from public.profiles
      where profiles.id = auth.uid();

    if coalesce(actor_role, 'member') <> 'owner' then
      raise exception 'Only the owner can change profile roles';
    end if;

    if old.role = 'owner' and new.role <> 'owner' then
      owner_count := public.staff_owner_count();

      if owner_count <= 1 then
        raise exception 'The last owner cannot be removed';
      end if;
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.staff_assign_member(
  target_username text,
  staff_position text,
  staff_duties text,
  permissions text[]
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  target_profile_id uuid;
  profile_count integer;
  target_is_owner boolean;
begin
  if not exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'owner'
  ) then
    raise exception 'Only the owner can assign staff access';
  end if;

  if length(trim(coalesce(staff_position, ''))) not between 2 and 60 then
    raise exception 'Position must be between 2 and 60 characters';
  end if;

  if length(trim(coalesce(staff_duties, ''))) not between 5 and 400 then
    raise exception 'Duties must be between 5 and 400 characters';
  end if;

  if coalesce(cardinality(permissions), 0) = 0 then
    raise exception 'Choose at least one work-area permission';
  end if;

  if exists (
    select 1
    from unnest(permissions) as requested(permission_key)
    where requested.permission_key is null
      or requested.permission_key not in (
        'match_review',
        'forum_moderation',
        'awards',
        'staff_directory'
      )
  ) then
    raise exception 'One or more work-area permissions are not allowed';
  end if;

  select count(*), (array_agg(id))[1]
    into profile_count, target_profile_id
    from public.profiles
    where lower(username) = lower(trim(target_username));

  if profile_count = 0 then
    raise exception 'No account was found for that username';
  end if;

  if profile_count > 1 then
    raise exception 'That username matches multiple accounts';
  end if;

  if exists (
    select 1
    from public.profiles
    where id = target_profile_id
      and role = 'owner'
  ) then
    raise exception 'Owner access cannot be assigned or changed here';
  end if;

  update public.profiles
    set role = 'staff'
    where id = target_profile_id;

  insert into public.staff_assignments (user_id, position, duties, updated_at)
    values (target_profile_id, trim(staff_position), trim(staff_duties), now())
    on conflict (user_id) do update
      set position = excluded.position,
          duties = excluded.duties,
          updated_at = now();

  delete from public.staff_access_grants
    where user_id = target_profile_id;

  insert into public.staff_access_grants (user_id, permission_key)
    select target_profile_id, requested.permission_key
    from (
      select distinct unnest(permissions) as permission_key
    ) as requested;
end;
$$;

revoke all on function public.staff_assign_member(text, text, text, text[]) from public, anon;
grant execute on function public.staff_assign_member(text, text, text, text[]) to authenticated;

create or replace function public.staff_remove_member(target_username text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  target_profile_id uuid;
  profile_count integer;
begin
  if not exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'owner'
  ) then
    raise exception 'Only the owner can remove staff access';
  end if;

  select count(*), (array_agg(id))[1]
    into profile_count, target_profile_id
    from public.profiles
    where lower(username) = lower(trim(target_username));

  if profile_count > 1 then
    raise exception 'That username matches multiple accounts';
  end if;

  if target_profile_id is null then
    raise exception 'No non-owner account was found for that username';
  end if;

  if exists (
    select 1
    from public.profiles
    where id = target_profile_id
      and role = 'owner'
  ) then
    raise exception 'Owner access cannot be removed here';
  end if;

  delete from public.staff_assignments
    where user_id = target_profile_id;

  if not found then
    raise exception 'That account does not have a staff assignment';
  end if;

  delete from public.staff_access_grants
    where user_id = target_profile_id;

  update public.profiles
    set role = 'member'
    where id = target_profile_id;
end;
$$;

revoke all on function public.staff_remove_member(text) from public, anon;
grant execute on function public.staff_remove_member(text) to authenticated;

create or replace function public.staff_update_directory(
  target_username text,
  staff_position text,
  staff_duties text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  target_profile_id uuid;
  profile_count integer;
  target_is_owner boolean;
begin
  if not public.has_staff_permission('staff_directory') then
    raise exception 'You do not have permission to update the staff directory';
  end if;

  if length(trim(coalesce(staff_position, ''))) not between 2 and 60 then
    raise exception 'Position must be between 2 and 60 characters';
  end if;

  if length(trim(coalesce(staff_duties, ''))) not between 5 and 400 then
    raise exception 'Duties must be between 5 and 400 characters';
  end if;

  select count(*), (array_agg(id))[1]
    into profile_count, target_profile_id
    from public.profiles
    where lower(username) = lower(trim(target_username));

  if profile_count > 1 then
    raise exception 'That username matches multiple accounts';
  end if;

  if target_profile_id is null then
    raise exception 'No account was found for that username';
  end if;

  select role = 'owner'
    into target_is_owner
    from public.profiles
    where id = target_profile_id;

  if target_is_owner then
    insert into public.staff_assignments (user_id, position, duties, updated_at)
      values (target_profile_id, trim(staff_position), trim(staff_duties), now())
      on conflict (user_id) do update
        set position = excluded.position,
            duties = excluded.duties,
            updated_at = now();
  else
    if not exists (
      select 1
      from public.profiles
      where id = target_profile_id
        and role = 'staff'
    ) then
      raise exception 'That account is no longer an active staff member';
    end if;

    update public.staff_assignments
      set position = trim(staff_position),
          duties = trim(staff_duties),
          updated_at = now()
      where user_id = target_profile_id;

    if not found then
      raise exception 'That account does not have a staff assignment';
    end if;
  end if;
end;
$$;

revoke all on function public.staff_update_directory(text, text, text) from public, anon;
grant execute on function public.staff_update_directory(text, text, text) to authenticated;
