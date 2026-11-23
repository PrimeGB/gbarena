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
  'The home page is easier to browse: Forums is now listed with Community, Staff with Contact Us, and the Top 10 players leaderboard includes a Yearly view alongside Monthly and Season rankings.'
)
from site_updates
where post.id = site_updates.id
  and coalesce(post.message, '') not like '%Top 10 players leaderboard includes a Yearly view%';
