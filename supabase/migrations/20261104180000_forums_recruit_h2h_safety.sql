-- Forums
create table if not exists public.forum_posts (
  id bigserial primary key,
  subject text not null,
  message text,
  system text,
  game text,
  ladder text,
  type text,
  category text,
  author text,
  user_id uuid default auth.uid() references auth.users(id) on delete set null,
  replies integer not null default 0,
  views integer not null default 0,
  pinned boolean not null default false,
  locked boolean not null default false,
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.forum_replies (
  id bigserial primary key,
  post_id bigint not null references public.forum_posts(id) on delete cascade,
  author text,
  user_id uuid default auth.uid() references auth.users(id) on delete set null,
  message text not null,
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.forum_reports (
  id bigserial primary key,
  target_type text not null check (target_type in ('post', 'reply')),
  target_id bigint not null,
  reporter_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  reason text not null,
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_forum_posts_created on public.forum_posts (created_at desc);
create index if not exists idx_forum_replies_post on public.forum_replies (post_id);

create or replace function public.gb_forum_before_insert()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  new.user_id := auth.uid();
  new.author := coalesce((select username from public.profiles where id = auth.uid()), 'Player');
  if tg_table_name = 'forum_posts' then
    new.replies := 0;
    new.views := 0;
    new.pinned := false;
    new.locked := false;
    new.hidden := false;
  else
    new.hidden := false;
    if exists (select 1 from public.forum_posts where id = new.post_id and (locked or hidden)) then
      raise exception 'This thread is locked.';
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.gb_forum_reply_count()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'INSERT' then
    update public.forum_posts set replies = replies + 1 where id = new.post_id;
  elsif tg_op = 'DELETE' then
    update public.forum_posts set replies = greatest(replies - 1, 0) where id = old.post_id;
  end if;
  return null;
end;
$$;

create or replace function public.gb_forum_view(p_post bigint)
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  update public.forum_posts set views = views + 1 where id = p_post and not hidden;
$$;
grant execute on function public.gb_forum_view(bigint) to anon, authenticated;

drop trigger if exists forum_posts_before_insert on public.forum_posts;
create trigger forum_posts_before_insert before insert on public.forum_posts
  for each row execute function public.gb_forum_before_insert();
drop trigger if exists forum_replies_before_insert on public.forum_replies;
create trigger forum_replies_before_insert before insert on public.forum_replies
  for each row execute function public.gb_forum_before_insert();
drop trigger if exists forum_replies_count on public.forum_replies;
create trigger forum_replies_count after insert or delete on public.forum_replies
  for each row execute function public.gb_forum_reply_count();

drop trigger if exists forum_posts_rate_limit on public.forum_posts;
create trigger forum_posts_rate_limit before insert on public.forum_posts
  for each row execute function public.gb_rate_limit_trigger('forum_post', 3, 600, 'user_id');
drop trigger if exists forum_replies_rate_limit on public.forum_replies;
create trigger forum_replies_rate_limit before insert on public.forum_replies
  for each row execute function public.gb_rate_limit_trigger('forum_reply', 10, 300, 'user_id');

drop trigger if exists forum_posts_block_muted on public.forum_posts;
create trigger forum_posts_block_muted before insert on public.forum_posts
  for each row execute function public.gb_block_muted_content();
drop trigger if exists forum_replies_block_muted on public.forum_replies;
create trigger forum_replies_block_muted before insert on public.forum_replies
  for each row execute function public.gb_block_muted_content();

alter table public.forum_posts enable row level security;
alter table public.forum_replies enable row level security;
alter table public.forum_reports enable row level security;

drop policy if exists forum_posts_read on public.forum_posts;
create policy forum_posts_read on public.forum_posts for select
  using (not hidden or user_id = auth.uid() or public.has_staff_permission('basic_moderation'));
drop policy if exists forum_posts_insert on public.forum_posts;
create policy forum_posts_insert on public.forum_posts for insert to authenticated
  with check (auth.uid() is not null);
drop policy if exists forum_posts_staff_update on public.forum_posts;
create policy forum_posts_staff_update on public.forum_posts for update to authenticated
  using (public.has_staff_permission('basic_moderation'))
  with check (public.has_staff_permission('basic_moderation'));
drop policy if exists forum_posts_delete on public.forum_posts;
create policy forum_posts_delete on public.forum_posts for delete to authenticated
  using (user_id = auth.uid() or public.has_staff_permission('basic_moderation'));

drop policy if exists forum_replies_read on public.forum_replies;
create policy forum_replies_read on public.forum_replies for select
  using (not hidden or user_id = auth.uid() or public.has_staff_permission('basic_moderation'));
drop policy if exists forum_replies_insert on public.forum_replies;
create policy forum_replies_insert on public.forum_replies for insert to authenticated
  with check (auth.uid() is not null);
drop policy if exists forum_replies_staff_update on public.forum_replies;
create policy forum_replies_staff_update on public.forum_replies for update to authenticated
  using (public.has_staff_permission('basic_moderation'))
  with check (public.has_staff_permission('basic_moderation'));
drop policy if exists forum_replies_delete on public.forum_replies;
create policy forum_replies_delete on public.forum_replies for delete to authenticated
  using (user_id = auth.uid() or public.has_staff_permission('basic_moderation'));

drop policy if exists forum_reports_insert on public.forum_reports;
create policy forum_reports_insert on public.forum_reports for insert to authenticated
  with check (reporter_id = auth.uid());
drop policy if exists forum_reports_staff on public.forum_reports;
create policy forum_reports_staff on public.forum_reports for select to authenticated
  using (public.has_staff_permission('basic_moderation'));
drop policy if exists forum_reports_staff_update on public.forum_reports;
create policy forum_reports_staff_update on public.forum_reports for update to authenticated
  using (public.has_staff_permission('basic_moderation'));

grant select on public.forum_posts, public.forum_replies to anon, authenticated;
grant insert, delete on public.forum_posts, public.forum_replies to authenticated;
grant update (pinned, locked, hidden) on public.forum_posts to authenticated;
grant update (hidden) on public.forum_replies to authenticated;
grant insert, select, update on public.forum_reports to authenticated;
grant usage on all sequences in schema public to authenticated;

-- Recruitment board
create table if not exists public.recruit_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  author text,
  kind text not null check (kind in ('lft', 'lfp')),
  team_id uuid references public.teams(id) on delete set null,
  game text,
  platform text,
  ladder text,
  message text not null check (char_length(message) between 5 and 600),
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists recruit_posts_created on public.recruit_posts (created_at desc);

create or replace function public.gb_recruit_before_insert()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  new.user_id := auth.uid();
  new.hidden := false;
  new.author := coalesce((select username from public.profiles where id = auth.uid()), 'Player');
  if new.kind = 'lfp' then
    if not exists (select 1 from public.teams where id = new.team_id and owner_id = auth.uid())
       and not exists (select 1 from public.team_members where team_id = new.team_id and user_id = auth.uid()) then
      raise exception 'You can only recruit for a team you belong to.';
    end if;
  else
    new.team_id := null;
  end if;
  return new;
end;
$$;

drop trigger if exists recruit_posts_before_insert on public.recruit_posts;
create trigger recruit_posts_before_insert before insert on public.recruit_posts
  for each row execute function public.gb_recruit_before_insert();
drop trigger if exists recruit_posts_rate_limit on public.recruit_posts;
create trigger recruit_posts_rate_limit before insert on public.recruit_posts
  for each row execute function public.gb_rate_limit_trigger('recruit_post', 3, 3600, 'user_id');
drop trigger if exists recruit_posts_block_muted on public.recruit_posts;
create trigger recruit_posts_block_muted before insert on public.recruit_posts
  for each row execute function public.gb_block_muted_content();

alter table public.recruit_posts enable row level security;
drop policy if exists recruit_read on public.recruit_posts;
create policy recruit_read on public.recruit_posts for select
  using (not hidden or user_id = auth.uid() or public.has_staff_permission('basic_moderation'));
drop policy if exists recruit_insert on public.recruit_posts;
create policy recruit_insert on public.recruit_posts for insert to authenticated with check (auth.uid() is not null);
drop policy if exists recruit_delete on public.recruit_posts;
create policy recruit_delete on public.recruit_posts for delete to authenticated
  using (user_id = auth.uid() or public.has_staff_permission('basic_moderation'));
grant select on public.recruit_posts to anon, authenticated;
grant insert, delete on public.recruit_posts to authenticated;

-- Head to head
create or replace function public.gb_head_to_head(p_team_a uuid, p_team_b uuid)
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'a_wins', count(*) filter (where winning_team_id = p_team_a),
    'b_wins', count(*) filter (where winning_team_id = p_team_b),
    'total', count(*)
  )
  from public.matches
  where winning_team_id is not null
    and ((posting_team_id = p_team_a and accepting_team_id = p_team_b)
      or (posting_team_id = p_team_b and accepting_team_id = p_team_a));
$$;
grant execute on function public.gb_head_to_head(uuid, uuid) to anon, authenticated;

-- Proof uploads for score reports
insert into storage.buckets (id, name, public)
values ('match-proofs', 'match-proofs', true)
on conflict (id) do nothing;

drop policy if exists match_proofs_upload on storage.objects;
create policy match_proofs_upload on storage.objects for insert to authenticated
  with check (bucket_id = 'match-proofs' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists match_proofs_read on storage.objects;
create policy match_proofs_read on storage.objects for select using (bucket_id = 'match-proofs');

-- Auto-confirm scores nobody answered within 48 hours
create or replace function public.gb_auto_confirm_stale_scores()
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  r record;
  v_owner uuid;
  v_count integer := 0;
begin
  for r in
    select id, confirmation_team_id from public.matches
    where status = 'awaiting_confirmation'
      and reporting_status = 'awaiting_confirmation'
      and score_reported_at < now() - interval '48 hours'
  loop
    select owner_id into v_owner from public.teams where id = r.confirmation_team_id;
    if v_owner is not null then
      begin
        perform public.confirm_match_and_apply(r.id, v_owner);
        v_count := v_count + 1;
      exception when others then
        null;
      end;
    end if;
  end loop;
  return v_count;
end;
$$;
revoke all on function public.gb_auto_confirm_stale_scores() from public, anon, authenticated;

-- Account safety
create or replace function public.export_my_data()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Not signed in';
  end if;
  return jsonb_build_object(
    'exported_at', now(),
    'profile', (select to_jsonb(p) from public.profiles p where p.id = v_uid),
    'gaming_accounts', coalesce((select jsonb_agg(to_jsonb(g)) from public.gaming_accounts g where g.user_id = v_uid), '[]'::jsonb),
    'teams_owned', coalesce((select jsonb_agg(to_jsonb(t)) from public.teams t where t.owner_id = v_uid), '[]'::jsonb),
    'team_memberships', coalesce((select jsonb_agg(to_jsonb(m)) from public.team_members m where m.user_id = v_uid), '[]'::jsonb),
    'messages_received', coalesce((select jsonb_agg(to_jsonb(x)) from public.messages x where x.recipient_id = v_uid), '[]'::jsonb),
    'friend_requests', coalesce((select jsonb_agg(to_jsonb(f)) from public.friend_requests f where f.requester_id = v_uid or f.recipient_id = v_uid), '[]'::jsonb),
    'forum_posts', coalesce((select jsonb_agg(to_jsonb(fp)) from public.forum_posts fp where fp.user_id = v_uid), '[]'::jsonb)
  );
end;
$$;
grant execute on function public.export_my_data() to authenticated;

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Not signed in';
  end if;
  if exists (select 1 from public.teams where owner_id = v_uid) then
    raise exception 'Transfer or delete your teams before deleting your account.';
  end if;
  delete from auth.users where id = v_uid;
end;
$$;
grant execute on function public.delete_my_account() to authenticated;

create extension if not exists pg_cron;
select cron.schedule('gb-auto-confirm', '*/30 * * * *', 'select public.gb_auto_confirm_stale_scores()');

notify pgrst, 'reload schema';
