-- Manual credit purchases: players request a pack, the Founder sends PayPal (Friends & Family) details,
-- then adds the credits once payment is confirmed. Prices are in Canadian dollars.
begin;

create table if not exists public.credit_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  package_key text not null,
  credits integer not null check (credits > 0),
  price_cad numeric(10,2) not null check (price_cad > 0),
  status text not null default 'pending' check (status in ('pending', 'awaiting_payment', 'completed', 'cancelled')),
  staff_note text,
  handled_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  details_sent_at timestamptz,
  closed_at timestamptz
);

create index if not exists credit_requests_status_idx on public.credit_requests (status, created_at);
create unique index if not exists credit_requests_one_open_idx on public.credit_requests (user_id)
  where status in ('pending', 'awaiting_payment');

alter table public.credit_requests enable row level security;
drop policy if exists "Users read own credit requests" on public.credit_requests;
create policy "Users read own credit requests" on public.credit_requests for select using (auth.uid() = user_id);

create or replace function public.gb_is_founder()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'owner');
$$;
revoke all on function public.gb_is_founder() from public, anon;
grant execute on function public.gb_is_founder() to authenticated;

-- Player sends a request. Packs and prices mirror lib/creditPackages.ts.
create or replace function public.gb_request_credits(p_package text)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_credits integer;
  v_price numeric(10,2);
  v_id uuid;
  v_name text;
  v_founder uuid;
begin
  if auth.uid() is null then raise exception 'Sign in to request credits.'; end if;

  select c, p into v_credits, v_price from (values
    ('c5', 5, 2.00), ('c10', 10, 3.50), ('c15', 15, 5.00), ('c20', 20, 6.50), ('c25', 25, 8.00)
  ) as packs(k, c, p) where k = p_package;
  if v_credits is null then raise exception 'Choose a credit pack.'; end if;

  if exists (select 1 from public.credit_requests where user_id = auth.uid() and status in ('pending', 'awaiting_payment')) then
    raise exception 'You already have a credit request in progress. Check your inbox for the next step.';
  end if;

  insert into public.credit_requests (user_id, package_key, credits, price_cad)
  values (auth.uid(), p_package, v_credits, v_price)
  returning id into v_id;

  select coalesce(username, 'A player') into v_name from public.profiles where id = auth.uid();
  for v_founder in select id from public.profiles where role = 'owner' loop
    perform public.gb_notify(
      v_founder,
      'Credit request: ' || v_name || ' wants ' || v_credits || ' credits',
      v_name || ' is requesting ' || v_credits || ' credits ($' || to_char(v_price, 'FM990.00') || ' CAD).'
        || E'\n\nOpen Staff Dashboard > Pending credit purchases to send payment details.',
      'credit_request', v_id
    );
  end loop;

  return v_id;
end;
$$;
revoke all on function public.gb_request_credits(text) from public, anon;
grant execute on function public.gb_request_credits(text) to authenticated;

