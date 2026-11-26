do $$
declare thread_id bigint;
begin
  select id into thread_id from public.forum_posts
    where author = 'Prime' and category = 'News & Updates' and pinned and not hidden
      and subject ilike '%Site Updates%' order by created_at desc limit 1;
  if thread_id is null then raise exception 'Pinned Site Updates thread not found'; end if;
  update public.forum_posts set message = concat_ws(E'\n\n', nullif(trim(message), ''),
    'Battlefield 6 team ladders are now easier to find on the PC, Xbox and PlayStation Battlefield pages. Main Edit has also been streamlined, with your profile options still available.')
  where id = thread_id and coalesce(message, '') not like '%Battlefield 6 team ladders are now easier to find%';
end;
$$;
