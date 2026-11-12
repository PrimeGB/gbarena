create table public.staff_credit_grants (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  granted_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

alter table public.staff_credit_grants enable row level security;
revoke all on public.staff_credit_grants from public, anon, authenticated;
grant select on public.staff_credit_grants to authenticated;
create policy staff_credit_grants_read on public.staff_credit_grants
  for select to authenticated
  using (user_id = auth.uid() or exists (
    select 1 from public.profiles where id = auth.uid() and role = 'owner'
  ));

create function public.gb_clear_credit_grant_on_role_change()
returns trigger language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  if new.role is distinct from old.role then
    delete from public.staff_credit_grants where user_id = new.id;
  end if;
  return new;
end;
$$;
revoke all on function public.gb_clear_credit_grant_on_role_change() from public, anon, authenticated;
create trigger staff_clear_credit_grant after update of role on public.profiles
  for each row execute function public.gb_clear_credit_grant_on_role_change();

create or replace function public.staff_email_is_allowed()
returns boolean language sql stable security definer set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('owner', 'admin', 'staff', 'senior_staff', 'referee')
  );
$$;

create or replace function public.guard_profile_role_changes()
returns trigger language plpgsql set search_path = public, pg_temp
as $$
begin
  if tg_op = 'INSERT' and new.role is distinct from 'member'
    and current_user not in ('postgres', 'supabase_admin', 'service_role') then
    raise exception 'New profiles must have the member role';
  end if;
  if tg_op = 'UPDATE' and new.role is distinct from old.role
    and current_user not in ('postgres', 'supabase_admin', 'service_role') then
    raise exception 'Staff roles can only be changed through staff management';
  end if;
  return new;
end;
$$;

create or replace function public.has_staff_permission(permission_key text)
returns boolean language sql stable security definer set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and (
        (p.role = 'owner' and permission_key in (
          'staff_reports', 'basic_moderation', 'escalated_reports', 'moderation_review',
          'match_review', 'awards', 'staff_directory', 'staff_access', 'team_enforcement',
          'audit_log', 'manage_staff', 'credit_management', 'award_recommendation'
        ))
        or (p.role = 'admin' and permission_key in (
          'staff_reports', 'basic_moderation', 'escalated_reports', 'moderation_review',
          'match_review', 'awards', 'staff_directory', 'staff_access', 'team_enforcement',
          'audit_log', 'manage_staff', 'award_recommendation'
        ))
        or (p.role in ('staff', 'senior_staff') and permission_key in (
          'staff_reports', 'basic_moderation', 'escalated_reports', 'award_recommendation'
        ))
        or (p.role = 'referee' and permission_key in ('match_review', 'award_recommendation'))
        or (p.role = 'admin' and permission_key = 'credit_management' and exists (
          select 1 from public.staff_credit_grants g where g.user_id = p.id
        ))
      )
  );
$$;

create function public.staff_my_permissions()
returns setof text language sql stable security definer set search_path = public, pg_temp
as $$
  select permission from unnest(array[
    'staff_reports', 'basic_moderation', 'escalated_reports', 'moderation_review',
    'match_review', 'awards', 'staff_directory', 'staff_access', 'team_enforcement',
    'audit_log', 'manage_staff', 'credit_management', 'award_recommendation'
  ]) permission
  where public.has_staff_permission(permission);
$$;
revoke all on function public.staff_my_permissions() from public, anon;
grant execute on function public.staff_my_permissions() to authenticated;

create or replace function public.staff_set_rank(
  target_username text, target_role text, staff_position text, staff_duties text, decision_reason text
)
returns void language plpgsql security definer set search_path = public, pg_temp
as $$
declare actor_role text; target public.profiles%rowtype;
begin
  select role into actor_role from public.profiles where id = auth.uid();
  if actor_role not in ('owner', 'admin') or actor_role is null then
    raise exception 'Staff management access is required';
  end if;
  if coalesce(target_role, '') not in ('member', 'staff', 'referee', 'admin') then
    raise exception 'Select a supported staff role';
  end if;
  if length(trim(coalesce(decision_reason, ''))) not between 10 and 1000 then
    raise exception 'Enter a reason between 10 and 1000 characters';
  end if;
  select * into target from public.profiles
    where lower(username) = lower(trim(target_username)) for update;
  if not found then raise exception 'Account not found'; end if;
  if public.gb_staff_conflicts_user(target.id) then raise exception 'Another Owner or Administrator must manage this account'; end if;
  if target.role = 'owner' then raise exception 'Owner roles cannot be changed here'; end if;
  if actor_role = 'admin' and (target.role = 'admin' or target_role = 'admin') then
    raise exception 'Only an Owner can change Administrator access';
  end if;
  if target_role <> 'member' and length(trim(coalesce(staff_duties, ''))) not between 5 and 400 then
    raise exception 'Provide a valid duty description';
  end if;

  update public.profiles set role = target_role where id = target.id;
  if target.role is distinct from target_role then
    delete from public.staff_access_grants where user_id = target.id;
    delete from public.staff_credit_grants where user_id = target.id;
  end if;
  if target_role = 'member' then
    delete from public.staff_assignments where user_id = target.id;
  else
    insert into public.staff_assignments(user_id, position, duties, updated_at)
      values (target.id, case target_role when 'admin' then 'Administrator'
        when 'referee' then 'Referee' else 'Moderator' end, trim(staff_duties), now())
      on conflict (user_id) do update set
        position = excluded.position, duties = excluded.duties, updated_at = now();
  end if;
  insert into public.staff_activity_log(actor_id, action, target_type, target_id, previous_values, new_values, reason)
    values (auth.uid(), 'staff_rank_changed', 'profile', target.id::text,
      jsonb_build_object('role', target.role),
      jsonb_build_object('role', target_role, 'duties', staff_duties),
      trim(decision_reason));
end;
$$;
revoke all on function public.staff_assign_member(text, text, text, text[]) from public, anon, authenticated;
revoke all on function public.staff_remove_member(text) from public, anon, authenticated;

create function public.staff_set_credit_access(target_username text, allow_access boolean, decision_reason text)
returns void language plpgsql security definer set search_path = public, pg_temp
as $$
declare target public.profiles%rowtype; had_access boolean;
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'owner') then
    raise exception 'Only an Owner can change credit access';
  end if;
  if allow_access is null or length(trim(coalesce(decision_reason, ''))) not between 10 and 1000 then
    raise exception 'Choose an action and enter a reason between 10 and 1000 characters';
  end if;
  select * into target from public.profiles where lower(username) = lower(trim(target_username)) for update;
  if not found or target.role <> 'admin' then raise exception 'An active Administrator is required'; end if;
  if public.gb_staff_conflicts_user(target.id) then raise exception 'Another Owner must manage this account'; end if;
  select exists (select 1 from public.staff_credit_grants where user_id = target.id) into had_access;
  if allow_access then
    insert into public.staff_credit_grants(user_id, granted_by) values (target.id, auth.uid())
      on conflict (user_id) do nothing;
  else
    delete from public.staff_credit_grants where user_id = target.id;
  end if;
  insert into public.staff_activity_log(actor_id, action, target_type, target_id, previous_values, new_values, reason)
    values (auth.uid(), 'staff_credit_access_changed', 'profile', target.id::text,
      jsonb_build_object('allowed', had_access), jsonb_build_object('allowed', allow_access), trim(decision_reason));