create or replace function public.staff_credit_requests()
returns table (
  id uuid, user_id uuid, username text, credits integer, price_cad numeric, status text,
  staff_note text, created_at timestamptz, details_sent_at timestamptz, closed_at timestamptz, balance integer
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.gb_is_founder() then raise exception 'Only the Founder can view credit purchases.'; end if;
  return query
    select r.id, r.user_id, p.username, r.credits, r.price_cad, r.status, r.staff_note,
           r.created_at, r.details_sent_at, r.closed_at, p.credits
    from public.credit_requests r join public.profiles p on p.id = r.user_id
    where r.status in ('pending', 'awaiting_payment') or r.closed_at > now() - interval '30 days'
    order by (r.status in ('pending', 'awaiting_payment')) desc, r.created_at desc;
end;
$$;
revoke all on function public.staff_credit_requests() from public, anon;
grant execute on function public.staff_credit_requests() to authenticated;

create or replace function public.staff_send_credit_payment_details(p_request uuid, p_paypal_email text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  r public.credit_requests%rowtype;
  v_email text := lower(btrim(coalesce(p_paypal_email, '')));
  v_name text;
begin
  if not public.gb_is_founder() then raise exception 'Only the Founder can send payment details.'; end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Enter a valid PayPal email.'; end if;

  select * into r from public.credit_requests where id = p_request for update;
  if not found or r.status not in ('pending', 'awaiting_payment') then raise exception 'This request is no longer open.'; end if;
  select username into v_name from public.profiles where id = r.user_id;

  update public.credit_requests set status = 'awaiting_payment', details_sent_at = now(), handled_by = auth.uid()
  where id = r.id;

  perform public.gb_notify(
    r.user_id,
    'Finish your credit purchase: ' || r.credits || ' credits',
    'Thanks for your credit request! To finish your purchase of ' || r.credits || ' credits:'
      || E'\n\n1. In PayPal, send $' || to_char(r.price_cad, 'FM990.00') || ' CAD to ' || v_email || '.'
      || E'\n2. Choose "Friends and Family" (purchases sent as Goods and Services cannot be accepted).'
      || E'\n3. Put your GameBattles username (' || coalesce(v_name, 'your username') || ') in the payment note.'
      || E'\n\nIf you pay in another currency, PayPal converts it to Canadian dollars. Your credits are added once payment is confirmed.'
      || E'\n\nNever share your PayPal password or login details with anyone. GameBattles staff will never ask for them.',
    'credit_request', r.id
  );
end;
$$;
revoke all on function public.staff_send_credit_payment_details(uuid, text) from public, anon;
grant execute on function public.staff_send_credit_payment_details(uuid, text) to authenticated;

create or replace function public.staff_complete_credit_request(p_request uuid)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  r public.credit_requests%rowtype;
  v_balance integer;
begin
  if not public.gb_is_founder() then raise exception 'Only the Founder can add purchased credits.'; end if;
  select * into r from public.credit_requests where id = p_request for update;
  if not found or r.status not in ('pending', 'awaiting_payment') then raise exception 'This request is no longer open.'; end if;

  update public.credit_requests set status = 'completed', closed_at = now(), handled_by = auth.uid() where id = r.id;
  v_balance := public.apply_credit_change(
    r.user_id, r.credits,
    'Purchased ' || r.credits || ' credits ($' || to_char(r.price_cad, 'FM990.00') || ' CAD, PayPal Friends & Family)',
    'purchase', auth.uid()
  );

  perform public.gb_notify(
    r.user_id,
    'Your ' || r.credits || ' credits have been added',
    'Payment confirmed. ' || r.credits || ' credits have been added to your account. Your balance is now '
      || v_balance || ' credits. Good luck in your next tournament!',
    'credit_request', r.id
  );
  return v_balance;
end;
$$;
revoke all on function public.staff_complete_credit_request(uuid) from public, anon;
grant execute on function public.staff_complete_credit_request(uuid) to authenticated;

create or replace function public.staff_cancel_credit_request(p_request uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  r public.credit_requests%rowtype;
  v_reason text := nullif(btrim(coalesce(p_reason, '')), '');
begin
  if not public.gb_is_founder() then raise exception 'Only the Founder can cancel credit requests.'; end if;
  select * into r from public.credit_requests where id = p_request for update;
  if not found or r.status not in ('pending', 'awaiting_payment') then raise exception 'This request is no longer open.'; end if;

  update public.credit_requests set status = 'cancelled', closed_at = now(), handled_by = auth.uid(), staff_note = v_reason
  where id = r.id;

  perform public.gb_notify(
    r.user_id,
    'Your credit request was cancelled',
    'Your request for ' || r.credits || ' credits has been cancelled.' || coalesce(E'\n\nReason: ' || v_reason, '')
      || E'\n\nYou can send a new request from the Tournaments page at any time.',
    'credit_request', r.id
  );
end;
$$;
revoke all on function public.staff_cancel_credit_request(uuid, text) from public, anon;
grant execute on function public.staff_cancel_credit_request(uuid, text) to authenticated;

commit;
