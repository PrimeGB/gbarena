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
  'The Create Match page has a cleaner, more compact layout, with key choices easier to scan and less scrolling. Detailed rules and extra settings stay tucked away until you need them. We are continuing to refine the match-posting experience based on player feedback.'
)
from site_updates
where post.id = site_updates.id
  and coalesce(post.message, '') not like '%cleaner, more compact layout%';
