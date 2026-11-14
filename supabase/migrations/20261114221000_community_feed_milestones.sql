alter table public.tournament_matches add column decided_at timestamptz;
create function public.gb_timestamp_tournament_decision()
returns trigger language plpgsql set search_path=public,pg_temp
as $$
begin
  if tg_op='INSERT' or new.winner_id is distinct from old.winner_id then
    new.decided_at:=case when new.winner_id is not null then now() end;
  end if;
  return new;
end;
$$;
revoke all on function public.gb_timestamp_tournament_decision() from public,anon,authenticated;
create trigger tournament_timestamp_decision before insert or update of winner_id
on public.tournament_matches for each row execute function public.gb_timestamp_tournament_decision();

create table public.community_rank_moments (
  team_id uuid not null,
  match_id uuid not null,
  previous_place bigint not null,
  current_place bigint not null,
  recorded_at timestamptz not null default now(),
  primary key(team_id,match_id)
);
alter table public.community_rank_moments enable row level security;
revoke all on public.community_rank_moments from public,anon,authenticated;

create function public.gb_capture_rank_moment()
returns trigger language plpgsql security definer set search_path=public,pg_temp
as $$
begin
  if new.previous_place > new.current_place then
    insert into public.community_rank_moments values(
      new.team_id,new.match_id,new.previous_place,new.current_place,new.recorded_at)
    on conflict(team_id,match_id) do update set previous_place=excluded.previous_place,
      current_place=excluded.current_place,recorded_at=excluded.recorded_at;
  else
    delete from public.community_rank_moments where team_id=new.team_id and match_id=new.match_id;
  end if;
  return new;
end;
$$;
revoke all on function public.gb_capture_rank_moment() from public,anon,authenticated;
create trigger team_capture_rank_moment after insert or update on public.team_match_rank_movement
for each row execute function public.gb_capture_rank_moment();
insert into public.community_rank_moments
  select team_id,match_id,previous_place,current_place,recorded_at
  from public.team_match_rank_movement where previous_place>current_place;

create view public.gb_community_moments as
with settled as (
  select * from public.matches where finalized and status='completed' and completed_at is not null
    and winning_team_id is not null and losing_team_id is not null
), activity as (
  select 'match:' || m.id::text as id,'match'::text as kind,
    coalesce(w.name,'A team') || ' defeated ' || coalesce(l.name,'a team') || ' in ' || public.gb_pretty(m.game) as txt,
    '/matches/' || m.id::text as href,m.completed_at as at,m.winning_team_id as team_id,
    (m.winning_user_ids)[1] as user_id,coalesce(m.winning_user_ids,'{}'::uuid[]) as user_ids
  from settled m left join public.teams w on w.id=m.winning_team_id left join public.teams l on l.id=m.losing_team_id
  union all
  select 'team:' || t.id::text,'team','New team ' || t.name || ' entered ' || public.gb_pretty(t.game),
    '/teams/' || t.id::text,t.created_at,t.id,t.owner_id,
    case when t.owner_id is null then '{}'::uuid[] else array[t.owner_id] end
  from public.teams t
  union all
  select 'award:' || ua.id::text,'award',
    coalesce(t.name,p.username,'A player') || ' earned ' || catalog.name,
    case when t.id is not null then '/teams/' || t.id::text
      when p.id is not null then '/profile/awards?userId=' || p.id::text else '/awards' end,
    ua.granted_at,ua.recipient_team_id,ua.recipient_id,
    case when ua.recipient_id is null then '{}'::uuid[] else array[ua.recipient_id] end
  from public.staff_user_awards ua join public.staff_award_catalog catalog on catalog.id=ua.award_id
  left join public.profiles p on p.id=ua.recipient_id left join public.teams t on t.id=ua.recipient_team_id
  where ua.revoked_at is null and (ua.recipient_team_id is not null or coalesce(p.show_public_awards,true))
  union all
  select 'friend:' || f.id::text,'friend',a.username || ' and ' || b.username || ' are now friends',
    '/profile/' || a.id::text,coalesce(f.responded_at,f.created_at),null::uuid,a.id,array[a.id,b.id]
  from public.friend_requests f join public.profiles a on a.id=f.requester_id join public.profiles b on b.id=f.recipient_id
  where f.status='accepted' and a.friends_public and b.friends_public
    and coalesce(a.show_public_friends,true) and coalesce(b.show_public_friends,true)
  union all
  select 'climb:' || r.team_id::text || ':' || r.match_id::text,'rank',
    team.name || ' climbed from #' || r.previous_place::text || ' to #' || r.current_place::text ||
      ' in ' || public.gb_pretty(m.game) || ' / ' || public.gb_pretty(m.ladder),
    '/teams/' || team.id::text,r.recorded_at,team.id,(m.winning_user_ids)[1],coalesce(m.winning_user_ids,'{}')
  from public.community_rank_moments r join settled m on m.id=r.match_id and m.winning_team_id=r.team_id
    join public.teams team on team.id=r.team_id
  where r.previous_place>r.current_place
  union all
  select 'rival:' || m.id::text,'rival',
    coalesce(w.name,'A team') || ' won the rematch against ' || coalesce(l.name,'a team') ||
      ' after losing their previous meeting',
    '/matches/' || m.id::text,m.completed_at,m.winning_team_id,(m.winning_user_ids)[1],
    coalesce(m.winning_user_ids,'{}')
  from settled m left join public.teams w on w.id=m.winning_team_id left join public.teams l on l.id=m.losing_team_id
  join lateral (
    select earlier.winning_team_id from settled earlier
    where (earlier.completed_at,earlier.id)<(m.completed_at,m.id)
      and ((earlier.winning_team_id=m.winning_team_id and earlier.losing_team_id=m.losing_team_id)
        or (earlier.winning_team_id=m.losing_team_id and earlier.losing_team_id=m.winning_team_id))
      and earlier.game=m.game and earlier.ladder=m.ladder
    order by earlier.completed_at desc,earlier.id desc limit 1
  ) previous on previous.winning_team_id=m.losing_team_id
  union all
  select 'tournament:' || tournament.id::text,'tournament',team.name || ' won ' || tournament.title,
    '/tournaments/' || tournament.id::text,final.created_at,team.id,null::uuid,'{}'::uuid[]
  from public.tournaments tournament join lateral (
    select final_match.winner_id,coalesce(final_match.decided_at,latest.action_at,reward.created_at) as created_at
    from public.tournament_matches final_match
    left join public.competition_rewards reward on reward.tournament_id=tournament.id and reward.reward_type='weekly_cup'
    left join lateral (
      select max(created_at) as action_at from public.staff_activity_log
      where action='tournament_match_decided' and target_id=final_match.id::text
        and new_values->>'winner'=final_match.winner_id::text
    ) latest on true
    where final_match.tournament_id=tournament.id
      and final_match.round=(select max(round) from public.tournament_matches where tournament_id=tournament.id)
      and final_match.winner_id is not null
      and (select count(*) from public.tournament_matches where tournament_id=tournament.id and round=final_match.round)=1
    limit 1
  ) final on true join public.teams team on team.id=final.winner_id
  where tournament.status='completed' and final.created_at is not null
  union all
  select 'season:' || honour.id::text,'season',
    honour.name || ' earned ' || case honour.honour when 'champion' then 'Season Champion'
      when 'top10' then 'Season Top 10' when 'undefeated' then 'Perfect Season Relic'
      when 'iron_competitor' then 'Iron Competitor Crest' else 'Three-Time Dynasty Seal' end ||
      ' in ' || season.name || ' (' || honour.scope_label || ')',
    '/champions?season=' || season.id::text,honour.awarded_at,
    case when honour.kind='teams' then honour.entity_id end,
    case when honour.kind='players' then honour.entity_id end,
    case when honour.kind='players' then array[honour.entity_id] else '{}'::uuid[] end
  from public.season_honours honour join public.seasons season on season.id=honour.season_id
  left join public.profiles profile on honour.kind='players' and profile.id=honour.entity_id
  where honour.revoked_at is null and (honour.kind='teams' or coalesce(profile.show_public_awards,true))
)
select * from activity;
revoke all on public.gb_community_moments from public,anon,authenticated;

