do $$
declare thread_id bigint;
begin
  select id into thread_id from public.forum_posts
    where author='Prime' and category='News & Updates' and pinned and not hidden
      and subject ilike '%Site Updates%'
    order by created_at desc limit 1;
  if thread_id is null then raise exception 'Pinned Site Updates thread not found'; end if;
  update public.forum_posts set message=concat_ws(E'\n\n',nullif(trim(message),''),
    'Team pages have returned to their compact layout, without the extra Season honours panel. The main box now simply says Achievements; small earned awards in that area are planned for later. Seasonal team recognition is still available in the Hall of Fame.')
    where id=thread_id and coalesce(message,'') not like '%Team pages have returned to their compact layout%';
end;
$$;
