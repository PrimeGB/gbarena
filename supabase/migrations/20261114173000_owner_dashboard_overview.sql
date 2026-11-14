create or replace function public.owner_dashboard_overview()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  actor_role text;
  result jsonb;
begin
  if auth.uid() is null or not public.staff_has_portal_access() then
    raise exception 'Founder access is required';
  end if;

  select role into actor_role
  from public.profiles
  where id = auth.uid();

  if actor_role is distinct from 'owner' then
    raise exception 'Founder access is required';
  end if;

  select jsonb_build_object(
    'generated_at', now(),
    'accounts', (select count(*) from public.profiles),
    'accounts_7d', (
      select count(*) from public.profiles
      where created_at >= now() - interval '7 days'
    ),
    'teams', (select count(*) from public.teams),
    'teams_7d', (
      select count(*) from public.teams
      where created_at >= now() - interval '7 days'
    ),
    'matches', (select count(*) from public.matches),
    'matches_7d', (
      select count(*) from public.matches
      where created_at >= now() - interval '7 days'
    ),
    'open_match_posts', (
      select count(*) from public.match_posts where status = 'open'
    ),
    'active_ladder_count', (
      select count(*) from (
        select platform, category, game, ladder
        from public.match_posts
        where status = 'open'
        group by platform, category, game, ladder
      ) active_ladders
    ),
    'active_ladders', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'platform', active.platform,
          'category', active.category,
          'game', active.game,
          'ladder', active.ladder,
          'open_match_posts', active.open_match_posts
        )
        order by active.open_match_posts desc, active.platform, active.game, active.ladder
      )
      from (
        select platform, category, game, ladder, count(*) as open_match_posts
        from public.match_posts
        where status = 'open'
        group by platform, category, game, ladder
        order by count(*) desc, platform, game, ladder
        limit 12
      ) active
    ), '[]'::jsonb),
    'forum_threads', (
      select count(*) from public.forum_posts where not hidden
    ),
    'forum_threads_7d', (
      select count(*) from public.forum_posts
      where not hidden and created_at >= now() - interval '7 days'
    ),
    'forum_replies_7d', (
      select count(*) from public.forum_replies
      where not hidden and created_at >= now() - interval '7 days'
    ),
    'active_tournaments', (
      select count(*) from public.tournaments where status in ('upcoming', 'live')
    ),
    'open_match_disputes', (
      select count(*) from public.matches
      where lower(coalesce(status, '')) = 'disputed'
        and lower(coalesce(reporting_status, '')) = 'disputed'
        and not coalesce(finalized, false)
    ),
    'open_staff_cases', (
      select count(*) from public.staff_cases
      where status not in ('resolved', 'dismissed')
    ),
    'priority_staff_cases', (
      select count(*) from public.staff_cases
      where priority in ('high', 'urgent')
        and status not in ('resolved', 'dismissed')
    ),
    'open_forum_reports', (
      select count(*) from public.forum_reports where not resolved
    ),
    'pending_feedback', (
      (select count(*) from public.community_suggestions where status = 'submitted')
      + (select count(*) from public.community_bug_reports where status = 'submitted')
    ),
    'pending_match_reviews', (
      select count(*) from public.match_decision_review_requests where status = 'pending'
    ),
    'pending_awards', (
      select count(*) from public.staff_award_requests where status = 'pending'
    ),
    'pending_site_requests', (
      select count(*) from public.staff_site_change_requests where status = 'pending'
    )
  ) into result;

  return result;
end;
$$;

revoke all on function public.owner_dashboard_overview() from public, anon;
grant execute on function public.owner_dashboard_overview() to authenticated;
