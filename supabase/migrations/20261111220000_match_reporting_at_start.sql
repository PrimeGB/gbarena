create or replace function public.report_match_score(match_uuid uuid, reporting_team_uuid uuid, posting_score integer, accepting_score integer)
returns jsonb language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  m public.matches%rowtype;
  uid uuid := auth.uid();
  scheduled timestamptz;
  best_of_number integer;
  required_wins integer;
begin
  if uid is null or posting_score is null or accepting_score is null
      or posting_score < 0 or accepting_score < 0 or posting_score = accepting_score then
    return jsonb_build_object('ok', false, 'message', 'Invalid score report.');
  end if;
  select * into m from public.matches where id = match_uuid for update;
  if not found then return jsonb_build_object('ok', false, 'message', 'Match not found.'); end if;
  scheduled := public.gb_match_scheduled_at(m.match_time);
  if scheduled is null or now() < scheduled then
    return jsonb_build_object('ok', false, 'message', 'Score reporting opens at the scheduled match time.');
  end if;
  if m.finalized or coalesce(m.reporting_status, 'none') not in ('none', '')
      or m.status in ('completed', 'disputed', 'cancelled')
      or reporting_team_uuid not in (m.posting_team_id, m.accepting_team_id)
      or not (
        exists (select 1 from public.teams t where t.id = reporting_team_uuid and t.owner_id = uid)
        or exists (select 1 from public.team_members tm where tm.team_id = reporting_team_uuid
          and tm.user_id = uid and lower(coalesce(tm.role, '')) in ('leader', 'co-leader', 'coleader', 'captain', 'owner'))
      ) then
    return jsonb_build_object('ok', false, 'message', 'You cannot report a score for this match.');
  end if;
  best_of_number := nullif(regexp_replace(coalesce(m.best_of, ''), '[^0-9]', '', 'g'), '')::integer;
  required_wins := case coalesce(best_of_number, 3) when 7 then 4 when 5 then 3 when 1 then 1 else 2 end;
  if greatest(posting_score, accepting_score) <> required_wins
      or least(posting_score, accepting_score) >= required_wins then
    return jsonb_build_object('ok', false, 'message', 'Invalid score for this best-of series.');
  end if;
  update public.matches set posting_team_score = posting_score, accepting_team_score = accepting_score,
    reported_by_team_id = reporting_team_uuid,
    reported_winner_team_id = case when posting_score > accepting_score then m.posting_team_id else m.accepting_team_id end,
    reported_loser_team_id = case when posting_score > accepting_score then m.accepting_team_id else m.posting_team_id end,
    confirmation_team_id = case when reporting_team_uuid = m.posting_team_id then m.accepting_team_id else m.posting_team_id end,
    reporting_status = 'awaiting_confirmation', status = 'awaiting_confirmation', score_reported_at = now()
  where id = match_uuid;
  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.dispute_match_score(match_uuid uuid, dispute_reason_text text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp
as $$
declare scheduled timestamptz;
begin
  select public.gb_match_scheduled_at(match_time) into scheduled from public.matches where id = match_uuid for update;
  if scheduled is null or now() < scheduled then
    return jsonb_build_object('ok', false, 'message', 'Disputes open at the scheduled match time.');
  end if;
  return public.gb_dispute_match_score_before_delay(match_uuid, dispute_reason_text);
end;
$$;

create or replace function public.gb_validate_dispute_ticket()
returns trigger language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  m public.matches%rowtype;
  scheduled timestamptz;
begin
  select * into m from public.matches where id = new.match_id for update;
  scheduled := public.gb_match_scheduled_at(m.match_time);
  if not found or scheduled is null or now() < scheduled
      or now() >= scheduled + interval '2 hours' then
    raise exception 'Tickets are available from the scheduled match time until 2 hours afterward.';
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

notify pgrst, 'reload schema';
