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
  'Awards & Achievements now has a consistent name in the menus and on the page.'
)
from site_updates
where post.id = site_updates.id
  and coalesce(post.message, '') not like '%Awards & Achievements now has a consistent name%';
