with site_updates as (
  select id
  from public.forum_posts
  where author = 'Prime'
    and category = 'News & Updates'
    and pinned
    and not hidden
    and subject ilike '%Site Updates%'
  order by created_at desc
  limit 1
)
update public.forum_posts as post
set message = concat_ws(
  E'\n\n',
  nullif(trim(post.message), ''),
  'The News Categories menu has been simplified to focus on updates, accepted suggestions and rule changes.'
)
from site_updates
where post.id = site_updates.id
  and coalesce(post.message, '') not like '%News Categories menu has been simplified%';
