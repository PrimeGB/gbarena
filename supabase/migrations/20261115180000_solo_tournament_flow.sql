alter table public.tournaments
  add column entry_kind text not null default 'team' check (entry_kind in ('team', 'player')),
  add column min_players integer check (min_players is null or min_players >= 2),
  add column winner_award text,
  add column target_score integer not null default 25 check (target_score between 1 and 999);

create table public.tournament_player_registrations (
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  player_id uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  primary key (tournament_id, player_id)
);

create table public.tournament_player_matches (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  round integer not null check (round >= 1),
  slot integer not null check (slot >= 0),
  player_a uuid references public.profiles(id),
  player_b uuid references public.profiles(id),
  winner_id uuid references public.profiles(id),
  status text not null default 'pending' check (status in ('pending', 'reported', 'disputed', 'completed', 'bye')),
  reported_by uuid references public.profiles(id),
  reported_winner uuid references public.profiles(id),
  score_a integer,
  score_b integer,
  decided_by uuid references public.profiles(id),
  unique (tournament_id, round, slot)
);

create table public.tournament_player_disputes (
  match_id uuid primary key references public.tournament_player_matches(id) on delete cascade,
  raised_by uuid not null references public.profiles(id),
  explanation text not null check (length(trim(explanation)) between 10 and 2000),
  original_score_a integer not null,
  original_score_b integer not null,
  created_at timestamptz not null default now(),
  resolved_by uuid references public.profiles(id),
  resolution text,
  resolved_at timestamptz
);

create table public.tournament_player_prizes (
  tournament_id uuid primary key references public.tournaments(id),
  winner_id uuid not null references public.profiles(id),
  credits integer not null check (credits >= 0),
  awarded_at timestamptz not null default now()
);

alter table public.tournament_player_registrations enable row level security;
alter table public.tournament_player_matches enable row level security;
alter table public.tournament_player_disputes enable row level security;
alter table public.tournament_player_prizes enable row level security;
create policy "Player registrations are public" on public.tournament_player_registrations for select using (true);
create policy "Player brackets are public" on public.tournament_player_matches for select using (true);
create policy "Player prizes are public" on public.tournament_player_prizes for select using (true);
create policy "Participants and match staff can view player disputes" on public.tournament_player_disputes for select to authenticated
  using (exists (
    select 1 from public.tournament_player_matches m
    where m.id = match_id and auth.uid() in (m.player_a, m.player_b)
  ) or (
    (public.has_staff_permission('match_review') or public.has_staff_permission('staff_access'))
    and not exists (
      select 1 from public.tournament_player_matches m
      join public.tournament_player_registrations r on r.tournament_id = m.tournament_id
      where m.id = match_id and r.player_id = auth.uid()
    )
  ));
revoke insert, update, delete, truncate on public.tournament_player_registrations, public.tournament_player_matches,
  public.tournament_player_disputes, public.tournament_player_prizes from anon, authenticated;
grant select on public.tournament_player_registrations, public.tournament_player_matches, public.tournament_player_prizes to anon, authenticated;
grant select on public.tournament_player_disputes to authenticated;

