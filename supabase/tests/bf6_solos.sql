begin;

do $$
declare
  users uuid[];
  team_a uuid:=gen_random_uuid();
  team_b uuid:=gen_random_uuid();
  post_uuid uuid;
  match_uuid uuid;
  selection text;
  series text;
  details jsonb;
  original jsonb;
  patch jsonb;
  accepted public.matches%rowtype;
  chosen text[];
  scheduled timestamptz:=now()+interval '50 days';
begin
  select array_agg(id) into users from (
    select p.id from public.profiles p join auth.users u on u.id=p.id order by p.id limit 2
  ) fixture;
  if cardinality(users)<>2 then raise exception 'Two real account fixtures are required'; end if;
  insert into public.gaming_accounts(user_id,platform,category,game,account_id)
    values(users[1],'xbox','battlefield','battlefield-6','bf6a'||left(replace(gen_random_uuid()::text,'-',''),8)),
          (users[2],'xbox','battlefield','battlefield-6','bf6b'||left(replace(gen_random_uuid()::text,'-',''),8))
    on conflict(user_id,platform,category,game) do nothing;
  insert into public.teams(id,name,owner_id,platform,category,game,ladder)
    values(team_a,'BF6 solos rollback A',users[1],'xbox','battlefield','battlefield-6','singles'),
          (team_b,'BF6 solos rollback B',users[2],'xbox','battlefield','battlefield-6','singles');

  foreach selection in array array['Empire State','Random','Saints Quarter'] loop
    perform set_config('request.jwt.claim.sub',users[1]::text,true);
    post_uuid:=gen_random_uuid();
    series:=case selection when 'Saints Quarter' then 'Best of 1' else 'Best of 3' end;
    details:=jsonb_build_object('settings',jsonb_build_object('Map Selection',selection,
      'Tiebreak','Next Kill Wins','AI Soldiers','Off'),'restrictions','[]'::jsonb);
    insert into public.match_posts(id,team_id,platform,category,game,ladder,game_mode,players,
      match_time,best_of,preset,crossplay,round_length,score_limit,health,respawn_delay,
      friendly_fire,killstreaks,additional_rules,posting_roster,status)
    values(post_uuid,team_a,'xbox','battlefield','battlefield-6','singles','Team Deathmatch','1v1',
      scheduled::text,series,'GB BF6 Solos TDM',false,'10 Minutes','Time Limit Only','Default','Default',
      'Off','Infantry Only',details,array[users[1]],'open');

    select to_jsonb(p) into original from public.match_posts p where id=post_uuid;
    foreach patch in array array[
      '{"game_mode":"Conquest"}'::jsonb,
      '{"round_length":"15 Minutes"}'::jsonb,
      '{"score_limit":"25 Kills"}'::jsonb,
      '{"best_of":"Best of 7"}'::jsonb,
      '{"health":"200%"}'::jsonb,
      '{"additional_rules":{"settings":{"Map Selection":"Mirak Valley","Tiebreak":"Next Kill Wins","AI Soldiers":"Off"},"restrictions":[]}}'::jsonb,
      '{"additional_rules":{"settings":{"Map Selection":"Random","Tiebreak":"Replay","AI Soldiers":"Off"},"restrictions":[]}}'::jsonb
    ] loop
      begin
        insert into public.match_posts
          select (jsonb_populate_record(null::public.match_posts,original||patch||jsonb_build_object(
            'id',gen_random_uuid(),'match_time',(scheduled+interval '10 days')::text))).*;
        raise exception 'Forged BF6 Solos settings were accepted: %',patch;
      exception when invalid_parameter_value then null;
      end;
    end loop;
    begin
      update public.match_posts set round_length='15 Minutes' where id=post_uuid;
      raise exception 'Posted BF6 settings were editable';
    exception when invalid_parameter_value then null;
    end;
    begin
      update public.match_posts set additional_rules=jsonb_set(additional_rules,
        '{settings,Map Selection}','"Mirak Valley"') where id=post_uuid;
      raise exception 'Posted map selection was editable';
    exception when raise_exception then
      if sqlerrm<>'Posted match rules cannot be changed.' then raise; end if;
    end;

    perform set_config('request.jwt.claim.sub',users[2]::text,true);
    select match_id into match_uuid from public.accept_match_post(post_uuid,team_b,array[users[2]]);
    select * into strict accepted from public.matches where id=match_uuid;
    chosen:=accepted.map_names;
    if accepted.additional_rules is distinct from details or accepted.locked_posting_roster<>array[users[1]]
      or accepted.locked_accepting_roster<>array[users[2]] then
      raise exception 'Acceptance must preserve posted map/rules and lock the solo rosters';
    end if;
    if selection='Random' then
      if cardinality(chosen)<>3 or not chosen<@array['Saints Quarter','Empire State']
        or chosen[1]=chosen[2] then
        raise exception 'Random maps must stay within the small pool and shuffle before repeating: %',chosen;
      end if;
    elsif chosen is distinct from array_fill(selection,array[case series when 'Best of 1' then 1 else 3 end]) then
      raise exception 'Preselected maps must survive acceptance for every series game';
    end if;
    begin
      update public.matches set map_names=array['Mirak Valley'] where id=match_uuid;
      raise exception 'Accepted maps were editable';
    exception when invalid_parameter_value then null;
    end;
    begin
      update public.matches set score_limit='15 Kills' where id=match_uuid;
      raise exception 'Accepted full-time rules were editable';
    exception when invalid_parameter_value then null;
    end;
    scheduled:=scheduled+interval '30 minutes';
  end loop;
end;
$$;

rollback;
