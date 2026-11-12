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
  'The Awards page has a fresh look and 40 new trophies, including seasonal challenges and rewards you can earn as you play. More awards are coming, and we welcome your suggestions!'
)
from site_updates
where post.id = site_updates.id
  and coalesce(post.message, '') not like '%40 new trophies, including seasonal challenges%';
