-- Reserve each scheduled platform/game/ladder time for a single open match post.
-- If duplicate open posts already exist, keep the oldest and expire the extras.
with ranked_open_posts as (
  select
    id,
    row_number() over (
      partition by platform, category, game, ladder, match_time
      order by created_at, id
    ) as slot_rank
  from public.match_posts
  where status = 'open'
)
update public.match_posts as posts
set status = 'expired'
from ranked_open_posts
where posts.id = ranked_open_posts.id
  and ranked_open_posts.slot_rank > 1;

create unique index if not exists idx_match_posts_unique_open_ladder_time
  on public.match_posts(platform, category, game, ladder, match_time)
  where status = 'open';

notify pgrst, 'reload schema';
