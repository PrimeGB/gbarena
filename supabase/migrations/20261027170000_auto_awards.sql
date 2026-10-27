-- Automatic awards: granted by the database when a player reaches a milestone.

alter table public.staff_award_catalog add column if not exists auto_award boolean not null default false;

insert into public.staff_award_catalog (name, award_group, purpose, exclusive, auto_award) values
  ('First Team Founded Badge', 'Milestones', 'Awarded automatically when you create your first team.', false, true),
  ('First Roster Spot Badge', 'Milestones', 'Awarded automatically when you join a team roster for the first time.', false, true),
  ('First Gamertag Linked Badge', 'Milestones', 'Awarded automatically when you link your first gaming ID.', false, true),
  ('Multi-Platform Linker Badge', 'Milestones', 'Awarded automatically when you link gaming IDs on three different platforms.', false, true),
  ('Profile Complete Badge', 'Milestones', 'Awarded automatically when your profile has an avatar, bio and location.', false, true),
  ('First Match Played Badge', 'Milestones', 'Awarded automatically after you complete your first official match.', false, true)
on conflict (name) do update set auto_award = true;

update public.staff_award_catalog set auto_award = true
where name in ('First Win Badge', '10 Wins Badge', '50 Wins Badge', '100 Wins Badge', '500 Wins Badge', '1000 Wins Badge');

create or replace function public.staff_public_award_catalog()
returns setof jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'name', catalog.name,
    'award_group', catalog.award_group,
    'purpose', catalog.purpose,
    'auto', catalog.auto_award
  )
  from public.staff_award_catalog catalog
  order by catalog.award_group, catalog.name;
$$;

-- An award is only ever auto-granted once per player, even if staff later revoke it.
create or replace function public.gb_grant_auto_award(p_user uuid, p_award text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_award bigint;
begin
  if p_user is null or not exists (select 1 from public.profiles where id = p_user) then
    return;
  end if;

  select id into v_award from public.staff_award_catalog where name = p_award;
  if v_award is null then
    return;
  end if;

  if exists (
    select 1 from public.staff_user_awards where award_id = v_award and recipient_id = p_user
  ) then
    return;
  end if;

  insert into public.staff_user_awards (award_id, recipient_id, granted_by, reason)
  values (v_award, p_user, p_user, 'Awarded automatically: ' || p_award);
end;
$$;

revoke all on function public.gb_grant_auto_award(uuid, text) from public, anon, authenticated;

create or replace function public.gb_auto_award_team_created()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.gb_grant_auto_award(new.owner_id, 'First Team Founded Badge');
  return new;
end;
$$;

drop trigger if exists teams_auto_award on public.teams;
create trigger teams_auto_award
  after insert on public.teams
  for each row execute function public.gb_auto_award_team_created();

create or replace function public.gb_auto_award_roster_join()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.gb_grant_auto_award(new.user_id, 'First Roster Spot Badge');
  return new;
end;
$$;

drop trigger if exists team_members_auto_award on public.team_members;
create trigger team_members_auto_award
  after insert on public.team_members
  for each row execute function public.gb_auto_award_roster_join();

create or replace function public.gb_auto_award_gamertag()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.gb_grant_auto_award(new.user_id, 'First Gamertag Linked Badge');
  if (select count(distinct platform) from public.gaming_accounts where user_id = new.user_id) >= 3 then
    perform public.gb_grant_auto_award(new.user_id, 'Multi-Platform Linker Badge');
  end if;
  return new;
end;
$$;

drop trigger if exists gaming_accounts_auto_award on public.gaming_accounts;
create trigger gaming_accounts_auto_award
  after insert on public.gaming_accounts
  for each row execute function public.gb_auto_award_gamertag();

create or replace function public.gb_auto_award_profile()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_wins integer := coalesce(new.wins, 0);
  v_t record;
begin
  if coalesce(trim(new.avatar_url), '') <> ''
     and coalesce(trim(new.player_bio), '') <> ''
     and coalesce(trim(new.location), '') <> '' then
    perform public.gb_grant_auto_award(new.id, 'Profile Complete Badge');
  end if;

  if v_wins + coalesce(new.losses, 0) >= 1 then
    perform public.gb_grant_auto_award(new.id, 'First Match Played Badge');
  end if;

  for v_t in
    select * from (values
      (1, 'First Win Badge'), (10, '10 Wins Badge'), (50, '50 Wins Badge'),
      (100, '100 Wins Badge'), (500, '500 Wins Badge'), (1000, '1000 Wins Badge')
    ) as t(need, award)
  loop
    if v_wins >= v_t.need then
      perform public.gb_grant_auto_award(new.id, v_t.award);
    end if;
  end loop;

  return new;
end;
$$;

drop trigger if exists profiles_auto_award on public.profiles;
create trigger profiles_auto_award
  after update on public.profiles
  for each row execute function public.gb_auto_award_profile();

-- Backfill for everyone who already qualifies.
select public.gb_grant_auto_award(t.owner_id, 'First Team Founded Badge')
from (select distinct owner_id from public.teams where owner_id is not null) t;

select public.gb_grant_auto_award(m.user_id, 'First Roster Spot Badge')
from (select distinct user_id from public.team_members) m;

select public.gb_grant_auto_award(g.user_id, 'First Gamertag Linked Badge')
from (select distinct user_id from public.gaming_accounts) g;

select public.gb_grant_auto_award(g.user_id, 'Multi-Platform Linker Badge')
from (select user_id from public.gaming_accounts group by user_id having count(distinct platform) >= 3) g;

select public.gb_grant_auto_award(p.id, 'Profile Complete Badge')
from public.profiles p
where coalesce(trim(p.avatar_url), '') <> '' and coalesce(trim(p.player_bio), '') <> '' and coalesce(trim(p.location), '') <> '';

select public.gb_grant_auto_award(p.id, 'First Match Played Badge')
from public.profiles p where coalesce(p.wins, 0) + coalesce(p.losses, 0) >= 1;

select public.gb_grant_auto_award(p.id, w.award)
from public.profiles p
join (values (1, 'First Win Badge'), (10, '10 Wins Badge'), (50, '50 Wins Badge'),
             (100, '100 Wins Badge'), (500, '500 Wins Badge'), (1000, '1000 Wins Badge')) as w(need, award)
  on coalesce(p.wins, 0) >= w.need;
