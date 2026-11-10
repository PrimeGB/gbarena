with site_updates as (
  select id from public.forum_posts
  where author = 'Prime' and category = 'News & Updates' and pinned and not hidden
    and subject ilike '%Site Updates%'
  order by created_at desc limit 1
)
update public.forum_posts as post
set message = replace(
  post.message,
  'Supported cross-play ladders now share standings across systems, with system filters. Cross-play match posts can be accepted by teams on compatible systems; please check your game versions can play together first.',
  'Cross-play matches are available between compatible systems. Each team stays on its own system ladder, and results affect its own ranking. The All Systems view shows each team''s rank on its own system. Please check your game versions can play together first.'
)
from site_updates
where post.id = site_updates.id;
