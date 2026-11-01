alter table public.tournaments add column if not exists entry_fee_credits integer not null default 0 check (entry_fee_credits >= 0);
alter table public.tournaments add column if not exists prize_credits integer not null default 0 check (prize_credits >= 0);
alter table public.tournament_registrations add column if not exists credits_paid integer not null default 0;

create table if not exists public.tournament_prize_payouts (
  id bigserial primary key,
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  placement integer not null default 1,
  total_credits integer not null check (total_credits > 0),
  paid_by uuid,
  created_at timestamptz not null default now(),
  unique (tournament_id, team_id),
  unique (tournament_id, placement)
);

alter table public.tournament_prize_payouts enable row level security;
drop policy if exists "Payouts are public" on public.tournament_prize_payouts;
create policy "Payouts are public" on public.tournament_prize_payouts for select using (true);

-- Entry fees are charged to the team owner on registration and refunded on withdrawal.
create or replace function public.register_team_for_tournament(
  p_tournament_id uuid,
  p_team_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  t public.tournaments%rowtype;
  v_count integer;
  v_balance integer;
begin
  if auth.uid() is null then
    raise exception 'You must be signed in.';
  end if;

  select * into t from public.tournaments where id = p_tournament_id for update;
  if not found or t.status <> 'upcoming' then
    raise exception 'This tournament is not open for registration.';
  end if;
  if t.starts_at is not null and t.starts_at <= now() then
    raise exception 'This tournament has already started.';
  end if;
  if not t.is_free and t.entry_fee > 0 and t.entry_fee_credits = 0 then
    raise exception 'Paid tournaments are not open for online registration yet.';
  end if;

  if not exists (
    select 1 from public.teams
    where id = p_team_id and owner_id = auth.uid()
  ) then
    raise exception 'Only the team owner can register a team.';
  end if;

  if t.platform is not null and not exists (
    select 1 from public.teams
    where id = p_team_id and platform = t.platform
  ) then
    raise exception 'This team is not on the % platform.', t.platform;
  end if;

  select count(*) into v_count
  from public.tournament_registrations
  where tournament_id = p_tournament_id;
  if t.max_teams is not null and v_count >= t.max_teams then
    raise exception 'This tournament is full.';
  end if;

  if exists (
    select 1 from public.tournament_registrations
    where tournament_id = p_tournament_id and team_id = p_team_id
  ) then
    raise exception 'This team is already registered.';
  end if;

  if t.entry_fee_credits > 0 then
    select credits into v_balance from public.profiles where id = auth.uid();
    if coalesce(v_balance, 0) < t.entry_fee_credits then
      raise exception 'Not enough credits. Entry costs % credits and you have %.', t.entry_fee_credits, coalesce(v_balance, 0);
    end if;
    perform public.apply_credit_change(auth.uid(), -t.entry_fee_credits, 'Entry fee: ' || t.title, 'spend', auth.uid());
  end if;

  insert into public.tournament_registrations (tournament_id, team_id, registered_by, credits_paid)
  values (p_tournament_id, p_team_id, auth.uid(), t.entry_fee_credits);
end;
$$;

create or replace function public.unregister_team_from_tournament(
  p_tournament_id uuid,
  p_team_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  r public.tournament_registrations%rowtype;
  t public.tournaments%rowtype;
begin
  if not exists (
    select 1 from public.teams
    where id = p_team_id and owner_id = auth.uid()
  ) then
    raise exception 'Only the team owner can withdraw a team.';
  end if;

  select * into t from public.tournaments where id = p_tournament_id;
  select * into r from public.tournament_registrations
   where tournament_id = p_tournament_id and team_id = p_team_id for update;
  if not found then
    return;
  end if;

  if t.status <> 'upcoming' or (t.starts_at is not null and t.starts_at <= now()) then
    raise exception 'You can no longer withdraw from this tournament.';
  end if;

  delete from public.tournament_registrations where id = r.id;

  if r.credits_paid > 0 then
    perform public.apply_credit_change(r.registered_by, r.credits_paid, 'Refund: ' || t.title, 'adjustment', auth.uid());
  end if;
end;
$$;

-- Pays a team's prize, split evenly across every team member (remainder goes to the owner).
create or replace function public.staff_award_tournament_prize(
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
declare
  t public.tournaments%rowtype;
  v_total integer;
  v_owner uuid;
  v_members uuid[];
  v_share integer;
  v_rest integer;
  v_user uuid;
begin
  if auth.uid() is null or not public.has_staff_permission('staff_access') then
    raise exception 'Only owner-level staff can pay out prizes.';
  end if;

  select * into t from public.tournaments where id = p_tournament_id;
  if not found then
    raise exception 'Tournament not found.';
  end if;

  v_total := coalesce(p_total_credits, t.prize_credits);
  if v_total is null or v_total <= 0 then
    raise exception 'Set a prize amount greater than 0.';
  end if;

  if not exists (
    select 1 from public.tournament_registrations
    where tournament_id = p_tournament_id and team_id = p_team_id
  ) then
    raise exception 'That team is not registered for this tournament.';
  end if;

  select owner_id into v_owner from public.teams where id = p_team_id;
  select array_agg(distinct u) into v_members
  from (
    select user_id as u from public.team_members where team_id = p_team_id and user_id is not null
    union
    select v_owner
  ) m
  where u is not null;

  if v_members is null or array_length(v_members, 1) = 0 then
    raise exception 'That team has no members to pay.';
  end if;

  insert into public.tournament_prize_payouts (tournament_id, team_id, placement, total_credits, paid_by)
  values (p_tournament_id, p_team_id, p_placement, v_total, auth.uid());

  v_share := v_total / array_length(v_members, 1);
  v_rest := v_total - v_share * array_length(v_members, 1);

  foreach v_user in array v_members loop
    if v_share + (case when v_user = v_owner then v_rest else 0 end) > 0 then
      perform public.apply_credit_change(
        v_user,
        v_share + (case when v_user = v_owner then v_rest else 0 end),
        'Prize: ' || t.title || ' (place ' || p_placement || ')',
        'prize',
        auth.uid()
      );
    end if;
  end loop;

  return v_total;
exception
  when unique_violation then
    raise exception 'A prize was already paid for that team or placement in this tournament.';
end;
$$;

revoke all on function public.staff_award_tournament_prize(uuid, uuid, integer, integer) from public, anon;
grant execute on function public.staff_award_tournament_prize(uuid, uuid, integer, integer) to authenticated;

update public.tournaments
   set prize_credits = 0, entry_fee_credits = 0
 where title = 'Rapid Royal Trios Kill Race Tournament' and prize_credits is null;
