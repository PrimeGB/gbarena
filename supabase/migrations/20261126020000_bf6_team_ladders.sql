create function public.gb_guard_bf6_team_ladders()
returns trigger language plpgsql set search_path = public, pg_temp
as $$
declare
  expected_players text;
  expected_mode text;
  presets text[];
  custom boolean;
begin
  if tg_op = 'UPDATE' and old.category = 'battlefield' and old.game = 'battlefield-6'
      and old.ladder in ('domination-5v5', 'obliteration-4v4', 'conquest-8v8', 'conquest-12v12', 'conquest-32v32') then
    if (new.category, new.game, new.ladder, new.players, new.game_mode, new.preset, new.best_of,
        new.friendly_fire, new.killstreaks, new.perks, new.radar, new.spectating, new.additional_rules)
      is distinct from
       (old.category, old.game, old.ladder, old.players, old.game_mode, old.preset, old.best_of,
        old.friendly_fire, old.killstreaks, old.perks, old.radar, old.spectating, old.additional_rules) then
      raise exception 'BF6 team match settings cannot be changed after posting.';
    end if;
    return new;
  end if;
  if new.category <> 'battlefield' or new.game <> 'battlefield-6' then return new; end if;
  case new.ladder
    when 'domination-5v5' then expected_players := '5v5'; expected_mode := 'Domination'; presets := array['GB Domination (Provisional)'];
    when 'obliteration-4v4' then expected_players := '4v4'; expected_mode := 'Squad Obliteration'; presets := array['ESB Squad Obliteration'];
    when 'conquest-8v8' then expected_players := '8v8'; expected_mode := 'Conquest'; presets := array['ESB Conquest Small', 'SnP T8 Conquest'];
    when 'conquest-12v12' then expected_players := '12v12'; expected_mode := 'Conquest'; presets := array['ESB Conquest Small'];
    when 'conquest-32v32' then expected_players := '32v32'; expected_mode := 'Conquest'; presets := array['GB Conquest (Provisional)'];
    else return new;
  end case;
  if tg_op = 'UPDATE' then raise exception 'Create a new post for the BF6 team ladder.'; end if;
  custom := coalesce(new.preset like 'Custom based on %', false);
  if new.players is distinct from expected_players or new.game_mode is distinct from expected_mode
    or coalesce(new.best_of, '') not in ('Best of 1', 'Best of 3')
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
revoke all on function public.gb_guard_bf6_team_ladders() from public, anon, authenticated;
create trigger zz_match_posts_bf6_team before insert or update on public.match_posts
for each row execute function public.gb_guard_bf6_team_ladders();
create trigger zz_matches_bf6_team before insert or update on public.matches
for each row execute function public.gb_guard_bf6_team_ladders();

do $$
declare thread_id bigint;
begin
  select id into thread_id from public.forum_posts
    where author = 'Prime' and category = 'News & Updates' and pinned and not hidden
      and subject ilike '%Site Updates%' order by created_at desc limit 1;
  if thread_id is null then raise exception 'Pinned Site Updates thread not found'; end if;
  update public.forum_posts set message = concat_ws(E'\n\n', nullif(trim(message), ''),
    'Battlefield 6 is getting new team ladders for 5v5 Domination, 4v4 Squad Obliteration and 8v8, 12v12 and 32v32 Conquest. ESB and SnP rules are available where applicable; larger matches and new formats should be checked in Portal before playing. Small tournaments for these modes are coming later.')
  where id = thread_id and coalesce(message, '') not like '%Battlefield 6 is getting new team ladders%';
end;
$$;