create or replace function public.gb_recent_activity(p_limit integer default 12,p_following_only boolean default false)
returns setof jsonb language sql stable security definer set search_path=public,pg_temp
as $$
  select jsonb_build_object('id',a.id,'kind',a.kind,'text',a.txt,'href',a.href,'at',a.at,
    'team_id',a.team_id,'user_id',a.user_id,'user_ids',a.user_ids,
    'favorited',exists(select 1 from public.community_activity_favorites f where f.user_id=auth.uid() and f.activity_id=a.id))
  from public.gb_community_moments a
  where a.at>=now()-interval '48 hours'
    and (not coalesce(p_following_only,false) or exists (
      select 1 from public.community_follows f where f.follower_id=auth.uid()
        and ((f.target_type='team' and f.target_id=a.team_id::text)
          or (f.target_type='player' and f.target_id::uuid=any(a.user_ids)))
    ))
  order by a.at desc,a.id limit greatest(1,least(coalesce(p_limit,12),50));
$$;

create or replace function public.gb_toggle_activity_reaction(p_activity_id text,p_reaction text)
returns boolean language plpgsql security definer set search_path=public,pg_temp
as $$
begin
  if auth.uid() is null then raise exception 'Sign in to react to community activity'; end if;
  if coalesce(p_reaction,'') not in ('gg','fire','heart') or not exists(
    select 1 from public.gb_community_moments where id=p_activity_id
  ) then raise exception 'Choose an available activity item and reaction'; end if;
  delete from public.community_activity_reactions
    where activity_id=p_activity_id and user_id=auth.uid() and reaction=p_reaction;
  if found then return false; end if;
  insert into public.community_activity_reactions(activity_id,user_id,reaction)
    values(p_activity_id,auth.uid(),p_reaction);
  return true;
end;
$$;

create or replace function public.gb_user_activity_favorites()
returns setof jsonb language sql stable security definer set search_path=public,pg_temp
as $$
  select jsonb_build_object('id',a.id,'kind',a.kind,'text',a.txt,'href',a.href,'at',a.at,
    'team_id',a.team_id,'user_id',a.user_id,'user_ids',a.user_ids,'favorited',true)
  from public.community_activity_favorites f join public.gb_community_moments a on a.id=f.activity_id
  where f.user_id=auth.uid() order by f.created_at desc;
$$;

notify pgrst,'reload schema';
