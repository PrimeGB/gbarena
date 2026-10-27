-- A disputed match reaches the staff queue when both teams have filed a ticket,
-- or when the 2 hour filing window has ended and at least one team has filed.
create or replace function public.dispute_ticket_window_ends_at(match_uuid uuid)
returns timestamptz
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(matches.disputed_at, matches.score_reported_at, matches.created_at)
    + interval '2 hours'
  from public.matches
  where matches.id = match_uuid;
$$;

revoke all on function public.dispute_ticket_window_ends_at(uuid) from public, anon;
grant execute on function public.dispute_ticket_window_ends_at(uuid) to authenticated;

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
    'submitted_team_count', coalesce(jsonb_array_length(submissions.ticket_submissions), 0),
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
    and tickets.id is not null
    and (
      coalesce(jsonb_array_length(submissions.ticket_submissions), 0) >= 2
      or now() >= public.dispute_ticket_window_ends_at(matches.id)
    )
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
