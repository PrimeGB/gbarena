alter function public.gb_ensure_seasons() set timezone='UTC';
alter table public.seasons add column standings_updated_at timestamptz;

create table public.season_standings_archive (
  season_id uuid not null references public.seasons(id),
  kind text not null check (kind in ('players','teams')),
  scope text not null,
  scope_label text not null,
  entity_id uuid not null,
  name text not null,
  wins bigint not null,
  losses bigint not null,
  place bigint not null,
  eligible_place bigint,
  primary key(season_id,kind,scope,entity_id)
);
create table public.season_honours (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id),
  kind text not null check (kind in ('players','teams')),
  scope text not null,
  scope_label text not null,
  entity_id uuid not null,
  name text not null,
  honour text not null check (honour in ('champion','top10','undefeated','iron_competitor','dynasty')),
  place bigint not null,
  wins bigint not null,
  losses bigint not null,
  awarded_at timestamptz not null default now(),
  revoked_at timestamptz,
  unique(season_id,kind,scope,entity_id,honour)
);
create index season_honours_entity_idx on public.season_honours(kind,entity_id,season_id);
create table public.season_refresh_queue (
  season_id uuid primary key references public.seasons(id),
  requested_at timestamptz not null default now()
);
alter table public.season_standings_archive enable row level security;
alter table public.season_honours enable row level security;
alter table public.season_refresh_queue enable row level security;
revoke all on public.season_standings_archive, public.season_honours, public.season_refresh_queue from public, anon, authenticated;

create function public.gb_season_results(p_season uuid)
returns table(kind text, scope text, scope_label text, entity_id uuid, name text,
  wins bigint, losses bigint, place bigint, eligible_place bigint)
language sql stable security definer set search_path = public, pg_temp
as $$
  with matches_in_season as (
    select m.* from public.matches m join public.seasons s on s.id = p_season
    where m.completed_at >= s.starts_at and m.completed_at < s.ends_at
      and m.finalized and m.status = 'completed'
      and m.winning_team_id is not null and m.losing_team_id is not null
      and m.winning_team_id <> m.losing_team_id
  ), outcomes as (
    select m.id, m.game, m.ladder, 'teams'::text as kind, m.winning_team_id as entity_id, true as won
      from matches_in_season m
    union all
    select m.id,m.game,m.ladder,'teams',m.losing_team_id,false from matches_in_season m
    union all
    select m.id,m.game,m.ladder,'players',player,true from matches_in_season m
      cross join lateral (select distinct unnest(m.winning_user_ids) as player) users
      where player is not null and not exists(select 1 from unnest(m.losing_user_ids) opponent where opponent=player)
    union all
    select m.id,m.game,m.ladder,'players',player,false from matches_in_season m
      cross join lateral (select distinct unnest(m.losing_user_ids) as player) users
      where player is not null and not exists(select 1 from unnest(m.winning_user_ids) opponent where opponent=player)
  ), scoped as (
    select o.*, scope.key, scope.label
    from outcomes o cross join lateral (values
      ('global','All games & ladders'),
      ('game:' || o.game,public.gb_pretty(o.game)),
      ('ladder:' || o.game || ':' || o.ladder,public.gb_pretty(o.game) || ' / ' || public.gb_pretty(o.ladder))
    ) scope(key,label) where scope.key is not null
  ), totals as (
    select kind,key,label,entity_id,
      count(*) filter(where won) as wins,count(*) filter(where not won) as losses
    from scoped group by kind,key,label,entity_id
  ), named as (
    select totals.*, coalesce(p.username,t.name,'Former competitor') as name,
      totals.wins + totals.losses >= 5 and totals.wins > 0 as eligible
    from totals left join public.profiles p on kind='players' and p.id=entity_id
      left join public.teams t on kind='teams' and t.id=entity_id
  )
  select kind,key,label,entity_id,name,wins,losses,
    rank() over(partition by kind,key order by wins desc,losses asc),
    case when eligible then rank() over(partition by kind,key,eligible order by wins desc,losses asc) end
  from named;
