-- Moderation: mute / suspend sanctions with an audit log. Additive; existing tables are untouched.
create table if not exists public.user_sanctions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('mute', 'suspend')),
  reason text not null,
  issued_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  revoked_at timestamptz,
  revoked_by uuid references auth.users(id)
);

create index if not exists user_sanctions_user_idx on public.user_sanctions (user_id, kind);

create table if not exists public.staff_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id),
  action text not null,
  target_user uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists staff_audit_log_created_idx on public.staff_audit_log (created_at desc);

alter table public.user_sanctions enable row level security;
alter table public.staff_audit_log enable row level security;

drop policy if exists "Staff read sanctions" on public.user_sanctions;
create policy "Staff read sanctions" on public.user_sanctions
  for select to authenticated
  using (public.has_staff_permission('staff_access') or user_id = auth.uid());

drop policy if exists "Staff read audit log" on public.staff_audit_log;
create policy "Staff read audit log" on public.staff_audit_log
  for select to authenticated
  using (public.has_staff_permission('staff_access'));

create or replace function public.gb_is_sanctioned(p_user uuid, p_kind text default null)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.user_sanctions s
    where s.user_id = p_user
      and s.revoked_at is null
      and (s.expires_at is null or s.expires_at > now())
      and (
        p_kind is null
        or s.kind = p_kind
        or (p_kind = 'mute' and s.kind = 'suspend')
      )
  );
$$;

create or replace function public.staff_issue_sanction(
  p_username text,
  p_kind text,
  p_reason text,
  p_hours integer default null
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid;
  v_role text;
  v_id uuid;
begin
  if not public.has_staff_permission('staff_access') then
    raise exception 'Staff access required.';
  end if;
  if p_kind not in ('mute', 'suspend') then
    raise exception 'Invalid sanction type.';
  end if;
  if coalesce(trim(p_reason), '') = '' then
    raise exception 'A reason is required.';
  end if;

  select id, role into v_user, v_role from public.profiles where lower(username) = lower(trim(p_username));
  if v_user is null then
    raise exception 'No player found with that username.';
  end if;
  if v_user = auth.uid() then
    raise exception 'You cannot sanction yourself.';
  end if;
  if lower(coalesce(v_role, '')) in ('owner', 'admin') then
    raise exception 'Owner and admin accounts cannot be sanctioned.';
  end if;

  insert into public.user_sanctions (user_id, kind, reason, issued_by, expires_at)
  values (
    v_user, p_kind, trim(p_reason), auth.uid(),
    case when p_hours is null or p_hours <= 0 then null else now() + make_interval(hours => p_hours) end
  )
  returning id into v_id;

  insert into public.staff_audit_log (actor_id, action, target_user, details)
  values (auth.uid(), 'sanction_issued', v_user,
    jsonb_build_object('kind', p_kind, 'reason', trim(p_reason), 'hours', p_hours, 'sanction_id', v_id));

  perform public.gb_notify(
    v_user,
    case when p_kind = 'mute' then 'You have been muted' else 'Your account has been suspended' end,
    'Reason: ' || trim(p_reason) || case when p_hours is null or p_hours <= 0 then ' (until staff lift it).' else ' (' || p_hours || ' hours).' end,
    'sanction', v_id
  );

  return v_id;
end;
$$;

create or replace function public.staff_revoke_sanction(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  s public.user_sanctions%rowtype;
begin
  if not public.has_staff_permission('staff_access') then
    raise exception 'Staff access required.';
  end if;

  select * into s from public.user_sanctions where id = p_id;
  if not found or s.revoked_at is not null then
    raise exception 'Sanction not found or already lifted.';
  end if;

  update public.user_sanctions set revoked_at = now(), revoked_by = auth.uid() where id = p_id;

  insert into public.staff_audit_log (actor_id, action, target_user, details)
  values (auth.uid(), 'sanction_revoked', s.user_id, jsonb_build_object('kind', s.kind, 'sanction_id', p_id));
end;
$$;

-- Enforcement: sanctioned users cannot post comments or user messages; suspended users cannot post or accept matches.
create or replace function public.gb_block_muted_content()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid;
begin
  if tg_table_name = 'messages' then
    if coalesce(new.sender_type, 'user') <> 'user' then return new; end if;
    v_user := new.sender_id;
  else
    v_user := new.user_id;
  end if;

  if v_user is not null and public.gb_is_sanctioned(v_user, 'mute') then
    raise exception 'Your account is muted by staff and cannot post.';
  end if;
  return new;
end;
$$;

drop trigger if exists match_comments_block_muted on public.match_comments;
create trigger match_comments_block_muted before insert on public.match_comments
  for each row execute function public.gb_block_muted_content();

drop trigger if exists messages_block_muted on public.messages;
create trigger messages_block_muted before insert on public.messages
  for each row execute function public.gb_block_muted_content();

create or replace function public.gb_block_suspended_matches()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_team uuid;
  v_owner uuid;
begin
  if tg_op = 'INSERT' then
    v_team := new.posting_team_id;
  elsif new.accepting_team_id is distinct from old.accepting_team_id then
    v_team := new.accepting_team_id;
  else
    return new;
  end if;

  select owner_id into v_owner from public.teams where id = v_team;
  if v_owner is not null and public.gb_is_sanctioned(v_owner, 'suspend') then
    raise exception 'This account is suspended and cannot play matches.';
  end if;
  return new;
end;
$$;

drop trigger if exists matches_block_suspended on public.matches;
create trigger matches_block_suspended before insert or update of accepting_team_id on public.matches
  for each row execute function public.gb_block_suspended_matches();

revoke all on function public.gb_block_muted_content() from public, anon, authenticated;
revoke all on function public.gb_block_suspended_matches() from public, anon, authenticated;
revoke all on function public.staff_issue_sanction(text, text, text, integer) from public, anon;
revoke all on function public.staff_revoke_sanction(uuid) from public, anon;
grant execute on function public.staff_issue_sanction(text, text, text, integer) to authenticated;
grant execute on function public.staff_revoke_sanction(uuid) to authenticated;
grant execute on function public.gb_is_sanctioned(uuid, text) to authenticated;
