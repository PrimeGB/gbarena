create table public.owner_audit_sources (
  table_name text primary key,
  category text not null,
  recorded_fields text[] not null,
  private_fields text[] not null default '{}',
  capture_started_at timestamptz not null default now()
);

create table public.owner_audit_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default clock_timestamp(),
  actor_id uuid,
  actor_name text not null,
  actor_role text not null,
  category text not null,
  action text not null,
  source_table text not null,
  target_id text not null,
  target_label text not null,
  target_href text,
  changed_fields text[] not null,
  private_fields text[] not null default '{}',
  previous_values jsonb not null,
  new_values jsonb not null,
  transaction_id text not null
);

create index owner_audit_events_time_idx on public.owner_audit_events(created_at desc, id desc);
create index owner_audit_events_actor_idx on public.owner_audit_events(actor_id, created_at desc);
create index owner_audit_events_category_idx on public.owner_audit_events(category, created_at desc);
create index owner_audit_events_target_idx on public.owner_audit_events(target_id, created_at desc);
alter table public.owner_audit_sources enable row level security;
alter table public.owner_audit_events enable row level security;
revoke all on public.owner_audit_sources, public.owner_audit_events from public, anon, authenticated;

insert into public.owner_audit_sources(table_name, category, recorded_fields, private_fields) values
  ('profiles', 'accounts', '{id,username,role,favorite_system,favorite_game,allow_friend_requests,allow_player_messages,show_public_awards,show_public_friends,show_public_teams,stats_public,friends_public,email_notifications,agreed_to_rules,display_awards,display_teams,display_friends}', '{email,secondary_email,full_name,date_of_birth,location,country,region,age_group,player_bio,avatar_url,logo_url,display_photos,xbox_gt,psn_gt,nintendo_gt,pc_gt,gt_xbox,gt_playstation,gt_nintendo,gt_pc}'),
  ('gaming_accounts', 'accounts', '{id,user_id,platform,category,game}', '{account_id}'),
  ('teams', 'teams', '{id,name,tag,owner_id,platform,category,game,ladder}', '{bio,logo_url,avatar_url}'),
  ('team_members', 'teams', '{id,team_id,user_id,role}', '{}'),
  ('team_invites', 'teams', '{id,team_id,user_id,status}', '{}'),
  ('team_name_change_requests', 'teams', '{id,team_id,requested_by,old_name,requested_name,status,reviewed_by,completed_by}', '{reason,review_note}'),
  ('team_streams', 'teams', '{team_id,user_id,is_live}', '{url}'),
  ('match_posts', 'matches', '{id,team_id,platform,category,game,ladder,game_mode,players,match_time,best_of,preset,status,crossplay,posting_roster,perks,launchers,killstreaks,field_upgrades,hardcore,friendly_fire,radar,spectating,third_person,round_length,score_limit,health,respawn_delay,bomb_timer,plant_time,defuse_time,attachments}', '{additional_rules}'),
  ('matches', 'matches', '{id,match_post_id,posting_team_id,accepting_team_id,game,ladder,status,reporting_status,posting_team_score,accepting_team_score,reported_by_team_id,reported_winner_team_id,reported_loser_team_id,winning_team_id,losing_team_id,finalized,finalized_by,disputed_by_team_id,dispute_status,resolved_by,confirmed_by_team_id,locked_posting_roster,locked_accepting_roster,posting_team_reported_score,accepting_team_reported_score,admin_override,host_team_ids,map_names}', '{staff_notes,dispute_reason,dispute_note,forfeit_reason,admin_decision,additional_rules}'),
  ('match_participants', 'matches', '{id,match_id,team_id,user_id,username_at_match,team_name_at_match}', '{account_id_at_match}'),
  ('match_cancellation_requests', 'matches', '{match_id,requesting_team_id,status}', '{}'),
  ('match_comments', 'matches', '{id,match_id,team_id,user_id,staff_comment,hidden,removed}', '{comment}'),
  ('match_proofs', 'matches', '{id,match_id,team_id,user_id}', '{proof_url,proof_note}'),
  ('dispute_tickets', 'matches', '{id,match_id,team_id,opponent_team_id,game,platform,ladder,status,created_by}', '{dispute_reason,dispute_description,evidence_paths}'),
  ('dispute_evidence', 'matches', '{id,dispute_ticket_id,uploaded_by,file_type}', '{file_url}'),
  ('forum_posts', 'forums', '{id,user_id,author,subject,category,system,game,ladder,type,pinned,locked,hidden}', '{message}'),
  ('forum_replies', 'forums', '{id,post_id,user_id,author,hidden}', '{message}'),
  ('forum_reports', 'reports', '{id,target_type,target_id,reporter_id,resolved}', '{reason}'),
  ('staff_cases', 'reports', '{id,case_number,report_type,priority,status,reported_by,assigned_to,target_user_id,target_team_id,match_id}', '{title,description,evidence,decision}'),
  ('community_suggestions', 'reports', '{id,submitter_id,status,reviewed_by}', '{title,details}'),
  ('community_bug_reports', 'reports', '{id,reporter_id,status,reviewed_by}', '{title,details,review_reason}'),
  ('match_decision_review_requests', 'reports', '{id,decision_id,team_id,submitted_by,status,reviewed_by}', '{reason,review_note}'),
  ('staff_award_requests', 'awards', '{id,award_id,requested_by,recipient_id,recipient_team_id,status,reviewed_by}', '{reason,evidence}'),
  ('staff_user_awards', 'awards', '{id,award_id,recipient_id,recipient_team_id,granted_by,revoked_by,revoked_at}', '{reason,evidence,revoke_reason}'),
  ('credit_transactions', 'credits', '{id,user_id,amount,balance_after,kind,created_by}', '{reason}'),
  ('staff_site_change_requests', 'staff', '{id,requested_by,status,reviewed_by}', '{description,decision_reason}'),
  ('staff_access_grants', 'staff', '{user_id,permission_key}', '{}'),
  ('staff_assignments', 'staff', '{user_id,position}', '{duties}'),
  ('staff_credit_grants', 'staff', '{user_id,granted_by}', '{}'),
  ('user_sanctions', 'staff', '{id,user_id,kind,issued_by,expires_at,revoked_at,revoked_by}', '{reason}'),
  ('staff_match_review_decisions', 'matches', '{id,match_id,ticket_id,referee_id,previous_posting_score,previous_accepting_score,official_posting_score,official_accepting_score,decider_role_at_time}', '{decision_note}'),
  ('tournaments', 'tournaments', '{id,title,platform,game,format,team_size,starts_at,max_teams,status,created_by,is_free,entry_fee_credits,prize_credits}', '{rules}'),
  ('tournament_registrations', 'tournaments', '{id,tournament_id,team_id,registered_by,credits_paid}', '{}'),
  ('tournament_matches', 'tournaments', '{id,tournament_id,round,slot,team_a,team_b,winner_id}', '{}');