create function public.register_player_for_tournament(p_tournament_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare t public.tournaments%rowtype;
begin
  if auth.uid() is null or not exists (select 1 from public.profiles where id = auth.uid()) then
    raise exception 'Sign in with a player profile to register.';
  end if;
  select * into t from public.tournaments where id = p_tournament_id for update;
  if not found or t.entry_kind <> 'player' or t.status <> 'upcoming'
    or (t.starts_at is not null and t.starts_at <= now()) then
    raise exception 'Registration is closed for this tournament.';
  end if;
  if not t.is_free or t.entry_fee_credits <> 0 or t.entry_fee <> 0 then
    raise exception 'Player registration is only available for free tournaments.';
  end if;
  if exists (select 1 from public.tournament_player_registrations where tournament_id = t.id and player_id = auth.uid()) then
    raise exception 'You are already registered.';
  end if;
  if t.max_teams is not null and
    (select count(*) from public.tournament_player_registrations where tournament_id = t.id) >= t.max_teams then
    raise exception 'This tournament is full.';
  end if;
  insert into public.tournament_player_registrations (tournament_id, player_id) values (t.id, auth.uid());
end;
$$;

create function public.unregister_player_from_tournament(p_tournament_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare t public.tournaments%rowtype;
begin
  if auth.uid() is null then raise exception 'Sign in to withdraw.'; end if;
  select * into t from public.tournaments where id = p_tournament_id for update;
  if not found or t.entry_kind <> 'player' or t.status <> 'upcoming'
    or (t.starts_at is not null and t.starts_at <= now()) then
    raise exception 'You can no longer withdraw from this tournament.';
  end if;
  delete from public.tournament_player_registrations where tournament_id = t.id and player_id = auth.uid();
  if not found then raise exception 'You are not registered.'; end if;
end;
$$;

create function public.generate_player_tournament_bracket(p_tournament_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare
  t public.tournaments%rowtype;
  players uuid[];
  n integer;
  size integer := 2;
  rounds integer := 1;
  r integer;
  s integer;
  m record;
begin
  if not public.has_staff_permission('staff_access') then raise exception 'Tournament staff access is required.'; end if;
  select * into t from public.tournaments where id = p_tournament_id for update;
  if not found or t.entry_kind <> 'player' or t.status <> 'upcoming' then raise exception 'This player tournament cannot be started.'; end if;
  if exists (select 1 from public.tournament_player_registrations where tournament_id = t.id and player_id = auth.uid()) then
    raise exception 'Another staff member must start a tournament you entered.';
  end if;
  if t.starts_at is null or t.starts_at > now() then raise exception 'The bracket can be generated once the announced tournament start time arrives.'; end if;
  if exists (select 1 from public.tournament_player_matches where tournament_id = t.id) then raise exception 'A bracket already exists.'; end if;
  select array_agg(player_id order by random()) into players from public.tournament_player_registrations where tournament_id = t.id;
  n := coalesce(array_length(players, 1), 0);
  if n < coalesce(t.min_players, 2) then raise exception 'At least % players are required.', coalesce(t.min_players, 2); end if;
  if t.max_teams is not null and n > t.max_teams then raise exception 'The tournament exceeds its player limit.'; end if;
  while size < n loop size := size * 2; rounds := rounds + 1; end loop;
  for r in 1..rounds loop
    for s in 0..(size / (2 ^ r)::integer) - 1 loop
      insert into public.tournament_player_matches (tournament_id, round, slot, player_a, player_b)
      values (t.id, r, s, case when r = 1 then players[s + 1] end,
        case when r = 1 then players[s + 1 + size / 2] end);
    end loop;
  end loop;
  for m in select * from public.tournament_player_matches where tournament_id = t.id and round = 1 and player_a is not null and player_b is null loop
    update public.tournament_player_matches set winner_id = m.player_a, status = 'bye' where id = m.id;
    if m.slot % 2 = 0 then
      update public.tournament_player_matches set player_a = m.player_a where tournament_id = t.id and round = 2 and slot = m.slot / 2;
    else
      update public.tournament_player_matches set player_b = m.player_a where tournament_id = t.id and round = 2 and slot = m.slot / 2;
    end if;
  end loop;
  update public.tournaments set status = 'live' where id = t.id;
end;
$$;

-- Only called by the authorized confirmation and staff-resolution functions below.
create function public.gb_finish_player_tournament_match(p_match uuid, p_winner uuid, p_actor uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare
  m public.tournament_player_matches%rowtype;
  t public.tournaments%rowtype;
  final_round integer;
  award_id bigint;
begin
  select * into m from public.tournament_player_matches where id = p_match for update;
  if not found or m.winner_id is not null or m.player_a is null or m.player_b is null
    or p_winner is null or p_winner not in (m.player_a, m.player_b) then
    raise exception 'This match cannot be finalized with that winner.';
  end if;
  select * into t from public.tournaments where id = m.tournament_id for update;
  if t.entry_kind <> 'player' or t.status <> 'live' then raise exception 'This tournament is not live.'; end if;
  update public.tournament_player_matches set winner_id = p_winner, status = 'completed', decided_by = p_actor where id = m.id;
  select max(round) into final_round from public.tournament_player_matches where tournament_id = t.id;
  if m.round < final_round then
    if m.slot % 2 = 0 then
      update public.tournament_player_matches set player_a = p_winner where tournament_id = t.id and round = m.round + 1 and slot = m.slot / 2 and player_a is null;
    else
      update public.tournament_player_matches set player_b = p_winner where tournament_id = t.id and round = m.round + 1 and slot = m.slot / 2 and player_b is null;
    end if;
    if not found then raise exception 'The next bracket position is unavailable.'; end if;
  else
    insert into public.tournament_player_prizes (tournament_id, winner_id, credits) values (t.id, p_winner, t.prize_credits);
    if t.prize_credits > 0 then
      perform public.apply_credit_change(p_winner, t.prize_credits, 'Tournament winner: ' || t.title, 'prize', p_actor);
    end if;
    if t.winner_award is not null then
      select id into award_id from public.staff_award_catalog where name = t.winner_award;
      if award_id is null then raise exception 'The tournament winner award is unavailable.'; end if;
      insert into public.staff_user_awards (award_id, recipient_id, granted_by, reason)
      values (award_id, p_winner, p_winner, 'Won the ' || t.title || ' tournament.');
    end if;
    update public.tournaments set status = 'completed' where id = t.id;
  end if;
end;
$$;

create function public.report_player_tournament_match(p_match uuid, p_score_a integer, p_score_b integer)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare m public.tournament_player_matches%rowtype; t public.tournaments%rowtype;
begin
  select * into m from public.tournament_player_matches where id = p_match;
  if not found then raise exception 'Match not found.'; end if;
  select * into t from public.tournaments where id = m.tournament_id and entry_kind = 'player' and status = 'live' for update;
  if not found then raise exception 'This tournament is not live.'; end if;
  select * into m from public.tournament_player_matches where id = p_match for update;
  if auth.uid() is null or auth.uid() not in (m.player_a, m.player_b) or m.player_a is null or m.player_b is null then raise exception 'Only the players in this match can report it.'; end if;
  if m.status <> 'pending' then raise exception 'This match has already been reported.'; end if;
  if p_score_a is null or p_score_b is null or not ((p_score_a = t.target_score and p_score_b >= 0 and p_score_b < t.target_score) or (p_score_b = t.target_score and p_score_a >= 0 and p_score_a < t.target_score)) then
    raise exception 'The winner must reach % and the other player must have a lower score.', t.target_score;
  end if;
  update public.tournament_player_matches set status = 'reported', reported_by = auth.uid(),
    reported_winner = case when p_score_a = t.target_score then m.player_a else m.player_b end,
    score_a = p_score_a, score_b = p_score_b where id = m.id;
end;
$$;

create function public.confirm_player_tournament_match(p_match uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare m public.tournament_player_matches%rowtype;
begin
  select * into m from public.tournament_player_matches where id = p_match;
  if not found then raise exception 'Match not found.'; end if;
  perform 1 from public.tournaments where id = m.tournament_id for update;
  select * into m from public.tournament_player_matches where id = p_match for update;
  if auth.uid() is null or auth.uid() not in (m.player_a, m.player_b) or auth.uid() = m.reported_by or m.status <> 'reported' then
    raise exception 'Only the other player can confirm a reported result.';
  end if;
  perform public.gb_finish_player_tournament_match(m.id, m.reported_winner, auth.uid());
end;
$$;

create function public.dispute_player_tournament_match(p_match uuid, p_explanation text)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare m public.tournament_player_matches%rowtype;
begin
  select * into m from public.tournament_player_matches where id = p_match;
  if not found then raise exception 'Match not found.'; end if;
  perform 1 from public.tournaments where id = m.tournament_id and status = 'live' for update;
  if not found then raise exception 'This tournament is not live.'; end if;
  select * into m from public.tournament_player_matches where id = p_match for update;
  if auth.uid() is null or auth.uid() not in (m.player_a, m.player_b) or auth.uid() = m.reported_by or m.status <> 'reported' then
    raise exception 'Only the other player can dispute a reported result.';
  end if;
  if length(trim(coalesce(p_explanation, ''))) not between 10 and 2000 then raise exception 'Explain the dispute in 10 to 2000 characters.'; end if;
  insert into public.tournament_player_disputes (match_id, raised_by, explanation, original_score_a, original_score_b)
  values (m.id, auth.uid(), trim(p_explanation), m.score_a, m.score_b);
  update public.tournament_player_matches set status = 'disputed' where id = m.id;
end;
$$;

create function public.resolve_player_tournament_dispute(p_match uuid, p_score_a integer, p_score_b integer, p_resolution text)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare m public.tournament_player_matches%rowtype; t public.tournaments%rowtype;
begin
  if not public.has_staff_permission('match_review') and not public.has_staff_permission('staff_access') then raise exception 'Match review access is required.'; end if;
  select * into m from public.tournament_player_matches where id = p_match;
  if not found then raise exception 'Match not found.'; end if;
  select * into t from public.tournaments where id = m.tournament_id and status = 'live' for update;
  if not found then raise exception 'This tournament is not live.'; end if;
  select * into m from public.tournament_player_matches where id = p_match for update;
  if exists (select 1 from public.tournament_player_registrations where tournament_id = m.tournament_id and player_id = auth.uid()) then
    raise exception 'Another staff member must resolve a tournament you entered.';
  end if;
  if m.status <> 'disputed' then raise exception 'This match is not awaiting dispute review.'; end if;
  if length(trim(coalesce(p_resolution, ''))) not between 10 and 2000 then raise exception 'Explain the decision in 10 to 2000 characters.'; end if;
  if p_score_a is null or p_score_b is null or not ((p_score_a = t.target_score and p_score_b >= 0 and p_score_b < t.target_score) or (p_score_b = t.target_score and p_score_a >= 0 and p_score_a < t.target_score)) then
    raise exception 'The winner must reach % and the other player must have a lower score.', t.target_score;
  end if;
  update public.tournament_player_disputes set resolved_by = auth.uid(), resolution = trim(p_resolution), resolved_at = now()
    where match_id = m.id and resolved_at is null;
  if not found then raise exception 'The open dispute was not found.'; end if;
  update public.tournament_player_matches set score_a = p_score_a, score_b = p_score_b where id = m.id;
  perform public.gb_finish_player_tournament_match(m.id, case when p_score_a = t.target_score then m.player_a else m.player_b end, auth.uid());
end;
$$;

revoke all on function public.gb_finish_player_tournament_match(uuid, uuid, uuid) from public, anon, authenticated;
revoke all on function public.register_player_for_tournament(uuid), public.unregister_player_from_tournament(uuid),
  public.generate_player_tournament_bracket(uuid), public.report_player_tournament_match(uuid, integer, integer),
  public.confirm_player_tournament_match(uuid), public.dispute_player_tournament_match(uuid, text),
  public.resolve_player_tournament_dispute(uuid, integer, integer, text) from public, anon;
grant execute on function public.register_player_for_tournament(uuid), public.unregister_player_from_tournament(uuid),
  public.generate_player_tournament_bracket(uuid), public.report_player_tournament_match(uuid, integer, integer),
  public.confirm_player_tournament_match(uuid), public.dispute_player_tournament_match(uuid, text),
  public.resolve_player_tournament_dispute(uuid, integer, integer, text) to authenticated;

create or replace function public.gb_guard_staff_tournament()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare is_owner boolean;
begin
  if tg_op = 'UPDATE' and new.entry_kind is distinct from old.entry_kind then
    raise exception 'The entrant type cannot be changed after a tournament is created.';
  end if;
  if tg_op = 'UPDATE' and old.entry_kind = 'player' then
    if old.status <> 'upcoming' and
      (new.entry_kind, new.min_players, new.max_teams, new.prize_credits, new.winner_award, new.target_score)
      is distinct from (old.entry_kind, old.min_players, old.max_teams, old.prize_credits, old.winner_award, old.target_score) then
      raise exception 'Player tournament entry and prizes cannot change after the bracket starts.';
    end if;
    if new.status = 'live' and old.status <> 'live' and not exists
      (select 1 from public.tournament_player_matches where tournament_id = old.id) then
      raise exception 'Generate the player bracket to start this tournament.';
    end if;
    if new.status = 'completed' and old.status <> 'completed' and not exists
      (select 1 from public.tournament_player_prizes where tournament_id = old.id) then
      raise exception 'The final must be decided before completing this tournament.';
    end if;
    if old.status = 'live' and new.status = 'completed'
      and (to_jsonb(new) - 'status') = (to_jsonb(old) - 'status')
      and exists (select 1 from public.tournament_player_prizes where tournament_id = old.id) then
      return new;
    end if;
  end if;
  if auth.uid() is null then
    if tg_op = 'DELETE' then return old; else return new; end if;
  end if;
  select role = 'owner' into is_owner from public.profiles where id = auth.uid();
  if not public.has_staff_permission('staff_access') then raise exception 'Tournament management access is required'; end if;
  if tg_op in ('UPDATE', 'DELETE') and exists (
    select 1 from public.tournament_registrations r
    where r.tournament_id = old.id and public.gb_staff_conflicts_team(r.team_id)
  ) then
    raise exception 'Another staff member must manage a tournament involving your team';
  end if;
  if not coalesce(is_owner, false) then
    if tg_op = 'INSERT' then
      if new.created_by is distinct from auth.uid() or coalesce(new.entry_fee, 0) <> 0
        or coalesce(new.entry_fee_credits, 0) <> 0 or coalesce(new.prize_credits, 0) <> 0
        or coalesce(new.prize_per_player, false) or nullif(trim(new.prize), '') is not null
        or new.winner_award is not null or not new.is_free or new.competition_type = 'weekly_cup' then
        raise exception 'Only a Founder can set tournament fees and prizes';
      end if;
    elsif tg_op = 'UPDATE' then
      if (new.entry_fee, new.entry_fee_credits, new.prize_credits, new.prize_per_player, new.prize, new.is_free, new.created_by, new.competition_type, new.winner_award)
        is distinct from
        (old.entry_fee, old.entry_fee_credits, old.prize_credits, old.prize_per_player, old.prize, old.is_free, old.created_by, old.competition_type, old.winner_award) then
        raise exception 'Only a Founder can change tournament fees and prizes';
      end if;
    elsif old.competition_type = 'weekly_cup' or coalesce(old.entry_fee, 0) <> 0
      or coalesce(old.entry_fee_credits, 0) <> 0 or coalesce(old.prize_credits, 0) <> 0
      or nullif(trim(old.prize), '') is not null or old.winner_award is not null then
      raise exception 'Only a Founder can delete tournaments with fees or prizes';
    end if;
  end if;
  insert into public.staff_activity_log(actor_id, action, target_type, target_id, previous_values, new_values, reason)
    values (auth.uid(), 'tournament_' || lower(tg_op), 'tournament',
      case when tg_op = 'DELETE' then old.id::text else new.id::text end,
      case when tg_op = 'INSERT' then null else to_jsonb(old) end,
      case when tg_op = 'DELETE' then null else to_jsonb(new) end, 'Tournament updated');
  if tg_op = 'DELETE' then return old; else return new; end if;
end;
$$;

