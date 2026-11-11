create temporary table host_assignment_test (
  category text, game text, ladder text, game_mode text, best_of text,
  posting_team_id uuid, accepting_team_id uuid, host_team_ids uuid[], map_names text[]
);
create trigger host_assignment_test before insert on host_assignment_test
  for each row execute function public.gb_assign_match_hosts();

do $$
declare
  lower_team uuid;
  higher_team uuid;
  unranked_team uuid;
  hosts uuid[];
  chosen text[];
  source_pool text[];
begin
  select array_agg(id order by coalesce(rating_points,100) desc, coalesce(wins,0) desc,
    coalesce(losses,0), created_at nulls first, id)
  into hosts from public.teams
  where category='call-of-duty' and game='mw2' and ladder='singles'
    and platform='xbox' and (wins > 0 or losses > 0);
  if cardinality(hosts) < 2 then raise exception 'Missing ranked test fixtures'; end if;
  higher_team := hosts[1];
  lower_team := hosts[2];
  select id into unranked_team from public.teams
    where category='call-of-duty' and game='mw2' and ladder='singles'
      and platform='xbox' and coalesce(wins,0)=0 and coalesce(losses,0)=0 limit 1;
  if unranked_team is null then raise exception 'Missing unranked test fixture'; end if;

  insert into host_assignment_test(category, game, ladder, game_mode, best_of, posting_team_id, accepting_team_id)
  values ('call-of-duty','mw2','singles','Search and Destroy','Best of 3',lower_team,higher_team)
  returning host_team_ids into hosts;
  if hosts <> array[higher_team,lower_team,higher_team] then raise exception 'Higher-ranked accepting team must host first: %', hosts; end if;

  insert into host_assignment_test(category, game, ladder, game_mode, best_of, posting_team_id, accepting_team_id)
  values ('call-of-duty','mw2','singles','Search and Destroy','Best of 3',unranked_team,higher_team)
  returning host_team_ids into hosts;
  if hosts <> array[higher_team,unranked_team,higher_team] then raise exception 'Ranked team must host before unranked team'; end if;

  select maps into source_pool from public.match_map_pools
    where category='call-of-duty' and game='black-ops-6' and game_mode='Search and Destroy';
  if source_pool is null or cardinality(source_pool) <> 5 then raise exception 'Missing BO6 map pool'; end if;
  for i in 1..30 loop
    chosen := public.gb_random_match_maps(source_pool, 'Best of 7');
    if cardinality(chosen) <> 7 or not chosen <@ source_pool
      or (select count(distinct value) from unnest(chosen[1:5]) as value) <> 5 then
      raise exception 'Invalid map draw: %', chosen;
    end if;
  end loop;
  if public.gb_random_match_maps(null, 'Best of 3') is not null then raise exception 'Unknown pool must remain unassigned'; end if;
  insert into host_assignment_test(category, game, ladder, game_mode, best_of, posting_team_id, accepting_team_id)
  values ('call-of-duty','black-ops-6','singles','Search and Destroy','Best of 3',lower_team,higher_team)
  returning map_names into chosen;
  if cardinality(chosen) <> 3 or not chosen <@ source_pool then raise exception 'Map assignment trigger failed'; end if;
end;
$$;

do $$
declare
  xbox_team uuid;
  ps_first uuid;
  ps_second uuid;
  hosts uuid[];
begin
  select id into xbox_team from public.teams where category='call-of-duty' and game='modern-warfare-4'
    and ladder='singles' and platform='xbox' limit 1;
  select array_agg(id order by id) into hosts from public.teams
    where category='call-of-duty' and game='modern-warfare-4' and ladder='singles' and platform='playstation';
  if xbox_team is null or cardinality(hosts) < 2 then raise exception 'Missing cross-play test fixtures'; end if;
  ps_first := hosts[1];
  ps_second := hosts[2];
  update public.teams set wins=1, losses=0, rating_points=100 where id in (xbox_team, ps_first, ps_second);
  update public.teams set rating_points=200 where id=ps_first;

  insert into host_assignment_test(category, game, ladder, game_mode, best_of, posting_team_id, accepting_team_id)
  values ('call-of-duty','modern-warfare-4','singles','Search and Destroy','Best of 3',ps_second,xbox_team)
  returning host_team_ids into hosts;
  if hosts <> array[xbox_team,ps_second,xbox_team] then raise exception 'Cross-play must compare system rank, not rating points'; end if;

  insert into host_assignment_test(category, game, ladder, game_mode, best_of, posting_team_id, accepting_team_id)
  values ('call-of-duty','modern-warfare-4','singles','Search and Destroy','Best of 3',ps_first,xbox_team)
  returning host_team_ids into hosts;
  if hosts <> array[ps_first,xbox_team,ps_first] then raise exception 'Equal cross-play ranks must choose posting team'; end if;

  update public.teams set wins=0, losses=0 where id in (xbox_team, ps_first);
  insert into host_assignment_test(category, game, ladder, game_mode, best_of, posting_team_id, accepting_team_id)
  values ('call-of-duty','modern-warfare-4','singles','Search and Destroy','Best of 3',ps_first,xbox_team)
  returning host_team_ids into hosts;
  if hosts <> array[ps_first,xbox_team,ps_first] then raise exception 'Two unranked teams must choose posting team'; end if;
end;
$$;
