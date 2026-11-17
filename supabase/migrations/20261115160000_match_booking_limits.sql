create or replace function public.gb_check_team_match_schedule(p_team uuid, p_time text, p_excluded_post uuid default null)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  scheduled timestamptz := public.gb_match_scheduled_at(p_time);
  active_count integer;
begin
  if scheduled is null then raise exception 'A valid scheduled match date and time is required.'; end if;

  if (select count(*) from public.matches m
      where (m.posting_team_id = p_team or m.accepting_team_id = p_team)
        and lower(coalesce(m.status, '')) = 'disputed'
        and not coalesce(m.finalized, false)) >= 3 then
    raise exception 'A team cannot post or accept matches while it has three or more unresolved disputes.';
  end if;

  select
    (select count(*) from public.match_posts p
     where p.team_id = p_team and p.status = 'open' and p.id is distinct from p_excluded_post
       and (public.gb_match_scheduled_at(p.match_time) is null or public.gb_match_scheduled_at(p.match_time) > now()))
    +
    (select count(*) from public.matches m
     where (m.posting_team_id = p_team or m.accepting_team_id = p_team)
       and coalesce(lower(m.status), '') not in ('completed', 'cancelled'))
  into active_count;
  if active_count >= 3 then
    raise exception 'A team already has three open posts or unfinished matches.';
  end if;

  if exists (
    select 1 from public.match_posts p
    where p.team_id = p_team and p.status = 'open' and p.id is distinct from p_excluded_post
      and (public.gb_match_scheduled_at(p.match_time) is null
           or (public.gb_match_scheduled_at(p.match_time) > now()
               and abs(extract(epoch from (public.gb_match_scheduled_at(p.match_time) - scheduled))) < 900))
  ) or exists (
    select 1 from public.matches m
    where (m.posting_team_id = p_team or m.accepting_team_id = p_team)
      and coalesce(lower(m.status), '') not in ('completed', 'cancelled')
      and (public.gb_match_scheduled_at(m.match_time) is null
           or abs(extract(epoch from (public.gb_match_scheduled_at(m.match_time) - scheduled))) < 900)
  ) then
    raise exception 'Your team has another match or open post within 15 minutes of this start time, or a match with an unknown time.';
  end if;
end;
$$;

create function public.gb_validate_match_post_window()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  scheduled timestamptz;
begin
  if tg_op = 'INSERT' or (new.status = 'open' and old.status is distinct from 'open') then
    scheduled := public.gb_match_scheduled_at(new.match_time);
    if scheduled is null or scheduled <= now() or scheduled > now() + interval '24 hours' then
      raise exception 'Choose a future match time within the next 24 hours.';
    end if;
  end if;
  return new;
end;
$$;

create trigger match_posts_validate_booking_window
before insert or update of status on public.match_posts
for each row execute function public.gb_validate_match_post_window();

create function public.gb_lock_disputed_match_schedules()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  team_id uuid;
begin
  for team_id in
    select distinct id from unnest(array[new.posting_team_id, new.accepting_team_id]) as ids(id)
    where id is not null order by id
  loop
    perform pg_advisory_xact_lock(hashtextextended('match-schedule:' || team_id::text, 0));
  end loop;
  return new;
end;
$$;

create trigger matches_lock_disputed_schedules
before update of status on public.matches
for each row
when (lower(coalesce(new.status, '')) = 'disputed' and lower(coalesce(old.status, '')) <> 'disputed')
execute function public.gb_lock_disputed_match_schedules();

notify pgrst, 'reload schema';
