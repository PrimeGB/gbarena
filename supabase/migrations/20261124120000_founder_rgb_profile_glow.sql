do $$
begin
  update public.profiles
  set profile_glow = 'RGB'
  where lower(username) = 'prime' and role = 'owner';

  if not found then
    raise exception 'Founder profile Prime was not found';
  end if;
end;
$$;

with site_updates as (
  select id from public.forum_posts
  where author = 'Prime' and category = 'News & Updates' and pinned and not hidden
    and subject ilike '%Site Updates%'
  order by created_at desc
  limit 1
)
update public.forum_posts as post
set message = concat_ws(
  E'\n\n',
  nullif(trim(post.message), ''),
  'Prime has a new animated RGB profile border, with flowing colors inspired by gaming setups.'
)
from site_updates
where post.id = site_updates.id
  and coalesce(post.message, '') not like '%Prime has a new animated RGB profile border%';
