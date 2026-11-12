create table public.community_suggestions (
  id bigint generated always as identity primary key,
  submitter_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (length(trim(title)) between 4 and 160),
  details text not null check (length(trim(details)) between 10 and 5000),
  status text not null default 'submitted' check (status in ('submitted', 'reviewed')),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  check (
    (status = 'submitted' and reviewed_by is null and reviewed_at is null)
    or (status = 'reviewed' and reviewed_by is not null and reviewed_at is not null)
  )
);

create index community_suggestions_queue_idx on public.community_suggestions(status, created_at desc);
alter table public.community_suggestions enable row level security;
revoke all on public.community_suggestions from public, anon, authenticated;

create function public.gb_submit_community_feedback(p_type text, p_title text, p_details text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.gb_submit_owner_feedback(p_type, p_title, p_details);
  if p_type = 'Bug Report' then
    perform public.gb_submit_bug_finder_report(p_title, p_details);
  elsif p_type = 'Suggestion' then
    insert into public.community_suggestions(submitter_id, title, details)
    values (auth.uid(), trim(p_title), trim(p_details));
  end if;
end;
$$;
revoke all on function public.gb_submit_community_feedback(text, text, text) from public, anon;
grant execute on function public.gb_submit_community_feedback(text, text, text) to authenticated;

create function public.staff_list_community_feedback()
returns table (
  id bigint, kind text, title text, details text, submitter text,
  status text, created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.staff_has_portal_access() or not public.has_staff_permission('staff_reports') then
    raise exception 'Staff feedback access is required';
  end if;

  return query
    select feedback.id, feedback.kind, feedback.title, feedback.details,
      feedback.submitter, feedback.status, feedback.created_at
    from (
    select s.id, 'Suggestion'::text as kind, s.title, s.details,
      coalesce(p.username, 'Deleted account') as submitter, s.status, s.created_at
    from public.community_suggestions s
    left join public.profiles p on p.id = s.submitter_id
    union all
    select b.id, 'Bug Report'::text, b.title, b.details,
      coalesce(p.username, 'Deleted account'), b.status, b.created_at
    from public.community_bug_reports b
    left join public.profiles p on p.id = b.reporter_id
    ) feedback
    order by (feedback.status = 'submitted') desc, feedback.created_at desc
    limit 100;
end;
$$;
revoke all on function public.staff_list_community_feedback() from public, anon;
grant execute on function public.staff_list_community_feedback() to authenticated;

create function public.staff_review_community_suggestion(p_suggestion_id bigint)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.staff_has_portal_access() or not public.has_staff_permission('staff_reports') then
    raise exception 'Staff feedback access is required';
  end if;
  update public.community_suggestions
  set status = 'reviewed', reviewed_by = auth.uid(), reviewed_at = now()
  where id = p_suggestion_id and status = 'submitted';
  if not found then
    raise exception 'Pending suggestion not found';
  end if;
  insert into public.staff_activity_log(actor_id, action, target_type, target_id, previous_values, new_values, reason)
  values (auth.uid(), 'community_suggestion_reviewed', 'community_suggestion', p_suggestion_id::text,
    jsonb_build_object('status', 'submitted'), jsonb_build_object('status', 'reviewed'), 'Suggestion reviewed');
end;
$$;
revoke all on function public.staff_review_community_suggestion(bigint) from public, anon;
grant execute on function public.staff_review_community_suggestion(bigint) to authenticated;
