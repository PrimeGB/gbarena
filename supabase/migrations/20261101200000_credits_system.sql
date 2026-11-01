alter table public.profiles add column if not exists credits integer not null default 0 check (credits >= 0);

create table if not exists public.credit_transactions (
  id bigserial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount integer not null,
  balance_after integer not null,
  reason text not null,
  kind text not null default 'award' check (kind in ('award', 'purchase', 'prize', 'spend', 'adjustment')),
  created_by uuid,
  created_at timestamptz not null default now()
);

create index if not exists credit_transactions_user_idx on public.credit_transactions (user_id, created_at desc);

alter table public.credit_transactions enable row level security;

drop policy if exists "Users read own credit history" on public.credit_transactions;
create policy "Users read own credit history"
  on public.credit_transactions for select
  using (auth.uid() = user_id);

-- Balances can only change through the functions below (they run as the database owner).
create or replace function public.guard_profile_credits()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    if not public.gb_is_db_role() then
      new.credits := 0;
    end if;
  elsif new.credits is distinct from old.credits and not public.gb_is_db_role() then
    raise exception 'Credits can only be changed through awards, purchases or prizes.';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_profile_credits_trg on public.profiles;
create trigger guard_profile_credits_trg
  before insert or update on public.profiles
  for each row execute function public.guard_profile_credits();

-- Shared helper for staff awards, future purchases and tournament prizes.
create or replace function public.apply_credit_change(
  p_user_id uuid,
  p_amount integer,
  p_reason text,
  p_kind text default 'award',
  p_created_by uuid default null
)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_balance integer;
begin
  if p_amount = 0 then
    raise exception 'Amount cannot be zero.';
  end if;

  update public.profiles
     set credits = credits + p_amount
   where id = p_user_id
   returning credits into v_balance;

  if not found then
    raise exception 'Player not found.';
  end if;

  insert into public.credit_transactions (user_id, amount, balance_after, reason, kind, created_by)
  values (p_user_id, p_amount, v_balance, p_reason, p_kind, p_created_by);

  return v_balance;
end;
$$;

revoke all on function public.apply_credit_change(uuid, integer, text, text, uuid) from public, anon, authenticated;

create or replace function public.staff_adjust_credits(
  target_username text,
  credit_amount integer,
  credit_reason text
)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_target uuid;
begin
  if auth.uid() is null or not public.has_staff_permission('staff_access') then
    raise exception 'Only owner-level staff can award or remove credits.';
  end if;
  if length(trim(coalesce(credit_reason, ''))) < 5 then
    raise exception 'Enter a reason of at least 5 characters.';
  end if;

  select id into v_target from public.profiles where lower(username) = lower(trim(target_username));
  if v_target is null then
    raise exception 'No player named % was found.', target_username;
  end if;

  return public.apply_credit_change(
    v_target,
    credit_amount,
    trim(credit_reason),
    case when credit_amount > 0 then 'award' else 'adjustment' end,
    auth.uid()
  );
end;
$$;

revoke all on function public.staff_adjust_credits(text, integer, text) from public, anon;
grant execute on function public.staff_adjust_credits(text, integer, text) to authenticated;
