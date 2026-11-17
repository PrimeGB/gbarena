-- Run after the account-deletion migration in a transaction; roll everything back.
do $$
declare
  player uuid := gen_random_uuid();
  event_id uuid := gen_random_uuid();
  test_match_id uuid := gen_random_uuid();
  rejected boolean := false;
begin
  perform set_config('request.jwt.claim.sub', '', true);
  insert into auth.users (id, raw_user_meta_data)
    values (player, jsonb_build_object('username', 'Tournament deletion fixture ' || player));
  delete from public.staff_user_awards where recipient_id = player;
  insert into public.tournaments (id, title, status, entry_kind, is_free, entry_fee, entry_fee_credits)
    values (event_id, 'Rollback-only account fixture', 'upcoming', 'player', true, 0, 0);
  insert into public.tournament_player_registrations (tournament_id, player_id) values (event_id, player);
  insert into public.tournament_player_matches (id, tournament_id, round, slot, player_a, winner_id, reported_by, reported_winner, decided_by)
    values (test_match_id, event_id, 1, 0, player, player, player, player, player);
  insert into public.tournament_player_disputes (match_id, raised_by, explanation, original_score_a, original_score_b, resolved_by)
    values (test_match_id, player, 'Test dispute explanation', 25, 0, player);
  insert into public.tournament_player_prizes (tournament_id, winner_id, credits) values (event_id, player, 0);
  update public.tournaments set status = 'live' where id = event_id;
  begin
    delete from public.profiles where id = player;
  exception when raise_exception then
    if sqlerrm not like '%cannot be deleted while you are entered in a live tournament%' then raise; end if;
    rejected := true;
  end;
  if not rejected or not exists (select 1 from public.profiles where id = player) then
    raise exception 'Live tournament account deletion was not safely blocked';
  end if;
  update public.tournaments set status = 'cancelled' where id = event_id;
  delete from public.profiles where id = player;
  if exists (select 1 from public.tournament_player_registrations where tournament_id = event_id)
    or exists (select 1 from public.tournament_player_matches where id = test_match_id and
      (player_a is not null or winner_id is not null or reported_by is not null or reported_winner is not null or decided_by is not null))
    or exists (select 1 from public.tournament_player_disputes where match_id = test_match_id and (raised_by is not null or resolved_by is not null))
    or exists (select 1 from public.tournament_player_prizes where tournament_id = event_id and winner_id is not null) then
    raise exception 'Tournament references were not removed or anonymized';
  end if;
end;
$$;
