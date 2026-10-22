alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('member', 'staff', 'senior_staff', 'referee', 'admin', 'owner'));

do $$
declare
  approved_founders integer;
  updated_founders integer;
begin
  select count(*)
    into approved_founders
    from auth.users
    where encode(sha256(convert_to(lower(trim(email)), 'UTF8')), 'hex') in (
      '4b9768f5cd965042c2fd6a2abe9bd7d1a45b220f789470df8003345a84f1f1bb',
      'fb4c902423af4bed135982df947b79f9b902aa5db9852904a744e21d0e5d9ce7'
    );

  if approved_founders <> 2 then
    raise exception 'Both configured Founder accounts must exist before applying this migration';
  end if;

  update public.profiles
    set role = 'owner'
    where id in (
      select id
      from auth.users
      where encode(sha256(convert_to(lower(trim(email)), 'UTF8')), 'hex') in (
        '4b9768f5cd965042c2fd6a2abe9bd7d1a45b220f789470df8003345a84f1f1bb',
        'fb4c902423af4bed135982df947b79f9b902aa5db9852904a744e21d0e5d9ce7'
      )
    );

  get diagnostics updated_founders = row_count;
  if updated_founders <> 2 then
    raise exception 'Both Founder accounts must have profile rows before applying this migration';
  end if;
end;
$$;

create or replace function public.staff_email_is_allowed()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role in ('staff', 'senior_staff', 'admin', 'owner')
  );
$$;

revoke all on function public.staff_email_is_allowed() from public, anon;
grant execute on function public.staff_email_is_allowed() to authenticated;

create or replace function public.staff_has_portal_access()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select auth.uid() is not null and public.staff_email_is_allowed();
$$;

revoke all on function public.staff_has_portal_access() from public, anon;
grant execute on function public.staff_has_portal_access() to authenticated;

create or replace function public.has_staff_permission(permission_key text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and (
        profiles.role = 'owner'
        or (
          permission_key in ('staff_reports', 'basic_moderation')
          and profiles.role in ('staff', 'senior_staff', 'admin')
        )
        or (
          permission_key in ('escalated_reports', 'moderation_review')
          and profiles.role in ('senior_staff', 'admin')
        )
        or (
          permission_key in (
            'match_review',
            'awards',
            'staff_directory',
            'staff_access',
            'team_enforcement',
            'audit_log'
          )
          and profiles.role = 'admin'
        )
      )
  );
$$;

revoke all on function public.has_staff_permission(text) from public, anon;
grant execute on function public.has_staff_permission(text) to authenticated;

