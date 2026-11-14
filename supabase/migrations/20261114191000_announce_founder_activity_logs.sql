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
  'The private Founder Site overview now includes searchable staff and member activity records, account and team lookup, and clearer logging coverage. New saved actions are recorded from this update onward to help review site issues; sensitive private contents are not copied into the new activity records.'
)
from site_updates
where post.id = site_updates.id
  and coalesce(post.message, '') not like '%includes searchable staff and member activity records%';
