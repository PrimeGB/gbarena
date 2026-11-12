create function public.staff_my_match_decisions()
returns setof jsonb language plpgsql stable security definer set search_path = public, pg_temp
as $$
begin
  if not public.has_staff_permission('match_review') then
    raise exception 'Match review access is required';
  end if;

  return query
    select jsonb_build_object(
      'id', decision.id,
      'ticket_id', decision.ticket_id,
      'match_id', decision.match_id,
      'posting_team_name', posting.name,
      'accepting_team_name', accepting.name,
      'official_posting_score', decision.official_posting_score,
      'official_accepting_score', decision.official_accepting_score,
      'decision_note', decision.decision_note,
      'created_at', decision.created_at
    )
    from public.staff_match_review_decisions decision
    join public.matches match on match.id = decision.match_id
    left join public.teams posting on posting.id = match.posting_team_id
    left join public.teams accepting on accepting.id = match.accepting_team_id
    where decision.referee_id = auth.uid()
      and not public.gb_staff_conflicts_match(decision.match_id)
    order by decision.created_at desc, decision.id desc;
end;
$$;
revoke all on function public.staff_my_match_decisions() from public, anon;
grant execute on function public.staff_my_match_decisions() to authenticated;

create function public.staff_my_match_decision_reviews()
returns setof jsonb language plpgsql stable security definer set search_path = public, pg_temp
as $$
begin
  if not public.has_staff_permission('match_review') then
    raise exception 'Match review access is required';
  end if;

  return query
    select jsonb_build_object(
      'id', request.id,
      'ticket_id', decision.ticket_id,
      'match_id', decision.match_id,
      'posting_team_name', posting.name,
      'accepting_team_name', accepting.name,
      'official_posting_score', decision.official_posting_score,
      'official_accepting_score', decision.official_accepting_score,
      'decision_note', decision.decision_note,
      'review_note', request.review_note,
      'reviewed_at', request.reviewed_at,
      'reviewer', reviewer.username
    )
    from public.match_decision_review_requests request
    join public.staff_match_review_decisions decision on decision.id = request.decision_id
    join public.matches match on match.id = decision.match_id
    left join public.teams posting on posting.id = match.posting_team_id
    left join public.teams accepting on accepting.id = match.accepting_team_id
    join public.profiles reviewer on reviewer.id = request.reviewed_by
    where decision.referee_id = auth.uid()
      and request.status = 'reviewed'
      and not public.gb_staff_conflicts_match(decision.match_id)
    order by request.reviewed_at desc, request.id desc;
end;
$$;
revoke all on function public.staff_my_match_decision_reviews() from public, anon;
grant execute on function public.staff_my_match_decision_reviews() to authenticated;

notify pgrst, 'reload schema';
