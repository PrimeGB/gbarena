alter function public.staff_award_tournament_prize(uuid, uuid, integer, integer)
  rename to gb_staff_award_tournament_prize_with_role_checks;
revoke all on function public.gb_staff_award_tournament_prize_with_role_checks(uuid, uuid, integer, integer)
  from public, anon, authenticated;

create function public.staff_award_tournament_prize(
  p_tournament_id uuid,
  p_team_id uuid,
  p_placement integer default 1,
  p_total_credits integer default null
)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare tournament_status text;
begin
  if not public.has_staff_permission('credit_management') then
    raise exception 'Owner-granted credit access is required';
  end if;

  select status into tournament_status
  from public.tournaments
  where id = p_tournament_id
  for update;

  if not found or tournament_status <> 'completed' then
    raise exception 'Tournament prizes can only be paid after the tournament is completed';
  end if;

  return public.gb_staff_award_tournament_prize_with_role_checks(
    p_tournament_id, p_team_id, p_placement, p_total_credits
  );
end;
$$;

revoke all on function public.staff_award_tournament_prize(uuid, uuid, integer, integer) from public, anon;
grant execute on function public.staff_award_tournament_prize(uuid, uuid, integer, integer) to authenticated;

notify pgrst, 'reload schema';
