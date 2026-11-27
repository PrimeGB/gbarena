-- Preserve tournament history: a live or completed tournament's bracket,
-- participants, results and winners are permanent and cannot be reset.
-- Also rate-limit tournament registrations to deter spam/automated signups.

create or replace function public.reset_tournament_bracket(p_tournament uuid)
returns void language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_status text;
begin
  if not public.has_staff_permission('staff_access') then
    raise exception 'Tournament management access is required';
  end if;
  if exists (
    select 1 from public.tournament_registrations
    where tournament_id = p_tournament and public.gb_staff_conflicts_team(team_id)
  ) then
    raise exception 'Another staff member must reset a bracket involving your team';
  end if;
  select status into v_status from public.tournaments where id = p_tournament;
  if v_status in ('live', 'completed') then
    raise exception 'A live or completed tournament bracket is permanent and cannot be reset.';
  end if;
  perform public.gb_reset_bracket_unchecked(p_tournament);
  insert into public.staff_activity_log(actor_id, action, target_type, target_id, reason)
    values (auth.uid(), 'tournament_bracket_reset', 'tournament', p_tournament::text, 'Tournament bracket reset');
end;
$$;
revoke all on function public.reset_tournament_bracket(uuid) from public, anon;
grant execute on function public.reset_tournament_bracket(uuid) to authenticated;

drop trigger if exists tournament_registration_rate_limit on public.tournament_registrations;
create trigger tournament_registration_rate_limit before insert on public.tournament_registrations
  for each row execute function public.gb_rate_limit_trigger('tournament_registration', 5, 3600, 'registered_by');

notify pgrst, 'reload schema';