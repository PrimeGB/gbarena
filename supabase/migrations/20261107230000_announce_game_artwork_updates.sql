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
  'Game artwork and titles have been checked across team, match, and ladder pages. Modern Warfare (2019), Modern Warfare II (2022), and older Modern Warfare games are now clearly distinguished, and Rocket League modes show Rocket League artwork. More artwork checks are underway.'
)
from site_updates
where post.id = site_updates.id
  and coalesce(post.message, '') not like '%Game artwork and titles have been checked across team, match, and ladder pages%';