end;
$$;
revoke all on function public.staff_set_credit_access(text, boolean, text) from public, anon;
grant execute on function public.staff_set_credit_access(text, boolean, text) to authenticated;

create function public.gb_staff_conflicts_team(p_team uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp
as $$
  select p_team is not null and auth.uid() is not null and (
    exists (select 1 from public.teams where id = p_team and owner_id = auth.uid())
    or exists (select 1 from public.team_members where team_id = p_team and user_id = auth.uid())
  );
$$;

create function public.gb_staff_conflicts_user(p_user uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp
as $$
  select p_user is not null and auth.uid() is not null and (
    p_user = auth.uid()
    or exists (
      select 1 from public.teams t
      where public.gb_staff_conflicts_team(t.id)
        and (t.owner_id = p_user or exists (
          select 1 from public.team_members tm where tm.team_id = t.id and tm.user_id = p_user
        ))
    )
  );
$$;

create function public.gb_staff_conflicts_match(p_match uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.matches m where m.id = p_match and (
      public.gb_staff_conflicts_team(m.posting_team_id)
      or public.gb_staff_conflicts_team(m.accepting_team_id)
      or auth.uid() = any(coalesce(m.locked_posting_roster, '{}'::uuid[]))
      or auth.uid() = any(coalesce(m.locked_accepting_roster, '{}'::uuid[]))
      or exists (select 1 from public.match_participants p where p.match_id = m.id and p.user_id = auth.uid())
    )
  );
$$;
revoke all on function public.gb_staff_conflicts_team(uuid), public.gb_staff_conflicts_user(uuid),
  public.gb_staff_conflicts_match(uuid) from public, anon, authenticated;

alter function public.staff_get_match_review_queue() rename to gb_staff_match_queue_before_conflicts;
revoke all on function public.gb_staff_match_queue_before_conflicts() from public, anon, authenticated;
create function public.staff_get_match_review_queue()
returns setof jsonb language sql stable security definer set search_path = public, pg_temp
as $$
  select item from public.gb_staff_match_queue_before_conflicts() item
  where not public.gb_staff_conflicts_match((item->>'match_id')::uuid);
$$;
revoke all on function public.staff_get_match_review_queue() from public, anon;
grant execute on function public.staff_get_match_review_queue() to authenticated;

alter function public.staff_finalize_disputed_match(uuid, integer, integer, text)
  rename to gb_staff_finalize_with_rank_movement;
revoke all on function public.gb_staff_finalize_with_rank_movement(uuid, integer, integer, text) from public, anon, authenticated;
create function public.staff_finalize_disputed_match(match_uuid uuid, posting_score integer, accepting_score integer, decision_note text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  if not public.has_staff_permission('match_review') then raise exception 'Match review access is required'; end if;
  perform 1 from public.matches where id = match_uuid for update;
  if public.gb_staff_conflicts_match(match_uuid) then raise exception 'You cannot decide a match involving you or your team'; end if;
  return public.gb_staff_finalize_with_rank_movement(match_uuid, posting_score, accepting_score, decision_note);
end;
$$;
revoke all on function public.staff_finalize_disputed_match(uuid, integer, integer, text) from public, anon;
grant execute on function public.staff_finalize_disputed_match(uuid, integer, integer, text) to authenticated;

create or replace function public.get_staff_directory()
returns table (user_id uuid, username text, "position" text, duties text, is_owner boolean)
language plpgsql stable security definer set search_path = public, pg_temp
as $$
begin
  if not public.staff_has_portal_access() then raise exception 'Staff access is required'; end if;
  return query select p.id, coalesce(p.username, 'Staff member'),
    case p.role
      when 'owner' then 'Founder / Owner' when 'admin' then 'Administrator'
      when 'referee' then 'Referee' else 'Moderator' end,
    coalesce(a.duties, ''), p.role = 'owner'
  from public.profiles p left join public.staff_assignments a on a.user_id = p.id
  where p.role in ('owner', 'admin', 'staff', 'senior_staff', 'referee')
  order by p.role, p.username;
end;
$$;

alter function public.staff_update_directory(text, text, text, text) rename to gb_staff_update_directory_unchecked;
revoke all on function public.gb_staff_update_directory_unchecked(text, text, text, text) from public, anon, authenticated;
create function public.staff_update_directory(target_username text, staff_position text, staff_duties text, decision_reason text)
returns void language plpgsql security definer set search_path = public, pg_temp
as $$
declare target public.profiles%rowtype; previous public.staff_assignments%rowtype; canonical_position text;
begin
  if not public.has_staff_permission('staff_directory') then raise exception 'Staff directory access is required'; end if;
  if length(trim(coalesce(staff_duties, ''))) not between 5 and 400
    or length(trim(coalesce(decision_reason, ''))) not between 10 and 1000 then
    raise exception 'Enter a valid position, duties and reason';
  end if;
  select * into target from public.profiles where lower(username) = lower(trim(target_username)) for update;
  if not found or target.role not in ('owner', 'admin', 'staff', 'senior_staff', 'referee') then
    raise exception 'Staff account not found';
  end if;
  if public.gb_staff_conflicts_user(target.id) then raise exception 'Another staff member must change this assignment'; end if;
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'owner')
    and target.role in ('owner', 'admin') then
    raise exception 'Only an Owner can change Administrator or Owner assignments';
  end if;
  canonical_position := case target.role when 'owner' then 'Founder / Owner'
    when 'admin' then 'Administrator' when 'referee' then 'Referee' else 'Moderator' end;
  select * into previous from public.staff_assignments where user_id = target.id;
  insert into public.staff_assignments(user_id, position, duties, updated_at)
    values(target.id, canonical_position, trim(staff_duties), now())
    on conflict (user_id) do update set position = excluded.position, duties = excluded.duties, updated_at = now();
  insert into public.staff_activity_log(actor_id, action, target_type, target_id, previous_values, new_values, reason)
    values (auth.uid(), 'staff_directory_updated', 'profile', target.id::text,
      jsonb_build_object('position', previous.position, 'duties', previous.duties),
      jsonb_build_object('position', canonical_position, 'duties', trim(staff_duties)), trim(decision_reason));
end;
$$;
revoke all on function public.staff_update_directory(text, text, text, text) from public, anon;
grant execute on function public.staff_update_directory(text, text, text, text) to authenticated;

alter function public.staff_update_case(bigint, text, text, text, text) rename to gb_staff_update_case_unchecked;
revoke all on function public.gb_staff_update_case_unchecked(bigint, text, text, text, text) from public, anon, authenticated;
create function public.staff_update_case(target_case_id bigint, new_status text, new_priority text, assigned_username text, decision_note text)
returns void language plpgsql security definer set search_path = public, pg_temp
as $$
declare c public.staff_cases%rowtype; actor_role text; assignee uuid;
begin
  if not public.has_staff_permission('staff_reports') then raise exception 'Report access is required'; end if;
  if length(trim(coalesce(decision_note, ''))) not between 10 and 1000 then raise exception 'Enter a reason between 10 and 1000 characters'; end if;
  if coalesce(new_status, '') not in ('new', 'under_review', 'awaiting_evidence', 'escalated', 'resolved', 'dismissed')
    or coalesce(new_priority, '') not in ('low', 'normal', 'high', 'urgent') then
    raise exception 'Choose a valid case status and priority';
  end if;
  select role into actor_role from public.profiles where id = auth.uid();
  select * into c from public.staff_cases where id = target_case_id for update;
  if not found then raise exception 'Case not found'; end if;
  if public.gb_staff_conflicts_user(c.reported_by) or public.gb_staff_conflicts_user(c.target_user_id)
    or public.gb_staff_conflicts_team(c.target_team_id) or public.gb_staff_conflicts_match(c.match_id) then
    raise exception 'Another staff member must handle a case involving you or your team';
  end if;
  if actor_role in ('staff', 'senior_staff') and new_priority in ('high', 'urgent')
    and new_priority is distinct from c.priority then raise exception 'Only Administrators can set high priority'; end if;
  if nullif(trim(assigned_username), '') is not null then
    select id into assignee from public.profiles
      where lower(username) = lower(trim(assigned_username))
        and role in ('owner', 'admin', 'staff', 'senior_staff');
    if assignee is null then raise exception 'The assigned username does not have report access'; end if;
  end if;
  if actor_role in ('staff', 'senior_staff') and (
    (assignee is null and c.assigned_to is not null and c.assigned_to <> auth.uid())
    or (assignee is not null and assignee <> auth.uid())
  ) then raise exception 'Moderators can only assign cases to themselves'; end if;
  update public.staff_cases set status = new_status, priority = new_priority, assigned_to = assignee,
    decision = case when new_status in ('resolved', 'dismissed') then trim(decision_note) else decision end,
    updated_at = now() where id = target_case_id;
  insert into public.staff_activity_log(actor_id, action, target_type, target_id, case_id, previous_values, new_values, reason)
    values (auth.uid(), 'case_updated', 'staff_case', target_case_id::text, target_case_id,
      jsonb_build_object('status', c.status, 'priority', c.priority, 'assigned_to', c.assigned_to),
      jsonb_build_object('status', new_status, 'priority', new_priority, 'assigned_to', assignee), trim(decision_note));
end;
$$;
revoke all on function public.staff_update_case(bigint, text, text, text, text) from public, anon;
grant execute on function public.staff_update_case(bigint, text, text, text, text) to authenticated;

alter function public.staff_dashboard_overview() rename to gb_staff_dashboard_overview_unfiltered;
revoke all on function public.gb_staff_dashboard_overview_unfiltered() from public, anon, authenticated;
create function public.staff_dashboard_overview()
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp
as $$
declare result jsonb;
begin
  if not public.staff_has_portal_access() then raise exception 'Staff access is required'; end if;
  result := public.gb_staff_dashboard_overview_unfiltered();
  if not public.has_staff_permission('staff_reports') then
    result := result || '{"new_reports":0,"priority_cases":0,"pending_awards":0,"my_cases":0}'::jsonb;
  end if;
  return result;
end;
$$;
revoke all on function public.staff_dashboard_overview() from public, anon;
grant execute on function public.staff_dashboard_overview() to authenticated;

alter function public.staff_adjust_credits(text, integer, text) rename to gb_staff_adjust_credits_unchecked;
revoke all on function public.gb_staff_adjust_credits_unchecked(text, integer, text) from public, anon, authenticated;
create function public.staff_adjust_credits(target_username text, credit_amount integer, credit_reason text)
returns integer language plpgsql security definer set search_path = public, pg_temp
as $$
declare target uuid; balance integer;
begin
  if not public.has_staff_permission('credit_management') then raise exception 'Owner-granted credit access is required'; end if;
  select id into target from public.profiles where lower(username) = lower(trim(target_username));
  if target is null then raise exception 'Player not found'; end if;
  if public.gb_staff_conflicts_user(target) then raise exception 'You cannot change credits for yourself or a teammate'; end if;
  balance := public.gb_staff_adjust_credits_unchecked(target_username, credit_amount, credit_reason);
  insert into public.staff_activity_log(actor_id, action, target_type, target_id, new_values, reason)
    values (auth.uid(), 'credits_adjusted', 'profile', target::text,
      jsonb_build_object('amount', credit_amount, 'balance', balance), trim(credit_reason));
  return balance;
end;
$$;
revoke all on function public.staff_adjust_credits(text, integer, text) from public, anon;
grant execute on function public.staff_adjust_credits(text, integer, text) to authenticated;

alter function public.staff_clear_purchase_block(text) rename to gb_staff_clear_purchase_block_unchecked;
revoke all on function public.gb_staff_clear_purchase_block_unchecked(text) from public, anon, authenticated;
create function public.staff_clear_purchase_block(target_username text)
returns void language plpgsql security definer set search_path = public, pg_temp
as $$
declare target uuid;
begin
  if not public.has_staff_permission('credit_management') then raise exception 'Owner-granted credit access is required'; end if;
  select id into target from public.profiles where lower(username) = lower(trim(target_username));
  if target is null then raise exception 'Player not found'; end if;
  if public.gb_staff_conflicts_user(target) then raise exception 'Another staff member must review this account'; end if;
  if not exists (select 1 from public.credit_purchase_blocks where user_id = target) then
    raise exception 'This account has no purchase block';
  end if;
  perform public.gb_staff_clear_purchase_block_unchecked(target_username);
  insert into public.staff_activity_log(actor_id, action, target_type, target_id, reason)
    values (auth.uid(), 'credit_purchase_block_cleared', 'profile', target::text, 'Credit purchase block cleared');
end;
$$;
revoke all on function public.staff_clear_purchase_block(text) from public, anon;
grant execute on function public.staff_clear_purchase_block(text) to authenticated;

alter function public.staff_award_tournament_prize(uuid, uuid, integer, integer) rename to gb_staff_pay_prize_unchecked;
revoke all on function public.gb_staff_pay_prize_unchecked(uuid, uuid, integer, integer) from public, anon, authenticated;
create function public.staff_award_tournament_prize(
  p_tournament_id uuid, p_team_id uuid, p_placement integer default 1, p_total_credits integer default null
)
returns integer language plpgsql security definer set search_path = public, pg_temp
as $$
declare paid integer; owner_actor boolean;
begin
  if not public.has_staff_permission('credit_management') then raise exception 'Owner-granted credit access is required'; end if;
  select role = 'owner' into owner_actor from public.profiles where id = auth.uid();
  if not owner_actor and p_total_credits is not null then
    raise exception 'Administrators must use the Owner-set tournament prize';
  end if;
  if not owner_actor and p_placement is distinct from 1 then
    raise exception 'Administrators may only pay the first-place prize';
  end if;
  if p_placement is null or p_placement < 1 then raise exception 'Choose a valid placement'; end if;
  if public.gb_staff_conflicts_team(p_team_id) then raise exception 'You cannot pay a prize to your own team'; end if;
  paid := public.gb_staff_pay_prize_unchecked(p_tournament_id, p_team_id, p_placement, p_total_credits);
  insert into public.staff_activity_log(actor_id, action, target_type, target_id, new_values, reason)
    values (auth.uid(), 'tournament_prize_paid', 'team', p_team_id::text,
      jsonb_build_object('tournament_id', p_tournament_id, 'placement', p_placement, 'credits', paid),
      'Tournament prize paid');
  return paid;
end;
$$;
revoke all on function public.staff_award_tournament_prize(uuid, uuid, integer, integer) from public, anon;
grant execute on function public.staff_award_tournament_prize(uuid, uuid, integer, integer) to authenticated;

alter function public.staff_award_competition_champion(text, uuid) rename to gb_staff_award_competition_unchecked;
revoke all on function public.gb_staff_award_competition_unchecked(text, uuid) from public, anon, authenticated;
create function public.staff_award_competition_champion(p_reward_type text, p_tournament_id uuid default null)
returns jsonb language plpgsql security definer set search_path = public, pg_temp
as $$
declare result jsonb;
begin
  if not public.has_staff_permission('credit_management') then raise exception 'Owner-granted credit access is required'; end if;
  if p_reward_type = 'weekly_cup'
    and not exists (select 1 from public.profiles where id = auth.uid() and role = 'owner')
    and not exists (select 1 from public.tournaments
      where id = p_tournament_id and prize_credits = 5 and prize_per_player) then
    raise exception 'The Owner-set prize must match the weekly cup reward';
  end if;
  result := public.gb_staff_award_competition_unchecked(p_reward_type, p_tournament_id);
  if public.gb_staff_conflicts_team((result->>'team_id')::uuid) then
    raise exception 'You cannot award a competition to your own team';
  end if;
  insert into public.staff_activity_log(actor_id, action, target_type, target_id, new_values, reason)
    values (auth.uid(), 'competition_champion_awarded', 'team', result->>'team_id', result, 'Competition champion awarded');
  return result;
end;
$$;
revoke all on function public.staff_award_competition_champion(text, uuid) from public, anon;
grant execute on function public.staff_award_competition_champion(text, uuid) to authenticated;

create or replace function public.staff_issue_sanction(p_username text, p_kind text, p_reason text, p_hours integer default null)
returns uuid language plpgsql security definer set search_path = public, pg_temp
as $$
declare target uuid; target_role text; sanction_id uuid; moderator boolean;
begin
  if not public.has_staff_permission('basic_moderation') then raise exception 'Moderation access is required'; end if;
  select role in ('staff', 'senior_staff') into moderator from public.profiles where id = auth.uid();
  if coalesce(p_kind, '') not in ('mute', 'suspend') then raise exception 'Invalid sanction type'; end if;
  if length(trim(coalesce(p_reason, ''))) not between 5 and 1000 then raise exception 'Enter a reason between 5 and 1000 characters'; end if;
  if moderator and (p_kind <> 'mute' or p_hours is null or p_hours < 1 or p_hours > 24) then
    raise exception 'Moderators may only issue mutes lasting 1 to 24 hours';
  end if;
  if p_hours is not null and p_hours <= 0 then raise exception 'Duration must be positive'; end if;
  select id, role into target, target_role from public.profiles where lower(username) = lower(trim(p_username));
  if target is null then raise exception 'Player not found'; end if;
  if target_role in ('owner', 'admin') then raise exception 'Owner and Administrator accounts cannot be sanctioned'; end if;
  if public.gb_staff_conflicts_user(target) then raise exception 'You cannot sanction yourself or a teammate'; end if;
  insert into public.user_sanctions(user_id, kind, reason, issued_by, expires_at)
    values (target, p_kind, trim(p_reason), auth.uid(),
      case when p_hours is null then null else now() + make_interval(hours => p_hours) end)
    returning id into sanction_id;
  insert into public.staff_audit_log(actor_id, action, target_user, details)
    values (auth.uid(), 'sanction_issued', target,
      jsonb_build_object('kind', p_kind, 'reason', trim(p_reason), 'hours', p_hours, 'sanction_id', sanction_id));
  perform public.gb_notify(target,
    case when p_kind = 'mute' then 'You have been muted' else 'Your account has been suspended' end,
    'Reason: ' || trim(p_reason) || case when p_hours is null then ' (until staff lift it).' else ' (' || p_hours || ' hours).' end,
    'sanction', sanction_id);
  return sanction_id;
end;
$$;

create or replace function public.staff_revoke_sanction(p_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp
as $$
declare s public.user_sanctions%rowtype; moderator boolean;
begin
  if not public.has_staff_permission('basic_moderation') then raise exception 'Moderation access is required'; end if;
  select role in ('staff', 'senior_staff') into moderator from public.profiles where id = auth.uid();
  select * into s from public.user_sanctions where id = p_id for update;
  if not found or s.revoked_at is not null then raise exception 'Sanction not found or already lifted'; end if;
  if public.gb_staff_conflicts_user(s.user_id) then raise exception 'You cannot change a sanction involving yourself or a teammate'; end if;
  if moderator and (s.kind <> 'mute' or s.expires_at is null or s.expires_at > s.created_at + interval '24 hours') then
    raise exception 'Moderators may only lift mutes of up to 24 hours';
  end if;
  update public.user_sanctions set revoked_at = now(), revoked_by = auth.uid() where id = p_id;
  insert into public.staff_audit_log(actor_id, action, target_user, details)
    values (auth.uid(), 'sanction_revoked', s.user_id, jsonb_build_object('kind', s.kind, 'sanction_id', p_id));
end;
$$;

drop policy if exists "Staff read sanctions" on public.user_sanctions;
create policy "Staff read sanctions" on public.user_sanctions for select to authenticated
  using (public.has_staff_permission('basic_moderation') or user_id = auth.uid());
revoke insert, update, delete, truncate, references, trigger on public.staff_audit_log from public, anon, authenticated;

drop policy if exists boost_flags_staff_update on public.boost_flags;
revoke update on public.boost_flags from public, anon, authenticated;

alter function public.staff_award_user(text, text, text, text) rename to gb_staff_award_user_unchecked;
revoke all on function public.gb_staff_award_user_unchecked(text, text, text, text) from public, anon, authenticated;
create function public.staff_award_user(target_username text, award_name text, award_reason text, award_evidence text default '')
returns bigint language plpgsql security definer set search_path = public, pg_temp
as $$
declare target uuid;
begin
  if not public.has_staff_permission('awards') then raise exception 'Award management access is required'; end if;
  select id into target from public.profiles where lower(username) = lower(trim(target_username));
  if public.gb_staff_conflicts_user(target) then raise exception 'You cannot award yourself or a teammate'; end if;
  if exists (select 1 from public.staff_award_catalog where name = trim(award_name) and exclusive)
    and not exists (select 1 from public.profiles where id = auth.uid() and role = 'owner') then
    raise exception 'Only an Owner can grant exclusive awards';
  end if;
  return public.gb_staff_award_user_unchecked(target_username, award_name, award_reason, award_evidence);
end;
$$;
revoke all on function public.staff_award_user(text, text, text, text) from public, anon;
grant execute on function public.staff_award_user(text, text, text, text) to authenticated;

alter function public.staff_award_team(uuid, text, text, text) rename to gb_staff_award_team_unchecked;
revoke all on function public.gb_staff_award_team_unchecked(uuid, text, text, text) from public, anon, authenticated;
create function public.staff_award_team(target_team_id uuid, award_name text, award_reason text, award_evidence text default '')
returns bigint language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  if not public.has_staff_permission('awards') then raise exception 'Award management access is required'; end if;
  if public.gb_staff_conflicts_team(target_team_id) then raise exception 'You cannot award your own team'; end if;
  if exists (select 1 from public.staff_award_catalog where name = trim(award_name) and exclusive)
    and not exists (select 1 from public.profiles where id = auth.uid() and role = 'owner') then
    raise exception 'Only an Owner can grant exclusive awards';
  end if;
  return public.gb_staff_award_team_unchecked(target_team_id, award_name, award_reason, award_evidence);
end;
$$;
revoke all on function public.staff_award_team(uuid, text, text, text) from public, anon;
grant execute on function public.staff_award_team(uuid, text, text, text) to authenticated;

alter function public.staff_revoke_award(bigint, text) rename to gb_staff_revoke_award_unchecked;
revoke all on function public.gb_staff_revoke_award_unchecked(bigint, text) from public, anon, authenticated;
create function public.staff_revoke_award(award_record_id bigint, revoke_reason text)
returns void language plpgsql security definer set search_path = public, pg_temp
as $$
declare a public.staff_user_awards%rowtype;
begin
  if not public.has_staff_permission('awards') then raise exception 'Award management access is required'; end if;
  select * into a from public.staff_user_awards where id = award_record_id for update;
  if not found then raise exception 'Award not found'; end if;
  if public.gb_staff_conflicts_user(a.recipient_id) or public.gb_staff_conflicts_team(a.recipient_team_id) then
    raise exception 'You cannot change an award involving yourself or your team';
  end if;
  if exists (select 1 from public.staff_award_catalog where id = a.award_id and exclusive)
    and not exists (select 1 from public.profiles where id = auth.uid() and role = 'owner') then
    raise exception 'Only an Owner can revoke exclusive awards';
  end if;
  perform public.gb_staff_revoke_award_unchecked(award_record_id, revoke_reason);
end;
$$;
revoke all on function public.staff_revoke_award(bigint, text) from public, anon;
grant execute on function public.staff_revoke_award(bigint, text) to authenticated;

alter function public.staff_review_award_request(bigint, boolean, text) rename to gb_staff_review_award_unchecked;
revoke all on function public.gb_staff_review_award_unchecked(bigint, boolean, text) from public, anon, authenticated;
create function public.staff_review_award_request(award_request_id bigint, approve_request boolean, decision_reason text)
returns void language plpgsql security definer set search_path = public, pg_temp
as $$
declare r public.staff_award_requests%rowtype; award_name text; recipient_username text;
begin
  if not public.has_staff_permission('awards') then raise exception 'Award management access is required'; end if;
  select * into r from public.staff_award_requests where id = award_request_id for update;
  if not found or r.status <> 'pending' then raise exception 'Pending award request not found'; end if;
  if approve_request is null or length(trim(coalesce(decision_reason, ''))) not between 10 and 1000 then
    raise exception 'Choose a decision and enter a reason between 10 and 1000 characters';
  end if;
  if public.gb_staff_conflicts_user(r.requested_by) or public.gb_staff_conflicts_user(r.recipient_id)
    or public.gb_staff_conflicts_team(r.recipient_team_id) then
    raise exception 'Another staff member must review this award request';
  end if;
  if approve_request then
    select name into award_name from public.staff_award_catalog where id = r.award_id;
    if r.recipient_id is not null then
      select username into recipient_username from public.profiles where id = r.recipient_id;
      perform public.staff_award_user(recipient_username, award_name, r.reason, r.evidence);
    else
      perform public.staff_award_team(r.recipient_team_id, award_name, r.reason, r.evidence);
    end if;
  end if;
  update public.staff_award_requests set status = case when approve_request then 'approved' else 'rejected' end,
    reviewed_by = auth.uid(), reviewed_at = now() where id = award_request_id;
  insert into public.staff_activity_log(actor_id, action, target_type, target_id, previous_values, new_values, reason)
    values (auth.uid(), 'award_request_reviewed', 'award_request', award_request_id::text,
      jsonb_build_object('status', 'pending'),
      jsonb_build_object('status', case when approve_request then 'approved' else 'rejected' end), trim(decision_reason));
end;
$$;
revoke all on function public.staff_review_award_request(bigint, boolean, text) from public, anon;
grant execute on function public.staff_review_award_request(bigint, boolean, text) to authenticated;

alter function public.staff_review_bug_finder_report(bigint, text, text) rename to gb_staff_review_bug_unchecked;
revoke all on function public.gb_staff_review_bug_unchecked(bigint, text, text) from public, anon, authenticated;
create function public.staff_review_bug_finder_report(p_report_id bigint, p_result text, p_review_reason text)
returns void language plpgsql security definer set search_path = public, pg_temp
as $$
declare reporter uuid;
begin
  if not public.has_staff_permission('awards') then raise exception 'Award management access is required'; end if;
  select reporter_id into reporter from public.community_bug_reports where id = p_report_id for update;
  if not found then raise exception 'Bug report not found'; end if;
  if public.gb_staff_conflicts_user(reporter) then raise exception 'Another staff member must review this report'; end if;
  perform public.gb_staff_review_bug_unchecked(p_report_id, p_result, p_review_reason);
end;
$$;
revoke all on function public.staff_review_bug_finder_report(bigint, text, text) from public, anon;
grant execute on function public.staff_review_bug_finder_report(bigint, text, text) to authenticated;

drop policy if exists forum_posts_delete on public.forum_posts;
create policy forum_posts_delete on public.forum_posts for delete to authenticated
  using (user_id = auth.uid() or public.has_staff_permission('staff_access'));

revoke update on public.forum_posts, public.forum_replies, public.forum_reports from public, anon, authenticated;
grant update (pinned, locked, hidden) on public.forum_posts to authenticated;
grant update (hidden) on public.forum_replies to authenticated;
grant update (resolved) on public.forum_reports to authenticated;

create function public.gb_guard_forum_moderation()
returns trigger language plpgsql security definer set search_path = public, pg_temp
as $$
declare author_id uuid;
begin
  if auth.uid() is null then
    if tg_op = 'DELETE' then return old; else return new; end if;
  end if;
  if tg_table_name = 'forum_reports' then
    if not public.has_staff_permission('basic_moderation') then raise exception 'Moderation access is required'; end if;
    if old.target_type = 'post' then
      select user_id into author_id from public.forum_posts where id = old.target_id;
    else
      select user_id into author_id from public.forum_replies where id = old.target_id;
    end if;
    if public.gb_staff_conflicts_user(old.reporter_id) or public.gb_staff_conflicts_user(author_id) then
      raise exception 'Another staff member must handle this report';
    end if;
    insert into public.staff_activity_log(actor_id, action, target_type, target_id, previous_values, new_values, reason)
      values (auth.uid(), 'forum_report_updated', 'forum_report', old.id::text,
        jsonb_build_object('resolved', old.resolved), jsonb_build_object('resolved', new.resolved),
        'Forum report status changed');
    return new;
  end if;
  if tg_op = 'UPDATE' then
    if tg_table_name = 'forum_posts' then
      if (new.pinned, new.locked, new.hidden) is not distinct from (old.pinned, old.locked, old.hidden) then return new; end if;
    elsif new.hidden is not distinct from old.hidden then
      return new;
    end if;
  elsif tg_op = 'DELETE' and (old.user_id = auth.uid() or pg_trigger_depth() > 1) then
    return old;
  end if;
  if not public.has_staff_permission('basic_moderation') then raise exception 'Moderation access is required'; end if;
  if public.gb_staff_conflicts_user(old.user_id) then raise exception 'Another staff member must moderate this content'; end if;
  if tg_table_name = 'forum_posts' then
    if tg_op = 'DELETE' and not public.has_staff_permission('staff_access') then
      raise exception 'Only an Administrator or Owner can delete another player''s thread';
    end if;
    if tg_op = 'UPDATE' then
      if (new.pinned, new.locked) is distinct from (old.pinned, old.locked)
        and not public.has_staff_permission('staff_access') then
        raise exception 'Only an Administrator or Owner can pin or lock a thread';
      end if;
    end if;
  end if;
  insert into public.staff_activity_log(actor_id, action, target_type, target_id, previous_values, new_values, reason)
    values (auth.uid(), 'forum_content_' || lower(tg_op), tg_table_name, old.id::text,
      to_jsonb(old), case when tg_op = 'UPDATE' then to_jsonb(new) else null end, 'Forum content moderated');
  if tg_op = 'DELETE' then return old; else return new; end if;
end;
$$;
revoke all on function public.gb_guard_forum_moderation() from public, anon, authenticated;
create trigger staff_guard_forum_posts before update or delete on public.forum_posts
  for each row execute function public.gb_guard_forum_moderation();
create trigger staff_guard_forum_replies before update or delete on public.forum_replies
  for each row execute function public.gb_guard_forum_moderation();
create trigger staff_guard_forum_reports before update on public.forum_reports
  for each row execute function public.gb_guard_forum_moderation();

alter function public.staff_review_team_name_request(uuid, text, text) rename to gb_staff_review_team_name_unchecked;
revoke all on function public.gb_staff_review_team_name_unchecked(uuid, text, text) from public, anon, authenticated;
create function public.staff_review_team_name_request(p_request_id uuid, p_decision text, p_note text default '')
returns void language plpgsql security definer set search_path = public, pg_temp
as $$
declare r public.team_name_change_requests%rowtype;
begin
  if not public.has_staff_permission('team_enforcement') then raise exception 'Team management access is required'; end if;
  select * into r from public.team_name_change_requests where id = p_request_id for update;
  if not found then raise exception 'Request not found'; end if;
  if public.gb_staff_conflicts_team(r.team_id) or public.gb_staff_conflicts_user(r.requested_by) then
    raise exception 'Another staff member must review this request';
  end if;
  perform public.gb_staff_review_team_name_unchecked(p_request_id, p_decision, p_note);
end;
$$;
revoke all on function public.staff_review_team_name_request(uuid, text, text) from public, anon;
grant execute on function public.staff_review_team_name_request(uuid, text, text) to authenticated;

alter function public.staff_apply_team_name_request(uuid) rename to gb_staff_apply_team_name_unchecked;
revoke all on function public.gb_staff_apply_team_name_unchecked(uuid) from public, anon, authenticated;
create function public.staff_apply_team_name_request(p_request_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp
as $$
declare r public.team_name_change_requests%rowtype;
begin
  if not public.has_staff_permission('team_enforcement') then raise exception 'Team management access is required'; end if;
  select * into r from public.team_name_change_requests where id = p_request_id for update;
  if not found then raise exception 'Request not found'; end if;
  if public.gb_staff_conflicts_team(r.team_id) or public.gb_staff_conflicts_user(r.requested_by) then
    raise exception 'Another staff member must apply this request';
  end if;
  perform public.gb_staff_apply_team_name_unchecked(p_request_id);
end;
$$;
revoke all on function public.staff_apply_team_name_request(uuid) from public, anon;
grant execute on function public.staff_apply_team_name_request(uuid) to authenticated;

alter function public.staff_review_community_suggestion(bigint) rename to gb_staff_review_suggestion_unchecked;
revoke all on function public.gb_staff_review_suggestion_unchecked(bigint) from public, anon, authenticated;
create function public.staff_review_community_suggestion(p_suggestion_id bigint)
returns void language plpgsql security definer set search_path = public, pg_temp
as $$
declare submitter uuid;
begin
  if not public.has_staff_permission('staff_reports') then raise exception 'Feedback access is required'; end if;
  select submitter_id into submitter from public.community_suggestions where id = p_suggestion_id for update;
  if not found then raise exception 'Suggestion not found'; end if;
  if public.gb_staff_conflicts_user(submitter) then raise exception 'Another staff member must review this suggestion'; end if;
  perform public.gb_staff_review_suggestion_unchecked(p_suggestion_id);
end;
$$;
revoke all on function public.staff_review_community_suggestion(bigint) from public, anon;
grant execute on function public.staff_review_community_suggestion(bigint) to authenticated;

alter function public.moderate_match_comment(uuid, text) rename to gb_moderate_match_comment_unchecked;
revoke all on function public.gb_moderate_match_comment_unchecked(uuid, text) from public, anon, authenticated;
create function public.moderate_match_comment(comment_uuid uuid, moderation_action text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp
as $$
declare c public.match_comments%rowtype; result jsonb;
begin
  if not public.has_staff_permission('basic_moderation') then raise exception 'Moderation access is required'; end if;
  select * into c from public.match_comments where id = comment_uuid for update;
  if not found then raise exception 'Comment not found'; end if;
  if public.gb_staff_conflicts_user(c.user_id) or public.gb_staff_conflicts_match(c.match_id) then
    raise exception 'Another staff member must moderate this comment';
  end if;
  result := public.gb_moderate_match_comment_unchecked(comment_uuid, moderation_action);
  if (result->>'ok')::boolean then
    insert into public.staff_activity_log(actor_id, action, target_type, target_id, new_values, reason)
      values (auth.uid(), 'match_comment_moderated', 'match_comment', comment_uuid::text,
        jsonb_build_object('action', moderation_action), 'Match comment moderated');
  end if;
  return result;
end;
$$;
revoke all on function public.moderate_match_comment(uuid, text) from public, anon;
grant execute on function public.moderate_match_comment(uuid, text) to authenticated;

create function public.gb_guard_staff_tournament()
returns trigger language plpgsql security definer set search_path = public, pg_temp
as $$
declare is_owner boolean;
begin
  if auth.uid() is null then
    if tg_op = 'DELETE' then return old; else return new; end if;
  end if;
  select role = 'owner' into is_owner from public.profiles where id = auth.uid();
  if not public.has_staff_permission('staff_access') then raise exception 'Tournament management access is required'; end if;
  if tg_op in ('UPDATE', 'DELETE') and exists (
    select 1 from public.tournament_registrations r
    where r.tournament_id = old.id and public.gb_staff_conflicts_team(r.team_id)
  ) then
    raise exception 'Another staff member must manage a tournament involving your team';
  end if;
  if not coalesce(is_owner, false) then
    if tg_op = 'INSERT' then
      if new.created_by is distinct from auth.uid() or coalesce(new.entry_fee, 0) <> 0
        or coalesce(new.entry_fee_credits, 0) <> 0 or coalesce(new.prize_credits, 0) <> 0
        or coalesce(new.prize_per_player, false) or nullif(trim(new.prize), '') is not null
        or not new.is_free or new.competition_type = 'weekly_cup' then
        raise exception 'Only an Owner can set tournament fees and prizes';
      end if;
    elsif tg_op = 'UPDATE' then
      if (new.entry_fee, new.entry_fee_credits, new.prize_credits, new.prize_per_player, new.prize, new.is_free, new.created_by, new.competition_type)
        is distinct from
        (old.entry_fee, old.entry_fee_credits, old.prize_credits, old.prize_per_player, old.prize, old.is_free, old.created_by, old.competition_type) then
        raise exception 'Only an Owner can change tournament fees and prizes';
      end if;
    elsif old.competition_type = 'weekly_cup' or coalesce(old.entry_fee, 0) <> 0
      or coalesce(old.entry_fee_credits, 0) <> 0 or coalesce(old.prize_credits, 0) <> 0
      or nullif(trim(old.prize), '') is not null then
      raise exception 'Only an Owner can delete tournaments with fees or prizes';
    end if;
  end if;
  insert into public.staff_activity_log(actor_id, action, target_type, target_id, previous_values, new_values, reason)
    values (auth.uid(), 'tournament_' || lower(tg_op), 'tournament',
      case when tg_op = 'DELETE' then old.id::text else new.id::text end,
      case when tg_op = 'INSERT' then null else to_jsonb(old) end,
      case when tg_op = 'DELETE' then null else to_jsonb(new) end, 'Tournament updated');
  if tg_op = 'DELETE' then return old; else return new; end if;
end;
$$;
revoke all on function public.gb_guard_staff_tournament() from public, anon, authenticated;
create trigger staff_guard_tournament before insert or update or delete on public.tournaments
  for each row execute function public.gb_guard_staff_tournament();
revoke delete on public.tournament_registrations from public, anon, authenticated;
revoke truncate, references, trigger on public.tournaments, public.tournament_registrations,
  public.tournament_matches, public.forum_posts, public.forum_replies, public.forum_reports,
  public.user_sanctions, public.staff_activity_log, public.boost_flags from public, anon, authenticated;

alter function public.set_tournament_match_winner(uuid, uuid) rename to gb_set_tournament_winner_unchecked;
revoke all on function public.gb_set_tournament_winner_unchecked(uuid, uuid) from public, anon, authenticated;
create function public.set_tournament_match_winner(p_match uuid, p_winner uuid)
returns void language plpgsql security definer set search_path = public, pg_temp
as $$
declare m public.tournament_matches%rowtype;
begin
  if not public.has_staff_permission('staff_access') then raise exception 'Tournament management access is required'; end if;
  select * into m from public.tournament_matches where id = p_match for update;
  if not found then raise exception 'Tournament match not found'; end if;
  if public.gb_staff_conflicts_team(m.team_a) or public.gb_staff_conflicts_team(m.team_b) then
    raise exception 'Another staff member must decide a match involving your team';
  end if;
  perform public.gb_set_tournament_winner_unchecked(p_match, p_winner);
  insert into public.staff_activity_log(actor_id, action, target_type, target_id, previous_values, new_values, reason)
    values (auth.uid(), 'tournament_match_decided', 'tournament_match', p_match::text,
      jsonb_build_object('winner', m.winner_id), jsonb_build_object('winner', p_winner), 'Tournament result decided');
end;
$$;
revoke all on function public.set_tournament_match_winner(uuid, uuid) from public, anon;
grant execute on function public.set_tournament_match_winner(uuid, uuid) to authenticated;

alter function public.generate_tournament_bracket(uuid) rename to gb_generate_bracket_unchecked;
revoke all on function public.gb_generate_bracket_unchecked(uuid) from public, anon, authenticated;
create function public.generate_tournament_bracket(p_tournament uuid)
returns void language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  if not public.has_staff_permission('staff_access') then raise exception 'Tournament management access is required'; end if;
  if exists (select 1 from public.tournament_registrations where tournament_id = p_tournament and public.gb_staff_conflicts_team(team_id)) then
    raise exception 'Another staff member must create the bracket for a tournament involving your team';
  end if;
  perform public.gb_generate_bracket_unchecked(p_tournament);
  insert into public.staff_activity_log(actor_id, action, target_type, target_id, reason)
    values (auth.uid(), 'tournament_bracket_generated', 'tournament', p_tournament::text, 'Tournament bracket generated');
end;
$$;
revoke all on function public.generate_tournament_bracket(uuid) from public, anon;
grant execute on function public.generate_tournament_bracket(uuid) to authenticated;

alter function public.reset_tournament_bracket(uuid) rename to gb_reset_bracket_unchecked;
revoke all on function public.gb_reset_bracket_unchecked(uuid) from public, anon, authenticated;
create function public.reset_tournament_bracket(p_tournament uuid)
returns void language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  if not public.has_staff_permission('staff_access') then raise exception 'Tournament management access is required'; end if;
  if exists (select 1 from public.tournament_registrations where tournament_id = p_tournament and public.gb_staff_conflicts_team(team_id)) then
    raise exception 'Another staff member must reset a bracket involving your team';
  end if;
  perform public.gb_reset_bracket_unchecked(p_tournament);
  insert into public.staff_activity_log(actor_id, action, target_type, target_id, reason)
    values (auth.uid(), 'tournament_bracket_reset', 'tournament', p_tournament::text, 'Tournament bracket reset');
end;
$$;
revoke all on function public.reset_tournament_bracket(uuid) from public, anon;
grant execute on function public.reset_tournament_bracket(uuid) to authenticated;

create function public.staff_recommend_award(
  p_award_name text, p_target_name text, p_target_type text, p_reason text, p_evidence text default ''
)
returns bigint language plpgsql security definer set search_path = public, pg_temp
as $$
declare award_id bigint; recipient uuid; team uuid; request_id bigint;
begin
  if not public.has_staff_permission('award_recommendation') then raise exception 'Staff access is required'; end if;
  if coalesce(p_target_type, '') not in ('player', 'team') or length(trim(coalesce(p_reason, ''))) not between 10 and 1000
    or length(coalesce(p_evidence, '')) > 5000 then raise exception 'Enter a valid recipient and reason'; end if;
  select id into award_id from public.staff_award_catalog where name = trim(p_award_name);
  if award_id is null then raise exception 'Award not found'; end if;
  if p_target_type = 'player' then
    select id into recipient from public.profiles where lower(username) = lower(trim(p_target_name));
    if recipient is null then raise exception 'Player not found'; end if;
  else
    select id into team from public.teams where lower(name) = lower(trim(p_target_name));
    if team is null then raise exception 'Team not found'; end if;
  end if;
  if public.gb_staff_conflicts_user(recipient) or public.gb_staff_conflicts_team(team) then
    raise exception 'You cannot recommend yourself or your own team';
  end if;
  insert into public.staff_award_requests(award_id, requested_by, recipient_id, recipient_team_id, reason, evidence)
    values (award_id, auth.uid(), recipient, team, trim(p_reason), trim(coalesce(p_evidence, '')))
    returning id into request_id;
  insert into public.staff_activity_log(actor_id, action, target_type, target_id, new_values, reason)
    values (auth.uid(), 'award_recommended', 'award_request', request_id::text,
      jsonb_build_object('award_id', award_id, 'recipient_id', recipient, 'team_id', team), trim(p_reason));
  return request_id;
end;
$$;
revoke all on function public.staff_recommend_award(text, text, text, text, text) from public, anon;
grant execute on function public.staff_recommend_award(text, text, text, text, text) to authenticated;

create or replace function public.staff_list_award_requests()
returns setof jsonb language sql stable security definer set search_path = public, pg_temp
as $$
  select jsonb_build_object('id', r.id, 'award_name', c.name, 'exclusive', c.exclusive,
    'requested_by', requester.username, 'recipient_username', coalesce(recipient.username, t.name),
    'reason', r.reason, 'evidence', r.evidence, 'status', r.status, 'created_at', r.created_at)
  from public.staff_award_requests r
  join public.staff_award_catalog c on c.id = r.award_id
  join public.profiles requester on requester.id = r.requested_by
  left join public.profiles recipient on recipient.id = r.recipient_id
  left join public.teams t on t.id = r.recipient_team_id
  where public.has_staff_permission('awards') order by r.created_at;
$$;

create table public.staff_site_change_requests (
  id bigint generated always as identity primary key,
  requested_by uuid not null references public.profiles(id),
  description text not null check (length(trim(description)) between 10 and 2000),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references public.profiles(id),
  decision_reason text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);
alter table public.staff_site_change_requests enable row level security;
revoke all on public.staff_site_change_requests from public, anon, authenticated;
grant select on public.staff_site_change_requests to authenticated;
create policy staff_site_change_requests_read on public.staff_site_change_requests for select to authenticated
  using (public.has_staff_permission('staff_access'));

create function public.staff_request_site_change(p_description text)
returns bigint language plpgsql security definer set search_path = public, pg_temp
as $$
declare request_id bigint;
begin
  if not public.has_staff_permission('staff_access') then raise exception 'Administrator access is required'; end if;
  if length(trim(coalesce(p_description, ''))) not between 10 and 2000 then
    raise exception 'Enter a description between 10 and 2000 characters';
  end if;
  insert into public.staff_site_change_requests(requested_by, description)
    values (auth.uid(), trim(p_description)) returning id into request_id;
  insert into public.staff_activity_log(actor_id, action, target_type, target_id, reason)
    values (auth.uid(), 'site_change_requested', 'site_change_request', request_id::text, 'Site change requested');
  return request_id;
end;
$$;
revoke all on function public.staff_request_site_change(text) from public, anon;
grant execute on function public.staff_request_site_change(text) to authenticated;

create function public.staff_review_site_change(p_request_id bigint, p_approve boolean, p_reason text)
returns void language plpgsql security definer set search_path = public, pg_temp
as $$
declare r public.staff_site_change_requests%rowtype;
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'owner') then
    raise exception 'Only an Owner can review site change requests';
  end if;
  if p_approve is null or length(trim(coalesce(p_reason, ''))) not between 10 and 1000 then
    raise exception 'Choose a decision and enter a reason between 10 and 1000 characters';
  end if;
  select * into r from public.staff_site_change_requests where id = p_request_id for update;
  if not found or r.status <> 'pending' then raise exception 'Pending request not found'; end if;
  if public.gb_staff_conflicts_user(r.requested_by) then raise exception 'Another Owner must review this request'; end if;
  update public.staff_site_change_requests set status = case when p_approve then 'approved' else 'rejected' end,
    reviewed_by = auth.uid(), reviewed_at = now(), decision_reason = trim(p_reason) where id = p_request_id;
  insert into public.staff_activity_log(actor_id, action, target_type, target_id, previous_values, new_values, reason)
    values (auth.uid(), 'site_change_reviewed', 'site_change_request', p_request_id::text,
      jsonb_build_object('status', 'pending'),
      jsonb_build_object('status', case when p_approve then 'approved' else 'rejected' end), trim(p_reason));
end;
$$;
revoke all on function public.staff_review_site_change(bigint, boolean, text) from public, anon;
grant execute on function public.staff_review_site_change(bigint, boolean, text) to authenticated;

notify pgrst, 'reload schema';
