create table if not exists public.credit_purchases (
  id bigserial primary key,
  paypal_order_id text not null unique,
  paypal_capture_id text unique,
  user_id uuid not null references public.profiles(id) on delete cascade,
  package_key text not null,
  credits integer not null check (credits > 0),
  amount_usd numeric(10,2) not null check (amount_usd > 0),
  status text not null default 'created' check (status in ('created', 'completed', 'failed', 'reversed')),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists credit_purchases_user_idx on public.credit_purchases (user_id, created_at desc);

alter table public.credit_purchases enable row level security;

drop policy if exists "Users read own purchases" on public.credit_purchases;
create policy "Users read own purchases"
  on public.credit_purchases for select
  using (auth.uid() = user_id);

-- Credits are only granted here, after the server has confirmed the PayPal capture.
-- Locking the row and checking its status makes this safe to call twice.
create or replace function public.complete_credit_purchase(p_order_id text, p_capture_id text)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  r public.credit_purchases%rowtype;
  v_balance integer;
begin
  select * into r from public.credit_purchases where paypal_order_id = p_order_id for update;
  if not found then
    raise exception 'Unknown order.';
  end if;

  if r.status = 'completed' then
    select credits into v_balance from public.profiles where id = r.user_id;
    return v_balance;
  end if;
  if r.status <> 'created' then
    raise exception 'This order can no longer be completed.';
  end if;

  update public.credit_purchases
     set status = 'completed', paypal_capture_id = p_capture_id, completed_at = now()
   where id = r.id;

  return public.apply_credit_change(r.user_id, r.credits, 'Purchased ' || r.credits || ' credits (PayPal)', 'purchase', null);
end;
$$;

revoke all on function public.complete_credit_purchase(text, text) from public, anon, authenticated;
grant execute on function public.complete_credit_purchase(text, text) to service_role;
