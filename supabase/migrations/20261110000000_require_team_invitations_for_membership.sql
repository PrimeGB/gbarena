drop policy if exists "Users can create their own team member row" on public.team_members;

create policy "Invited users can join teams"
on public.team_members
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and role = 'member'
  and exists (
    select 1
    from public.team_invites invite
    where invite.team_id = team_members.team_id
      and invite.user_id = (select auth.uid())
      and invite.status = 'pending'
  )
);

create or replace function public.gb_protect_team_invite_identity()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is not null and (
    new.id is distinct from old.id
    or new.team_id is distinct from old.team_id
    or new.user_id is distinct from old.user_id
    or new.created_at is distinct from old.created_at
  ) then
    raise exception 'An invitation cannot be transferred or changed.';
  end if;
  return new;
end;
$$;

create trigger team_invites_protect_identity
before update on public.team_invites
for each row execute function public.gb_protect_team_invite_identity();

with site_updates as (
  select id from public.forum_posts
  where author = 'Prime' and category = 'News & Updates' and pinned and not hidden
    and subject ilike '%Site Updates%'
  order by created_at desc limit 1
)
update public.forum_posts as post
set message = concat_ws(E'\n\n', nullif(trim(post.message), ''),
  'Team membership and stream access now have stronger invitation safeguards.')
from site_updates
where post.id = site_updates.id
  and coalesce(post.message, '') not like '%Team membership and stream access now have stronger invitation safeguards%';