$$;
revoke all on function public.gb_season_results(uuid) from public, anon, authenticated;

create function public.gb_refresh_season(p_season uuid)
returns void language plpgsql security definer set search_path = public, pg_temp
as $$
declare season public.seasons%rowtype;
begin
  perform pg_advisory_xact_lock(hashtext('gb_season_archives'));
  select * into strict season from public.seasons where id=p_season;
  delete from public.season_standings_archive where season_id=p_season;
  insert into public.season_standings_archive
    select p_season,result.* from public.gb_season_results(p_season) result;

  if season.ends_at <= now() then
    update public.season_honours h set revoked_at=now()
      where h.season_id=p_season and h.revoked_at is null and h.honour<>'dynasty'
      and not exists(
        select 1 from public.season_standings_archive s
        where s.season_id=p_season and s.kind=h.kind and s.scope=h.scope and s.entity_id=h.entity_id
          and s.eligible_place is not null and case h.honour
            when 'champion' then s.eligible_place=1
            when 'top10' then s.scope='global' and s.eligible_place<=10
            when 'undefeated' then s.scope='global' and s.losses=0 and s.wins>=10
            when 'iron_competitor' then s.scope='global' and s.wins+s.losses>=50
            else false end
      );
    insert into public.season_honours(season_id,kind,scope,scope_label,entity_id,name,honour,place,wins,losses)
    select p_season,s.kind,s.scope,s.scope_label,s.entity_id,s.name,award.honour,
      s.eligible_place,s.wins,s.losses
    from public.season_standings_archive s
    cross join lateral (
      select 'champion'::text as honour where s.eligible_place=1
      union all select 'top10' where s.scope='global' and s.eligible_place<=10
      union all select 'undefeated' where s.scope='global' and s.losses=0 and s.wins>=10
      union all select 'iron_competitor' where s.scope='global' and s.wins+s.losses>=50
    ) award
    where s.season_id=p_season and s.eligible_place is not null
    on conflict(season_id,kind,scope,entity_id,honour) do update set
      name=excluded.name,place=excluded.place,wins=excluded.wins,losses=excluded.losses,revoked_at=null
    where (season_honours.name,season_honours.place,season_honours.wins,season_honours.losses,season_honours.revoked_at)
      is distinct from (excluded.name,excluded.place,excluded.wins,excluded.losses,null::timestamptz);
  end if;
  update public.seasons set standings_updated_at=now() where id=p_season;
end;
$$;
revoke all on function public.gb_refresh_season(uuid) from public, anon, authenticated;

create function public.gb_queue_season_refresh()
returns trigger language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  if tg_op='UPDATE' and
    (old.completed_at,old.finalized,old.status,old.winning_team_id,old.losing_team_id,
      old.winning_user_ids,old.losing_user_ids,old.game,old.ladder)
    is not distinct from
    (new.completed_at,new.finalized,new.status,new.winning_team_id,new.losing_team_id,
      new.winning_user_ids,new.losing_user_ids,new.game,new.ladder) then return new; end if;
  if tg_op<>'INSERT' then
    insert into public.season_refresh_queue(season_id)
    select id from public.seasons where old.completed_at>=starts_at and old.completed_at<ends_at
    on conflict(season_id) do update set requested_at=now();
  end if;
  if tg_op<>'DELETE' then
    insert into public.season_refresh_queue(season_id)
    select id from public.seasons where new.completed_at>=starts_at and new.completed_at<ends_at
    on conflict(season_id) do update set requested_at=now();
  end if;
  if tg_op='DELETE' then return old; else return new; end if;
end;
$$;
revoke all on function public.gb_queue_season_refresh() from public,anon,authenticated;
create trigger matches_queue_season_refresh after insert or update or delete on public.matches
for each row execute function public.gb_queue_season_refresh();

