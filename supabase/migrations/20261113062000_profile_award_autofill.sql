begin;

create function public.gb_valid_profile_award_slots(p_user uuid, p_slots text[])
returns text[]
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(array_agg(chosen.id::text order by chosen.first_slot), '{}'::text[])
  from (
    select award.id, min(slot.ordinality) as first_slot
    from unnest(coalesce(p_slots, '{}'::text[])) with ordinality as slot(value, ordinality)
    cross join lateral (
      select a.id from public.staff_user_awards a
      join public.staff_award_catalog c on c.id = a.award_id
      where a.recipient_id = p_user and a.revoked_at is null
        and (a.id::text = slot.value or c.name = slot.value)
      order by a.granted_at desc, a.id desc limit 1
    ) award
    group by award.id
    order by min(slot.ordinality)
    limit 6
  ) chosen;
$$;
revoke all on function public.gb_valid_profile_award_slots(uuid, text[]) from public, anon, authenticated;

create function public.gb_autofill_profile_award()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_slots text[];
  valid_slots text[];
begin
  if new.recipient_id is null or new.revoked_at is not null then return new; end if;
  select display_awards into current_slots from public.profiles
  where id = new.recipient_id for update;
  if not found then raise exception 'Award recipient profile was not found'; end if;

  valid_slots := public.gb_valid_profile_award_slots(new.recipient_id, current_slots);
  if cardinality(valid_slots) < 6 and not (new.id::text = any(valid_slots)) then
    update public.profiles set display_awards = array_append(valid_slots, new.id::text)
    where id = new.recipient_id;
  end if;
  return new;
end;
$$;
revoke all on function public.gb_autofill_profile_award() from public, anon, authenticated;

-- Preserve the awards already shown by the profile's default selection.
lock table public.profiles in share row exclusive mode;
lock table public.staff_user_awards in share row exclusive mode;
update public.profiles p
set display_awards = coalesce((
  select array_agg(selected.id::text order by selected.granted_at desc, selected.id desc)
  from (
    select a.id, a.granted_at from public.staff_user_awards a
    where a.recipient_id = p.id and a.revoked_at is null
    order by a.granted_at desc, a.id desc limit 6
  ) selected
), '{}'::text[])
where coalesce(cardinality(p.display_awards), 0) = 0
  and exists (select 1 from public.staff_user_awards a where a.recipient_id = p.id and a.revoked_at is null);

create trigger staff_user_awards_autofill_profile
  after insert on public.staff_user_awards
  for each row execute function public.gb_autofill_profile_award();
create trigger staff_user_awards_autofill_restored
  after update of revoked_at on public.staff_user_awards
  for each row
  when (old.revoked_at is not null and new.revoked_at is null)
  execute function public.gb_autofill_profile_award();

create function public.gb_save_profile_award_slots(p_expected text[], p_awards text[])
returns text[]
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_slots text[];
  valid_slots text[];
begin
  if auth.uid() is null then raise exception 'Sign in to save your awards'; end if;
  select display_awards into current_slots from public.profiles where id = auth.uid() for update;
  if not found then raise exception 'Your profile could not be found'; end if;
  if coalesce(current_slots, '{}'::text[]) is distinct from coalesce(p_expected, '{}'::text[]) then
    raise exception 'Your awards changed elsewhere. Reload the page before editing them again.';
  end if;
  if p_awards is null or cardinality(p_awards) > 6 then
    raise exception 'Choose up to six awards';
  end if;
  valid_slots := public.gb_valid_profile_award_slots(auth.uid(), p_awards);
  if cardinality(valid_slots) <> cardinality(p_awards) then
    raise exception 'Only your active awards can be displayed, without duplicates';
  end if;
  update public.profiles set display_awards = valid_slots where id = auth.uid();
  select display_awards into current_slots from public.profiles where id = auth.uid();
  return current_slots;
end;
$$;
revoke all on function public.gb_save_profile_award_slots(text[], text[]) from public, anon;
grant execute on function public.gb_save_profile_award_slots(text[], text[]) to authenticated;

commit;
