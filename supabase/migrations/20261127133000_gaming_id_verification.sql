-- Proof-of-ownership for gaming IDs without platform OAuth: staff can mark a
-- gaming account as verified. Only staff may set/change the verified flag; a
-- user cannot verify their own ID.

alter table public.gaming_accounts add column if not exists verified boolean not null default false;
alter table public.gaming_accounts add column if not exists verified_by uuid references public.profiles(id);
alter table public.gaming_accounts add column if not exists verified_at timestamptz;

create or replace function public.staff_set_gaming_account_verified(p_account uuid, p_verified boolean)
returns void language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  if not (public.has_staff_permission('team_enforcement') or public.has_staff_permission('staff_access')) then
    raise exception 'Staff access required.';
  end if;
  update public.gaming_accounts
    set verified = p_verified,
        verified_by = case when p_verified then auth.uid() else null end,
        verified_at = case when p_verified then now() else null end
  where id = p_account;
  if not found then raise exception 'Gaming account not found.'; end if;
end;
$$;
revoke all on function public.staff_set_gaming_account_verified(uuid, boolean) from public, anon;
grant execute on function public.staff_set_gaming_account_verified(uuid, boolean) to authenticated;

-- Prevent anyone but staff (or db/service) from changing the verified flag.
create or replace function public.gb_guard_gaming_account()
returns trigger language plpgsql set search_path = public, pg_temp
as $$
declare
  v_override boolean := public.gb_is_db_role()
    or (auth.uid() is not null and public.has_staff_permission('team_enforcement'));
begin
  if tg_op = 'INSERT' then
    new.account_id := trim(new.account_id);
    if not v_override and new.verified then
      raise exception 'Gaming IDs cannot be self-verified.';
    end if;
    if exists (
      select 1 from public.gaming_accounts g
      where g.user_id <> new.user_id and g.platform = new.platform
        and lower(trim(g.account_id)) = lower(new.account_id)
    ) then
      raise exception 'This gaming ID is already linked to another account.';
    end if;
    new.locked_until := now() + interval '30 days';
    return new;
  end if;

  if tg_op = 'DELETE' then
    if public.gb_gaming_id_cooldown_enabled()
       and old.locked_until > now() and pg_trigger_depth() = 1 and not v_override then
      raise exception 'This gaming ID is locked to your account until %. It cannot be removed or changed before then.',
        to_char(old.locked_until, 'Mon DD, YYYY');
    end if;
    return old;
  end if;

  if new.user_id is distinct from old.user_id and not v_override then
    raise exception 'A gaming ID cannot be moved to another account.';
  end if;
  if (new.account_id, new.platform, new.category, new.game)
     is distinct from (old.account_id, old.platform, old.category, old.game) then
    if public.gb_gaming_id_cooldown_enabled()
       and old.locked_until > now() and not v_override then
      raise exception 'This gaming ID is locked to your account until %. It cannot be removed or changed before then.',
        to_char(old.locked_until, 'Mon DD, YYYY');
    end if;
    new.account_id := trim(new.account_id);
    if exists (
      select 1 from public.gaming_accounts g
      where g.user_id <> new.user_id and g.platform = new.platform
        and lower(trim(g.account_id)) = lower(new.account_id)
    ) then
      raise exception 'This gaming ID is already linked to another account.';
    end if;
    new.locked_until := now() + interval '30 days';
  else
    new.locked_until := old.locked_until;
  end if;
  if new.verified is distinct from old.verified and not v_override then
    raise exception 'Only staff can verify a gaming ID.';
  end if;
  return new;
end;
$$;

notify pgrst, 'reload schema';