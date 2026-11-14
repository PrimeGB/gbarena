do $$
declare thread_id bigint;
begin
  select id into thread_id from public.forum_posts
    where author='Prime' and category='News & Updates' and pinned and not hidden
      and subject ilike '%Site Updates%'
    order by created_at desc limit 1;
  if thread_id is null then raise exception 'Pinned Site Updates thread not found'; end if;
  update public.forum_posts set message=concat_ws(E'\n\n',nullif(trim(message),''),
    'Match Snapshot has a cleaner blue GB layout: a clear summary above the form replaces the cramped sidebar and separate mini-boxes. Platform, player count, rules and cross-play stay easy to scan and update as you change your settings, with a compact layout on phones too.')
    where id=thread_id and coalesce(message,'') not like '%Match Snapshot has a cleaner blue GB layout%';
end;
$$;
