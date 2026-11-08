create table public.team_name_change_requests (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  requested_by uuid references auth.users(id) on delete set null,
  old_name text not null,
  requested_name text not null,
  reason text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'completed')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  review_note text,
  completed_at timestamptz,
  completed_by uuid references auth.users(id) on delete set null
);

create unique index team_name_change_one_open_per_team
  on public.team_name_change_requests (team_id)
  where status in ('pending', 'approved');

alter table public.team_name_change_requests enable row level security;
revoke all on public.team_name_change_requests from public, anon, authenticated;

create or replace function public.gb_guard_team_name()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if new.name is distinct from old.name and auth.uid() is not null then
    if current_user not in ('postgres', 'supabase_admin', 'service_role')
       or not public.has_staff_permission('team_enforcement')
       or not exists (
         select 1 from public.team_name_change_requests r
         where r.team_id = old.id and r.status = 'approved'
           and r.old_name = old.name and r.requested_name = new.name
       ) then
      raise exception 'Team name changes require an approved staff request.';
    end if;
  end if;
  return new;
end;
$$;

create trigger teams_guard_name before update of name on public.teams
  for each row execute function public.gb_guard_team_name();

create or replace function public.request_team_name_change(p_team_id uuid, p_name text, p_reason text)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_team public.teams%rowtype;
  v_id uuid;
  v_name text := trim(coalesce(p_name, ''));
  v_reason text := trim(coalesce(p_reason, ''));
begin
  if auth.uid() is null then raise exception 'Sign in to request a team name change.'; end if;
  select * into v_team from public.teams where id = p_team_id for update;
  if not found or v_team.owner_id is distinct from auth.uid() then
    raise exception 'Only the team leader can request a name change.';
  end if;
  if length(v_name) not between 4 and 100 then raise exception 'Team name must be between 4 and 100 characters.'; end if;
  if length(v_reason) not between 1 and 1000 then raise exception 'Please provide a reason of up to 1,000 characters.'; end if;
  if lower(v_name) = lower(trim(v_team.name)) then raise exception 'Choose a different team name.'; end if;
  if exists (select 1 from public.teams where lower(trim(name)) = lower(v_name) and id <> p_team_id) then
    raise exception 'That team name is already taken.';
  end if;
  if exists (select 1 from public.team_name_change_requests where team_id = p_team_id and status in ('pending', 'approved')) then
    raise exception 'This team already has an open name change request.';
  end if;
  insert into public.team_name_change_requests(team_id, requested_by, old_name, requested_name, reason)
    values (p_team_id, auth.uid(), v_team.name, v_name, v_reason) returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.team_name_change_history(p_team_id uuid)
returns table(id uuid, old_name text, requested_name text, reason text, status text, review_note text, created_at timestamptz)
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if auth.uid() is null or not exists (select 1 from public.teams where teams.id = p_team_id and owner_id = auth.uid()) then
    raise exception 'Only the team leader can view these requests.';
  end if;
  return query select r.id, r.old_name, r.requested_name, r.reason, r.status, r.review_note, r.created_at
    from public.team_name_change_requests r where r.team_id = p_team_id order by r.created_at desc limit 20;
end;
$$;

create or replace function public.staff_team_name_requests()
returns table(id uuid, team_id uuid, old_name text, requested_name text, reason text, status text, created_at timestamptz, requester text)
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if auth.uid() is null or not public.has_staff_permission('team_enforcement') then raise exception 'Staff team-management access required.'; end if;
  return query select r.id, r.team_id, r.old_name, r.requested_name, r.reason, r.status, r.created_at, coalesce(p.username, 'Former member')
    from public.team_name_change_requests r left join public.profiles p on p.id = r.requested_by
    where r.status in ('pending', 'approved') order by r.created_at;
end;
$$;

