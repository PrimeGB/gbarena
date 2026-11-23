with site_updates as (
  select id from public.forum_posts
  where author = 'Prime' and category = 'News & Updates' and pinned and not hidden
    and subject ilike '%Site Updates%'
  order by created_at desc limit 1
)
update public.forum_posts as post
set message = concat_ws(E'\n\n', nullif(trim(post.message), ''),
  'Latest update: We restored more Ambassador profile looks and made them selectable. Tournament requests are easier to send with game, player count and format, and the Awards & Achievements hall has clearer seasonal banners. We also clarified a tournament prize. Next up: more ways to personalize creator profiles and community tournaments.')
from site_updates
where post.id = site_updates.id
  and coalesce(post.message, '') not like '%restored more Ambassador profile looks%';