create or replace function public.get_staff_directory()
returns table (
  user_id uuid,
  username text,
  position text,
  duties text,
  is_owner boolean
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null or not public.staff_email_is_allowed() then
    raise exception 'Staff access is required to view the staff roster';
  end if;

  return query
    select profiles.id,
           coalesce(profiles.username, 'Staff member'),
           coalesce(staff_assignments.position, case profiles.role
             when 'owner' then 'Founder — Prime'
             when 'admin' then 'Administrator'
             when 'senior_staff' then 'Senior Staff'
             else 'Moderator'
           end),
           coalesce(staff_assignments.duties, ''),
           profiles.role = 'owner'
    from public.profiles
    left join public.staff_assignments
      on staff_assignments.user_id = profiles.id
    where profiles.role in ('staff', 'senior_staff', 'admin', 'owner')
    order by profiles.role, profiles.username;
end;
$$;

revoke all on function public.get_staff_directory() from public, anon;
grant execute on function public.get_staff_directory() to authenticated;

create table if not exists public.staff_activity_log (
  id bigint generated always as identity primary key,
  actor_id uuid not null references public.profiles(id),
  action text not null check (length(trim(action)) between 2 and 100),
  target_type text not null check (length(trim(target_type)) between 2 and 60),
  target_id text,
  case_id bigint,
  previous_values jsonb,
  new_values jsonb,
  reason text not null check (length(trim(reason)) between 5 and 1000),
  created_at timestamptz not null default now()
);

alter table public.staff_activity_log enable row level security;
revoke all on public.staff_activity_log from public, anon, authenticated;
grant select on public.staff_activity_log to authenticated;

drop policy if exists staff_activity_log_admin_read on public.staff_activity_log;
create policy staff_activity_log_admin_read
  on public.staff_activity_log for select
  to authenticated
  using (public.has_staff_permission('audit_log'));

create or replace function public.prevent_staff_activity_log_mutation()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  raise exception 'Staff activity history is immutable';
end;
$$;

drop trigger if exists staff_activity_log_immutable on public.staff_activity_log;
create trigger staff_activity_log_immutable
before update or delete on public.staff_activity_log
for each row execute function public.prevent_staff_activity_log_mutation();

create table if not exists public.staff_cases (
  id bigint generated always as identity primary key,
  case_number text generated always as ('GB-' || lpad(id::text, 8, '0')) stored unique,
  report_type text not null check (
    report_type in ('player', 'team', 'match', 'harassment', 'cheating', 'impersonation', 'abuse', 'other')
  ),
  title text not null check (length(trim(title)) between 4 and 160),
  description text not null check (length(trim(description)) between 10 and 5000),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  status text not null default 'new' check (
    status in ('new', 'under_review', 'awaiting_evidence', 'escalated', 'resolved', 'dismissed')
  ),
  reported_by uuid references public.profiles(id) on delete set null,
  assigned_to uuid references public.profiles(id) on delete set null,
  target_user_id uuid references public.profiles(id) on delete set null,
  target_team_id uuid references public.teams(id),
  match_id uuid references public.matches(id) on delete set null,
  evidence text not null default '',
  decision text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.staff_cases enable row level security;
revoke all on public.staff_cases from public, anon, authenticated;

create index if not exists staff_cases_inbox_idx
  on public.staff_cases(status, priority, created_at desc);
create index if not exists staff_cases_assignee_idx
  on public.staff_cases(assigned_to, status, created_at desc);

create table if not exists public.staff_award_catalog (
  id bigint generated always as identity primary key,
  name text not null unique check (length(trim(name)) between 2 and 100),
  award_group text not null check (length(trim(award_group)) between 2 and 60),
  purpose text not null check (length(trim(purpose)) between 5 and 500),
  exclusive boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.staff_award_requests (
  id bigint generated always as identity primary key,
  award_id bigint not null references public.staff_award_catalog(id),
  requested_by uuid not null references public.profiles(id),
  recipient_id uuid references public.profiles(id),
  recipient_team_id uuid references public.teams(id),
  reason text not null check (length(trim(reason)) between 10 and 1000),
  evidence text not null default '',
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  check ((recipient_id is null) <> (recipient_team_id is null))
);

create table if not exists public.staff_user_awards (
  id bigint generated always as identity primary key,
  award_id bigint not null references public.staff_award_catalog(id),
  recipient_id uuid references public.profiles(id),
  recipient_team_id uuid references public.teams(id),
  granted_by uuid not null references public.profiles(id),
  reason text not null check (length(trim(reason)) between 10 and 1000),
  evidence text not null default '',
  granted_at timestamptz not null default now(),
  revoked_by uuid references public.profiles(id),
  revoked_at timestamptz,
  revoke_reason text,
  check ((recipient_id is null) <> (recipient_team_id is null))
);

alter table public.staff_award_catalog enable row level security;
alter table public.staff_award_requests enable row level security;
alter table public.staff_user_awards enable row level security;

revoke all on public.staff_award_catalog from public, anon, authenticated;
revoke all on public.staff_award_requests from public, anon, authenticated;
revoke all on public.staff_user_awards from public, anon, authenticated;

create or replace function public.staff_set_rank(
  target_username text,
  target_role text,
  staff_position text,
  staff_duties text,
  decision_reason text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  target_profile public.profiles%rowtype;
begin
  if not public.has_staff_permission('staff_access') then
    raise exception 'Only Founder — Prime can assign staff ranks';
  end if;
  if coalesce(target_role, '') not in ('member', 'staff', 'senior_staff', 'admin') then
    raise exception 'That rank cannot be assigned through staff management';
  end if;
  if length(trim(coalesce(decision_reason, ''))) < 10 then
    raise exception 'Enter a reason of at least 10 characters for the rank change';
  end if;

  select * into target_profile
  from public.profiles
  where lower(username) = lower(trim(target_username))
  for update;

  if not found then
    raise exception 'No account was found for that username';
  end if;
  if target_profile.role = 'owner' then
    raise exception 'Founder ranks cannot be changed here';
  end if;
  if target_role <> 'member'
    and (
      length(trim(coalesce(staff_position, ''))) not between 2 and 60
      or length(trim(coalesce(staff_duties, ''))) not between 5 and 400
    ) then
    raise exception 'Provide a valid staff position and duty description';
  end if;

  update public.profiles set role = target_role where id = target_profile.id;
  if target_role = 'member' then
    delete from public.staff_assignments where user_id = target_profile.id;
    delete from public.staff_access_grants where user_id = target_profile.id;
  else
    insert into public.staff_assignments(user_id, position, duties, updated_at)
      values(target_profile.id, trim(staff_position), trim(staff_duties), now())
      on conflict (user_id) do update set
        position = excluded.position, duties = excluded.duties, updated_at = now();
  end if;

  insert into public.staff_activity_log(
    actor_id, action, target_type, target_id, previous_values, new_values, reason
  ) values (
    auth.uid(), 'staff_rank_changed', 'profile', target_profile.id::text,
    jsonb_build_object('role', target_profile.role),
    jsonb_build_object('role', target_role, 'position', staff_position, 'duties', staff_duties),
    trim(decision_reason)
  );
end;
$$;

revoke all on function public.staff_set_rank(text, text, text, text, text) from public, anon;
grant execute on function public.staff_set_rank(text, text, text, text, text) to authenticated;

create or replace function public.staff_submit_report(
  report_type text,
  report_title text,
  report_description text,
  target_username text default null,
  target_team_name text default null,
  target_match uuid default null,
  evidence_text text default ''
)
returns bigint
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  target_profile_id uuid;
  target_team_id uuid;
  new_case_id bigint;
begin
  if auth.uid() is null then
    raise exception 'Sign in to submit a report';
  end if;
  if report_type not in ('player', 'team', 'match', 'harassment', 'cheating', 'impersonation', 'abuse', 'other') then
    raise exception 'Select a supported report category';
  end if;
  if length(trim(coalesce(report_title, ''))) not between 4 and 160
    or length(trim(coalesce(report_description, ''))) not between 10 and 5000 then
    raise exception 'Enter a title and a report description';
  end if;
  if target_username is not null then
    select id into target_profile_id
    from public.profiles
    where lower(username) = lower(trim(target_username))
    limit 1;
    if target_profile_id is null then
      raise exception 'The reported player account could not be found';
    end if;
  end if;
  if target_team_name is not null then
    select id into target_team_id
    from public.teams
    where lower(name) = lower(trim(target_team_name))
    limit 1;
    if target_team_id is null then
      raise exception 'The reported team could not be found';
    end if;
  end if;

  insert into public.staff_cases(
    report_type, title, description, reported_by, target_user_id, target_team_id, match_id, evidence
  ) values (
    report_type, trim(report_title), trim(report_description), auth.uid(),
    target_profile_id, target_team_id, target_match, trim(coalesce(evidence_text, ''))
  ) returning id into new_case_id;

  return new_case_id;
end;
$$;

revoke all on function public.staff_submit_report(text, text, text, text, text, uuid, text) from public, anon;
grant execute on function public.staff_submit_report(text, text, text, text, text, uuid, text) to authenticated;

create or replace function public.staff_update_directory(
  target_username text,
  staff_position text,
  staff_duties text,
  decision_reason text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  target_profile public.profiles%rowtype;
  previous_position text;
  previous_duties text;
begin
  if not public.has_staff_permission('staff_directory') then
    raise exception 'You do not have permission to update the staff directory';
  end if;
  if length(trim(coalesce(staff_position, ''))) not between 2 and 60
    or length(trim(coalesce(staff_duties, ''))) not between 5 and 400 then
    raise exception 'Enter a valid position and duty description';
  end if;
  if length(trim(coalesce(decision_reason, ''))) < 10 then
    raise exception 'Enter a reason of at least 10 characters';
  end if;

  select * into target_profile
  from public.profiles
  where lower(username) = lower(trim(target_username))
    and role in ('staff', 'senior_staff', 'admin', 'owner')
  for update;
  if not found then raise exception 'Active staff account not found'; end if;

  select position, duties into previous_position, previous_duties
  from public.staff_assignments where user_id = target_profile.id;

  insert into public.staff_assignments(user_id, position, duties, updated_at)
    values(target_profile.id, trim(staff_position), trim(staff_duties), now())
    on conflict (user_id) do update set
      position = excluded.position, duties = excluded.duties, updated_at = now();

  insert into public.staff_activity_log(
    actor_id, action, target_type, target_id, previous_values, new_values, reason
  ) values (
    auth.uid(), 'staff_directory_updated', 'profile', target_profile.id::text,
    jsonb_build_object('position', previous_position, 'duties', previous_duties),
    jsonb_build_object('position', trim(staff_position), 'duties', trim(staff_duties)),
    trim(decision_reason)
  );
end;
$$;

revoke all on function public.staff_update_directory(text, text, text, text) from public, anon;
grant execute on function public.staff_update_directory(text, text, text, text) to authenticated;
revoke all on function public.staff_update_directory(text, text, text) from public, anon, authenticated;

insert into public.staff_award_catalog(name, award_group, purpose, exclusive)
values
  ('Founder Trophy', 'Founder', 'Recognizes original founders of GameBattles.', true),
  ('Founder Badge', 'Founder', 'Permanent recognition for founding members.', true),
  ('Alpha Tester Medal', 'Tester', 'For users who tested the earliest private build.', false),
  ('Beta Tester Medal', 'Tester', 'For users who helped test before public launch.', false),
  ('Community Contributor Plaque', 'Community', 'For exceptional contributions to the community.', false),
  ('Staff Pick Star', 'Community', 'For a standout contribution selected by staff.', false),
  ('Tournament Winner Trophy', 'Tournament', 'For winners of official tournaments.', false),
  ('Tournament Runner-Up Trophy', 'Tournament', 'For second-place tournament teams or players.', false),
  ('Grand Champion Crown', 'Champion', 'For top-level championship winners.', false),
  ('World Champion Trophy', 'Champion', 'For the highest world-level champion.', true),
  ('Ladder Champion Shield', 'Ladder', 'For official ladder champions.', false),
  ('Season Champion Shield', 'Season', 'For official season winners.', false),
  ('Top 100 Team Ribbon', 'Ranking', 'For teams reaching the top 100.', false),
  ('Top 10 Team Ribbon', 'Ranking', 'For teams reaching the top 10.', false),
  ('#1 Ranked Team Shield', 'Ranking', 'For the team holding the number one rank.', false),
  ('First Win Badge', 'Wins', 'For a player earning their first official win.', false),
  ('100 Wins Badge', 'Wins', 'For a player reaching 100 official wins.', false),
  ('500 Wins Badge', 'Wins', 'For a player reaching 500 official wins.', false),
  ('1000 Wins Badge', 'Wins', 'For a player reaching 1000 official wins.', false),
  ('Hall of Fame Plaque', 'Legacy', 'For an inducted GameBattles Hall of Fame member.', true),
  ('GameBattles Immortal Crystal', 'Legacy', 'The highest lifetime achievement award.', true),
  ('Sportsmanship Ribbon', 'Community', 'For consistently respectful competition.', false),
  ('Bug Hunter Medal', 'Tester', 'For reporting impactful and verified bugs.', false),
  ('Helpful Member Medal', 'Community', 'For consistently helping other players.', false),
  ('Tournament Finalist Trophy', 'Tournament', 'For finalists in official tournaments.', false),
  ('Major Champion Shield', 'Champion', 'For winners of major competitive events.', false),
  ('Top 50 Team Ribbon', 'Ranking', 'For teams reaching the top 50.', false),
  ('Top 25 Team Ribbon', 'Ranking', 'For teams reaching the top 25.', false),
  ('Top 5 Team Ribbon', 'Ranking', 'For teams reaching the top 5.', false),
  ('Undefeated Season Shield', 'Season', 'For an undefeated official season.', false),
  ('Rival Slayer Shield', 'Rivalry', 'For defeating a major rival.', false),
  ('1 Year Service Medal', 'Service', 'For one year as a member.', false),
  ('3 Year Service Medal', 'Service', 'For three years as a member.', false),
  ('5 Year Service Medal', 'Service', 'For five years as a member.', false),
  ('Community Legend Crown', 'Legacy', 'For legendary community members.', false),
  ('Launch Supporter Medal', 'Launch', 'For launch-period supporters.', false),
  ('Discord Founder Badge', 'Launch', 'For early Discord community members.', false),
  ('Username Reserved Badge', 'Launch', 'For users who reserved a name early.', false),
  ('Early Access Shield', 'Launch', 'For private-build testers.', false),
  ('Feedback Veteran Medal', 'Tester', 'For substantial site feedback.', false),
  ('Profile Pioneer Badge', 'User', 'For early complete profiles.', false),
  ('Team Builder Shield', 'Team', 'For building active teams.', false),
  ('Roster Leader Medal', 'Team', 'For captains who build full rosters.', false),
  ('Captain''s Honor Shield', 'Team', 'For trusted team captains.', false),
  ('Recruiter Badge', 'Team', 'For inviting active members.', false),
  ('Verified Team Badge', 'Team', 'For verified teams.', false),
  ('Match Finder Medal', 'Matches', 'For active match finder users.', false),
  ('Clutch Victory Medal', 'Matches', 'For a major comeback victory.', false),
  ('Clean Sweep Trophy', 'Matches', 'For a series sweep.', false),
  ('Perfect Record Shield', 'Matches', 'For a perfect competitive record.', false),
  ('Playoff Champion Trophy', 'Playoffs', 'For playoff bracket winners.', false),
  ('Playoff Finalist Medal', 'Playoffs', 'For playoff finalists.', false),
  ('Division Champion Shield', 'Division', 'For division winners.', false),
  ('Elite Division Shield', 'Division', 'For elite-division competitors.', false),
  ('Pro Division Medal', 'Division', 'For pro-division competitors.', false),
  ('Rookie Breakout Badge', 'User', 'For standout new players.', false),
  ('Forum Veteran Badge', 'Community', 'For active community contributors.', false),
  ('Content Creator Plaque', 'Creator', 'For creators who promote competitive gaming.', false),
  ('Featured Player Plaque', 'Featured', 'For players featured by staff.', false),
  ('Legendary Team Crystal', 'Legacy', 'For legendary competitive teams.', false)
on conflict (name) do nothing;

create or replace function public.staff_list_cases()
returns setof jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'id', staff_cases.id,
    'case_number', staff_cases.case_number,
    'report_type', staff_cases.report_type,
    'title', staff_cases.title,
    'description', staff_cases.description,
    'priority', staff_cases.priority,
    'status', staff_cases.status,
    'reported_by', staff_cases.reported_by,
    'reporter_username', reporter.username,
    'assigned_to', staff_cases.assigned_to,
    'assignee_username', assignee.username,
    'target_username', target.username,
    'target_team_id', staff_cases.target_team_id,
    'target_team_name', target_team.name,
    'match_id', staff_cases.match_id,
    'evidence', staff_cases.evidence,
    'decision', staff_cases.decision,
    'created_at', staff_cases.created_at,
    'updated_at', staff_cases.updated_at
  )
  from public.staff_cases
  left join public.profiles reporter on reporter.id = staff_cases.reported_by
  left join public.profiles assignee on assignee.id = staff_cases.assigned_to
  left join public.profiles target on target.id = staff_cases.target_user_id
  left join public.teams target_team on target_team.id = staff_cases.target_team_id
  where public.has_staff_permission('staff_reports')
  order by
    case staff_cases.priority when 'urgent' then 0 when 'high' then 1 when 'normal' then 2 else 3 end,
    staff_cases.created_at;
$$;

revoke all on function public.staff_list_cases() from public, anon;
grant execute on function public.staff_list_cases() to authenticated;

create or replace function public.staff_update_case(
  target_case_id bigint,
  new_status text,
  new_priority text,
  assigned_username text,
  decision_note text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  case_row public.staff_cases%rowtype;
  assigned_profile_id uuid;
  actor_role text;
begin
  select role into actor_role from public.profiles where id = auth.uid();
  if not public.has_staff_permission('staff_reports') then
    raise exception 'You do not have permission to handle reports';
  end if;
  if length(trim(coalesce(decision_note, ''))) < 10 then
    raise exception 'Enter a reason of at least 10 characters for every case update';
  end if;
  if coalesce(new_status, '') not in ('new', 'under_review', 'awaiting_evidence', 'escalated', 'resolved', 'dismissed')
    or coalesce(new_priority, '') not in ('low', 'normal', 'high', 'urgent') then
    raise exception 'Choose a valid case status and priority';
  end if;
  if new_status = 'escalated' and not public.has_staff_permission('escalated_reports') then
    raise exception 'Only Senior Staff or higher can escalate cases';
  end if;
  select * into case_row from public.staff_cases where id = target_case_id for update;
  if not found then raise exception 'Case not found'; end if;

  if actor_role = 'staff'
    and new_priority in ('high', 'urgent') then
    raise exception 'Only Senior Staff or administrators can mark a case high priority';
  end if;
  if assigned_username is not null and trim(assigned_username) <> '' then
    select id into assigned_profile_id
    from public.profiles
    where lower(username) = lower(trim(assigned_username))
      and role in ('staff', 'senior_staff', 'admin', 'owner')
    limit 1;
    if assigned_profile_id is null then
      raise exception 'The assigned username is not an active staff member';
    end if;
  end if;
  if actor_role = 'staff'
    and assigned_profile_id is null
    and case_row.assigned_to is not null
    and case_row.assigned_to <> auth.uid() then
    raise exception 'Moderators cannot unassign a case from another staff member';
  end if;
  if actor_role = 'staff'
    and assigned_profile_id is not null
    and assigned_profile_id <> auth.uid() then
    raise exception 'Moderators can assign cases only to themselves';
  end if;

  update public.staff_cases
    set status = new_status,
        priority = new_priority,
        assigned_to = assigned_profile_id,
        decision = case when new_status in ('resolved', 'dismissed')
          then trim(decision_note) else decision end,
        updated_at = now()
    where id = target_case_id;

  insert into public.staff_activity_log(
    actor_id, action, target_type, target_id, case_id, previous_values, new_values, reason
  ) values (
    auth.uid(), 'case_updated', 'staff_case', target_case_id::text, target_case_id,
    jsonb_build_object('status', case_row.status, 'priority', case_row.priority, 'assigned_to', case_row.assigned_to),
    jsonb_build_object('status', new_status, 'priority', new_priority, 'assigned_to', assigned_profile_id),
    coalesce(nullif(trim(decision_note), ''), 'Case status, priority, or assignment updated.')
  );
end;
$$;

revoke all on function public.staff_update_case(bigint, text, text, text, text) from public, anon;
grant execute on function public.staff_update_case(bigint, text, text, text, text) to authenticated;

create or replace function public.staff_dashboard_overview()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  actor_role text;
  result jsonb;
begin
  select role into actor_role from public.profiles where id = auth.uid();
  if not public.staff_email_is_allowed() then
    raise exception 'Staff access is required to view the dashboard';
  end if;

  select jsonb_build_object(
    'role', actor_role,
    'open_disputes', (
      select count(*) from public.matches
      where lower(coalesce(status, '')) = 'disputed'
        and lower(coalesce(reporting_status, '')) = 'disputed'
        and not coalesce(finalized, false)
    ),
    'new_reports', (
      select count(*) from public.staff_cases where status = 'new'
    ),
    'priority_cases', (
      select count(*) from public.staff_cases
      where priority in ('high', 'urgent')
        and status not in ('resolved', 'dismissed')
    ),
    'pending_awards', (
      select count(*) from public.staff_award_requests where status = 'pending'
    ),
    'my_cases', (
      select count(*) from public.staff_cases
      where assigned_to = auth.uid()
        and status not in ('resolved', 'dismissed')
    ),
    'recent_actions', coalesce((
      select jsonb_agg(item) from (
        select jsonb_build_object(
          'action', staff_activity_log.action,
          'target_type', staff_activity_log.target_type,
          'target_id', staff_activity_log.target_id,
          'case_id', staff_activity_log.case_id,
          'reason', staff_activity_log.reason,
          'previous_values', staff_activity_log.previous_values,
          'new_values', staff_activity_log.new_values,
          'created_at', staff_activity_log.created_at,
          'actor_username', profiles.username
        ) as item
        from public.staff_activity_log
        join public.profiles on profiles.id = staff_activity_log.actor_id
        where public.has_staff_permission('audit_log')
          or (
            public.has_staff_permission('moderation_review')
            and staff_activity_log.action = 'case_updated'
          )
          or staff_activity_log.actor_id = auth.uid()
        order by staff_activity_log.created_at desc
        limit 10
      ) recent
    ), '[]'::jsonb)
  ) into result;

  return result;
end;
$$;

revoke all on function public.staff_dashboard_overview() from public, anon;
grant execute on function public.staff_dashboard_overview() to authenticated;

create or replace function public.staff_list_awards()
returns setof jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'id', catalog.id,
    'name', catalog.name,
    'award_group', catalog.award_group,
    'purpose', catalog.purpose,
    'exclusive', catalog.exclusive,
    'active_award_count', (
      select count(*) from public.staff_user_awards awards
      where awards.award_id = catalog.id and awards.revoked_at is null
    )
  )
  from public.staff_award_catalog catalog
  where public.has_staff_permission('awards')
  order by catalog.award_group, catalog.name;
$$;

revoke all on function public.staff_list_awards() from public, anon;
grant execute on function public.staff_list_awards() to authenticated;

create or replace function public.staff_search_award_targets(query_text text)
returns setof jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.has_staff_permission('awards') then
    raise exception 'Administrator access is required to search award recipients';
  end if;
  if length(trim(coalesce(query_text, ''))) < 2 then
    return;
  end if;

  return query
    select result.item
    from (
      select jsonb_build_object(
        'id', profiles.id, 'target_type', 'player', 'label', profiles.username
      ) as item,
      profiles.username as sort_name,
      'player'::text as sort_type
      from public.profiles
      where profiles.username ilike '%' || trim(query_text) || '%'
      union all
      select jsonb_build_object(
        'id', teams.id, 'target_type', 'team', 'label', teams.name
      ) as item,
      teams.name as sort_name,
      'team'::text as sort_type
      from public.teams
      where teams.name ilike '%' || trim(query_text) || '%'
    ) result
    order by result.sort_type, result.sort_name
    limit 20;
end;
$$;

revoke all on function public.staff_search_award_targets(text) from public, anon;
grant execute on function public.staff_search_award_targets(text) to authenticated;

create or replace function public.staff_public_award_catalog()
returns setof jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'name', catalog.name,
    'award_group', catalog.award_group,
    'purpose', catalog.purpose
  )
  from public.staff_award_catalog catalog
  order by catalog.award_group, catalog.name;
$$;

revoke all on function public.staff_public_award_catalog() from public;
grant execute on function public.staff_public_award_catalog() to anon, authenticated;

create or replace function public.staff_submit_award_request(
  award_name text,
  request_reason text,
  request_evidence text default ''
)
returns bigint
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  award_row public.staff_award_catalog%rowtype;
  request_id bigint;
begin
  if auth.uid() is null then
    raise exception 'Sign in to request an award';
  end if;
  if length(trim(coalesce(request_reason, ''))) not between 10 and 1000 then
    raise exception 'Enter a reason between 10 and 1000 characters';
  end if;

  select * into award_row from public.staff_award_catalog
  where name = trim(award_name);
  if not found then raise exception 'Award not found'; end if;

  insert into public.staff_award_requests(
    award_id, requested_by, recipient_id, reason, evidence
  ) values (
    award_row.id, auth.uid(), auth.uid(), trim(request_reason),
    trim(coalesce(request_evidence, ''))
  ) returning id into request_id;
  return request_id;
end;
$$;

revoke all on function public.staff_submit_award_request(text, text, text) from public, anon;
grant execute on function public.staff_submit_award_request(text, text, text) to authenticated;

create or replace function public.staff_award_user(
  target_username text,
  award_name text,
  award_reason text,
  award_evidence text default ''
)
returns bigint
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  recipient uuid;
  award_row public.staff_award_catalog%rowtype;
  new_award_id bigint;
begin
  if not public.has_staff_permission('awards') then
    raise exception 'Administrator access is required to grant awards';
  end if;
  if length(trim(coalesce(award_reason, ''))) not between 10 and 1000 then
    raise exception 'Enter a reason between 10 and 1000 characters';
  end if;

  select id into recipient from public.profiles
    where lower(username) = lower(trim(target_username)) limit 1;
  if recipient is null then raise exception 'Player account not found'; end if;
  select * into award_row from public.staff_award_catalog
    where name = trim(award_name);
  if not found then raise exception 'Award not found'; end if;
  if award_row.exclusive and not public.has_staff_permission('staff_access') then
    raise exception 'Only Founder — Prime can grant this exclusive award';
  end if;

  insert into public.staff_user_awards(
    award_id, recipient_id, granted_by, reason, evidence
  ) values (
    award_row.id, recipient, auth.uid(), trim(award_reason), trim(coalesce(award_evidence, ''))
  ) returning id into new_award_id;

  insert into public.staff_activity_log(
    actor_id, action, target_type, target_id, new_values, reason
  ) values (
    auth.uid(), 'award_granted', 'profile', recipient::text,
    jsonb_build_object('award_id', award_row.id, 'award_name', award_row.name, 'award_record_id', new_award_id),
    trim(award_reason)
  );
  return new_award_id;
end;
$$;

revoke all on function public.staff_award_user(text, text, text, text) from public, anon;
grant execute on function public.staff_award_user(text, text, text, text) to authenticated;

create or replace function public.staff_award_team(
  target_team_id uuid,
  award_name text,
  award_reason text,
  award_evidence text default ''
)
returns bigint
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  team_row public.teams%rowtype;
  award_row public.staff_award_catalog%rowtype;
  new_award_id bigint;
begin
  if not public.has_staff_permission('awards') then
    raise exception 'Administrator access is required to grant awards';
  end if;
  if length(trim(coalesce(award_reason, ''))) not between 10 and 1000 then
    raise exception 'Enter a reason between 10 and 1000 characters';
  end if;

  select * into team_row from public.teams where id = target_team_id;
  if not found then raise exception 'Team not found'; end if;
  select * into award_row from public.staff_award_catalog where name = trim(award_name);
  if not found then raise exception 'Award not found'; end if;
  if award_row.exclusive and not public.has_staff_permission('staff_access') then
    raise exception 'Only Founder — Prime can grant this exclusive award';
  end if;

  insert into public.staff_user_awards(
    award_id, recipient_team_id, granted_by, reason, evidence
  ) values (
    award_row.id, team_row.id, auth.uid(), trim(award_reason), trim(coalesce(award_evidence, ''))
  ) returning id into new_award_id;

  insert into public.staff_activity_log(
    actor_id, action, target_type, target_id, new_values, reason
  ) values (
    auth.uid(), 'award_granted', 'team', team_row.id::text,
    jsonb_build_object('award_id', award_row.id, 'award_name', award_row.name, 'award_record_id', new_award_id),
    trim(award_reason)
  );
  return new_award_id;
end;
$$;

revoke all on function public.staff_award_team(uuid, text, text, text) from public, anon;
grant execute on function public.staff_award_team(uuid, text, text, text) to authenticated;

create or replace function public.staff_revoke_award(
  award_record_id bigint,
  revoke_reason text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  award_row public.staff_user_awards%rowtype;
  target_type text;
  target_id text;
begin
  if not public.has_staff_permission('awards') then
    raise exception 'Administrator access is required to revoke awards';
  end if;
  if length(trim(coalesce(revoke_reason, ''))) < 10 then
    raise exception 'Enter a reason of at least 10 characters';
  end if;

  select * into award_row
    from public.staff_user_awards where id = award_record_id for update;
  if not found or award_row.revoked_at is not null then
    raise exception 'Active award record not found';
  end if;
  target_type := case when award_row.recipient_id is not null then 'profile' else 'team' end;
  target_id := coalesce(award_row.recipient_id::text, award_row.recipient_team_id::text);
  if exists (
    select 1 from public.staff_award_catalog
    where id = award_row.award_id and exclusive
  ) and not public.has_staff_permission('staff_access') then
    raise exception 'Only Founder — Prime can revoke this exclusive award';
  end if;

  update public.staff_user_awards
    set revoked_by = auth.uid(), revoked_at = now(), revoke_reason = trim(revoke_reason)
    where id = award_record_id;

  insert into public.staff_activity_log(
    actor_id, action, target_type, target_id, previous_values, reason
  ) values (
    auth.uid(), 'award_revoked', target_type, target_id,
    jsonb_build_object('award_record_id', award_record_id, 'award_id', award_row.award_id),
    trim(revoke_reason)
  );
end;
$$;

revoke all on function public.staff_revoke_award(bigint, text) from public, anon;
grant execute on function public.staff_revoke_award(bigint, text) to authenticated;

create or replace function public.staff_list_award_requests()
returns setof jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'id', requests.id,
    'award_name', catalog.name,
    'exclusive', catalog.exclusive,
    'requested_by', requester.username,
    'recipient_username', recipient.username,
    'reason', requests.reason,
    'evidence', requests.evidence,
    'status', requests.status,
    'created_at', requests.created_at
  )
  from public.staff_award_requests requests
  join public.staff_award_catalog catalog on catalog.id = requests.award_id
  join public.profiles requester on requester.id = requests.requested_by
  left join public.profiles recipient on recipient.id = requests.recipient_id
  where public.has_staff_permission('awards')
  order by requests.created_at;
$$;

revoke all on function public.staff_list_award_requests() from public, anon;
grant execute on function public.staff_list_award_requests() to authenticated;

create or replace function public.staff_review_award_request(
  award_request_id bigint,
  approve_request boolean,
  decision_reason text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  request_row public.staff_award_requests%rowtype;
  award_name text;
  recipient_username text;
begin
  if not public.has_staff_permission('awards') then
    raise exception 'Administrator access is required to review award requests';
  end if;
  if length(trim(coalesce(decision_reason, ''))) < 10 then
    raise exception 'Enter a review reason of at least 10 characters';
  end if;

  select * into request_row
  from public.staff_award_requests
  where id = award_request_id
  for update;
  if not found or request_row.status <> 'pending' then
    raise exception 'Pending award request not found';
  end if;

  select catalog.name, profiles.username
    into award_name, recipient_username
  from public.staff_award_catalog catalog
  join public.profiles on profiles.id = request_row.recipient_id
  where catalog.id = request_row.award_id;

  if approve_request then
    perform public.staff_award_user(
      recipient_username, award_name, request_row.reason, request_row.evidence
    );
  end if;

  update public.staff_award_requests
    set status = case when approve_request then 'approved' else 'rejected' end,
        reviewed_by = auth.uid(),
        reviewed_at = now()
    where id = award_request_id;

  insert into public.staff_activity_log(
    actor_id, action, target_type, target_id, previous_values, new_values, reason
  ) values (
    auth.uid(), 'award_request_reviewed', 'award_request', award_request_id::text,
    jsonb_build_object('status', 'pending'),
    jsonb_build_object('status', case when approve_request then 'approved' else 'rejected' end),
    trim(decision_reason)
  );
end;
$$;

revoke all on function public.staff_review_award_request(bigint, boolean, text) from public, anon;
grant execute on function public.staff_review_award_request(bigint, boolean, text) to authenticated;

create or replace function public.staff_list_active_awards()
returns setof jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'id', awards.id,
    'award_name', catalog.name,
    'recipient_type', case when awards.recipient_id is not null then 'player' else 'team' end,
    'target_name', coalesce(recipient.username, team.name),
    'reason', awards.reason,
    'evidence', awards.evidence,
    'granted_at', awards.granted_at,
    'granted_by', grantor.username,
    'exclusive', catalog.exclusive
  )
  from public.staff_user_awards awards
  join public.staff_award_catalog catalog on catalog.id = awards.award_id
  left join public.profiles recipient on recipient.id = awards.recipient_id
  left join public.teams team on team.id = awards.recipient_team_id
  join public.profiles grantor on grantor.id = awards.granted_by
  where awards.revoked_at is null and public.has_staff_permission('awards')
  order by awards.granted_at desc
  limit 100;
$$;

revoke all on function public.staff_list_active_awards() from public, anon;
grant execute on function public.staff_list_active_awards() to authenticated;

create or replace function public.log_staff_match_review()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.staff_activity_log(
    actor_id, action, target_type, target_id, previous_values, new_values, reason
  ) values (
    new.referee_id, 'match_result_finalized', 'match', new.match_id::text,
    jsonb_build_object(
      'posting_score', new.previous_posting_score,
      'accepting_score', new.previous_accepting_score
    ),
    jsonb_build_object(
      'posting_score', new.official_posting_score,
      'accepting_score', new.official_accepting_score
    ),
    new.decision_note
  );
  return new;
end;
$$;

drop trigger if exists staff_match_review_audit on public.staff_match_review_decisions;
create trigger staff_match_review_audit
after insert on public.staff_match_review_decisions
for each row execute function public.log_staff_match_review();

create or replace function public.staff_player_award_history(target_username text)
returns setof jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'id', awards.id,
    'name', catalog.name,
    'award_group', catalog.award_group,
    'reason', awards.reason,
    'evidence', awards.evidence,
    'granted_at', awards.granted_at,
    'granted_by', grantor.username,
    'revoked_at', awards.revoked_at,
    'revoke_reason', awards.revoke_reason
  )
  from public.staff_user_awards awards
  join public.staff_award_catalog catalog on catalog.id = awards.award_id
  left join public.profiles grantor on grantor.id = awards.granted_by
  join public.profiles recipient on recipient.id = awards.recipient_id
  where lower(recipient.username) = lower(trim(target_username))
    and (awards.revoked_at is null or public.has_staff_permission('awards'))
  order by awards.granted_at desc;
$$;

revoke all on function public.staff_player_award_history(text) from public, anon;
grant execute on function public.staff_player_award_history(text) to anon, authenticated;

create or replace function public.staff_team_award_history(target_team_id uuid)
returns setof jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'id', awards.id,
    'name', catalog.name,
    'award_group', catalog.award_group,
    'reason', awards.reason,
    'granted_at', awards.granted_at,
    'granted_by', grantor.username
  )
  from public.staff_user_awards awards
  join public.staff_award_catalog catalog on catalog.id = awards.award_id
  left join public.profiles grantor on grantor.id = awards.granted_by
  where awards.recipient_team_id = target_team_id
    and awards.revoked_at is null
  order by awards.granted_at desc;
$$;

revoke all on function public.staff_team_award_history(uuid) from public;
grant execute on function public.staff_team_award_history(uuid) to anon, authenticated;
