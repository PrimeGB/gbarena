create table if not exists public.community_activity_favorites (
  user_id uuid not null references public.profiles(id) on delete cascade,
  activity_id text not null,
  activity_snapshot jsonb not null check (jsonb_typeof(activity_snapshot) = 'object'),
  created_at timestamptz not null default now(),
  primary key (user_id, activity_id)
);

alter table public.community_activity_favorites enable row level security;
revoke all on public.community_activity_favorites from public, anon, authenticated;

create index if not exists community_activity_favorites_created_idx
  on public.community_activity_favorites (user_id, created_at desc);

create or replace function public.gb_recent_activity(
  p_limit integer default 12,
  p_following_only boolean default false
)
returns setof jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with activity as (
    select
      'match:' || m.id::text as id,
      'match'::text as kind,
      coalesce(w.name, 'A team') || ' defeated ' || coalesce(l.name, 'a team') || ' in ' || public.gb_pretty(m.game) as txt,
      '/matches/' || m.id::text as href,
      m.completed_at as at,
      m.winning_team_id as team_id,
      (m.winning_user_ids)[1] as user_id,
      coalesce(m.winning_user_ids, array[]::uuid[]) as user_ids
    from public.matches m
    left join public.teams w on w.id = m.winning_team_id
    left join public.teams l on l.id = m.losing_team_id
    where m.completed_at is not null and m.winning_team_id is not null

    union all

    select
      'team:' || t.id::text,
      'team',
      'New team ' || t.name || ' entered ' || public.gb_pretty(t.game),
      '/teams/' || t.id::text,
      t.created_at,
      t.id,
      t.owner_id,
      case when t.owner_id is null then array[]::uuid[] else array[t.owner_id] end
    from public.teams t

    union all

    select
      'award:' || ua.id::text,
      'award',
      case when ua.recipient_team_id is not null
        then coalesce(team.name, 'A team') || ' earned ' || c.name
        else coalesce(p.username, 'A player') || ' earned ' || c.name end,
      case when ua.recipient_team_id is not null
        then '/teams/' || ua.recipient_team_id::text
        when p.username is not null then '/players/' || p.username else '/awards' end,
      ua.granted_at,
      ua.recipient_team_id,
      ua.recipient_id,
      case when ua.recipient_id is null then array[]::uuid[] else array[ua.recipient_id] end
    from public.staff_user_awards ua
    join public.staff_award_catalog c on c.id = ua.award_id
    left join public.profiles p on p.id = ua.recipient_id
    left join public.teams team on team.id = ua.recipient_team_id
    where ua.revoked_at is null
      and (ua.recipient_id is not null or ua.recipient_team_id is not null)
  )
  select jsonb_build_object(
    'id', a.id,
    'kind', a.kind,
    'text', a.txt,
    'href', a.href,
    'at', a.at,
    'team_id', a.team_id,
    'user_id', a.user_id,
    'user_ids', a.user_ids,
    'favorited', exists (
      select 1
      from public.community_activity_favorites f
      where f.user_id = auth.uid() and f.activity_id = a.id
    )
  )
  from activity a
  where a.at >= now() - interval '48 hours'
    and (
      not coalesce(p_following_only, false)
      or (
        auth.uid() is not null
        and exists (
          select 1
          from public.community_follows f
          where f.follower_id = auth.uid()
            and (
              (f.target_type = 'team' and f.target_id = a.team_id::text)
              or (
                f.target_type = 'player'
                and f.target_id::uuid = any(a.user_ids)
              )
            )
        )
      )
    )
  order by a.at desc
  limit greatest(1, least(coalesce(p_limit, 12), 50));
$$;

create or replace function public.gb_toggle_activity_favorite(p_activity_id text)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_snapshot jsonb;
begin
  if v_user_id is null then
    raise exception 'Sign in to save community activity.';
  end if;
  if coalesce(trim(p_activity_id), '') = '' then
    raise exception 'Choose an activity update to save.';
  end if;

  delete from public.community_activity_favorites
  where user_id = v_user_id and activity_id = p_activity_id;
  if found then
    return false;
  end if;

  select activity
  into v_snapshot
  from public.gb_recent_activity(50, false) as activity
  where activity->>'id' = p_activity_id
  limit 1;

  if v_snapshot is null then
    raise exception 'This activity is no longer available to save.';
  end if;

  insert into public.community_activity_favorites (user_id, activity_id, activity_snapshot)
  values (
    v_user_id,
    p_activity_id,
    jsonb_set(v_snapshot, '{favorited}', 'true'::jsonb, true)
  );

  return true;
end;
$$;

revoke all on function public.gb_toggle_activity_favorite(text) from public;
grant execute on function public.gb_toggle_activity_favorite(text) to authenticated;

create or replace function public.gb_user_activity_favorites()
returns setof jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select jsonb_set(f.activity_snapshot, '{favorited}', 'true'::jsonb, true)
  from public.community_activity_favorites f
  where f.user_id = auth.uid()
  order by f.created_at desc;
$$;

revoke all on function public.gb_user_activity_favorites() from public;
grant execute on function public.gb_user_activity_favorites() to authenticated;

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
  'Latest release: The Following box is easier to read and scroll, and community updates now stay in the feed for 48 hours. Save favorites to keep them available longer.'
)
from site_updates
where post.id = site_updates.id
  and coalesce(post.message, '') not like '%community updates now stay in the feed for 48 hours%';
