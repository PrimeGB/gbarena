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
  'The mobile homepage has a fresh look and easier navigation. Team pages, team creation, and team rankings are now easier to use on a phone.'
)
from site_updates
where post.id = site_updates.id
  and coalesce(post.message, '') not like '%mobile homepage has a fresh look and easier navigation%';
