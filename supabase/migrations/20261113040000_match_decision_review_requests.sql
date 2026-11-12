alter table public.staff_match_review_decisions add column decider_role_at_time text;

create function public.gb_record_match_decider_role()
returns trigger language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  select role into new.decider_role_at_time from public.profiles where id = new.referee_id;
  return new;
end;
$$;
revoke all on function public.gb_record_match_decider_role() from public, anon, authenticated;
create trigger staff_match_decider_role before insert on public.staff_match_review_decisions
  for each row execute function public.gb_record_match_decider_role();

create table public.match_decision_review_requests (
  id bigint generated always as identity primary key,
  decision_id uuid not null references public.staff_match_review_decisions(id),
  team_id uuid not null references public.teams(id),
  submitted_by uuid not null references public.profiles(id),
  reason text not null check (length(trim(reason)) between 10 and 2000),
  status text not null default 'pending' check (status in ('pending', 'reviewed')),
  reviewed_by uuid references public.profiles(id),
  review_note text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  unique (decision_id, team_id)
);

alter table public.match_decision_review_requests enable row level security;
revoke all on public.match_decision_review_requests from public, anon, authenticated;

create function public.match_decision_review_status(p_match_id uuid, p_team_id uuid)
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp
as $$
declare m public.matches%rowtype; d public.staff_match_review_decisions%rowtype; r public.match_decision_review_requests%rowtype;
begin
  if auth.uid() is null then raise exception 'Sign in to check review requests'; end if;
  select * into m from public.matches where id = p_match_id;
  if not found or p_team_id is null
    or (p_team_id is distinct from m.posting_team_id and p_team_id is distinct from m.accepting_team_id)
    or not (
      exists (select 1 from public.team_members where team_id = p_team_id and user_id = auth.uid())
      or exists (select 1 from public.teams where id = p_team_id and owner_id = auth.uid())
    ) then
    raise exception 'You must belong to a team in this match';
  end if;
  select * into d from public.staff_match_review_decisions where match_id = p_match_id;
  if not found then return jsonb_build_object('eligible', false); end if;
  select * into r from public.match_decision_review_requests where decision_id = d.id and team_id = p_team_id;
  return jsonb_build_object(
    'eligible', true, 'status', r.status, 'reason', r.reason, 'review_note', r.review_note,
    'decision_reason', d.decision_note, 'posting_score', d.official_posting_score,
    'accepting_score', d.official_accepting_score
  );
end;
$$;
revoke all on function public.match_decision_review_status(uuid, uuid) from public, anon;
grant execute on function public.match_decision_review_status(uuid, uuid) to authenticated;

create function public.request_match_decision_review(p_match_id uuid, p_team_id uuid, p_reason text)
returns bigint language plpgsql security definer set search_path = public, pg_temp
as $$
declare d public.staff_match_review_decisions%rowtype; request_id bigint;
begin
  if length(trim(coalesce(p_reason, ''))) not between 10 and 2000 then
    raise exception 'Enter a reason between 10 and 2000 characters';
  end if;
  if not coalesce((public.match_decision_review_status(p_match_id, p_team_id)->>'eligible')::boolean, false) then
    raise exception 'This match does not have a staff decision to review';
  end if;
  select * into d from public.staff_match_review_decisions where match_id = p_match_id;
  insert into public.match_decision_review_requests(decision_id, team_id, submitted_by, reason)
    values (d.id, p_team_id, auth.uid(), trim(p_reason))
    on conflict (decision_id, team_id) do nothing returning id into request_id;
  if request_id is null then raise exception 'Your team has already requested a review of this decision'; end if;
  return request_id;
end;
$$;
revoke all on function public.request_match_decision_review(uuid, uuid, text) from public, anon;
grant execute on function public.request_match_decision_review(uuid, uuid, text) to authenticated;

create function public.staff_list_match_decision_reviews()
returns setof jsonb language plpgsql stable security definer set search_path = public, pg_temp
as $$
begin
  if not public.has_staff_permission('staff_access') then raise exception 'Administrator access is required'; end if;
  return query
    select jsonb_build_object(
      'id', r.id, 'match_id', d.match_id, 'team_name', t.name,
      'submitted_by', p.username, 'reason', r.reason, 'status', r.status,
      'created_at', r.created_at, 'decision_reason', d.decision_note,
      'posting_score', d.official_posting_score, 'accepting_score', d.official_accepting_score,
      'decided_by', decider.username, 'review_note', r.review_note,
      'can_review', r.status = 'pending' and (
        exists (select 1 from public.profiles actor where actor.id = auth.uid() and actor.role = 'owner')
        or d.decider_role_at_time in ('staff', 'senior_staff', 'referee')
      ),
      'submissions', coalesce((
        select jsonb_agg(jsonb_build_object(
          'team_name', submission_team.name,
          'reason', ticket.dispute_reason,
          'description', ticket.dispute_description,
          'evidence_paths', ticket.evidence_paths
        ) order by ticket.id)
        from public.dispute_tickets ticket
        left join public.teams submission_team on submission_team.id = ticket.team_id
        where ticket.match_id = d.match_id
      ), '[]'::jsonb)
    )
    from public.match_decision_review_requests r
    join public.staff_match_review_decisions d on d.id = r.decision_id
    join public.teams t on t.id = r.team_id
    join public.profiles p on p.id = r.submitted_by
    join public.profiles decider on decider.id = d.referee_id
    where not public.gb_staff_conflicts_match(d.match_id)
      and d.referee_id <> auth.uid()
    order by case when r.status = 'pending' then 0 else 1 end, r.created_at desc;
end;
$$;
revoke all on function public.staff_list_match_decision_reviews() from public, anon;
grant execute on function public.staff_list_match_decision_reviews() to authenticated;

create function public.staff_record_match_decision_review(p_request_id bigint, p_note text)
returns void language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  r public.match_decision_review_requests%rowtype;
  d public.staff_match_review_decisions%rowtype;
  actor_role text;
begin
  select role into actor_role from public.profiles where id = auth.uid();
  if actor_role is null or actor_role not in ('owner', 'admin') then
    raise exception 'Administrator access is required';
  end if;
  if length(trim(coalesce(p_note, ''))) not between 10 and 1000 then
    raise exception 'Enter a review note between 10 and 1000 characters';
  end if;
  select * into r from public.match_decision_review_requests where id = p_request_id for update;
  if not found or r.status <> 'pending' then raise exception 'Pending review request not found'; end if;
  select * into d from public.staff_match_review_decisions where id = r.decision_id;
  if public.gb_staff_conflicts_match(d.match_id) or d.referee_id = auth.uid() then
    raise exception 'Another authorized staff member must review this decision';
  end if;
  if actor_role = 'admin' and coalesce(d.decider_role_at_time, '') not in ('staff', 'senior_staff', 'referee') then
    raise exception 'Only an Owner can review this decision';
  end if;
  update public.match_decision_review_requests
    set status = 'reviewed', reviewed_by = auth.uid(), review_note = trim(p_note), reviewed_at = now()
    where id = r.id;
  insert into public.staff_activity_log(actor_id, action, target_type, target_id, previous_values, new_values, reason)
    values (auth.uid(), 'match_decision_reviewed', 'match', d.match_id::text,
      jsonb_build_object('request_id', r.id, 'status', 'pending'),
      jsonb_build_object('request_id', r.id, 'status', 'reviewed', 'result_changed', false), trim(p_note));
end;
$$;
revoke all on function public.staff_record_match_decision_review(bigint, text) from public, anon;
grant execute on function public.staff_record_match_decision_review(bigint, text) to authenticated;

notify pgrst, 'reload schema';
