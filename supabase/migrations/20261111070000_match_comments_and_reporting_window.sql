alter table public.match_comments
  add column if not exists staff_comment boolean not null default false,
  add column if not exists hidden boolean not null default false,
  add column if not exists removed boolean not null default false;

alter table public.match_comments drop constraint if exists match_comments_one_per_user_per_match;
create unique index match_comments_one_player_comment
  on public.match_comments(match_id, user_id) where not staff_comment;

revoke all on public.match_comments from anon, authenticated;

create or replace function public.get_match_comment_access(match_uuid uuid)
returns jsonb
language plpgsql stable security definer
set search_path = public, pg_temp
as $$
declare
  uid uuid := auth.uid();
  team uuid;
  staff boolean := false;
begin
  if uid is null then
    return jsonb_build_object('team_id', null, 'staff', false, 'has_comment', false);
  end if;
  staff := public.has_staff_permission('basic_moderation');
  select p.team_id into team from public.match_participants p
    join public.matches m on m.id = p.match_id
    where p.match_id = match_uuid and p.user_id = uid
      and p.team_id in (m.posting_team_id, m.accepting_team_id)
      and coalesce(m.status, '') <> 'cancelled'
    limit 1;
  if team is null then
    select case when uid = any(coalesce(m.locked_posting_roster, '{}'::uuid[]))
      then m.posting_team_id
      when uid = any(coalesce(m.locked_accepting_roster, '{}'::uuid[]))
      then m.accepting_team_id end into team
    from public.matches m
    where m.id = match_uuid and coalesce(m.status, '') <> 'cancelled';
  end if;
  return jsonb_build_object('team_id', team, 'staff', staff,
    'has_comment', exists(select 1 from public.match_comments c
      where c.match_id = match_uuid and c.user_id = uid and not c.staff_comment));
end;
$$;

drop function public.get_match_comments(uuid);
create function public.get_match_comments(match_uuid uuid)
returns table(id uuid, match_id uuid, user_id uuid, team_id uuid, comment text,
  created_at timestamptz, username text, hidden boolean)
language sql stable security definer
set search_path = public, pg_temp
as $$
  select c.id, c.match_id, c.user_id, c.team_id, c.comment, c.created_at,
    coalesce(p.username, 'Player'), c.hidden
  from public.match_comments c left join public.profiles p on p.id = c.user_id
  where c.match_id = match_uuid and not c.removed
    and (not c.hidden or (auth.uid() is not null and public.has_staff_permission('basic_moderation')))
  order by c.created_at, c.id;
$$;

create or replace function public.post_match_comment(
  match_uuid uuid, poster_user_uuid uuid, poster_team_uuid uuid, body_text text
)
returns jsonb
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  uid uuid := auth.uid();
  access jsonb;
  team uuid;
  staff boolean;
begin
  if uid is null or uid is distinct from poster_user_uuid then
    return jsonb_build_object('ok', false, 'message', 'Sign in as yourself to comment.');
  end if;
  if length(trim(coalesce(body_text, ''))) not between 1 and 2000 then
    return jsonb_build_object('ok', false, 'message', 'Comments must contain 1 to 2000 characters.');
  end if;
  if not exists (select 1 from public.matches where id = match_uuid
      and posting_team_id is not null and accepting_team_id is not null
      and coalesce(status, '') <> 'cancelled') then
    return jsonb_build_object('ok', false, 'message', 'This match is not available for comments.');
  end if;
  access := public.get_match_comment_access(match_uuid);
  team := (access->>'team_id')::uuid;
  staff := (access->>'staff')::boolean;
  if not staff and (team is null or team is distinct from poster_team_uuid) then
    return jsonb_build_object('ok', false, 'message', 'Only match players and staff can comment.');
  end if;
  if not staff and (access->>'has_comment')::boolean then
    return jsonb_build_object('ok', false, 'message', 'You already posted your one match comment.');
  end if;
  begin
    insert into public.match_comments(match_id, user_id, team_id, comment, staff_comment)
    values (match_uuid, uid, team, trim(body_text), staff);
  exception when unique_violation then
    return jsonb_build_object('ok', false, 'message', 'You already posted your one match comment.');
  end;
  return jsonb_build_object('ok', true, 'message', 'Comment posted.');
