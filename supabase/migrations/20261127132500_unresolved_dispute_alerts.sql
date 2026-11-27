-- Automated alerts for unresolved disputes: once a disputed match has passed
-- its filing window by 2 hours with an open ticket and no staff decision, alert
-- every match-review staff member once (deduped via the inbox message).

create or replace function public.gb_alert_unresolved_disputes()
returns integer language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  r record;
  v_staff uuid;
  v_count integer := 0;
begin
  for r in
    select m.id
    from public.matches m
    where lower(coalesce(m.status, '')) = 'disputed'
      and lower(coalesce(m.reporting_status, '')) = 'disputed'
      and not coalesce(m.finalized, false)
      and exists (
        select 1 from public.dispute_tickets dt
        where dt.match_id = m.id and lower(coalesce(dt.status, 'open')) = 'open'
      )
      and now() >= public.dispute_ticket_window_ends_at(m.id) + interval '2 hours'
      and not exists (
        select 1 from public.messages msg
        where msg.related_type = 'match' and msg.related_id = m.id
          and msg.subject = 'Unresolved match dispute'
      )
  loop
    for v_staff in
      select id from public.profiles where role in ('owner', 'admin', 'referee')
    loop
      perform public.gb_notify(
        v_staff,
        'Unresolved match dispute',
        'A disputed match has passed its filing window and still needs a staff decision.',
        'match',
        r.id
      );
    end loop;
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

revoke all on function public.gb_alert_unresolved_disputes() from public, anon, authenticated;

do $$
begin
  perform cron.schedule(
    'gb-alert-unresolved-disputes',
    '7 * * * *',
    'select public.gb_alert_unresolved_disputes()'
  );
exception when others then
  null;
end $$;

notify pgrst, 'reload schema';