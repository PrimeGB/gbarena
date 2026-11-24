with site_updates as (
  select id from public.forum_posts
  where author = 'Prime' and category = 'News & Updates' and pinned and not hidden
    and subject ilike '%Site Updates%'
  order by created_at desc
  limit 1
)
update public.forum_posts as post
set message = concat_ws(
  E'\n\n',
  nullif(trim(post.message), ''),
  'Prime''s profile glow now fades more slowly with cooler colors and softer edges.'
)
from site_updates
where post.id = site_updates.id
  and coalesce(post.message, '') not like '%Prime''s profile glow now fades more slowly%';
