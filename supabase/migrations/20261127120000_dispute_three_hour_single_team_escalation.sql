-- Dispute filing window is 3 hours from the scheduled match time.
-- A case escalates to the staff queue as soon as BOTH teams file, or at the
-- 3-hour deadline if at least one team filed (noting who did not submit).

create or replace function public.dispute_ticket_window_ends_at(match_uuid uuid)
returns timestamptz
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(public.gb_match_scheduled_at(match_time), started_at, accepted_at, created_at)
    + interval '3 hours'
  from public.matches
  where id = match_uuid;
$$;

revoke all on function public.dispute_ticket_window_ends_at(uuid) from public, anon;
grant execute on function public.dispute_ticket_window_ends_at(uuid) to authenticated;

create or replace function public.gb_validate_dispute_ticket()
returns trigger language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  m public.matches%rowtype;
  scheduled timestamptz;
begin
  select * into m from public.matches where id = new.match_id for update;
  scheduled := public.gb_match_scheduled_at(m.match_time);
  if not found or scheduled is null or now() < scheduled + interval '15 minutes'
      or now() >= scheduled + interval '3 hours' then
    raise exception 'Tickets are available from 15 minutes until 3 hours after the scheduled match time.';
  end if;
  if coalesce(m.status, '') <> 'disputed' or coalesce(m.reporting_status, '') <> 'disputed'
      or new.team_id not in (m.posting_team_id, m.accepting_team_id)
      or new.opponent_team_id is distinct from
        (case when new.team_id = m.posting_team_id then m.accepting_team_id else m.posting_team_id end)
      or coalesce(new.status, '') <> 'open'
      or new.created_by is distinct from auth.uid()
      or not exists(select 1 from public.team_members where team_id = new.team_id and user_id = auth.uid()) then
    raise exception 'Only a member of a disputed match team can submit its ticket.';
  end if;
  if exists(select 1 from public.dispute_tickets where match_id = new.match_id and team_id = new.team_id) then
    raise exception 'Your team has already submitted a dispute ticket for this match.';
  end if;
  return new;
end;
$$;

-- Rebuild the inner queue on the current authoritative definition, keeping the
-- existing single-team escalation, and add deadline metadata: window end,
-- whether it escalated at the deadline, and which teams did not submit.
create or replace function public.gb_staff_match_queue_before_conflicts()
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
    'window_ends_at', public.dispute_ticket_window_ends_at(matches.id),
    'escalated_at_deadline',
      coalesce(jsonb_array_length(submissions.ticket_submissions), 0) < 2
      and now() >= public.dispute_ticket_window_ends_at(matches.id),
    'missing_team_names', missing.missing_team_names,
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
  left join lateral (
    select coalesce(jsonb_agg(team_names.name order by team_names.name), '[]'::jsonb) as missing_team_names
    from (
      select t.name
      from public.teams t
      where t.id in (matches.posting_team_id, matches.accepting_team_id)
        and not exists (
          select 1 from public.dispute_tickets dt
          where dt.match_id = matches.id
            and lower(coalesce(dt.status, 'open')) = 'open'
            and dt.team_id = t.id
        )
    ) team_names
  ) as missing on true
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

revoke all on function public.gb_staff_match_queue_before_conflicts() from public, anon, authenticated;

notify pgrst, 'reload schema';