create function public.owner_require_access()
returns void language plpgsql stable security definer set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null or not public.staff_has_portal_access()
     or not exists(select 1 from public.profiles where id = auth.uid() and role = 'owner') then
    raise exception 'Founder access is required';
  end if;
end;
$$;
revoke all on function public.owner_require_access() from public, anon, authenticated;

create function public.owner_capture_audit_event()
returns trigger language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  config public.owner_audit_sources%rowtype;
  before_row jsonb := '{}';
  after_row jsonb := '{}';
  source_row jsonb;
  before_values jsonb;
  after_values jsonb;
  changed text[];
  private_changed text[];
  actor uuid := auth.uid();
  actor_name text;
  actor_role text;
  target_id text;
  target_label text;
  target_href text;
begin
  select * into strict config from public.owner_audit_sources where table_name = tg_table_name;
  if tg_op <> 'INSERT' then before_row := to_jsonb(old); end if;
  if tg_op <> 'DELETE' then after_row := to_jsonb(new); end if;
  source_row := case when tg_op = 'DELETE' then before_row else after_row end;

  select coalesce(array_agg(field order by field), '{}') into changed
  from unnest(config.recorded_fields || config.private_fields) field
  where before_row->field is distinct from after_row->field;
  if tg_op = 'UPDATE' and cardinality(changed) = 0 then return new; end if;
  select coalesce(array_agg(field order by field), '{}') into private_changed
  from unnest(config.private_fields) field where field = any(changed);
  select coalesce(jsonb_object_agg(field, before_row->field), '{}') into before_values
  from unnest(config.recorded_fields) field where before_row ? field;
  select coalesce(jsonb_object_agg(field, after_row->field), '{}') into after_values
  from unnest(config.recorded_fields) field where after_row ? field;

  select username, role into actor_name, actor_role from public.profiles where id = actor;
  if tg_table_name = 'profiles' and tg_op <> 'INSERT' and before_row->>'id' = actor::text then
    actor_name := before_row->>'username';
    actor_role := before_row->>'role';
  end if;
  actor_name := coalesce(actor_name, case when actor is null then 'System / service' else 'Unavailable account' end);
  actor_role := coalesce(actor_role, case when actor is null then 'system' else 'unknown' end);
  target_id := coalesce(source_row->>'id', source_row->>'match_id',
    concat_ws(':', source_row->>'user_id', source_row->>'team_id', source_row->>'permission_key'));
  target_label := coalesce(source_row->>'username', source_row->>'name',
    source_row->>'subject', source_row->>'case_number',
    case when 'title' = any(config.recorded_fields) then source_row->>'title' end,
    replace(tg_table_name, '_', ' ') || ' ' || target_id);
  target_href := case
    when tg_table_name = 'profiles' then '/profile/' || target_id
    when tg_table_name = 'teams' then '/teams/' || target_id
    when tg_table_name = 'forum_posts' then '/forums/' || target_id
    when tg_table_name = 'forum_replies' then '/forums/' || (source_row->>'post_id')
    when tg_table_name = 'match_posts' then '/matches/finder'
    when tg_table_name = 'matches' then '/matches/' || target_id
    when tg_table_name = 'forum_reports' then '/staff/forum-reports'
    when tg_table_name = 'staff_cases' then '/staff/dashboard#reports-inbox'
    when tg_table_name in ('community_suggestions', 'community_bug_reports') then '/staff/feedback'
    when tg_table_name = 'match_decision_review_requests' then '/staff/match-reviews'
    when config.category = 'awards' then '/staff/awards'
    when config.category = 'credits' then '/staff/credits'
    when tg_table_name = 'staff_site_change_requests' then '/staff/site-requests'
    when config.category = 'tournaments' then '/staff/tournaments'
    when source_row->>'match_id' is not null then '/matches/' || (source_row->>'match_id')
    when source_row->>'team_id' is not null then '/teams/' || (source_row->>'team_id')
    when config.category = 'staff' then '/staff/dashboard#staff-access'
    when source_row->>'user_id' is not null then '/profile/' || (source_row->>'user_id')
    else null end;

  insert into public.owner_audit_events(actor_id, actor_name, actor_role, category, action,
    source_table, target_id, target_label, target_href, changed_fields, private_fields,
    previous_values, new_values, transaction_id)
  values(actor, actor_name, actor_role, config.category,
    tg_table_name || '_' || case tg_op when 'INSERT' then 'created' when 'UPDATE' then 'updated' else 'deleted' end,
    tg_table_name, target_id, target_label, target_href, changed, private_changed,
    before_values, after_values, txid_current()::text);
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;
revoke all on function public.owner_capture_audit_event() from public, anon, authenticated;

