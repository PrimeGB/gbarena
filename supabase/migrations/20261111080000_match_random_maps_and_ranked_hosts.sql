create table public.match_map_pools (
  category text not null,
  game text not null,
  game_mode text not null,
  maps text[] not null check (cardinality(maps) > 0),
  source_url text not null,
  primary key (category, game, game_mode)
);

alter table public.match_map_pools enable row level security;
create policy match_map_pools_public_read on public.match_map_pools for select to anon, authenticated using (true);
revoke all on public.match_map_pools from anon, authenticated;
grant select on public.match_map_pools to anon, authenticated;

-- Championship pools are snapshots, not claims about a current live playlist.
insert into public.match_map_pools(category, game, game_mode, maps, source_url) values
('call-of-duty','modern-warfare-4','Search and Destroy',array['Gun Runner','St. Petrograd','Rammaza','Arklov Peak','Piccadilly'],'https://liquipedia.net/callofduty/Call_of_Duty_League/Season_1/Playoffs'),
('call-of-duty','modern-warfare-4','Hardpoint',array['Gun Runner','St. Petrograd','Hackney Yard','Rammaza','Azhir Cave'],'https://liquipedia.net/callofduty/Call_of_Duty_League/Season_1/Playoffs'),
('call-of-duty','modern-warfare-4','Domination',array['Gun Runner','St. Petrograd','Hackney Yard'],'https://liquipedia.net/callofduty/Call_of_Duty_League/Season_1/Playoffs'),
('call-of-duty','black-ops-cold-war','Search and Destroy',array['Raid','Moscow','Express','Standoff','Miami'],'https://liquipedia.net/callofduty/Call_of_Duty_League/Season_2/Playoffs'),
('call-of-duty','black-ops-cold-war','Hardpoint',array['Raid','Moscow','Checkmate','Garrison','Apocalypse'],'https://liquipedia.net/callofduty/Call_of_Duty_League/Season_2/Playoffs'),
('call-of-duty','black-ops-cold-war','Control',array['Raid','Checkmate','Garrison'],'https://liquipedia.net/callofduty/Call_of_Duty_League/Season_2/Playoffs'),
('call-of-duty','vanguard','Search and Destroy',array['Berlin','Bocage','Desert Siege','Tuscan'],'https://liquipedia.net/callofduty/Template:CDL_2022_Map_Pool'),
('call-of-duty','vanguard','Hardpoint',array['Berlin','Bocage','Gavutu','Tuscan'],'https://liquipedia.net/callofduty/Template:CDL_2022_Map_Pool'),
('call-of-duty','vanguard','Control',array['Tuscan','Gavutu'],'https://liquipedia.net/callofduty/Template:CDL_2022_Map_Pool'),
('call-of-duty','modern-warfare-ii','Search and Destroy',array['Hotel','Fortress','Embassy','Mercado','El Asilo'],'https://liquipedia.net/callofduty/Call_of_Duty_League/Season_4/Playoffs'),
('call-of-duty','modern-warfare-ii','Hardpoint',array['Hotel','Fortress','Embassy','Mercado','Hydro'],'https://liquipedia.net/callofduty/Call_of_Duty_League/Season_4/Playoffs'),
('call-of-duty','modern-warfare-ii','Control',array['Hotel','El Asilo','Expo'],'https://liquipedia.net/callofduty/Call_of_Duty_League/Season_4/Playoffs'),
('call-of-duty','modern-warfare-iii','Search and Destroy',array['6 Star','Highrise','Invasion','Karachi','Rio'],'https://liquipedia.net/callofduty/Call_of_Duty_League/Season_5/Stage_4/Major'),
('call-of-duty','modern-warfare-iii','Hardpoint',array['6 Star','Karachi','Rio','Sub Base','Vista'],'https://liquipedia.net/callofduty/Call_of_Duty_League/Season_5/Stage_4/Major'),
('call-of-duty','modern-warfare-iii','Control',array['Highrise','Invasion','Karachi'],'https://liquipedia.net/callofduty/Call_of_Duty_League/Season_5/Stage_4/Major'),
('call-of-duty','black-ops-6','Search and Destroy',array['Hacienda','Protocol','Red Card','Dealership','Rewind'],'https://liquipedia.net/callofduty/Call_of_Duty_League/Season_6/Playoffs'),
('call-of-duty','black-ops-6','Hardpoint',array['Hacienda','Red Card','Rewind','Skyline','Vault'],'https://liquipedia.net/callofduty/Call_of_Duty_League/Season_6/Playoffs'),
('call-of-duty','black-ops-6','Control',array['Hacienda','Protocol','Vault'],'https://liquipedia.net/callofduty/Call_of_Duty_League/Season_6/Playoffs'),
('call-of-duty','mw2','Search and Destroy',array['Highrise','Invasion','Karachi','Scrapyard','Terminal'],'https://hpgtournaments.weebly.com/rules-for-mw2.html'),
('old-school','mw2-2009','Search and Destroy',array['Highrise','Invasion','Karachi','Scrapyard','Terminal'],'https://hpgtournaments.weebly.com/rules-for-mw2.html'),
('old-school','bo1-2010','Search and Destroy',array['Firing Range','Grid','Hanoi','Havana','Villa'],'https://cod-esports.fandom.com/wiki/MLG_National_Championship_2011'),
('old-school','bo1-2010','Domination',array['Firing Range','Summit'],'https://cod-esports.fandom.com/wiki/MLG_National_Championship_2011');

