begin;

-- Payment details now come from the Founder so the player can reply with their payment confirmation.
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
  v_price text;
begin
  if not public.gb_is_founder() then raise exception 'Only the Founder can send payment details.'; end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Enter a valid PayPal email.'; end if;

  select * into r from public.credit_requests where id = p_request for update;
  if not found or r.status not in ('pending', 'awaiting_payment') then raise exception 'This request is no longer open.'; end if;
  select coalesce(username, 'your username') into v_name from public.profiles where id = r.user_id;
  v_price := '$' || to_char(r.price_cad, 'FM990.00') || ' CAD';

  update public.credit_requests set status = 'awaiting_payment', details_sent_at = now(), handled_by = auth.uid()
  where id = r.id;

  insert into public.messages (sender_id, recipient_id, sender_type, subject, body, message_type, related_type, related_id, is_read, is_archived)
  values (
    auth.uid(), r.user_id, 'staff',
    'Your credit purchase: ' || r.credits || ' credits for ' || v_price,
    'Hi ' || v_name || ','
      || E'\n\nThanks for your credit request! Here are your purchase details.'
      || E'\n\nWHAT YOU ARE BUYING\n' || r.credits || ' GameBattles credits'
      || E'\nPrice: ' || v_price
      || E'\n\nHOW TO PAY'
      || E'\n1. Open PayPal and choose Send.'
      || E'\n2. Send ' || v_price || ' to: ' || v_email
      || E'\n3. Choose "Friends and Family". Payments sent as "Goods and Services" cannot be accepted.'
      || E'\n4. In the payment note, write your GameBattles username: ' || v_name
      || E'\n\nAFTER YOU PAY'
      || E'\nReply to this message to let us know your payment has been sent. Once we confirm it, your '
      || r.credits || ' credits will be added to your account and you will get a message.'
      || E'\n\nIf you pay in another currency, PayPal converts it to Canadian dollars. Credits are non-refundable but can be used toward paid tournaments, including events with cash prizes.'
      || E'\n\nStay safe: never share your PayPal password or login details with anyone. GameBattles staff will never ask for them.',
    'staff', 'credit_request', r.id, false, false
  );
end;
$$;
revoke all on function public.staff_send_credit_payment_details(uuid, text) from public, anon;
grant execute on function public.staff_send_credit_payment_details(uuid, text) to authenticated;

drop function if exists public.staff_credit_requests();
create function public.staff_credit_requests()
returns table (
  id uuid, user_id uuid, username text, credits integer, price_cad numeric, status text,
  staff_note text, created_at timestamptz, details_sent_at timestamptz, closed_at timestamptz, balance integer,
  player_replied_at timestamptz
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
           r.created_at, r.details_sent_at, r.closed_at, p.credits,
           (select max(m.created_at) from public.messages m
             join public.profiles o on o.id = m.recipient_id and o.role = 'owner'
             where m.sender_id = r.user_id and r.details_sent_at is not null and m.created_at >= r.details_sent_at)
    from public.credit_requests r join public.profiles p on p.id = r.user_id
    where r.status in ('pending', 'awaiting_payment') or r.closed_at > now() - interval '30 days'
    order by (r.status in ('pending', 'awaiting_payment')) desc, r.created_at desc;
end;
$$;
revoke all on function public.staff_credit_requests() from public, anon;
grant execute on function public.staff_credit_requests() to authenticated;

commit;