do $$
declare config record; missing_field text;
begin
  for config in select * from public.owner_audit_sources loop
    select field into missing_field from unnest(config.recorded_fields || config.private_fields) field
    where not exists(select 1 from information_schema.columns
      where table_schema = 'public' and table_name = config.table_name and column_name = field)
    limit 1;
    if missing_field is not null then
      raise exception 'Audit source %.% does not exist', config.table_name, missing_field;
    end if;
    execute format('create trigger owner_audit_capture after insert or update or delete on public.%I
      for each row execute function public.owner_capture_audit_event()', config.table_name);
  end loop;
end;
$$;

create function public.owner_guard_audit_history()
returns trigger language plpgsql set search_path = public, pg_temp
as $$
begin
  if tg_op = 'DELETE' and current_user in ('postgres', 'supabase_admin')
    and old.created_at < now() - interval '12 months' then
    return old;
  end if;
  raise exception 'Audit history cannot be changed; only expired records can be removed';
end;
$$;
create trigger owner_audit_immutable before update or delete on public.owner_audit_events
for each row execute function public.owner_guard_audit_history();
revoke all on function public.owner_guard_audit_history() from public, anon, authenticated;

create function public.owner_expire_audit_events()
returns bigint language plpgsql security definer set search_path = public, pg_temp
as $$
declare removed bigint;
begin
  delete from public.owner_audit_events where created_at < now() - interval '12 months';
  get diagnostics removed = row_count;
  return removed;
end;
$$;
revoke all on function public.owner_expire_audit_events() from public, anon, authenticated;
select cron.schedule('gb-expire-owner-audit', '23 3 * * *', 'select public.owner_expire_audit_events()');

-- Existing staff history stays in its original tables; no synthetic member history is backfilled.
create function public.owner_legacy_audit_category(p_action text, p_target text)
returns text language sql immutable set search_path = public, pg_temp
as $$
  select case
    when p_action like '%forum_report%' then 'reports'
    when p_action like '%forum%' or p_target like '%forum%' then 'forums'
    when p_action like '%tournament%' then 'tournaments'
    when p_action like '%match%' or p_target like '%match%' then 'matches'
    when p_action like '%award%' or p_target like '%award%' then 'awards'
    when p_action like '%credit%' then 'credits'
    when p_action like '%case%' or p_action like '%feedback%' then 'reports'
    when p_action like '%team_name%' then 'teams'
    else 'staff' end;
$$;
revoke all on function public.owner_legacy_audit_category(text,text) from public, anon, authenticated;

create view public.owner_audit_history as
select 'event:' || id::text as id, created_at, actor_id, actor_name, actor_role,
  case when actor_role = 'system' then 'system'
    when actor_role = 'member' then 'member'
    when actor_role in ('owner','admin','senior_staff','staff','referee') then 'staff'
    else 'unknown' end as audience,
  category, action, source_table, target_id, target_label, target_href, changed_fields,
  private_fields, previous_values, new_values, transaction_id, ''::text as reason
from public.owner_audit_events
union all
select 'staff:' || log.id::text, log.created_at, log.actor_id,
  coalesce(profile.username, 'Unavailable account'), 'historical_staff', 'staff',
  public.owner_legacy_audit_category(log.action,log.target_type), log.action, 'staff_activity_log', coalesce(log.target_id, log.case_id::text, ''),
  replace(log.target_type, '_', ' ') || ' ' || coalesce(log.target_id, log.case_id::text, ''),
  case when log.target_type in ('player','profile','user') and log.target_id is not null then '/profile/' || log.target_id
    when log.target_type = 'team' and log.target_id is not null then '/teams/' || log.target_id
    when log.target_type = 'match' and log.target_id is not null then '/matches/' || log.target_id
    else null end,
  array[]::text[], array[]::text[], coalesce(log.previous_values, '{}'), coalesce(log.new_values, '{}'),
  null::text, log.reason
from public.staff_activity_log log left join public.profiles profile on profile.id = log.actor_id
union all
select 'moderation:' || log.id::text, log.created_at, log.actor_id,
  coalesce(profile.username, case when log.actor_id is null then 'System / service' else 'Unavailable account' end),
  case when log.actor_id is null then 'system' else 'historical_staff' end,
  case when log.actor_id is null then 'system' else 'staff' end,
  public.owner_legacy_audit_category(log.action,''), log.action, 'staff_audit_log', coalesce(log.target_user::text, log.details->>'team_id', ''),
  coalesce(target.username, log.details->>'team_id', 'Moderation action'),
  case when log.target_user is not null then '/profile/' || log.target_user::text
    when log.details ? 'team_id' then '/teams/' || (log.details->>'team_id') else null end,
  array[]::text[], array[]::text[], '{}'::jsonb, log.details, null::text, ''
from public.staff_audit_log log
left join public.profiles profile on profile.id = log.actor_id
left join public.profiles target on target.id = log.target_user;
revoke all on public.owner_audit_history from public, anon, authenticated;

create function public.owner_search_audit(
  p_query text default '', p_actor text default '', p_category text default '',
  p_audience text default '', p_target text default '',
  p_from timestamptz default null, p_to timestamptz default null,
  p_before timestamptz default null, p_before_id text default null,
  p_limit integer default 50
)
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp
as $$
declare result jsonb;
begin
  perform public.owner_require_access();
  if length(coalesce(p_query,'')) > 200 or length(coalesce(p_actor,'')) > 100
    or length(coalesce(p_target,'')) > 100 or p_limit is null or p_limit not between 1 and 200
    or (p_from is not null and p_to is not null and p_from >= p_to)
    or (p_before is null) <> (p_before_id is null)
    or coalesce(p_category,'') not in ('','accounts','teams','matches','forums','reports','awards','credits','tournaments','staff')
    or coalesce(p_audience,'') not in ('','staff','member','system','unknown') then
    raise exception 'Invalid audit search filters';
  end if;
  with matching as (
    select history.* from public.owner_audit_history history
    where (p_from is null or created_at >= p_from) and (p_to is null or created_at < p_to)
      and (coalesce(p_category,'') = '' or category = p_category)
      and (coalesce(p_audience,'') = '' or audience = p_audience)
      and (coalesce(p_actor,'') = '' or position(lower(p_actor) in lower(actor_name || ' ' || coalesce(actor_id::text,''))) > 0)
      and (coalesce(p_target,'') = '' or position(lower(p_target) in lower(target_id || ' ' || target_label || ' ' || previous_values::text || ' ' || new_values::text)) > 0)
      and (coalesce(p_query,'') = '' or position(lower(p_query) in lower(
        replace(action,'_',' ') || ' ' || action || ' ' || source_table || ' ' || actor_name || ' ' ||
        coalesce(actor_id::text,'') || ' ' || target_id || ' ' || target_label || ' ' ||
        coalesce(transaction_id,'') || ' ' || reason || ' ' || previous_values::text || ' ' ||
        new_values::text || ' ' || array_to_string(changed_fields,' '))) > 0)
      and (p_before is null or (created_at, id) < (p_before, p_before_id))
    order by created_at desc, id desc limit p_limit + 1
  ), page as (
    select * from matching order by created_at desc, id desc limit p_limit
  )
  select jsonb_build_object(
    'events', coalesce((select jsonb_agg(to_jsonb(page) order by created_at desc, id desc) from page), '[]'),
    'has_more', (select count(*) > p_limit from matching),
    'next_cursor', (select jsonb_build_object('at',created_at,'id',id)
      from page order by created_at asc, id asc limit 1)
  ) into result;
  return result;
end;
$$;
revoke all on function public.owner_search_audit(text,text,text,text,text,timestamptz,timestamptz,timestamptz,text,integer) from public, anon;
grant execute on function public.owner_search_audit(text,text,text,text,text,timestamptz,timestamptz,timestamptz,text,integer) to authenticated;

create function public.owner_audit_coverage()
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp
as $$
begin
  perform public.owner_require_access();
  return jsonb_build_object(
    'retention_months', 12,
    'cleanup_scheduled', exists(select 1 from cron.job where jobname = 'gb-expire-owner-audit' and active),
    'sources', (select jsonb_agg(jsonb_build_object(
      'table_name', source.table_name, 'category', source.category,
      'capture_started_at', source.capture_started_at,
      'active', exists(select 1 from pg_trigger
        where tgrelid = to_regclass('public.' || source.table_name)
          and tgname = 'owner_audit_capture' and tgenabled in ('O','A')),
      'recorded_fields', source.recorded_fields, 'private_fields', source.private_fields,
      'events_7d', (select count(*) from public.owner_audit_events event
        where event.source_table = source.table_name and event.created_at >= now() - interval '7 days')
    ) order by source.category, source.table_name) from public.owner_audit_sources source),
    'legacy_staff_events', (select count(*) from public.staff_activity_log),
    'legacy_moderation_events', (select count(*) from public.staff_audit_log)
  );
end;
$$;
revoke all on function public.owner_audit_coverage() from public, anon;
grant execute on function public.owner_audit_coverage() to authenticated;

create function public.owner_lookup_accounts_teams(p_query text)
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp
as $$
begin
  perform public.owner_require_access();
  if p_query is null or length(trim(p_query)) not between 2 and 100 then
    raise exception 'Enter between 2 and 100 characters to find an account or team';
  end if;
  return jsonb_build_object(
    'accounts', coalesce((select jsonb_agg(to_jsonb(result)) from (
      select id, username, role, created_at from public.profiles
      where position(lower(trim(p_query)) in lower(coalesce(username,'') || ' ' || id::text)) > 0
      order by username, id limit 20
    ) result), '[]'),
    'teams', coalesce((select jsonb_agg(to_jsonb(result)) from (
      select team.id, team.name, team.platform, team.game, team.ladder, team.owner_id,
        owner.username as owner_username, team.created_at
      from public.teams team left join public.profiles owner on owner.id = team.owner_id
      where position(lower(trim(p_query)) in lower(team.name || ' ' || team.id::text)) > 0
      order by team.name, team.id limit 20
    ) result), '[]')
  );
end;
$$;
revoke all on function public.owner_lookup_accounts_teams(text) from public, anon;
grant execute on function public.owner_lookup_accounts_teams(text) to authenticated;

create function public.owner_record_audit_export(
  p_count integer, p_category text default '',
  p_from timestamptz default null, p_to timestamptz default null
)
returns void language plpgsql security definer set search_path = public, pg_temp
as $$
declare actor public.profiles%rowtype; export_id uuid := gen_random_uuid();
begin
  perform public.owner_require_access();
  if p_count is null or p_count not between 0 and 5000
    or coalesce(p_category,'') not in ('','accounts','teams','matches','forums','reports','awards','credits','tournaments','staff') then
    raise exception 'Invalid audit export details';
  end if;
  select * into strict actor from public.profiles where id = auth.uid();
  insert into public.owner_audit_events(id, actor_id, actor_name, actor_role, category, action,
    source_table, target_id, target_label, target_href, changed_fields, previous_values,
    new_values, transaction_id)
  values(export_id, actor.id, actor.username, actor.role, 'staff', 'audit_export_prepared',
    'owner_audit_exports', export_id::text, 'Private audit download', null,
    array['record_count','category','from','to'], '{}',
    jsonb_build_object('record_count',p_count,'category',p_category,'from',p_from,'to',p_to),
    txid_current()::text);
end;
$$;
revoke all on function public.owner_record_audit_export(integer,text,timestamptz,timestamptz) from public, anon;
grant execute on function public.owner_record_audit_export(integer,text,timestamptz,timestamptz) to authenticated;

notify pgrst, 'reload schema';
