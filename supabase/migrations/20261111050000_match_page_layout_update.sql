with site_updates as (
  select id from public.forum_posts
  where author = 'Prime' and category = 'News & Updates' and pinned and not hidden
    and subject ilike '%Site Updates%'
  order by created_at desc limit 1
)
update public.forum_posts as post
set message = concat_ws(E'\n\n', nullif(trim(post.message), ''),
  'Updated match pages with a more compact layout, side-by-side rosters, and clearer match details.')
from site_updates
where post.id = site_updates.id
  and coalesce(post.message, '') not like '%Updated match pages with a more compact layout%';
