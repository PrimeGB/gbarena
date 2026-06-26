-- RPC to accept a match post atomically and create the official match.
-- Run this in Supabase SQL editor. The function is SECURITY DEFINER so it can bypass RLS safely
-- if you own it with a DB role that has the proper privileges. Review before deploying.

create or replace function public.accept_match_post(post_id uuid, accepting_team uuid)
returns table(match_id uuid) as $$
declare
  p record;
begin
  select * into p from match_posts where id = post_id;
  if not found then
    raise exception 'match post not found';
  end if;

  if p.status is distinct from 'open' then
    raise exception 'match post not open (status=%)', p.status;
  end if;

  if p.team_id = accepting_team then
    raise exception 'cannot accept your own match post';
  end if;

  -- Mark the post accepted
  update match_posts set status = 'accepted' where id = post_id and status = 'open';

  -- Create the official match record using fields from the post
  insert into matches (
    match_post_id, posting_team_id, accepting_team_id,
    platform, category, game, ladder,
    game_mode, players, match_time, best_of,
    preset, perks, launchers, killstreaks, field_upgrades,
    hardcore, friendly_fire, radar, spectating, third_person,
    round_length, score_limit, health, respawn_delay, bomb_timer,
    plant_time, defuse_time, attachments,
    status, accepted_at
  ) values (
    p.id, p.team_id, accepting_team,
    p.platform, p.category, p.game, p.ladder,
    p.game_mode, p.players, p.match_time, p.best_of,
    p.preset, p.perks, p.launchers, p.killstreaks, p.field_upgrades,
    p.hardcore, p.friendly_fire, p.radar, p.spectating, p.third_person,
    p.round_length, p.score_limit, p.health, p.respawn_delay, p.bomb_timer,
    p.plant_time, p.defuse_time, p.attachments,
    'upcoming', now()
  ) returning id into match_id;

  return next;
end;
$$ language plpgsql security definer;

-- Notes:
-- 1) Run this in the Supabase SQL editor. After creating the function you can call it via
--    `rpc('accept_match_post', { post_id: '<uuid>', accepting_team: '<team_uuid>' })` from the client.
-- 2) Review security: SECURITY DEFINER functions run with the owner's rights. Ensure the database role
--    that owns this function is restricted and the function logic includes necessary validations.
