begin;

lock table public.teams, public.match_posts, public.matches in share row exclusive mode;

do $$
begin
  if exists (select 1 from public.teams where category = 'battlefield' and game = 'battlefield-6'
      and ladder in ('domination-5v5', 'obliteration-4v4', 'conquest-8v8', 'conquest-12v12', 'conquest-32v32'))
    or exists (select 1 from public.match_posts where category = 'battlefield' and game = 'battlefield-6'
      and ladder in ('domination-5v5', 'obliteration-4v4', 'conquest-8v8', 'conquest-12v12', 'conquest-32v32'))
    or exists (select 1 from public.matches where category = 'battlefield' and game = 'battlefield-6'
      and ladder in ('domination-5v5', 'obliteration-4v4', 'conquest-8v8', 'conquest-12v12', 'conquest-32v32')) then
    raise exception 'BF6 format-specific records exist; resolve them before consolidating the team ladder.';
  end if;
end;
$$;

create function public.gb_guard_bf6_team_scope()
returns trigger language plpgsql set search_path = public, pg_temp
as $$
begin
  if new.category = 'battlefield' and new.game = 'battlefield-6'
    and new.ladder in ('domination-5v5', 'obliteration-4v4', 'conquest-8v8', 'conquest-12v12', 'conquest-32v32') then
    raise exception 'BF6 team formats now share the Team Ladder.';
  end if;
  return new;
end;
$$;
revoke all on function public.gb_guard_bf6_team_scope() from public, anon, authenticated;
create trigger zz_teams_bf6_shared_ladder before insert or update of category, game, ladder on public.teams
for each row execute function public.gb_guard_bf6_team_scope();

create or replace function public.gb_guard_bf6_team_ladders()
returns trigger language plpgsql set search_path = public, pg_temp
as $$
declare
  presets text[];
  custom boolean;
begin
  if tg_op = 'UPDATE' and old.category = 'battlefield' and old.game = 'battlefield-6' and old.ladder = 'team' then
    if (new.category, new.game, new.ladder, new.players, new.game_mode, new.preset, new.best_of,
        new.friendly_fire, new.killstreaks, new.perks, new.radar, new.spectating, new.additional_rules)
      is distinct from
       (old.category, old.game, old.ladder, old.players, old.game_mode, old.preset, old.best_of,
        old.friendly_fire, old.killstreaks, old.perks, old.radar, old.spectating, old.additional_rules) then
      raise exception 'BF6 team match settings cannot be changed after posting.';
    end if;
    return new;
  end if;
  if new.category is distinct from 'battlefield' or new.game is distinct from 'battlefield-6' then return new; end if;
  if new.ladder in ('domination-5v5', 'obliteration-4v4', 'conquest-8v8', 'conquest-12v12', 'conquest-32v32') then
    raise exception 'BF6 team formats now share the Team Ladder.';
  end if;
  if new.ladder is distinct from 'team' then return new; end if;
  if tg_op = 'UPDATE' then raise exception 'Create a new post for the BF6 team ladder.'; end if;
  case
    when new.players = '5v5' and new.game_mode = 'Domination' then presets := array['GB Domination (Provisional)'];
    when new.players = '4v4' and new.game_mode = 'Squad Obliteration' then presets := array['ESB Squad Obliteration'];
    when new.players = '8v8' and new.game_mode = 'Conquest' then presets := array['ESB Conquest Small', 'SnP T8 Conquest'];
    when new.players = '12v12' and new.game_mode = 'Conquest' then presets := array['ESB Conquest Small'];
    when new.players = '32v32' and new.game_mode = 'Conquest' then presets := array['GB Conquest (Provisional)'];
    else raise exception 'Invalid BF6 team ladder format or settings.';
  end case;
  custom := coalesce(new.preset like 'Custom based on %', false);
  if coalesce(new.best_of, '') not in ('Best of 1', 'Best of 3')
    or not coalesce(case when custom then substring(new.preset from 17) else new.preset end = any(presets), false)
    or coalesce(new.friendly_fire, '') not in ('Follow rules', 'On', 'Off')
    or coalesce(new.killstreaks, '') not in ('Follow rules', 'On', 'Off')
    or coalesce(new.perks, '') not in ('Follow rules', 'On', 'Off')
    or coalesce(new.radar, '') not in ('Follow rules', 'On', 'Off')
    or coalesce(new.spectating, '') not in ('Follow rules', 'On', 'Off')
    or (not custom and (new.friendly_fire, new.killstreaks, new.perks, new.radar, new.spectating)
      is distinct from ('Follow rules', 'Follow rules', 'Follow rules', 'Follow rules', 'Follow rules')) then
    raise exception 'Invalid BF6 team ladder format or settings.';
  end if;
  return new;
end;
$$;

do $$
declare thread_id bigint;
begin
  select id into thread_id from public.forum_posts
    where author = 'Prime' and category = 'News & Updates' and pinned and not hidden
      and subject ilike '%Site Updates%' order by created_at desc limit 1;
  if thread_id is null then raise exception 'Pinned Site Updates thread not found'; end if;
  update public.forum_posts set message = concat_ws(E'\n\n', nullif(trim(message), ''),
    'Battlefield 6 now has one Team Ladder. Choose Domination, Squad Obliteration or Conquest and your preferred team size when setting up a match; the formats share the same ladder.')
  where id = thread_id and coalesce(message, '') not like '%Battlefield 6 now has one Team Ladder%';
end;
$$;

commit;
