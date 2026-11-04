-- Realtime publication
do $$
declare t text;
begin
  foreach t in array array['messages','matches','dispute_tickets','match_comments','tournament_matches']
  loop
    if to_regclass('public.' || t) is not null
       and not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- Stats privacy enforced in the database
do $$
begin
  if not exists (select 1 from pg_proc where proname = 'gb_player_stats_raw') then
    alter function public.gb_player_stats(uuid) rename to gb_player_stats_raw;
  end if;
  if not exists (select 1 from pg_proc where proname = 'gb_player_season_history_raw') then
    alter function public.gb_player_season_history(uuid) rename to gb_player_season_history_raw;
  end if;
end $$;

revoke all on function public.gb_player_stats_raw(uuid) from public, anon, authenticated;
revoke all on function public.gb_player_season_history_raw(uuid) from public, anon, authenticated;

create or replace function public.gb_can_view_stats(p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select auth.uid() = p_user
    or coalesce((select stats_public from public.profiles where id = p_user), true)
    or public.has_staff_permission('basic_moderation');
$$;

create or replace function public.gb_player_stats(p_user uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.gb_can_view_stats(p_user) then
    return '{}'::jsonb;
  end if;
  return public.gb_player_stats_raw(p_user);
end;
$$;

create or replace function public.gb_player_season_history(p_user uuid)
returns setof jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.gb_can_view_stats(p_user) then
    return;
  end if;
  return query select * from public.gb_player_season_history_raw(p_user);
end;
$$;

grant execute on function public.gb_can_view_stats(uuid) to anon, authenticated;
grant execute on function public.gb_player_stats(uuid) to anon, authenticated;
grant execute on function public.gb_player_season_history(uuid) to anon, authenticated;

-- Rate limiting
create table if not exists public.rate_limit_events (
  id bigserial primary key,
  user_id uuid not null,
  action text not null,
  created_at timestamptz not null default now()
);
create index if not exists rate_limit_events_lookup on public.rate_limit_events (user_id, action, created_at desc);
alter table public.rate_limit_events enable row level security;
revoke all on public.rate_limit_events from anon, authenticated;

-- Trigger args: action, max events, window seconds, user column name
create or replace function public.gb_rate_limit_trigger()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_action text := tg_argv[0];
  v_max int := tg_argv[1]::int;
  v_window int := tg_argv[2]::int;
  v_user uuid := nullif(to_jsonb(new) ->> tg_argv[3], '')::uuid;
  v_count int;
begin
  if v_user is null then
    return new;
  end if;
  if coalesce(to_jsonb(new) ->> 'sender_type', 'user') = 'system' then
    return new;
  end if;

  delete from public.rate_limit_events where created_at < now() - interval '1 day';

  select count(*) into v_count from public.rate_limit_events
   where user_id = v_user and action = v_action and created_at > now() - make_interval(secs => v_window);

  if v_count >= v_max then
    raise exception 'You are doing that too fast. Please wait a moment and try again.' using errcode = 'P0001';
  end if;

  insert into public.rate_limit_events (user_id, action) values (v_user, v_action);
  return new;
end;
$$;

drop trigger if exists friend_requests_rate_limit on public.friend_requests;
create trigger friend_requests_rate_limit before insert on public.friend_requests
  for each row execute function public.gb_rate_limit_trigger('friend_request', 10, 600, 'requester_id');

drop trigger if exists messages_rate_limit on public.messages;
create trigger messages_rate_limit before insert on public.messages
  for each row execute function public.gb_rate_limit_trigger('message', 20, 300, 'sender_id');

drop trigger if exists match_comments_rate_limit on public.match_comments;
create trigger match_comments_rate_limit before insert on public.match_comments
  for each row execute function public.gb_rate_limit_trigger('match_comment', 15, 300, 'user_id');

drop trigger if exists staff_cases_rate_limit on public.staff_cases;
create trigger staff_cases_rate_limit before insert on public.staff_cases
  for each row execute function public.gb_rate_limit_trigger('report', 5, 600, 'reported_by');

-- Email notifications
alter table public.profiles add column if not exists email_notifications boolean not null default true;

create or replace function public.gb_email_on_message()
returns trigger
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_url text;
  v_secret text;
  v_email text;
  v_opt boolean;
begin
  if new.recipient_id is null then
    return new;
  end if;

  select value into v_url from public.app_settings where key = 'email_webhook_url';
  select value into v_secret from public.app_settings where key = 'email_webhook_secret';
  if coalesce(v_url, '') = '' or coalesce(v_secret, '') = '' then
    return new;
  end if;

  select email_notifications into v_opt from public.profiles where id = new.recipient_id;
  if coalesce(v_opt, true) = false then
    return new;
  end if;

  select email into v_email from auth.users where id = new.recipient_id;
  if v_email is null then
    return new;
  end if;

  perform net.http_post(
    url := v_url,
    body := jsonb_build_object('to', v_email, 'subject', coalesce(new.subject, 'New notification'), 'body', coalesce(new.body, '')),
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-webhook-secret', v_secret)
  );
  return new;
exception when others then
  return new;
end;
$$;

drop trigger if exists messages_email_notify on public.messages;
create trigger messages_email_notify after insert on public.messages
  for each row execute function public.gb_email_on_message();

notify pgrst, 'reload schema';