create or replace function public.staff_review_team_name_request(p_request_id uuid, p_decision text, p_note text default '')
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_request public.team_name_change_requests%rowtype;
begin
  if auth.uid() is null or not public.has_staff_permission('team_enforcement') then raise exception 'Staff team-management access required.'; end if;
  if p_decision not in ('approved', 'rejected') then raise exception 'Invalid review decision.'; end if;
  if length(trim(coalesce(p_note, ''))) > 1000 then raise exception 'Review note is too long.'; end if;
  select * into v_request from public.team_name_change_requests where id = p_request_id for update;
  if not found or (v_request.status <> 'pending' and not (v_request.status = 'approved' and p_decision = 'rejected')) then
    raise exception 'This request is no longer awaiting review.';
  end if;
  update public.team_name_change_requests set status = p_decision, reviewed_by = auth.uid(), reviewed_at = now(), review_note = nullif(trim(p_note), '') where id = p_request_id;
  insert into public.staff_audit_log(actor_id, action, details) values (auth.uid(), 'team_name_request_' || p_decision, jsonb_build_object('request_id', p_request_id, 'team_id', v_request.team_id, 'old_name', v_request.old_name, 'requested_name', v_request.requested_name, 'note', nullif(trim(p_note), '')));
  perform public.gb_notify(v_request.requested_by, 'Team name change ' || p_decision,
    case when p_decision = 'approved' then 'Your request was approved. Staff will apply the change.' else 'Your team name change request was declined.' end
    || case when nullif(trim(p_note), '') is not null then ' Staff note: ' || trim(p_note) else '' end, 'team', v_request.team_id);
end;
$$;

create or replace function public.staff_apply_team_name_request(p_request_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_request public.team_name_change_requests%rowtype; v_current text;
begin
  if auth.uid() is null or not public.has_staff_permission('team_enforcement') then raise exception 'Staff team-management access required.'; end if;
  select * into v_request from public.team_name_change_requests where id = p_request_id for update;
  if not found or v_request.status <> 'approved' then raise exception 'This request must be approved before it can be applied.'; end if;
  select name into v_current from public.teams where id = v_request.team_id for update;
  if not found or v_current is distinct from v_request.old_name then raise exception 'The team name changed since this request was submitted.'; end if;
  perform pg_advisory_xact_lock(hashtextextended(lower(trim(v_request.requested_name)), 0));
  if exists (select 1 from public.teams where lower(trim(name)) = lower(trim(v_request.requested_name)) and id <> v_request.team_id) then
    raise exception 'That team name is already taken. Reject the request and ask the leader to choose another name.';
  end if;
  update public.teams set name = v_request.requested_name where id = v_request.team_id;
  update public.team_name_change_requests set status = 'completed', completed_by = auth.uid(), completed_at = now() where id = p_request_id;
  insert into public.staff_audit_log(actor_id, action, details) values (auth.uid(), 'team_name_request_completed', jsonb_build_object('request_id', p_request_id, 'team_id', v_request.team_id, 'old_name', v_request.old_name, 'new_name', v_request.requested_name));
  perform public.gb_notify(v_request.requested_by, 'Team name changed', 'Staff changed your team name to ' || v_request.requested_name || '.', 'team', v_request.team_id);
end;
$$;

revoke all on function public.request_team_name_change(uuid, text, text), public.team_name_change_history(uuid), public.staff_team_name_requests(), public.staff_review_team_name_request(uuid, text, text), public.staff_apply_team_name_request(uuid) from public, anon;
grant execute on function public.request_team_name_change(uuid, text, text), public.team_name_change_history(uuid), public.staff_team_name_requests(), public.staff_review_team_name_request(uuid, text, text), public.staff_apply_team_name_request(uuid) to authenticated;

with site_updates as (
  select id from public.forum_posts where author = 'Prime' and category = 'News & Updates' and pinned and not hidden and subject ilike '%Site Updates%' order by created_at desc limit 1
)
update public.forum_posts p set message = concat_ws(E'\n\n', nullif(trim(p.message), ''), 'Team leaders can now request a team name change for staff review. Approved changes are applied by staff.')
from site_updates where p.id = site_updates.id and coalesce(p.message, '') not like '%Team leaders can now request a team name change%';
