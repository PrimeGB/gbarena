begin;

alter table public.profiles add column profile_status_private boolean not null default false;
grant select (profile_status_private) on public.profiles to anon, authenticated;

create or replace function public.gb_gaming_account_id(
  p_user_id uuid, p_platform text, p_category text, p_game text
)
returns text language sql stable
set search_path = public, pg_temp
as $$
  select coalesce(
    case lower(coalesce(p_platform, ''))
      when 'xbox' then coalesce(nullif(trim(profile.gt_xbox), ''), nullif(trim(profile.xbox_gt), ''))
      when 'playstation' then coalesce(nullif(trim(profile.gt_playstation), ''), nullif(trim(profile.psn_gt), ''))
      when 'nintendo' then coalesce(nullif(trim(profile.gt_nintendo), ''), nullif(trim(profile.nintendo_gt), ''))
      when 'pc' then coalesce(nullif(trim(profile.gt_pc), ''), nullif(trim(profile.pc_gt), ''))
      else null
    end,
    (select nullif(trim(account.account_id), '')
     from public.gaming_accounts account
     where account.user_id = p_user_id and account.platform = p_platform
       and account.category = p_category and account.game = p_game
     order by account.updated_at desc, account.created_at desc limit 1)
  )
  from public.profiles profile where profile.id = p_user_id;
$$;

create table public.profile_linked_ids (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  service text not null check (length(trim(service)) between 1 and 32),
  account_id text not null check (length(trim(account_id)) between 1 and 80),
  created_at timestamptz not null default now()
);
alter table public.profile_linked_ids enable row level security;
revoke all on public.profile_linked_ids from public, anon, authenticated;
grant select on public.profile_linked_ids to anon, authenticated;
grant insert, update, delete on public.profile_linked_ids to authenticated;
create policy "Linked profile IDs are public" on public.profile_linked_ids
  for select to anon, authenticated using (true);
create policy "Players manage their linked profile IDs" on public.profile_linked_ids
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create table public.profile_list_visibility (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  awards boolean not null default true,
  friends boolean not null default true,
  teams boolean not null default true
);

alter table public.profile_list_visibility enable row level security;
revoke all on public.profile_list_visibility from public, anon, authenticated;
grant select on public.profile_list_visibility to anon, authenticated;
create policy "Profile list visibility is public"
  on public.profile_list_visibility for select to anon, authenticated using (true);

create function public.gb_set_profile_list_visibility(p_list text, p_public boolean)
returns void
language plpgsql security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then raise exception 'Sign in to change profile visibility'; end if;
  if p_list is null or p_list not in ('awards', 'friends', 'teams') or p_public is null then
    raise exception 'Invalid profile list visibility';
  end if;
  insert into public.profile_list_visibility (user_id, awards, friends, teams)
  values (auth.uid(),
    case when p_list = 'awards' then p_public else true end,
    case when p_list = 'friends' then p_public else true end,
    case when p_list = 'teams' then p_public else true end)
  on conflict (user_id) do update set
    awards = case when p_list = 'awards' then p_public else profile_list_visibility.awards end,
    friends = case when p_list = 'friends' then p_public else profile_list_visibility.friends end,
    teams = case when p_list = 'teams' then p_public else profile_list_visibility.teams end;
end;
$$;
revoke all on function public.gb_set_profile_list_visibility(text, boolean) from public, anon;
grant execute on function public.gb_set_profile_list_visibility(text, boolean) to authenticated;

create table public.special_profile_access (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  granted_by uuid not null references public.profiles(id),
  granted_at timestamptz not null default now()
);
alter table public.special_profile_access enable row level security;
revoke all on public.special_profile_access from public, anon, authenticated;

create function public.gb_my_special_profile_access()
returns boolean
language plpgsql stable security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then raise exception 'Sign in to view special profile access'; end if;
  return exists (select 1 from public.profiles where id = auth.uid() and role = 'owner')
    or exists (select 1 from public.special_profile_access where user_id = auth.uid());
end;
$$;
revoke all on function public.gb_my_special_profile_access() from public, anon;
grant execute on function public.gb_my_special_profile_access() to authenticated;

create function public.gb_founder_set_special_profile_access(p_username text, p_unlocked boolean)
returns text
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  v_founder uuid;
  v_target uuid;
  v_username text;
begin
  v_founder := public.gb_require_founder();
  if p_unlocked is null or nullif(trim(p_username), '') is null then
    raise exception 'Choose a player and access status';
  end if;
  select id, username into v_target, v_username
  from public.profiles where lower(username) = lower(trim(p_username));
  if v_target is null then raise exception 'Player not found'; end if;
  if not p_unlocked and exists (select 1 from public.profiles where id = v_target and role = 'owner') then
    raise exception 'Founder access cannot be locked';
  end if;
  if p_unlocked then
    insert into public.special_profile_access (user_id, granted_by)
    values (v_target, v_founder)
    on conflict (user_id) do update set granted_by = excluded.granted_by, granted_at = now();
  else
    delete from public.special_profile_access where user_id = v_target;
  end if;
  return v_username;
end;
$$;
revoke all on function public.gb_founder_set_special_profile_access(text, boolean) from public, anon;
grant execute on function public.gb_founder_set_special_profile_access(text, boolean) to authenticated;

with site_updates as (
  select id from public.forum_posts
  where author = 'Prime' and category = 'News & Updates' and pinned and not hidden
    and subject ilike '%Site Updates%'
  order by created_at desc limit 1
)
update public.forum_posts as post
set message = concat_ws(E'\n\n', nullif(trim(post.message), ''),
  'Profile editing has a fresh look, with new controls for who can open your full awards, friends and teams lists. Featured items can still be shown on your profile. Special profile access can now be unlocked by a Founder, with more customization coming later.')
from site_updates
where post.id = site_updates.id
  and coalesce(post.message, '') not like '%Profile editing has a fresh look%';

commit;
