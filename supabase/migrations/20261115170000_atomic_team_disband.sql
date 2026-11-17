create or replace function public.gb_disband_team(p_team_id uuid)
returns void
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  perform 1 from public.teams
  where id = p_team_id and owner_id = auth.uid()
  for update;
  if not found then
    raise exception 'The team could not be found or you do not have permission to disband it.';
  end if;

  delete from public.team_members where team_id = p_team_id;
  delete from public.teams where id = p_team_id and owner_id = auth.uid();
  if not found then
    raise exception 'The team could not be disbanded.';
  end if;
end;
$$;

revoke all on function public.gb_disband_team(uuid) from public, anon;
grant execute on function public.gb_disband_team(uuid) to authenticated;
