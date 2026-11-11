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
  'Match Finder has a sharper layout and now shows the ruleset with each match. Open a post to review its settings before accepting. Custom matches can also specify equipment and perk rules, and those details stay with the match.'
)
from site_updates
where post.id = site_updates.id
  and coalesce(post.message, '') not like '%Custom matches can also specify equipment and perk rules%';
