alter table public.profiles
  add column if not exists friends_public boolean not null default true;

create table if not exists public.private_top_friends (
  user_id uuid primary key references public.profiles(id) on delete cascade deferrable initially deferred,
  friend_ids text[] not null default '{}'
);
alter table public.private_top_friends enable row level security;
revoke all on public.private_top_friends from public, anon, authenticated;
grant select on public.private_top_friends to authenticated;
create policy "Users can view own private top friends"
  on public.private_top_friends for select to authenticated
  using (user_id = (select auth.uid()));

create or replace function public.gb_guard_top_friends_privacy()
returns trigger language plpgsql security definer
set search_path = public, pg_temp
as $$
begin
  if not new.friends_public then
    if new.display_friends is not null then
      insert into public.private_top_friends (user_id, friend_ids)
      values (new.id, new.display_friends)
      on conflict (user_id) do update set friend_ids = excluded.friend_ids;
    end if;
    new.display_friends := null;
  elsif tg_op = 'UPDATE' and not old.friends_public and new.display_friends is null then
    select friend_ids into new.display_friends
    from public.private_top_friends where user_id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_top_friends_privacy on public.profiles;
create trigger profiles_guard_top_friends_privacy
  before insert or update on public.profiles
  for each row execute function public.gb_guard_top_friends_privacy();

create or replace function public.gb_profile_friends(p_user uuid)
returns jsonb language plpgsql stable security definer
set search_path = public, pg_temp
as $$
declare
  v_profile public.profiles%rowtype;
  v_top text[];
  v_friends jsonb;
begin
  select * into v_profile from public.profiles where id = p_user;
  if not found then
    return null;
  end if;
  if not v_profile.friends_public and auth.uid() is distinct from p_user then
    return jsonb_build_object('username', v_profile.username, 'private', true);
  end if;

  if v_profile.friends_public then
    v_top := v_profile.display_friends;
  else
    select friend_ids into v_top from public.private_top_friends where user_id = p_user;
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', p.id, 'username', p.username, 'avatar_url', p.avatar_url
  ) order by lower(coalesce(p.username, '')), p.id), '[]'::jsonb)
  into v_friends
  from public.profiles p
  where p.id in (
    select case when f.requester_id = p_user then f.recipient_id else f.requester_id end
    from public.friend_requests f
    where f.status = 'accepted' and (f.requester_id = p_user or f.recipient_id = p_user)
  );
  return jsonb_build_object('username', v_profile.username, 'private', false, 'friends', v_friends, 'top_ids', v_top);
end;
$$;
revoke all on function public.gb_profile_friends(uuid) from public;
grant execute on function public.gb_profile_friends(uuid) to anon, authenticated;

with site_updates as (
  select id from public.forum_posts
  where author = 'Prime' and category = 'News & Updates' and pinned and not hidden
    and subject ilike '%Site Updates%'
  order by created_at desc limit 1
)
update public.forum_posts as post
set message = concat_ws(E'\n\n', nullif(trim(post.message), ''),
  'Friends pages have a fresh look, and you can now choose whether other players can see your friends list in profile privacy settings.')
from site_updates
where post.id = site_updates.id
  and coalesce(post.message, '') not like '%Friends pages have a fresh look%';
