create or replace function public.gb_profile_following_activity(p_limit integer default 8)
returns setof jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select activity || jsonb_build_object(
    'follow_type', follows.target_type,
    'follow_id', follows.target_id,
    'follow_name', case
      when follows.target_type = 'team' then coalesce(team.name, 'Team')
      else coalesce(profile.username, 'Player')
    end,
    'follow_href', case
      when follows.target_type = 'team' then '/teams/' || follows.target_id
      else '/profile?userId=' || follows.target_id
    end
  )
  from public.gb_recent_activity(50, true) as activity
  join public.community_follows follows
    on follows.follower_id = auth.uid()
    and (
      (follows.target_type = 'team' and follows.target_id = activity->>'team_id')
      or (
        follows.target_type = 'player'
        and (activity->'user_ids') ? follows.target_id
      )
    )
  left join public.teams team
    on follows.target_type = 'team' and team.id::text = follows.target_id
  left join public.profiles profile
    on follows.target_type = 'player' and profile.id::text = follows.target_id
  order by (activity->>'at')::timestamptz desc, activity->>'id', follows.target_type, follows.target_id
  limit greatest(1, least(coalesce(p_limit, 8), 50));
$$;

revoke all on function public.gb_profile_following_activity(integer) from public, anon;
grant execute on function public.gb_profile_following_activity(integer) to authenticated;

with site_updates as (
  select id from public.forum_posts
  where author = 'Prime' and category = 'News & Updates' and pinned and not hidden
    and subject ilike '%Site Updates%'
  order by created_at desc limit 1
)
update public.forum_posts as post
set message = concat_ws(E'\n\n', nullif(trim(post.message), ''),
  'The Following box now highlights the player or team behind each update and takes up less space on your profile.')
from site_updates
where post.id = site_updates.id
  and coalesce(post.message, '') not like '%The Following box now highlights the player or team behind each update%';
