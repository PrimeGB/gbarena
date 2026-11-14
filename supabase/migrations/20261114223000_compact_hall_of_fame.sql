do $$
declare thread_id bigint;
begin
  select id into thread_id from public.forum_posts
    where author='Prime' and category='News & Updates' and pinned and not hidden
      and subject ilike '%Site Updates%'
    order by created_at desc limit 1;
  if thread_id is null then raise exception 'Pinned Site Updates thread not found'; end if;
  update public.forum_posts set message=concat_ws(E'\n\n',nullif(trim(message),''),
    'The Hall of Fame has been rebuilt as a compact trophy room: player and team champions together, Top 10 recognition alongside, and much less clicking and page scrolling. It opens on the latest season with earned honours, and combines category titles instead of repeating the same winner. The season collection now has five distinctive award designs, with clearly marked examples wherever awards have not yet been earned.')
    where id=thread_id and coalesce(message,'') not like '%rebuilt as a compact trophy room%';
end;
$$;
