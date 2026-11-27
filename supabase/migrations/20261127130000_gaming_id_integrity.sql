-- Re-enable the 30-day gaming-ID cooldown (was paused as a testing switch) and
-- close the legacy-profile duplicate gap so a gamertag cannot be falsely claimed
-- by editing profiles.xbox_gt / psn_gt / etc. (previously only gaming_accounts
-- was guarded, and only against the same user).

create or replace function public.gb_gaming_id_cooldown_enabled()
returns boolean language sql immutable
set search_path = public, pg_temp
as $$ select true $$;

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
      if v_n is not null and not v_override and exists (
        select 1 from public.profiles p
        where p.id is distinct from new.id
          and lower(trim(coalesce(to_jsonb(p) ->> v_field, ''))) = lower(v_n)
      ) then
        raise exception 'This gamertag is already linked to another account.';
      end if;
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

notify pgrst, 'reload schema';