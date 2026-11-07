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
  'Latest release: The homepage sidebar now has a clear Awards & Achievements section, and social links have been tidied up.'
)
from site_updates
where post.id = site_updates.id
  and coalesce(post.message, '') not like '%homepage sidebar now has a clear Awards & Achievements section%';
