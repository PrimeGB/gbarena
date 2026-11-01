alter table public.tournaments add column if not exists prize_per_player boolean not null default false;

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
  v_amount integer;
  v_per_player boolean;
  v_owner uuid;
  v_members uuid[];
  v_n integer;
  v_share integer;
  v_rest integer;
  v_paid integer := 0;
  v_user uuid;
  v_give integer;
begin
  if auth.uid() is null or not public.has_staff_permission('staff_access') then
    raise exception 'Only owner-level staff can pay out prizes.';
  end if;

  select * into t from public.tournaments where id = p_tournament_id;
  if not found then
    raise exception 'Tournament not found.';
  end if;

  v_amount := coalesce(p_total_credits, t.prize_credits);
  v_per_player := p_total_credits is null and t.prize_per_player;
  if v_amount is null or v_amount <= 0 then
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

  v_n := coalesce(array_length(v_members, 1), 0);
  if v_n = 0 then
    raise exception 'That team has no members to pay.';
  end if;

  v_share := case when v_per_player then v_amount else v_amount / v_n end;
  v_rest := case when v_per_player then 0 else v_amount - (v_amount / v_n) * v_n end;

  insert into public.tournament_prize_payouts (tournament_id, team_id, placement, total_credits, paid_by)
  values (p_tournament_id, p_team_id, p_placement, v_share * v_n + v_rest, auth.uid());

  foreach v_user in array v_members loop
    v_give := v_share + (case when v_user = v_owner then v_rest else 0 end);
    if v_give > 0 then
      perform public.apply_credit_change(
        v_user, v_give,
        'Prize: ' || t.title || ' (place ' || p_placement || ')',
        'prize', auth.uid()
      );
      v_paid := v_paid + v_give;
    end if;
  end loop;

  return v_paid;
exception
  when unique_violation then
    raise exception 'A prize was already paid for that team or placement in this tournament.';
end;
$$;

revoke all on function public.staff_award_tournament_prize(uuid, uuid, integer, integer) from public, anon;
grant execute on function public.staff_award_tournament_prize(uuid, uuid, integer, integer) to authenticated;

update public.tournaments
   set prize_credits = 25,
       prize_per_player = true,
       entry_fee_credits = 0,
       prize = '25 credits per winning player'
 where title = 'Rapid Royal Trios Kill Race Tournament';
