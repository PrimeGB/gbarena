-- Ambassador applications: players apply, the Founder reviews them in the
-- staff ambassador box.
begin;

create table if not exists public.ambassador_applications (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  channel text not null check (length(trim(channel)) between 4 and 300),
  twitch text not null default '' check (length(twitch) <= 200),
  youtube text not null default '' check (length(youtube) <= 200),
  tiktok text not null default '' check (length(tiktok) <= 200),
  kick text not null default '' check (length(kick) <= 200),
  instagram text not null default '' check (length(instagram) <= 200),
  discord text not null default '' check (length(discord) <= 200),
  games text not null check (length(trim(games)) between 2 and 200),
  audience text not null default '' check (length(audience) <= 120),
  pitch text not null check (length(trim(pitch)) between 10 and 1000),
  status text not null default 'pending' check (status in ('pending', 'approved', 'declined')),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  review_note text not null default '',
  created_at timestamptz not null default now()
);

create unique index if not exists ambassador_applications_pending_idx
  on public.ambassador_applications(user_id) where status = 'pending';
create index if not exists ambassador_applications_queue_idx
  on public.ambassador_applications(status, created_at desc);

alter table public.ambassador_applications enable row level security;
revoke all on public.ambassador_applications from public, anon, authenticated;

-- Player: submit an application.
create or replace function public.gb_ambassador_apply(
  p_channel text,
  p_games text,
  p_pitch text,
  p_audience text default '',
  p_twitch text default '',
  p_youtube text default '',
  p_tiktok text default '',
  p_kick text default '',
  p_instagram text default '',
  p_discord text default ''
)
returns bigint
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_id bigint;
  v_founder uuid;
  v_name text;
begin
  if v_uid is null then
    raise exception 'Sign in to apply';
  end if;
  if exists (select 1 from public.ambassadors where user_id = v_uid and active) then
    raise exception 'You are already a GameBattles Ambassador';
  end if;
  if exists (select 1 from public.ambassador_applications where user_id = v_uid and status = 'pending') then
    raise exception 'Your application is already in review. Watch your inbox.';
  end if;

  insert into public.ambassador_applications (
    user_id, channel, games, pitch, audience,
    twitch, youtube, tiktok, kick, instagram, discord
  ) values (
    v_uid,
    trim(p_channel),
    trim(p_games),
    trim(p_pitch),
    left(trim(coalesce(p_audience, '')), 120),
    left(trim(coalesce(p_twitch, '')), 200),
    left(trim(coalesce(p_youtube, '')), 200),
    left(trim(coalesce(p_tiktok, '')), 200),
    left(trim(coalesce(p_kick, '')), 200),
    left(trim(coalesce(p_instagram, '')), 200),
    left(trim(coalesce(p_discord, '')), 200)
  ) returning id into v_id;

  -- Alert the Founder's inbox.
  select id into v_founder from public.profiles where role = 'owner' limit 1;
  select coalesce(username, 'A player') into v_name from public.profiles where id = v_uid;
  if v_founder is not null and v_founder <> v_uid then
    insert into public.messages (sender_id, recipient_id, sender_type, subject, body, message_type, related_type, related_id, is_read, is_archived)
    values (
      v_uid, v_founder, 'player',
      'Ambassador application: ' || v_name,
      v_name || ' has applied to become a GameBattles Ambassador.'
        || E'\n\nChannel: ' || trim(p_channel)
        || E'\nGames: ' || trim(p_games)
        || E'\n\nReview it in the staff area under Ambassador Program.',
      'player', 'ambassador_application', v_uid, false, false
    );
  end if;

  return v_id;
end;
$$;

revoke all on function public.gb_ambassador_apply(text, text, text, text, text, text, text, text, text, text) from public, anon;
grant execute on function public.gb_ambassador_apply(text, text, text, text, text, text, text, text, text, text) to authenticated;

-- Player: check own latest application status.
create or replace function public.gb_my_ambassador_application()
returns table (status text, created_at timestamptz, review_note text)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select apps.status, apps.created_at, apps.review_note
  from public.ambassador_applications apps
  where apps.user_id = auth.uid()
  order by apps.created_at desc
  limit 1;
$$;

revoke all on function public.gb_my_ambassador_application() from public, anon;
grant execute on function public.gb_my_ambassador_application() to authenticated;

-- Founder: list applications (pending first).
create or replace function public.staff_ambassador_applications()
returns table (
  id bigint,
  user_id uuid,
  username text,
  channel text,
  twitch text,
  youtube text,
  tiktok text,
  kick text,
  instagram text,
  discord text,
  games text,
  audience text,
  pitch text,
  status text,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.gb_require_founder();
  return query
    select apps.id, apps.user_id, prof.username, apps.channel,
      apps.twitch, apps.youtube, apps.tiktok, apps.kick, apps.instagram, apps.discord,
      apps.games, apps.audience, apps.pitch, apps.status, apps.created_at
    from public.ambassador_applications apps
    join public.profiles prof on prof.id = apps.user_id
    where apps.status = 'pending' or apps.created_at > now() - interval '30 days'
    order by (apps.status = 'pending') desc, apps.created_at desc;
end;
$$;

revoke all on function public.staff_ambassador_applications() from public, anon;
grant execute on function public.staff_ambassador_applications() to authenticated;

-- Founder: approve or decline. Approving does not appoint by itself; the
-- founder appoints with the form (prefilled from the application).
create or replace function public.staff_ambassador_application_review(
  p_id bigint,
  p_status text,
  p_note text default ''
)
returns void
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_founder uuid;
  v_app record;
begin
  v_founder := public.gb_require_founder();
  if p_status not in ('approved', 'declined') then
    raise exception 'Status must be approved or declined';
  end if;

  select * into v_app from public.ambassador_applications where id = p_id for update;
  if not found or v_app.status <> 'pending' then
    raise exception 'This application is no longer open';
  end if;

  update public.ambassador_applications
  set status = p_status, reviewed_by = v_founder, reviewed_at = now(),
      review_note = left(trim(coalesce(p_note, '')), 500)
  where id = p_id;

  insert into public.messages (sender_id, recipient_id, sender_type, subject, body, message_type, related_type, related_id, is_read, is_archived)
  values (
    v_founder, v_app.user_id, 'staff',
    case when p_status = 'approved'
      then 'Welcome to the GB Ambassadors!'
      else 'Your Ambassador application' end,
    case when p_status = 'approved'
      then 'Congratulations - your application to become a GameBattles Ambassador has been approved! Your gold profile, recruit link and ambassador award are being set up now. Check out your profile and the Ambassadors page.'
      else 'Thanks for applying to the GameBattles Ambassador program. We are not able to bring you on right now, but keep playing and streaming - you can apply again any time.'
        || case when length(trim(coalesce(p_note, ''))) > 0 then E'\n\nNote from the Founder: ' || trim(p_note) else '' end
    end,
    'staff', 'ambassador_application', v_app.user_id, false, false
  );
end;
$$;

revoke all on function public.staff_ambassador_application_review(bigint, text, text) from public, anon;
grant execute on function public.staff_ambassador_application_review(bigint, text, text) to authenticated;

commit;