create function public.gb_process_season_refreshes()
returns void language plpgsql security definer set search_path = public, pg_temp
as $$
declare queued record; refreshed boolean := false;
begin
  perform pg_advisory_xact_lock(hashtext('gb_season_archives'));
  perform public.gb_ensure_seasons();
  insert into public.season_refresh_queue(season_id)
    select id from public.seasons where standings_updated_at is null
      or (ends_at<=now() and standings_updated_at<ends_at)
    on conflict do nothing;
  for queued in select season_id from public.season_refresh_queue for update loop
    perform public.gb_refresh_season(queued.season_id);
    refreshed := true;
    delete from public.season_refresh_queue where season_id=queued.season_id;
  end loop;
  if not refreshed then return; end if;
  -- Reconcile cross-season rarity after any corrected season.
  with titles as (
    select h.*,row_number() over(partition by h.kind,h.entity_id order by s.ends_at,h.season_id) as titles
    from public.season_honours h join public.seasons s on s.id=h.season_id
    where h.honour='champion' and h.scope='global' and h.revoked_at is null
  )
  update public.season_honours h set revoked_at=now() where h.honour='dynasty' and h.revoked_at is null
    and not exists(select 1 from titles t where t.titles=3 and t.season_id=h.season_id
      and t.kind=h.kind and t.entity_id=h.entity_id);
  insert into public.season_honours(season_id,kind,scope,scope_label,entity_id,name,honour,place,wins,losses)
  select champion.season_id,champion.kind,champion.scope,champion.scope_label,champion.entity_id,
    champion.name,'dynasty',champion.place,champion.wins,champion.losses
  from (
    select h.*,row_number() over(partition by h.kind,h.entity_id order by s.ends_at,h.season_id) as titles
    from public.season_honours h join public.seasons s on s.id=h.season_id
    where h.honour='champion' and h.scope='global' and h.revoked_at is null
  ) champion where titles=3
  on conflict(season_id,kind,scope,entity_id,honour) do update set
    name=excluded.name,place=excluded.place,wins=excluded.wins,losses=excluded.losses,revoked_at=null
  where (season_honours.name,season_honours.place,season_honours.wins,season_honours.losses,season_honours.revoked_at)
    is distinct from (excluded.name,excluded.place,excluded.wins,excluded.losses,null::timestamptz);
end;
$$;
revoke all on function public.gb_process_season_refreshes() from public,anon,authenticated;
select cron.schedule('gb-season-archives','* * * * *','select public.gb_process_season_refreshes()');

create function public.gb_season_board(p_season uuid,p_kind text default 'players',
  p_scope text default 'global',p_limit integer default 100)
returns setof jsonb language plpgsql stable security definer set search_path=public,pg_temp
as $$
declare ended boolean; pending boolean;
begin
  if p_kind not in ('players','teams') or p_limit is null or p_limit not between 1 and 100 then
    raise exception 'Choose a valid season board'; end if;
  select ends_at<=now() into ended from public.seasons where id=p_season;
  if not found then raise exception 'Season not found'; end if;
  select exists(select 1 from public.season_refresh_queue where season_id=p_season) into pending;
  if ended and not pending then
    return query select jsonb_build_object('id',entity_id,'name',name,'wins',wins,'losses',losses,
      'rank',place,'eligible_rank',eligible_place,'archived',true)
    from public.season_standings_archive where season_id=p_season and kind=p_kind and scope=p_scope
    order by place,name,entity_id limit p_limit;
  else
    return query select jsonb_build_object('id',entity_id,'name',name,'wins',wins,'losses',losses,
      'rank',place,'eligible_rank',eligible_place,'archived',false)
    from public.gb_season_results(p_season) where kind=p_kind and scope=p_scope
    order by place,name,entity_id limit p_limit;
  end if;
end;
$$;
revoke all on function public.gb_season_board(uuid,text,text,integer) from public,anon;
grant execute on function public.gb_season_board(uuid,text,text,integer) to anon,authenticated;

create or replace function public.gb_season_standings(p_season uuid,p_kind text default 'teams',p_limit integer default 25)
returns setof jsonb language sql stable security definer set search_path=public,pg_temp
as $$ select * from public.gb_season_board(p_season,p_kind,'global',p_limit); $$;

