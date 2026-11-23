create or replace function public.gb_season_scopes(p_season uuid)
returns setof jsonb
language sql stable security definer set search_path = public, pg_temp
as $$
  select jsonb_build_object('scope', scope, 'label', label)
  from (
    select 'global'::text as scope, 'All games & ladders'::text as label
    union
    select 'game:' || m.game, public.gb_pretty(m.game)
    from public.matches m
    where m.finalized and m.status = 'completed'
      and nullif(trim(m.game), '') is not null
    union
    select 'ladder:' || m.game || ':' || m.ladder,
      public.gb_pretty(m.game) || ' / ' || public.gb_pretty(m.ladder)
    from public.matches m
    where m.finalized and m.status = 'completed'
      and nullif(trim(m.game), '') is not null
      and nullif(trim(m.ladder), '') is not null
  ) scopes
  order by case when scope = 'global' then 0 when scope like 'game:%' then 1 else 2 end, label;
$$;

with site_updates as (
  select id from public.forum_posts
  where author = 'Prime' and category = 'News & Updates' and pinned and not hidden
    and subject ilike '%Site Updates%'
  order by created_at desc limit 1
)
update public.forum_posts as post
set message = replace(post.message,
  'and the Awards & Achievements hall has clearer seasonal banners. We also clarified a tournament prize.',
  'and the Awards & Achievements hall has clearer seasonal banners. Season team rankings can be switched between all ladders and individual ladders. We also clarified a tournament prize.')
from site_updates
where post.id = site_updates.id
  and post.message like '%restored more Ambassador profile looks%'
  and post.message not like '%Season team rankings can be switched%';
