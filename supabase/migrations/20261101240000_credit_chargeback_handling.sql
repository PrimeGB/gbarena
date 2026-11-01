create table if not exists public.credit_purchase_blocks (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  reason text not null,
  created_at timestamptz not null default now()
);

alter table public.credit_purchase_blocks enable row level security;

create table if not exists public.paypal_webhook_events (
  event_id text primary key,
  event_type text not null,
  created_at timestamptz not null default now()
);

alter table public.paypal_webhook_events enable row level security;

-- Called by the PayPal webhook when a payment is refunded, reversed or disputed.
-- Removes the purchased credits (as many as the player still has), blocks future purchases and logs it.
create or replace function public.reverse_credit_purchase(p_capture_id text, p_reason text)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  r public.credit_purchases%rowtype;
  v_balance integer;
  v_take integer;
begin
  select * into r from public.credit_purchases where paypal_capture_id = p_capture_id for update;
  if not found then
    return 'unknown-payment';
  end if;
  if r.status = 'reversed' then
    return 'already-reversed';
  end if;
  if r.status <> 'completed' then
    return 'not-completed';
  end if;

  update public.credit_purchases set status = 'reversed' where id = r.id;

  select credits into v_balance from public.profiles where id = r.user_id for update;
  v_take := least(coalesce(v_balance, 0), r.credits);

  if v_take > 0 then
    perform public.apply_credit_change(
      r.user_id, -v_take,
      p_reason || case when v_take < r.credits
        then ' (' || (r.credits - v_take) || ' credits already spent)' else '' end,
      'adjustment', null
    );
  end if;

  insert into public.credit_purchase_blocks (user_id, reason)
  values (r.user_id, p_reason)
  on conflict (user_id) do nothing;

  return 'reversed';
end;
$$;

revoke all on function public.reverse_credit_purchase(text, text) from public, anon, authenticated;
grant execute on function public.reverse_credit_purchase(text, text) to service_role;

-- Staff can lift a block after reviewing the case.
create or replace function public.staff_clear_purchase_block(target_username text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null or not public.has_staff_permission('staff_access') then
    raise exception 'Only owner-level staff can clear purchase blocks.';
  end if;
  delete from public.credit_purchase_blocks
   where user_id = (select id from public.profiles where lower(username) = lower(trim(target_username)));
end;
$$;

revoke all on function public.staff_clear_purchase_block(text) from public, anon;
grant execute on function public.staff_clear_purchase_block(text) to authenticated;
