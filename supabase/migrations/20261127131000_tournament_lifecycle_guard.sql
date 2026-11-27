-- Team tournaments could be set to 'live' or 'completed' with no bracket
-- generated (player tournaments already guard this in their own flow). Add a
-- lifecycle guard so a team event must have a bracket before going live and
-- must go live before it can be completed.

create or replace function public.gb_guard_tournament_lifecycle()
returns trigger language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  if tg_op <> 'UPDATE' then return new; end if;
  if auth.uid() is null then return new; end if;
  if coalesce(new.entry_kind, '') = 'player' then return new; end if;

  if new.status = 'live' and old.status is distinct from 'live'
     and not exists (
       select 1 from public.tournament_matches tm where tm.tournament_id = new.id
     ) then
    raise exception 'Generate the tournament bracket before going live.';
  end if;

  if new.status = 'completed' and old.status is distinct from 'completed'
     and old.status <> 'live' then
    raise exception 'A team tournament must go live before it can be completed.';
  end if;

  return new;
end;
$$;

revoke all on function public.gb_guard_tournament_lifecycle() from public, anon, authenticated;

drop trigger if exists guard_tournament_lifecycle on public.tournaments;
create trigger guard_tournament_lifecycle before update on public.tournaments
  for each row execute function public.gb_guard_tournament_lifecycle();

notify pgrst, 'reload schema';