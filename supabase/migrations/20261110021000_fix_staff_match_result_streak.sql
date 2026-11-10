create or replace function public.staff_finalize_disputed_match(
  match_uuid uuid,
  posting_score integer,
  accepting_score integer,
  decision_note text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  match_row public.matches%rowtype;
  required_wins integer;
  best_of_number integer;
  winner_team_id uuid;
  loser_team_id uuid;
  posting_users uuid[];
  accepting_users uuid[];
  winner_users uuid[];
  loser_users uuid[];
  all_users uuid[];
  review_ticket_id text;
  updated_team_count integer;
begin
  if auth.uid() is null
    or not public.has_staff_permission('match_review') then
    raise exception 'You do not have permission to finalize match results';
  end if;

  if posting_score is null or accepting_score is null then
    raise exception 'Enter both teams'' official scores';
  end if;

  if length(trim(coalesce(decision_note, ''))) not between 10 and 1000 then
    raise exception 'Enter a decision reason between 10 and 1000 characters';
  end if;

  select *
    into match_row
    from public.matches
    where id = match_uuid
    for update;

  if not found then
    raise exception 'Match not found';
  end if;

  if lower(coalesce(match_row.status, '')) <> 'disputed'
    or lower(coalesce(match_row.reporting_status, '')) <> 'disputed' then
    raise exception 'Only disputed matches can be finalized here';
  end if;

  if coalesce(match_row.finalized, false)
    or coalesce(match_row.rankings_applied, false)
    or coalesce(match_row.result_processed, false)
    or exists (
      select 1
      from public.staff_match_review_decisions
      where staff_match_review_decisions.match_id = match_uuid
    ) then
    raise exception 'This match result has already been finalized or processed';
  end if;

  if match_row.posting_team_id is null
    or match_row.accepting_team_id is null
    or match_row.posting_team_id = match_row.accepting_team_id then
    raise exception 'The match teams could not be verified';
  end if;

  best_of_number := coalesce(
    nullif((regexp_match(coalesce(match_row.best_of, ''), '[0-9]+'))[1], '')::integer,
    3
  );
  required_wins := case
    when best_of_number = 7 then 4
    when best_of_number = 5 then 3
    else 2
  end;
  if best_of_number not in (3, 5, 7) then
    raise exception 'This match has an unsupported best-of format';
  end if;

  if posting_score < 0
    or accepting_score < 0
    or greatest(posting_score, accepting_score) <> required_wins
    or least(posting_score, accepting_score) >= required_wins then
    raise exception 'The official score is not valid for this best-of series';
  end if;

  if posting_score > accepting_score then
    winner_team_id := match_row.posting_team_id;
    loser_team_id := match_row.accepting_team_id;
  else
    winner_team_id := match_row.accepting_team_id;
    loser_team_id := match_row.posting_team_id;
  end if;

  select array_agg(match_participants.user_id order by match_participants.user_id)
    into posting_users
    from public.match_participants
    where match_participants.match_id = match_uuid
      and match_participants.team_id = match_row.posting_team_id;

  select array_agg(match_participants.user_id order by match_participants.user_id)
    into accepting_users
    from public.match_participants
    where match_participants.match_id = match_uuid
      and match_participants.team_id = match_row.accepting_team_id;

  if coalesce(cardinality(posting_users), 0) = 0 then
    posting_users := coalesce(match_row.locked_posting_roster, '{}'::uuid[]);
  end if;
  if coalesce(cardinality(accepting_users), 0) = 0 then
    accepting_users := coalesce(match_row.locked_accepting_roster, '{}'::uuid[]);
  end if;

  if coalesce(cardinality(posting_users), 0) = 0
    or coalesce(cardinality(accepting_users), 0) = 0 then
    raise exception 'A verified match roster is unavailable; the result was not changed';
  end if;

  if exists (
    select 1
    from unnest(posting_users) as posting(user_id)
    join unnest(accepting_users) as accepting(user_id)
      on accepting.user_id = posting.user_id
  ) then
    raise exception 'The match rosters overlap; the result was not changed';
  end if;

  if auth.uid() = any(posting_users)
    or auth.uid() = any(accepting_users)
    or exists (
      select 1
      from public.teams
      where id in (match_row.posting_team_id, match_row.accepting_team_id)
        and owner_id = auth.uid()
    ) then
    raise exception 'You cannot finalize a match involving your team or roster';
  end if;

  if winner_team_id = match_row.posting_team_id then
    winner_users := posting_users;
    loser_users := accepting_users;
  else
    winner_users := accepting_users;
    loser_users := posting_users;
  end if;

  select array_agg(distinct roster.user_id order by roster.user_id)
    into all_users
    from unnest(winner_users || loser_users) as roster(user_id);

  select id::text
    into review_ticket_id
    from public.dispute_tickets
    where dispute_tickets.match_id = match_uuid
      and lower(coalesce(dispute_tickets.status, 'open')) = 'open'
    order by id
    limit 1;

  update public.teams
    set wins = coalesce(wins, 0) + case when id = winner_team_id then 1 else 0 end,
        losses = coalesce(losses, 0) + case when id = loser_team_id then 1 else 0 end,
        streak = case when id = winner_team_id then 'W' else 'L' end,
        xp = coalesce(xp, 0) + case when id = winner_team_id then 25 else 5 end,
        rating_points = case
          when id = winner_team_id then coalesce(rating_points, 0) + 25
          else greatest(0, coalesce(rating_points, 0) - 10)
        end
    where id in (match_row.posting_team_id, match_row.accepting_team_id);

  get diagnostics updated_team_count = row_count;
  if updated_team_count <> 2 then
    raise exception 'Both match teams must exist before the result can be finalized';
  end if;

  update public.profiles
    set gb_wins = coalesce(gb_wins, 0) + case when id = any(winner_users) then 1 else 0 end,
        gb_losses = coalesce(gb_losses, 0) + case when id = any(loser_users) then 1 else 0 end,
        gb_rank_points = case
          when id = any(winner_users) then coalesce(gb_rank_points, 0) + 25
          else greatest(0, coalesce(gb_rank_points, 0) - 10)
        end
    where id = any(all_users);

  update public.matches
    set posting_team_score = posting_score,
        accepting_team_score = accepting_score,
        reported_winner_team_id = winner_team_id,
        reported_loser_team_id = loser_team_id,
        winning_team_id = winner_team_id,
        losing_team_id = loser_team_id,
        status = 'completed',
        reporting_status = 'completed',
        score_confirmed_at = now(),
        score_verified = true,
        score_verified_at = now(),
        completed_at = now(),
        finalized = true,
        finalized_at = now(),
        finalized_by = auth.uid(),
        rankings_applied = true,
        result_processed = true,
        ranking_change_applied_at = now(),
        winning_user_ids = winner_users,
        losing_user_ids = loser_users
    where id = match_uuid;

  update public.dispute_tickets
    set status = 'resolved'
    where dispute_tickets.match_id = match_uuid
      and lower(coalesce(dispute_tickets.status, 'open')) = 'open';

  insert into public.staff_match_review_decisions (
    match_id,
    ticket_id,
    referee_id,
    previous_posting_score,
    previous_accepting_score,
    official_posting_score,
    official_accepting_score,
    decision_note
  ) values (
    match_uuid,
    review_ticket_id,
    auth.uid(),
    match_row.posting_team_score,
    match_row.accepting_team_score,
    posting_score,
    accepting_score,
    trim(decision_note)
  );

  return jsonb_build_object(
    'ok', true,
    'match_id', match_uuid,
    'winner_team_id', winner_team_id,
    'posting_team_score', posting_score,
    'accepting_team_score', accepting_score
  );
end;
$$;
