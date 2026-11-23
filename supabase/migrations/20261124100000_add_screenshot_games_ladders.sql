create or replace function public.gb_ladder_platforms(p_category text, p_game text, p_platform text)
returns text[]
language sql
immutable
set search_path = public, pg_temp
as $$
  select case
    when p_category = 'fighting-games'
      and p_game = 'street-fighter-6'
      and p_platform in ('xbox', 'playstation', 'pc', 'nintendo')
      then array['xbox', 'playstation', 'pc', 'nintendo']
    when p_category = 'fighting-games'
      and p_game = 'tekken-8'
      and p_platform in ('xbox', 'playstation', 'pc')
      then array['xbox', 'playstation', 'pc']
    when p_category = 'fighting-games'
      and p_game = 'brawlhalla'
      and p_platform in ('xbox', 'playstation', 'pc', 'nintendo', 'mobile')
      then array['xbox', 'playstation', 'pc', 'nintendo', 'mobile']
    when p_category = 'fighting-games'
      and p_game = 'mortal-kombat-1'
      and p_platform in ('xbox', 'playstation', 'pc')
      then array['xbox', 'playstation', 'pc']
    when p_category = 'sports-games'
      and p_game = 'nba-2k27'
      and p_platform in ('xbox', 'playstation')
      then array['xbox', 'playstation']
    when p_category = 'sports-games'
      and p_game = 'efootball'
      and p_platform in ('xbox', 'playstation', 'pc')
      then array['xbox', 'playstation', 'pc']
    when p_category = 'tactical-shooters'
      and p_game = 'valorant'
      and p_platform in ('xbox', 'playstation')
      then array['xbox', 'playstation']
    when p_category = 'hero-shooters'
      and p_game in ('marvel-rivals', 'overwatch-2')
      and p_platform in ('xbox', 'playstation', 'nintendo')
      then array['xbox', 'playstation', 'nintendo']
    when p_category = 'strategy-games'
      and p_game = 'chess'
      and p_platform in ('pc', 'mobile')
      then array['pc', 'mobile']
    else array[p_platform]
  end;
$$;

grant execute on function public.gb_ladder_platforms(text, text, text) to anon, authenticated;

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
  'New ladders are now available for Street Fighter 6, EA Sports FC 27, NBA 2K27, Brawlhalla, Tekken 8, Counter-Strike 2, VALORANT, Marvel Rivals, Overwatch 2, Super Smash Bros. Ultimate, Mortal Kombat 1, Chess, and eFootball. Fortnite Box Fights also has its own 1v1 ladder, with formats and match settings tailored to each game.'
)
from site_updates
where post.id = site_updates.id
  and coalesce(post.message, '') not like '%New ladders are now available for Street Fighter 6%';
