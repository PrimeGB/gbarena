alter table public.matches add column if not exists host_team_ids uuid[];

create function public.gb_match_host_rotation(series text, posting uuid, accepting uuid)
returns uuid[] language sql immutable set search_path = public, pg_temp
as $$
  select case when posting is null or accepting is null then null else
    array(select case when game_number % 2 = 1 then posting else accepting end
      from generate_series(1, case substring(coalesce(series, '') from '[0-9]+')
        when '1' then 1 when '2' then 2 when '5' then 5 when '7' then 7 else 3 end) as game_number)
  end;
$$;

create function public.gb_assign_match_hosts()
returns trigger language plpgsql set search_path = public, pg_temp
as $$
begin
  new.host_team_ids := public.gb_match_host_rotation(new.best_of, new.posting_team_id, new.accepting_team_id);
  return new;
end;
$$;

create trigger matches_assign_hosts before insert on public.matches
  for each row execute function public.gb_assign_match_hosts();

with site_updates as (
  select id from public.forum_posts
  where author = 'Prime' and category = 'News & Updates' and pinned and not hidden
    and subject ilike '%Site Updates%'
  order by created_at desc limit 1
)
update public.forum_posts as post
set message = concat_ws(E'\n\n', nullif(trim(post.message), ''),
  'New matches now show which team organizes each game, alternating between teams. Game-specific map selections are still being worked on.')
from site_updates where post.id = site_updates.id
  and coalesce(post.message, '') not like '%New matches now show which team organizes each game%';

notify pgrst, 'reload schema';
