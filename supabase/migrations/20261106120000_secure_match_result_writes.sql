-- Match result writes must be performed through functions that validate the
-- match state and the caller's authority over the participating team.
revoke update on public.matches from anon, authenticated;

create or replace function public.report_match_score(
  match_uuid uuid,
  reporting_team_uuid uuid,
  posting_score integer,
  accepting_score integer
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  m public.matches%rowtype;
  uid uuid := auth.uid();
begin
  if uid is null or posting_score < 0 or accepting_score < 0 or posting_score = accepting_score then
    return jsonb_build_object('ok', false, 'message', 'Invalid score report.');
  end if;

  select * into m from public.matches where id = match_uuid for update;
  if not found
     or m.finalized
     or coalesce(m.reporting_status, 'none') not in ('none', '')
     or m.status in ('completed', 'disputed', 'cancelled')
     or (m.status <> 'playing' and (m.match_time is null or m.match_time > now()))
     or reporting_team_uuid not in (m.posting_team_id, m.accepting_team_id)
     or not (
       exists (select 1 from public.teams t where t.id = reporting_team_uuid and t.owner_id = uid)
       or exists (
         select 1 from public.team_members tm
         where tm.team_id = reporting_team_uuid and tm.user_id = uid
           and lower(coalesce(tm.role, '')) in ('leader', 'co-leader', 'coleader', 'captain', 'owner')
       )
     ) then
    return jsonb_build_object('ok', false, 'message', 'You cannot report a score for this match.');
  end if;

  update public.matches
  set posting_team_score = posting_score,
      accepting_team_score = accepting_score,
      reported_by_team_id = reporting_team_uuid,
      reported_winner_team_id = case when posting_score > accepting_score then m.posting_team_id else m.accepting_team_id end,
      reported_loser_team_id = case when posting_score > accepting_score then m.accepting_team_id else m.posting_team_id end,
      confirmation_team_id = case when reporting_team_uuid = m.posting_team_id then m.accepting_team_id else m.posting_team_id end,
      reporting_status = 'awaiting_confirmation',
      status = 'awaiting_confirmation',
      score_reported_at = now()
  where id = match_uuid;

  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.report_match_score(uuid, uuid, integer, integer) from public, anon;
grant execute on function public.report_match_score(uuid, uuid, integer, integer) to authenticated;

create or replace function public.dispute_match_score(match_uuid uuid, dispute_reason_text text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  m public.matches%rowtype;
  uid uuid := auth.uid();
begin
  if uid is null or length(trim(coalesce(dispute_reason_text, ''))) = 0
     or length(dispute_reason_text) > 500 then
    return jsonb_build_object('ok', false, 'message', 'Choose a valid dispute reason.');
  end if;

  select * into m from public.matches where id = match_uuid for update;
  if not found
     or m.finalized
     or m.status <> 'awaiting_confirmation'
     or m.reporting_status <> 'awaiting_confirmation'
     or m.confirmation_team_id not in (m.posting_team_id, m.accepting_team_id)
     or not (
       exists (select 1 from public.teams t where t.id = m.confirmation_team_id and t.owner_id = uid)
       or exists (
         select 1 from public.team_members tm
         where tm.team_id = m.confirmation_team_id and tm.user_id = uid
           and lower(coalesce(tm.role, '')) in ('leader', 'co-leader', 'coleader', 'captain', 'owner')
       )
     ) then
    return jsonb_build_object('ok', false, 'message', 'You cannot dispute this match.');
  end if;

  update public.matches
  set status = 'disputed',
      reporting_status = 'disputed',
      disputed_at = now(),
      dispute_reason = trim(dispute_reason_text)
  where id = match_uuid;

  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.dispute_match_score(uuid, text) from public, anon;
grant execute on function public.dispute_match_score(uuid, text) to authenticated;

-- Keep the existing settlement implementation, but validate lifecycle and
-- caller authority before allowing it to process a result.
alter function public.confirm_match_and_apply(uuid, uuid) rename to gb_confirm_match_and_apply_unchecked;
revoke all on function public.gb_confirm_match_and_apply_unchecked(uuid, uuid) from public, anon, authenticated;

create function public.confirm_match_and_apply(match_uuid uuid, confirming_user_uuid uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  m public.matches%rowtype;
  uid uuid := auth.uid();
begin
  if uid is not null and uid is distinct from confirming_user_uuid then
    return jsonb_build_object('ok', false, 'message', 'You can only confirm a result as yourself.');
  end if;

  select * into m from public.matches where id = match_uuid for update;
  if not found then
    return jsonb_build_object('ok', false, 'message', 'Match not found.');
  end if;
  if coalesce(m.result_processed, false) then
    return jsonb_build_object('ok', true, 'message', 'Already processed.');
  end if;
  if m.finalized
     or m.status <> 'awaiting_confirmation'
     or m.reporting_status <> 'awaiting_confirmation'
     or m.reported_by_team_id is null
     or m.confirmation_team_id is null
     or m.confirmation_team_id = m.reported_by_team_id
     or m.confirmation_team_id not in (m.posting_team_id, m.accepting_team_id)
     or m.reported_winner_team_id is null
     or m.reported_loser_team_id is null then
    return jsonb_build_object('ok', false, 'message', 'This match is not awaiting a valid result confirmation.');
  end if;

  if uid is not null and not (
    exists (select 1 from public.teams t where t.id = m.confirmation_team_id and t.owner_id = uid)
    or exists (
      select 1 from public.team_members tm
      where tm.team_id = m.confirmation_team_id and tm.user_id = uid
        and lower(coalesce(tm.role, '')) in ('leader', 'co-leader', 'coleader', 'captain', 'owner')
    )
  ) then
    return jsonb_build_object('ok', false, 'message', 'Only a leader, co-leader, captain, or owner of the opposing team can confirm.');
  end if;

  if uid is null and not exists (
    select 1 from public.teams t
    where t.id = m.confirmation_team_id and t.owner_id = confirming_user_uuid
  ) then
    return jsonb_build_object('ok', false, 'message', 'Automated confirmation must use the opposing team owner.');
  end if;

  return public.gb_confirm_match_and_apply_unchecked(match_uuid, confirming_user_uuid);
end;
$$;

revoke all on function public.confirm_match_and_apply(uuid, uuid) from public, anon;
grant execute on function public.confirm_match_and_apply(uuid, uuid) to authenticated;

notify pgrst, 'reload schema';
