create function public.gb_ladder_platforms(p_category text, p_game text, p_platform text)
returns text[]
language sql
immutable
set search_path = public, pg_temp
as $$
  select case
    when p_platform in ('xbox', 'playstation', 'pc', 'nintendo')
      and p_category in ('fortnite', 'rocket-league', 'apex')
      then array['xbox', 'playstation', 'pc', 'nintendo']
    when p_platform in ('xbox', 'playstation', 'pc')
      and (
        (p_category = 'call-of-duty' and p_game in ('modern-warfare-4', 'modern-warfare-ii', 'modern-warfare-iii', 'black-ops-6', 'black-ops-cold-war', 'vanguard'))
        or (p_category = 'battlefield' and p_game in ('battlefield-6', 'battlefield-2042', 'redsec'))
        or p_category = 'rainbow-six'
      )
      then array['xbox', 'playstation', 'pc']
    else array[p_platform]
  end;
$$;

grant execute on function public.gb_ladder_platforms(text, text, text) to anon, authenticated;

alter table public.matches add column if not exists crossplay text;
update public.matches m set crossplay = case when p.crossplay then 'On' else 'Off' end
from public.match_posts p where p.id = m.match_post_id and m.crossplay is null
  and (m.status is distinct from 'completed' or coalesce(m.result_processed, false));

drop policy if exists "Authenticated users can create matches" on public.matches;
drop policy if exists "Signed in users can create matches" on public.matches;

create function public.gb_lock_match_ladder_settings()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if (new.match_post_id, new.platform, new.category, new.game, new.ladder, new.crossplay)
    is distinct from (old.match_post_id, old.platform, old.category, old.game, old.ladder, old.crossplay) then
    raise exception 'Accepted match ladder and cross-play settings cannot be changed.';
  end if;
  return new;
end;
$$;
create trigger matches_lock_ladder_settings before update on public.matches
for each row execute function public.gb_lock_match_ladder_settings();

create function public.gb_lock_post_crossplay()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if new.crossplay is distinct from old.crossplay then
    raise exception 'Cross-play cannot be changed on a match post.';
  end if;
  return new;
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
  'Supported cross-play ladders now share standings across systems, with system filters. Cross-play match posts can be accepted by teams on compatible systems; please check your game versions can play together first.')
from site_updates
where post.id = site_updates.id
  and coalesce(post.message, '') not like '%Supported cross-play ladders now share standings across systems%';
create trigger match_posts_lock_crossplay before update on public.match_posts
for each row execute function public.gb_lock_post_crossplay();

create or replace function public.capture_match_rosters()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_user_id uuid;
  v_required integer;
  v_accepting_platform text;
begin
  if tg_op = 'UPDATE' then
    if (new.locked_posting_roster, new.locked_accepting_roster)
      is distinct from (old.locked_posting_roster, old.locked_accepting_roster) then
      raise exception 'Accepted match rosters cannot be changed.';
    end if;
    return new;
  end if;
  select platform into v_accepting_platform from public.teams where id = new.accepting_team_id;
  if not found then raise exception 'Accepting team not found.'; end if;
  if v_accepting_platform is distinct from new.platform and not exists (
    select 1 from public.match_posts post
    join public.teams accepting on accepting.id = new.accepting_team_id
    where post.id = new.match_post_id and post.status = 'accepted' and post.crossplay
      and post.team_id = new.posting_team_id and post.platform = new.platform
      and post.category = new.category and post.game = new.game and post.ladder = new.ladder
      and accepting.category = new.category and accepting.game = new.game and accepting.ladder = new.ladder
      and accepting.platform = any(public.gb_ladder_platforms(new.category, new.game, new.platform))
  ) then raise exception 'Cross-system matches require a compatible cross-play match post.'; end if;
  v_required := coalesce(nullif((regexp_match(lower(coalesce(new.players, '')), '^([0-9]+)v'))[1], '')::integer, 1);
  if coalesce(cardinality(new.locked_posting_roster), 0) <> v_required
    or coalesce(cardinality(new.locked_accepting_roster), 0) <> v_required
    or cardinality(array(select distinct unnest(new.locked_posting_roster))) <> v_required
    or cardinality(array(select distinct unnest(new.locked_accepting_roster))) <> v_required then
    raise exception 'Both teams must submit exactly % distinct match participants.', v_required;
  end if;
  for v_user_id in
    select distinct roster.user_id from (
      select unnest(new.locked_posting_roster) as user_id
      union select unnest(new.locked_accepting_roster)
    ) roster order by roster.user_id
  loop
    perform pg_advisory_xact_lock(hashtextextended(v_user_id::text, 0));
  end loop;
  if exists (
    select 1 from unnest(new.locked_posting_roster) roster(user_id)
    where not exists (select 1 from public.team_members where team_id = new.posting_team_id and user_id = roster.user_id)
       or not exists (select 1 from public.gaming_accounts where user_id = roster.user_id and platform = new.platform and category = new.category and game = new.game)
  ) or exists (
    select 1 from unnest(new.locked_accepting_roster) roster(user_id)
    where not exists (select 1 from public.team_members where team_id = new.accepting_team_id and user_id = roster.user_id)
       or not exists (select 1 from public.gaming_accounts where user_id = roster.user_id and platform = v_accepting_platform and category = new.category and game = new.game)
  ) then raise exception 'Every match player must be rostered and have a saved gaming ID for their team system and game.'; end if;
  return new;
