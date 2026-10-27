alter table public.dispute_tickets
  add column if not exists evidence_paths jsonb not null default '[]'::jsonb;

create or replace function public.require_dispute_ticket_evidence()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if jsonb_typeof(new.evidence_paths) <> 'array'
    or new.evidence_paths = '[]'::jsonb then
    raise exception 'At least one evidence file is required for a dispute ticket';
  end if;

  return new;
end;
$$;

create trigger dispute_tickets_require_evidence
  before insert on public.dispute_tickets
  for each row
  execute function public.require_dispute_ticket_evidence();

create or replace function public.has_submitted_dispute_ticket(
  match_uuid uuid,
  team_uuid uuid
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.team_members
    where team_id = $2
      and user_id = auth.uid()
  )
  and exists (
    select 1
    from public.dispute_tickets
    where match_id = $1
      and team_id = $2
  );
$$;

revoke all on function public.has_submitted_dispute_ticket(uuid, uuid) from public, anon;
grant execute on function public.has_submitted_dispute_ticket(uuid, uuid) to authenticated;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'dispute-evidence',
  'dispute-evidence',
  false,
  52428800,
  array['image/*', 'video/*']::text[]
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists dispute_evidence_team_upload on storage.objects;
create policy dispute_evidence_team_upload
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'dispute-evidence'
    and array_length(storage.foldername(name), 1) = 2
    and exists (
      select 1
      from public.matches as matches
      join public.team_members as team_members
        on team_members.team_id::text = (storage.foldername(name))[2]
      where matches.id::text = (storage.foldername(name))[1]
        and lower(coalesce(matches.status, '')) = 'disputed'
        and lower(coalesce(matches.reporting_status, '')) = 'disputed'
        and team_members.user_id = (select auth.uid())
        and team_members.team_id in (
          matches.posting_team_id,
          matches.accepting_team_id
        )
        and not exists (
          select 1
          from public.dispute_tickets as tickets
          where tickets.match_id = matches.id
            and tickets.team_id = team_members.team_id
        )
    )
  );

drop policy if exists dispute_evidence_participant_or_staff_read on storage.objects;
create policy dispute_evidence_participant_or_staff_read
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'dispute-evidence'
    and (
      public.has_staff_permission('match_review')
      or (
        array_length(storage.foldername(name), 1) = 2
        and exists (
          select 1
          from public.matches as matches
          join public.team_members as team_members
            on team_members.team_id::text = (storage.foldername(name))[2]
          where matches.id::text = (storage.foldername(name))[1]
            and team_members.user_id = (select auth.uid())
            and team_members.team_id in (
              matches.posting_team_id,
              matches.accepting_team_id
            )
        )
      )
    )
  );

drop policy if exists dispute_evidence_cleanup_before_ticket on storage.objects;
create policy dispute_evidence_cleanup_before_ticket
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'dispute-evidence'
    and array_length(storage.foldername(name), 1) = 2
    and exists (
      select 1
      from public.matches as matches
      join public.team_members as team_members
        on team_members.team_id::text = (storage.foldername(name))[2]
      where matches.id::text = (storage.foldername(name))[1]
        and team_members.user_id = (select auth.uid())
        and team_members.team_id in (
          matches.posting_team_id,
          matches.accepting_team_id
        )
    )
    and not exists (
      select 1
      from public.dispute_tickets as tickets
      where tickets.match_id::text = (storage.foldername(name))[1]
        and tickets.team_id::text = (storage.foldername(name))[2]
    )
  );

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
    'ticket_submissions', submissions.ticket_submissions,
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
      and dispute_tickets.team_id in (
        matches.posting_team_id,
        matches.accepting_team_id
      )
    order by dispute_tickets.id
    limit 1
  ) as tickets on true
  left join lateral (
    select jsonb_agg(
      jsonb_build_object(
        'team_id', dispute_tickets.team_id,
        'team_name', teams.name,
        'dispute_reason', dispute_tickets.dispute_reason,
        'dispute_description', dispute_tickets.dispute_description,
        'evidence_paths', dispute_tickets.evidence_paths
      )
      order by dispute_tickets.id
    ) as ticket_submissions
    from public.dispute_tickets
    left join public.teams as teams
      on teams.id = dispute_tickets.team_id
    where dispute_tickets.match_id = matches.id
      and lower(coalesce(dispute_tickets.status, 'open')) = 'open'
      and dispute_tickets.team_id in (
        matches.posting_team_id,
        matches.accepting_team_id
      )
  ) as submissions on true
  left join public.teams as posting_team
    on posting_team.id = matches.posting_team_id
  left join public.teams as accepting_team
    on accepting_team.id = matches.accepting_team_id
  where public.has_staff_permission('match_review')
    and lower(coalesce(matches.status, '')) = 'disputed'
    and lower(coalesce(matches.reporting_status, '')) = 'disputed'
    and not coalesce(matches.finalized, false)
    and (
      select count(distinct dispute_tickets.team_id)
      from public.dispute_tickets
      where dispute_tickets.match_id = matches.id
        and lower(coalesce(dispute_tickets.status, 'open')) = 'open'
        and dispute_tickets.team_id in (
          matches.posting_team_id,
          matches.accepting_team_id
        )
    ) = 2
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
