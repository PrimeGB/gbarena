create or replace function public.gb_team_streams(p_team_id uuid)
returns table(user_id uuid, username text, url text, is_live boolean)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select stream.user_id, coalesce(profile.username, 'Player'), stream.url, stream.is_live
  from public.team_streams stream
  join public.teams team on team.id = stream.team_id
  left join public.profiles profile on profile.id = stream.user_id
  where stream.team_id = p_team_id
    and (stream.is_live or stream.user_id = auth.uid())
    and (
      team.owner_id = stream.user_id
      or (
        lower(coalesce(team.ladder, '')) <> 'singles'
        and exists (
          select 1 from public.team_members member
          where member.team_id = stream.team_id and member.user_id = stream.user_id
        )
      )
    )
  order by stream.is_live desc, profile.username, stream.user_id;
$$;

create or replace function public.gb_set_team_stream(p_team_id uuid, p_url text, p_is_live boolean)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then
    raise exception 'Sign in to manage your stream.';
  end if;
  if not exists (
    select 1 from public.teams team
    where team.id = p_team_id and (
      team.owner_id = auth.uid()
      or (
        lower(coalesce(team.ladder, '')) <> 'singles'
        and exists (
          select 1 from public.team_members member
          where member.team_id = team.id and member.user_id = auth.uid()
        )
      )
    )
  ) then
    raise exception 'Only team members can manage their stream.';
  end if;
  if p_url is null or length(p_url) > 2048
     or p_url !~ '^https://[A-Za-z0-9]([A-Za-z0-9.-]*[A-Za-z0-9])?(/.*)?$'
     or p_url ~ '[[:space:][:cntrl:]]' or position(chr(92) in p_url) > 0
     or p_is_live is null then
    raise exception 'Enter a valid HTTPS stream link and live status.';
  end if;
  insert into public.team_streams (team_id, user_id, url, is_live, updated_at)
  values (p_team_id, auth.uid(), p_url, p_is_live, now())
  on conflict (team_id, user_id) do update
  set url = excluded.url, is_live = excluded.is_live, updated_at = now();
end;
$$;

with site_updates as (
  select id from public.forum_posts
  where author = 'Prime' and category = 'News & Updates' and pinned and not hidden
    and subject ilike '%Site Updates%'
  order by created_at desc limit 1
)
update public.forum_posts as post
set message = concat_ws(E'\n\n', nullif(trim(post.message), ''),
  'Team Streams now has a more compact look, and singles teams show only their player''s stream.')
from site_updates
where post.id = site_updates.id
  and coalesce(post.message, '') not like '%Team Streams now has a more compact look%';