create function public.gb_season_scopes(p_season uuid)
returns setof jsonb language sql stable security definer set search_path=public,pg_temp
as $$
  select jsonb_build_object('scope',scope,'label',scope_label) from (
    select distinct scope,scope_label from public.gb_season_results(p_season)
  ) scopes order by case when scope='global' then 0 when scope like 'game:%' then 1 else 2 end,scope_label;
$$;
revoke all on function public.gb_season_scopes(uuid) from public,anon;
grant execute on function public.gb_season_scopes(uuid) to anon,authenticated;

create function public.gb_season_honours(p_season uuid default null,p_kind text default 'players',
  p_entity uuid default null,p_limit integer default 100,p_scope text default null)
returns setof jsonb language plpgsql stable security definer set search_path=public,pg_temp
as $$
begin
  if p_kind not in ('players','teams') or p_limit is null or p_limit not between 1 and 200 then
    raise exception 'Choose valid season honours'; end if;
  return query select to_jsonb(h) || jsonb_build_object('season_name',s.name,'season_number',s.number,
    'starts_at',s.starts_at,'ends_at',s.ends_at)
  from public.season_honours h join public.seasons s on s.id=h.season_id
  where h.revoked_at is null and h.kind=p_kind
    and (p_season is null or h.season_id=p_season) and (p_entity is null or h.entity_id=p_entity)
    and (p_scope is null or h.scope=p_scope)
  order by s.ends_at desc,case h.honour when 'champion' then 0 when 'top10' then 1 else 2 end,
    h.scope,h.place,h.name,h.id limit p_limit;
end;
$$;
revoke all on function public.gb_season_honours(uuid,text,uuid,integer,text) from public,anon;
grant execute on function public.gb_season_honours(uuid,text,uuid,integer,text) to anon,authenticated;

insert into public.staff_award_catalog(name,award_group,purpose,exclusive,auto_award) values
 ('Season Top 10 Badge','Season Honours','Finish in the eligible global Top 10 in a completed monthly season. Season-specific badge; at least 5 finalized matches and 1 win. Tied places are shared.',true,true),
 ('Season Category Champion','Season Honours','Finish first among eligible players or teams globally, per game, or per game/ladder in a completed monthly season. At least 5 finalized matches and 1 win.',true,true),
 ('Perfect Season Relic','Rare Season Achievements','Finish a monthly season with at least 10 finalized wins and no losses. Season-specific rare honour.',true,true),
 ('Iron Competitor Crest','Rare Season Achievements','Complete at least 50 finalized matches and earn a win in one monthly season.',true,true),
 ('Three-Time Dynasty Seal','Rare Season Achievements','Win eligible global championships in three completed monthly seasons. Awarded on the third championship.',true,true)
on conflict(name) do update set purpose=excluded.purpose,auto_award=excluded.auto_award,exclusive=excluded.exclusive;

insert into public.owner_audit_sources(table_name,category,recorded_fields,private_fields)
values ('season_honours','awards','{id,season_id,kind,scope,scope_label,entity_id,name,honour,place,wins,losses,revoked_at}','{}');
create trigger owner_audit_capture after insert or update or delete on public.season_honours
for each row execute function public.owner_capture_audit_event();

select public.gb_process_season_refreshes();

create or replace function public.gb_player_season_history_raw(p_user uuid)
returns setof jsonb language sql stable security definer set search_path=public,pg_temp
as $$
  select jsonb_build_object('season_id',s.id,'name',s.name,'number',s.number,
    'wins',result.wins,'losses',result.losses,'place',result.place,
    'players',(select count(*) from public.gb_season_results(s.id) where kind='players' and scope='global'),
    'current',s.starts_at<=now() and s.ends_at>now())
  from public.seasons s cross join lateral public.gb_season_results(s.id) result
  where result.kind='players' and result.scope='global' and result.entity_id=p_user
  order by s.starts_at desc;
$$;
revoke all on function public.gb_player_season_history_raw(uuid) from public,anon,authenticated;
notify pgrst,'reload schema';