end;
$$;

create function public.moderate_match_comment(comment_uuid uuid, moderation_action text)
returns jsonb
language plpgsql security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null or not public.has_staff_permission('basic_moderation') then
    return jsonb_build_object('ok', false, 'message', 'Staff moderation permission required.');
  end if;
  if moderation_action not in ('hide', 'unhide', 'remove') then
    return jsonb_build_object('ok', false, 'message', 'Invalid moderation action.');
  end if;
  update public.match_comments
  set hidden = moderation_action = 'hide', removed = moderation_action = 'remove'
  where id = comment_uuid and not removed;
  if not found then
    return jsonb_build_object('ok', false, 'message', 'Comment not found.');
  end if;
  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.get_match_comment_access(uuid) from public, anon;
grant execute on function public.get_match_comment_access(uuid) to authenticated;
revoke all on function public.get_match_comments(uuid) from public;
grant execute on function public.get_match_comments(uuid) to anon, authenticated;
revoke all on function public.post_match_comment(uuid, uuid, uuid, text) from public, anon;
grant execute on function public.post_match_comment(uuid, uuid, uuid, text) to authenticated;
revoke all on function public.moderate_match_comment(uuid, text) from public, anon;
grant execute on function public.moderate_match_comment(uuid, text) to authenticated;

create function public.gb_match_scheduled_at(value text)
returns timestamptz language plpgsql stable set search_path = public, pg_temp
as $$
begin
  if value is null or value !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}[T ][0-9]{2}:[0-9]{2}(:[0-9]{2}(\.[0-9]+)?)?(Z|[+-][0-9]{2}(:?[0-9]{2})?)$' then
    return null;
  end if;
  return value::timestamptz;
exception when invalid_datetime_format or datetime_field_overflow then
  return null;
end;
$$;

create or replace function public.report_match_score(match_uuid uuid, reporting_team_uuid uuid, posting_score integer, accepting_score integer)
returns jsonb language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  m public.matches%rowtype;
  uid uuid := auth.uid();
  scheduled timestamptz;
  best_of_number integer;
  required_wins integer;
begin
  if uid is null or posting_score is null or accepting_score is null
      or posting_score < 0 or accepting_score < 0 or posting_score = accepting_score then
    return jsonb_build_object('ok', false, 'message', 'Invalid score report.');
  end if;
  select * into m from public.matches where id = match_uuid for update;
  if not found then return jsonb_build_object('ok', false, 'message', 'Match not found.'); end if;
  scheduled := public.gb_match_scheduled_at(m.match_time);
  if scheduled is null or now() < scheduled + interval '15 minutes' then
    return jsonb_build_object('ok', false, 'message', 'Score reporting opens 15 minutes after the scheduled match time.');
  end if;
  if m.finalized or coalesce(m.reporting_status, 'none') not in ('none', '')
      or m.status in ('completed', 'disputed', 'cancelled')
      or reporting_team_uuid not in (m.posting_team_id, m.accepting_team_id)
      or not (
        exists (select 1 from public.teams t where t.id = reporting_team_uuid and t.owner_id = uid)
        or exists (select 1 from public.team_members tm where tm.team_id = reporting_team_uuid
          and tm.user_id = uid and lower(coalesce(tm.role, '')) in ('leader', 'co-leader', 'coleader', 'captain', 'owner'))
      ) then
    return jsonb_build_object('ok', false, 'message', 'You cannot report a score for this match.');
  end if;
  best_of_number := nullif(regexp_replace(coalesce(m.best_of, ''), '[^0-9]', '', 'g'), '')::integer;
  required_wins := case coalesce(best_of_number, 3) when 7 then 4 when 5 then 3 when 1 then 1 else 2 end;
  if greatest(posting_score, accepting_score) <> required_wins
      or least(posting_score, accepting_score) >= required_wins then
    return jsonb_build_object('ok', false, 'message', 'Invalid score for this best-of series.');
  end if;
  update public.matches set posting_team_score = posting_score, accepting_team_score = accepting_score,
    reported_by_team_id = reporting_team_uuid,
    reported_winner_team_id = case when posting_score > accepting_score then m.posting_team_id else m.accepting_team_id end,
    reported_loser_team_id = case when posting_score > accepting_score then m.accepting_team_id else m.posting_team_id end,
    confirmation_team_id = case when reporting_team_uuid = m.posting_team_id then m.accepting_team_id else m.posting_team_id end,
    reporting_status = 'awaiting_confirmation', status = 'awaiting_confirmation', score_reported_at = now()
  where id = match_uuid;
  return jsonb_build_object('ok', true);
