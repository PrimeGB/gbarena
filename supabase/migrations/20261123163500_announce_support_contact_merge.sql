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
  'Contact and Support are now together on one Support / Contact page, with general contact guidance, account and match help, reports, suggestions, and awards information in one place.'
)
from site_updates
where post.id = site_updates.id
  and coalesce(post.message, '') not like '%Contact and Support are now together on one Support / Contact page%';
