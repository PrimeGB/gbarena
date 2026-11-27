-- Account suspension: staff can suspend/unsuspend a user. Suspended users are
-- blocked from creating new content (forum posts, recruit posts, tournament
-- registrations) until reinstated.

alter table public.profiles add column if not exists suspended boolean not null default false;
alter table public.profiles add column if not exists suspended_at timestamptz;
alter table public.profiles add column if not exists suspension_reason text;

create or replace function public.staff_set_user_suspended(p_user uuid, p_suspended boolean, p_reason text default null)
returns void language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  if not (public.has_staff_permission('team_enforcement') or public.has_staff_permission('staff_access')) then
    raise exception 'Staff access required.';
  end if;
  if p_user = auth.uid() then
    raise exception 'You cannot suspend your own account.';
  end if;
  update public.profiles
    set suspended = p_suspended,
        suspended_at = case when p_suspended then now() else null end,
        suspension_reason = case when p_suspended then nullif(trim(coalesce(p_reason, '')), '') else null end
  where id = p_user;
  if not found then raise exception 'User not found.'; end if;
  insert into public.staff_activity_log(actor_id, action, target_type, target_id, reason)
    values (auth.uid(), case when p_suspended then 'user_suspended' else 'user_unsuspended' end,
      'profile', p_user::text, coalesce(nullif(trim(coalesce(p_reason, '')), ''), 'No reason provided'));
end;
$$;
revoke all on function public.staff_set_user_suspended(uuid, boolean, text) from public, anon;
grant execute on function public.staff_set_user_suspended(uuid, boolean, text) to authenticated;

create or replace function public.gb_block_if_suspended()
returns trigger language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  if auth.uid() is not null and exists (
    select 1 from public.profiles where id = auth.uid() and suspended
  ) then
    raise exception 'Your account is suspended and cannot create new content. Contact staff to appeal.';
  end if;
  if tg_op = 'DELETE' then return old; else return new; end if;
end;
$$;
revoke all on function public.gb_block_if_suspended() from public, anon, authenticated;

drop trigger if exists guard_suspended_forum_posts on public.forum_posts;
create trigger guard_suspended_forum_posts before insert or update on public.forum_posts
  for each row execute function public.gb_block_if_suspended();

drop trigger if exists guard_suspended_recruit_posts on public.recruit_posts;
create trigger guard_suspended_recruit_posts before insert or update on public.recruit_posts
  for each row execute function public.gb_block_if_suspended();

drop trigger if exists guard_suspended_tournament_reg on public.tournament_registrations;
create trigger guard_suspended_tournament_reg before insert on public.tournament_registrations
  for each row execute function public.gb_block_if_suspended();

notify pgrst, 'reload schema';