end;
$$;

create or replace function public.capture_match_participants()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  insert into public.match_participants (match_id, team_id, team_name_at_match, user_id, username_at_match, platform, category, game, account_id_at_match)
  select new.id, team.id, coalesce(team.name, 'Team'), roster.user_id, coalesce(profile.username, 'Player'),
         team.platform, new.category, new.game, account.account_id
  from (select new.posting_team_id as team_id, unnest(new.locked_posting_roster) as user_id
        union all select new.accepting_team_id, unnest(new.locked_accepting_roster)) roster
  join public.teams team on team.id = roster.team_id
  join public.profiles profile on profile.id = roster.user_id
  join public.gaming_accounts account on account.user_id = roster.user_id
    and account.platform = team.platform and account.category = new.category and account.game = new.game;
  return new;
end;
$$;

create or replace function public.accept_match_post(post_id uuid, accepting_team uuid, accepting_roster uuid[])
returns table(match_id uuid)
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_post public.match_posts%rowtype;
  v_team public.teams%rowtype;
  v_match_id uuid;
begin
  if auth.uid() is null then raise exception 'You must be signed in to accept a match.'; end if;
  select * into v_post from public.match_posts where id = $1 for update;
  if not found or v_post.status is distinct from 'open' then raise exception 'Match post not found or no longer open.'; end if;
  select * into v_team from public.teams where id = $2;
  if not found or v_team.category is distinct from v_post.category
    or v_team.game is distinct from v_post.game or v_team.ladder is distinct from v_post.ladder
    or (v_team.platform is distinct from v_post.platform and (
      not coalesce(v_post.crossplay, false)
      or not (v_team.platform = any(public.gb_ladder_platforms(v_post.category, v_post.game, v_post.platform)))
    )) then raise exception 'Accepting team is not eligible for this match or cross-play is disabled.'; end if;
  if v_post.team_id = $2 then raise exception 'You cannot accept your own match post.'; end if;
  if exists (select 1 from public.match_posts where team_id = $2 and status = 'open' and id <> v_post.id)
    or exists (select 1 from public.matches where (posting_team_id = $2 or accepting_team_id = $2)
      and coalesce(lower(status), '') not in ('completed', 'cancelled')) then
    raise exception 'This team already has an open or active match commitment.';
  end if;
  if v_team.owner_id is distinct from auth.uid() and not exists (
    select 1 from public.team_members where team_id = $2 and user_id = auth.uid()
      and lower(coalesce(role, '')) in ('leader', 'co-leader', 'coleader', 'co_leader', 'captain')
  ) then raise exception 'Only team leaders, co-leaders, and captains can accept matches.'; end if;
  if coalesce(cardinality($3), 0) <> cardinality(v_post.posting_roster)
    or cardinality(array(select distinct unnest($3))) <> cardinality(v_post.posting_roster) then
    raise exception 'Select the same number of players as the posting team.';
  end if;
  if exists (select 1 from unnest($3) roster(user_id)
    where not exists (select 1 from public.team_members where team_id = $2 and user_id = roster.user_id)
       or not exists (select 1 from public.gaming_accounts where user_id = roster.user_id
         and platform = v_team.platform and category = v_post.category and game = v_post.game)) then
    raise exception 'Every selected player must be rostered and have a saved gaming ID for their team system and game.';
  end if;
  update public.match_posts set status = 'accepted' where id = v_post.id and status = 'open';
  if not found then raise exception 'Match post is no longer open.'; end if;
  insert into public.matches (
    match_post_id, posting_team_id, accepting_team_id, platform, category, game, ladder,
    game_mode, players, match_time, best_of, preset, crossplay, perks, launchers, killstreaks, field_upgrades,
    hardcore, friendly_fire, radar, spectating, third_person, round_length, score_limit, health,
    respawn_delay, bomb_timer, plant_time, defuse_time, attachments,
    locked_posting_roster, locked_accepting_roster, status, accepted_at
  ) values (
    v_post.id, v_post.team_id, $2, v_post.platform, v_post.category, v_post.game, v_post.ladder,
    v_post.game_mode, v_post.players, v_post.match_time, v_post.best_of, v_post.preset, case when v_post.crossplay then 'On' else 'Off' end,
    v_post.perks, v_post.launchers, v_post.killstreaks, v_post.field_upgrades,
    v_post.hardcore, v_post.friendly_fire, v_post.radar, v_post.spectating, v_post.third_person,
    v_post.round_length, v_post.score_limit, v_post.health, v_post.respawn_delay, v_post.bomb_timer,
    v_post.plant_time, v_post.defuse_time, v_post.attachments, v_post.posting_roster, $3, 'upcoming', now()
  ) returning id into v_match_id;
  return query select v_match_id;
end;
$$;
