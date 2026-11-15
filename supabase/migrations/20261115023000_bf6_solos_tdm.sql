insert into public.match_map_pools(category,game,game_mode,maps,source_url)
values ('battlefield','battlefield-6','Team Deathmatch',array['Saints Quarter','Empire State'],
  'https://www.polygon.com/map/battlefield-6-interactive-maps-multiplayer-bf6-all-list/')
on conflict(category,game,game_mode) do update set maps=excluded.maps,source_url=excluded.source_url;

create function public.gb_guard_bf6_solos()
returns trigger language plpgsql set search_path=public,pg_temp
as $$
declare
  selection text;
  pool text[];
  games integer;
begin
  if tg_op='UPDATE' and old.category='battlefield' and old.game='battlefield-6' and old.ladder='singles' then
    if (new.platform,new.category,new.game,new.ladder,new.game_mode,new.players,new.preset,new.best_of,
        new.round_length,new.score_limit,new.health,new.respawn_delay,new.friendly_fire,new.killstreaks,
        new.perks,new.launchers,new.field_upgrades,new.hardcore,new.radar,new.spectating,
        new.third_person,new.bomb_timer,new.plant_time,new.defuse_time,new.attachments)
      is distinct from
       (old.platform,old.category,old.game,old.ladder,old.game_mode,old.players,old.preset,old.best_of,
        old.round_length,old.score_limit,old.health,old.respawn_delay,old.friendly_fire,old.killstreaks,
        old.perks,old.launchers,old.field_upgrades,old.hardcore,old.radar,old.spectating,
        old.third_person,old.bomb_timer,old.plant_time,old.defuse_time,old.attachments) then
      raise exception using errcode='22023',message='BF6 Solos settings are locked once posted.';
    end if;
    if tg_table_name='matches' then
      if new.map_names is distinct from old.map_names then
        raise exception using errcode='22023',message='Accepted BF6 Solos maps cannot be changed.';
      end if;
    end if;
    return new;
  end if;
  if (new.category,new.game,new.ladder) is distinct from ('battlefield','battlefield-6','singles') then
    return new;
  end if;
  if tg_op='UPDATE' then
    raise exception using errcode='22023',message='Create a new post for the BF6 Solos ladder.';
  end if;
  if (new.game_mode,new.players,new.preset,new.round_length,new.score_limit,new.health,
      new.respawn_delay,new.friendly_fire,new.killstreaks)
    is distinct from ('Team Deathmatch','1v1','GB BF6 Solos TDM','10 Minutes','Time Limit Only','Default',
      'Default','Off','Infantry Only')
    or coalesce(new.best_of,'') not in ('Best of 1','Best of 3')
    or coalesce(new.platform,'') not in ('xbox','playstation','pc')
    or num_nonnulls(new.perks,new.launchers,new.field_upgrades,new.hardcore,new.radar,
      new.spectating,new.third_person,new.bomb_timer,new.plant_time,new.defuse_time,new.attachments)>0 then
    raise exception using errcode='22023',message='BF6 Solos requires the locked 1v1, full 10-minute Team Deathmatch rules.';
  end if;
  selection:=new.additional_rules #>> '{settings,Map Selection}';
  select maps into pool from public.match_map_pools
    where category='battlefield' and game='battlefield-6' and game_mode='Team Deathmatch';
  if pool is null or selection is null or (selection<>'Random' and not selection=any(pool)) then
    raise exception using errcode='22023',message='Choose Random or an approved small BF6 Solos map.';
  end if;
  if new.additional_rules is distinct from jsonb_build_object('settings',
      jsonb_build_object('Map Selection',selection,'Tiebreak','Next Kill Wins','AI Soldiers','Off'),
      'restrictions','[]'::jsonb) then
    raise exception using errcode='22023',message='BF6 Solos requires no AI and a next-kill tiebreak.';
  end if;
  if tg_table_name='matches' then
    games:=case new.best_of when 'Best of 1' then 1 else 3 end;
    if selection<>'Random' then
      new.map_names:=array_fill(selection,array[games]);
    end if;
    if coalesce(cardinality(new.map_names),0)<>games or not new.map_names<@pool
      or array_position(new.map_names,null) is not null then
      raise exception using errcode='22023',message='BF6 Solos maps must be assigned from the approved pool.';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function public.gb_guard_bf6_solos() from public,anon,authenticated;

create trigger zz_match_posts_bf6_solos before insert or update on public.match_posts
for each row execute function public.gb_guard_bf6_solos();
-- Runs after the existing rule-copy and random-map/host assignment triggers.
create trigger zz_matches_bf6_solos before insert or update on public.matches
for each row execute function public.gb_guard_bf6_solos();

do $$
declare thread_id bigint;
begin
  select id into thread_id from public.forum_posts
    where author='Prime' and category='News & Updates' and pinned and not hidden
      and subject ilike '%Site Updates%' order by created_at desc limit 1;
  if thread_id is null then raise exception 'Pinned Site Updates thread not found'; end if;
  update public.forum_posts set message=concat_ws(E'\n\n',nullif(trim(message),''),
    'Battlefield 6 now has a Solos Team Deathmatch ladder: 1v1, a full 10 minutes, most kills wins and next-kill sudden death for ties. Choose Random or preselect Saints Quarter or Empire State from the small-map pool before opponents accept. The ladder rules include Portal host setup and proof requirements; hosts must configure and test their experience in-game.')
    where id=thread_id and coalesce(message,'') not like '%Battlefield 6 now has a Solos Team Deathmatch ladder%';
end;
$$;
notify pgrst,'reload schema';