end;
$$;
revoke all on function public.report_match_score(uuid, uuid, integer, integer) from public, anon;
grant execute on function public.report_match_score(uuid, uuid, integer, integer) to authenticated;

alter function public.dispute_match_score(uuid, text) rename to gb_dispute_match_score_before_delay;
revoke all on function public.gb_dispute_match_score_before_delay(uuid, text) from public, anon, authenticated;
create function public.dispute_match_score(match_uuid uuid, dispute_reason_text text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp
as $$
declare scheduled timestamptz;
begin
  select public.gb_match_scheduled_at(match_time) into scheduled from public.matches where id = match_uuid for update;
  if scheduled is null or now() < scheduled + interval '15 minutes' then
    return jsonb_build_object('ok', false, 'message', 'Disputes open 15 minutes after the scheduled match time.');
  end if;
  return public.gb_dispute_match_score_before_delay(match_uuid, dispute_reason_text);
end;
$$;
revoke all on function public.dispute_match_score(uuid, text) from public, anon;
grant execute on function public.dispute_match_score(uuid, text) to authenticated;

create or replace function public.dispute_ticket_window_ends_at(match_uuid uuid)
returns timestamptz language sql stable security definer set search_path = public, pg_temp
as $$
  select coalesce(public.gb_match_scheduled_at(match_time), started_at, accepted_at, created_at) + interval '2 hours'
  from public.matches where id = match_uuid
$$;

create function public.gb_validate_dispute_ticket()
returns trigger language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  m public.matches%rowtype;
  scheduled timestamptz;
begin
  select * into m from public.matches where id = new.match_id for update;
  scheduled := public.gb_match_scheduled_at(m.match_time);
  if not found or scheduled is null or now() < scheduled + interval '15 minutes'
      or now() >= scheduled + interval '2 hours' then
    raise exception 'Tickets are available from 15 minutes until 2 hours after the scheduled match time.';
  end if;
  if coalesce(m.status, '') <> 'disputed' or coalesce(m.reporting_status, '') <> 'disputed'
      or new.team_id not in (m.posting_team_id, m.accepting_team_id)
      or new.opponent_team_id is distinct from
        (case when new.team_id = m.posting_team_id then m.accepting_team_id else m.posting_team_id end)
      or coalesce(new.status, '') <> 'open'
      or new.created_by is distinct from auth.uid()
      or not exists(select 1 from public.team_members where team_id = new.team_id and user_id = auth.uid()) then
    raise exception 'Only a member of a disputed match team can submit its ticket.';
  end if;
  if exists(select 1 from public.dispute_tickets where match_id = new.match_id and team_id = new.team_id) then
    raise exception 'Your team has already submitted a dispute ticket for this match.';
  end if;
  return new;
end;
$$;
create trigger dispute_tickets_validate_match before insert on public.dispute_tickets
  for each row execute function public.gb_validate_dispute_ticket();
create policy dispute_tickets_team_insert on public.dispute_tickets for insert to authenticated
  with check (created_by = auth.uid());

with site_updates as (
  select id from public.forum_posts
  where author = 'Prime' and category = 'News & Updates' and pinned and not hidden
    and subject ilike '%Site Updates%'
  order by created_at desc limit 1
)
update public.forum_posts as post
set message = concat_ws(E'\n\n', nullif(trim(post.message), ''),
  'Match players can comment once after a match is accepted, and staff can help moderate. Score reports, disputes, and tickets open 15 minutes after match time.')
from site_updates where post.id = site_updates.id
  and coalesce(post.message, '') not like '%Match players can comment once after a match is accepted%';

notify pgrst, 'reload schema';
