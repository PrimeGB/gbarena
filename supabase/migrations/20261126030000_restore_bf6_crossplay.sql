create or replace function public.gb_ladder_platforms(p_category text, p_game text, p_platform text)
returns text[]
language sql
immutable
set search_path = public, pg_temp
as $$
  select case
    when p_category = 'battlefield'
      and p_game = 'battlefield-6'
      and p_platform in ('xbox', 'playstation', 'pc')
      then array['xbox', 'playstation', 'pc']
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
