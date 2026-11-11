-- Testing switch: restore the cooldown by returning true and updating the profile copy.
create function public.gb_gaming_id_cooldown_enabled()
returns boolean language sql immutable
set search_path = public, pg_temp
as $$ select false $$;

create or replace function public.gb_guard_gaming_account()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_override boolean := public.gb_is_db_role()
    or (auth.uid() is not null and public.has_staff_permission('team_enforcement'));
begin
  if tg_op = 'INSERT' then
    new.account_id := trim(new.account_id);
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
  return new;
end;
$$;

create or replace function public.gb_guard_profile_columns()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_db boolean := public.gb_is_db_role();
  v_override boolean;
  v_old jsonb;
  v_new jsonb;
  v_locks jsonb;
  v_field text;
  v_o text;
  v_n text;
begin
  if tg_op = 'INSERT' then
    if not v_db then
      new.xp := 0; new.wins := 0; new.losses := 0;
      new.rating_points := 0; new.rank_points := 0;
      new.gb_wins := 0; new.gb_losses := 0; new.gb_rank_points := 0;
      new.overall_wins := 0; new.overall_losses := 0;
      new.gamertag_locks := '{}'::jsonb;
    end if;
    return new;
  end if;

  if not v_db and (
    new.xp, new.wins, new.losses, new.rating_points, new.rank_points,
    new.gb_wins, new.gb_losses, new.gb_rank_points, new.overall_wins, new.overall_losses
  ) is distinct from (
    old.xp, old.wins, old.losses, old.rating_points, old.rank_points,
    old.gb_wins, old.gb_losses, old.gb_rank_points, old.overall_wins, old.overall_losses
  ) then
    raise exception 'Player XP, rank and records can only be changed by verified match results.';
  end if;

  v_override := v_db or (auth.uid() is not null and public.has_staff_permission('team_enforcement'));
  if new.email is distinct from old.email and coalesce(old.email, '') <> '' and not v_override then
    raise exception 'Your email is locked to this account.';
  end if;

  v_old := to_jsonb(old);
  v_new := to_jsonb(new);
  v_locks := coalesce(old.gamertag_locks, '{}'::jsonb);
  foreach v_field in array array[
    'xbox_gt', 'psn_gt', 'nintendo_gt', 'pc_gt',
    'gt_xbox', 'gt_playstation', 'gt_nintendo', 'gt_pc'
  ] loop
    v_o := nullif(trim(coalesce(v_old ->> v_field, '')), '');
    v_n := nullif(trim(coalesce(v_new ->> v_field, '')), '');
    if v_o is distinct from v_n then
      if public.gb_gaming_id_cooldown_enabled()
         and v_o is not null
         and coalesce((v_locks ->> v_field)::timestamptz, 'epoch'::timestamptz) > now()
         and not v_override then
        raise exception 'This gamertag is locked to your account until %. It cannot be changed or removed before then.',
          to_char((v_locks ->> v_field)::timestamptz, 'Mon DD, YYYY');
      end if;
      v_locks := case
        when v_n is null then v_locks - v_field
        else jsonb_set(v_locks, array[v_field], to_jsonb((now() + interval '30 days')::text))
      end;
    end if;
  end loop;
  new.gamertag_locks := v_locks;
  return new;
end;
$$;
