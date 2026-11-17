alter table public.tournament_player_registrations
  drop constraint tournament_player_registrations_player_id_fkey,
  add constraint tournament_player_registrations_player_id_fkey foreign key (player_id) references public.profiles(id) on delete cascade;

alter table public.tournament_player_matches
  drop constraint tournament_player_matches_player_a_fkey,
  drop constraint tournament_player_matches_player_b_fkey,
  drop constraint tournament_player_matches_winner_id_fkey,
  drop constraint tournament_player_matches_reported_by_fkey,
  drop constraint tournament_player_matches_reported_winner_fkey,
  drop constraint tournament_player_matches_decided_by_fkey,
  add constraint tournament_player_matches_player_a_fkey foreign key (player_a) references public.profiles(id) on delete set null,
  add constraint tournament_player_matches_player_b_fkey foreign key (player_b) references public.profiles(id) on delete set null,
  add constraint tournament_player_matches_winner_id_fkey foreign key (winner_id) references public.profiles(id) on delete set null,
  add constraint tournament_player_matches_reported_by_fkey foreign key (reported_by) references public.profiles(id) on delete set null,
  add constraint tournament_player_matches_reported_winner_fkey foreign key (reported_winner) references public.profiles(id) on delete set null,
  add constraint tournament_player_matches_decided_by_fkey foreign key (decided_by) references public.profiles(id) on delete set null;

alter table public.tournament_player_disputes
  alter column raised_by drop not null,
  drop constraint tournament_player_disputes_raised_by_fkey,
  drop constraint tournament_player_disputes_resolved_by_fkey,
  add constraint tournament_player_disputes_raised_by_fkey foreign key (raised_by) references public.profiles(id) on delete set null,
  add constraint tournament_player_disputes_resolved_by_fkey foreign key (resolved_by) references public.profiles(id) on delete set null;

alter table public.tournament_player_prizes
  alter column winner_id drop not null,
  drop constraint tournament_player_prizes_winner_id_fkey,
  add constraint tournament_player_prizes_winner_id_fkey foreign key (winner_id) references public.profiles(id) on delete set null;

create function public.gb_guard_live_player_tournament_account_delete()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  perform t.id from public.tournaments t
  join public.tournament_player_registrations r on r.tournament_id = t.id
  where r.player_id = old.id
  order by t.id for update of t;
  if exists (
    select 1 from public.tournament_player_registrations r
    join public.tournaments t on t.id = r.tournament_id
    where r.player_id = old.id and t.status = 'live'
  ) then
    raise exception 'Your account cannot be deleted while you are entered in a live tournament. Please contact support or wait until it ends.';
  end if;
  return old;
end;
$$;
revoke all on function public.gb_guard_live_player_tournament_account_delete() from public, anon, authenticated;
create trigger profiles_guard_live_player_tournament_delete
  before delete on public.profiles for each row execute function public.gb_guard_live_player_tournament_account_delete();
