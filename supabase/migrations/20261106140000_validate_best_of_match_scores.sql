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
  best_of_number integer;
  required_wins integer;
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

  best_of_number := nullif(regexp_replace(coalesce(m.best_of, ''), '[^0-9]', '', 'g'), '')::integer;
  if best_of_number is null then
    best_of_number := 3;
  end if;
  required_wins := case
    when best_of_number = 7 then 4
    when best_of_number = 5 then 3
    when best_of_number = 1 then 1
    else 2
  end;
  if greatest(posting_score, accepting_score) <> required_wins
     or least(posting_score, accepting_score) >= required_wins then
    return jsonb_build_object('ok', false, 'message', 'Invalid score for this best-of series.');
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

notify pgrst, 'reload schema';
