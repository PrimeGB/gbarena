with site_updates as (
  select id from public.forum_posts
  where author = 'Prime' and category = 'News & Updates' and pinned and not hidden
    and subject ilike '%Site Updates%'
  order by created_at desc limit 1
)
update public.forum_posts as post
set message = concat_ws(E'\n\n', nullif(trim(post.message), ''),
  'Profile navigation has been tidied up by removing the duplicate Gaming Accounts tab. The Gaming Accounts button is still available on your profile.')
from site_updates
where post.id = site_updates.id
  and coalesce(post.message, '') not like '%Profile navigation has been tidied up by removing the duplicate Gaming Accounts tab%';
