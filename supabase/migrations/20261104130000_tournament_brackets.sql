-- Single-elimination brackets for tournaments. Additive: no existing tables are changed.
create table if not exists public.tournament_matches (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  round integer not null check (round >= 1),
  slot integer not null check (slot >= 0),
  team_a uuid references public.teams(id) on delete set null,
  team_b uuid references public.teams(id) on delete set null,
  winner_id uuid references public.teams(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (tournament_id, round, slot)
);

create index if not exists tournament_matches_tournament_idx
  on public.tournament_matches (tournament_id, round, slot);

alter table public.tournament_matches enable row level security;

drop policy if exists "Bracket matches are public" on public.tournament_matches;
create policy "Bracket matches are public"
  on public.tournament_matches for select
  using (true);

-- Moves a decided match's winner into the next round (slot/2; even slot -> team_a, odd -> team_b).
create or replace function public.gb_advance_bracket_winner(p_match uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  m public.tournament_matches%rowtype;
  v_rounds integer;
begin
  select * into m from public.tournament_matches where id = p_match;
  if not found then return; end if;

  select max(round) into v_rounds from public.tournament_matches where tournament_id = m.tournament_id;

  if m.round >= v_rounds then
    update public.tournaments set status = 'completed' where id = m.tournament_id and m.winner_id is not null;
    return;
  end if;

  if m.slot % 2 = 0 then
    update public.tournament_matches set team_a = m.winner_id
    where tournament_id = m.tournament_id and round = m.round + 1 and slot = m.slot / 2;
  else
    update public.tournament_matches set team_b = m.winner_id
    where tournament_id = m.tournament_id and round = m.round + 1 and slot = m.slot / 2;
  end if;
end;
$$;

create or replace function public.generate_tournament_bracket(p_tournament uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_teams uuid[];
  v_n integer;
  v_size integer := 2;
  v_rounds integer := 1;
  r integer;
  s integer;
  m record;
begin
  if not public.has_staff_permission('staff_access') then
    raise exception 'Staff access required.';
  end if;

  if exists (select 1 from public.tournament_matches where tournament_id = p_tournament) then
    raise exception 'A bracket already exists. Reset it first.';
  end if;

  select array_agg(team_id order by random()) into v_teams
  from public.tournament_registrations where tournament_id = p_tournament;

  v_n := coalesce(array_length(v_teams, 1), 0);
  if v_n < 2 then
    raise exception 'At least 2 registered teams are required.';
  end if;

  while v_size < v_n loop
    v_size := v_size * 2;
    v_rounds := v_rounds + 1;
  end loop;

  for r in 1..v_rounds loop
    for s in 0..(v_size / (2 ^ r)::integer) - 1 loop
      insert into public.tournament_matches (tournament_id, round, slot, team_a, team_b)
      values (
        p_tournament, r, s,
        case when r = 1 then v_teams[s + 1] end,
        case when r = 1 then v_teams[s + 1 + v_size / 2] end
      );
    end loop;
  end loop;

  -- Byes: a lone team in round 1 advances automatically.
  for m in
    select id, team_a from public.tournament_matches
    where tournament_id = p_tournament and round = 1 and team_a is not null and team_b is null
  loop
    update public.tournament_matches set winner_id = m.team_a where id = m.id;
    perform public.gb_advance_bracket_winner(m.id);
  end loop;

  update public.tournaments set status = 'live' where id = p_tournament and status = 'upcoming';
end;
$$;

create or replace function public.set_tournament_match_winner(p_match uuid, p_winner uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  m public.tournament_matches%rowtype;
  nxt public.tournament_matches%rowtype;
begin
  if not public.has_staff_permission('staff_access') then
    raise exception 'Staff access required.';
  end if;

  select * into m from public.tournament_matches where id = p_match;
  if not found then raise exception 'Match not found.'; end if;
  if m.team_a is null or m.team_b is null then
    raise exception 'Both teams must be set before choosing a winner.';
  end if;
  if p_winner is distinct from m.team_a and p_winner is distinct from m.team_b then
    raise exception 'Winner must be one of the two teams in this match.';
  end if;

  select * into nxt from public.tournament_matches
  where tournament_id = m.tournament_id and round = m.round + 1 and slot = m.slot / 2;
  if found and nxt.winner_id is not null then
    raise exception 'The next round is already decided. Undo that match first.';
  end if;

  update public.tournament_matches set winner_id = p_winner where id = p_match;
  perform public.gb_advance_bracket_winner(p_match);
end;
$$;

create or replace function public.reset_tournament_bracket(p_tournament uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.has_staff_permission('staff_access') then
    raise exception 'Staff access required.';
  end if;
  delete from public.tournament_matches where tournament_id = p_tournament;
end;
$$;

revoke all on function public.gb_advance_bracket_winner(uuid) from public, anon, authenticated;
revoke all on function public.generate_tournament_bracket(uuid) from public, anon;
revoke all on function public.set_tournament_match_winner(uuid, uuid) from public, anon;
revoke all on function public.reset_tournament_bracket(uuid) from public, anon;
grant execute on function public.generate_tournament_bracket(uuid) to authenticated;
grant execute on function public.set_tournament_match_winner(uuid, uuid) to authenticated;
grant execute on function public.reset_tournament_bracket(uuid) to authenticated;