alter table public.matches add column if not exists map_names text[];

create function public.gb_random_match_maps(pool text[], series text)
returns text[] language plpgsql volatile set search_path = public, pg_temp
as $$
declare
  needed integer := case substring(coalesce(series, '') from '[0-9]+')
    when '1' then 1 when '2' then 2 when '5' then 5 when '7' then 7 else 3 end;
  selected text[] := '{}';
  shuffled text[];
begin
  if pool is null or cardinality(pool) = 0 then return null; end if;
  while cardinality(selected) < needed loop
    select array_agg(item order by random()) into shuffled from unnest(pool) as item;
    selected := selected || shuffled;
  end loop;
  return selected[1:needed];
end;
$$;

create or replace function public.gb_assign_match_hosts()
returns trigger language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  posting_rank bigint;
  accepting_rank bigint;
  first_host uuid;
  second_host uuid;
  pool text[];
begin
  if new.posting_team_id is null or new.accepting_team_id is null then
    new.host_team_ids := null;
    new.map_names := null;
    return new;
  end if;

  with rankings as (
    select id, row_number() over (partition by platform order by
      coalesce(rating_points, 100) desc, coalesce(wins, 0) desc,
      coalesce(losses, 0), created_at nulls first, id) as rank
    from public.teams
    where category = new.category and game = new.game and ladder = new.ladder
      and (wins > 0 or losses > 0)
  )
  select max(rank) filter (where id = new.posting_team_id),
         max(rank) filter (where id = new.accepting_team_id)
  into posting_rank, accepting_rank from rankings;

  if accepting_rank is not null and (posting_rank is null or accepting_rank < posting_rank) then
    first_host := new.accepting_team_id;
    second_host := new.posting_team_id;
  else
    first_host := new.posting_team_id;
    second_host := new.accepting_team_id;
  end if;
  new.host_team_ids := public.gb_match_host_rotation(new.best_of, first_host, second_host);

  select maps into pool from public.match_map_pools
    where category = new.category and game = new.game and game_mode = new.game_mode;
  new.map_names := public.gb_random_match_maps(pool, new.best_of);
  return new;
end;
$$;

revoke all on function public.gb_random_match_maps(text[], text) from public, anon, authenticated;

with site_updates as (
  select id from public.forum_posts
  where author = 'Prime' and category = 'News & Updates' and pinned and not hidden
    and subject ilike '%Site Updates%'
  order by created_at desc limit 1
)
update public.forum_posts as post
set message = concat_ws(E'\n\n', nullif(trim(post.message), ''),
  'New matches now start with the higher-ranked team hosting, then alternate hosts. Supported Call of Duty modes also receive random maps from their game-specific competitive rotation. More map pools are being researched.')
from site_updates where post.id = site_updates.id
  and coalesce(post.message, '') not like '%Supported Call of Duty modes also receive random maps%';

notify pgrst, 'reload schema';
