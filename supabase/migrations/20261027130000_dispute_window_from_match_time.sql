-- The filing window runs for 2 hours from the match start. Staff only see a
-- case before then if both teams have already filed.
create or replace function public.dispute_ticket_window_ends_at(match_uuid uuid)
returns timestamptz
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(matches.started_at, matches.accepted_at, matches.created_at)
    + interval '2 hours'
  from public.matches
  where matches.id = match_uuid;
$$;

revoke all on function public.dispute_ticket_window_ends_at(uuid) from public, anon;
grant execute on function public.dispute_ticket_window_ends_at(uuid) to authenticated;
