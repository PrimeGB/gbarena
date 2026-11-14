begin;

do $$
declare
  founder uuid;
  member_id uuid;
  event public.owner_audit_events%rowtype;
  search_result jsonb;
  next_page jsonb;
  cursor jsonb;
  rejected boolean;
  baseline bigint;
  expired_id uuid := gen_random_uuid();
  thread_id bigint;
begin
  select id into strict founder from public.profiles where role = 'owner' order by created_at limit 1;
  select id into strict member_id from public.profiles where role = 'member' order by created_at limit 1;
  if has_table_privilege('authenticated', 'public.owner_audit_events', 'INSERT')
    or has_table_privilege('authenticated', 'public.owner_audit_events', 'SELECT')
    or has_table_privilege('authenticated', 'public.owner_audit_events', 'UPDATE')
    or has_table_privilege('authenticated', 'public.owner_audit_events', 'DELETE')
    or has_table_privilege('anon', 'public.owner_audit_history', 'SELECT') then
    raise exception 'Audit tables must not be directly accessible to clients';
  end if;

  perform set_config('request.jwt.claim.sub', member_id::text, true);
  rejected := false;
  begin
    perform public.owner_search_audit();
  exception when raise_exception then
    rejected := sqlerrm = 'Founder access is required';
  end;
  if not rejected then raise exception 'Members must not read Founder audit logs'; end if;
  rejected := false;
  begin
    perform public.owner_audit_coverage();
  exception when raise_exception then
    rejected := sqlerrm = 'Founder access is required';
  end;
  if not rejected then raise exception 'Members must not read audit coverage'; end if;
  rejected := false;
  begin
    perform public.owner_lookup_accounts_teams('test');
  exception when raise_exception then
    rejected := sqlerrm = 'Founder access is required';
  end;
  if not rejected then raise exception 'Members must not use Founder lookup'; end if;

  insert into public.forum_posts(subject, message, category, user_id)
    values('__audit_test_thread__', '__private_forum_test__', 'General Discussion', member_id)
    returning id into thread_id;
  delete from public.forum_posts where id = thread_id;
  if (select count(*) from public.owner_audit_events where source_table = 'forum_posts'
      and target_id = thread_id::text and action in ('forum_posts_created','forum_posts_deleted')) <> 2
    or exists(select 1 from public.owner_audit_events where target_id = thread_id::text
      and to_jsonb(owner_audit_events)::text like '%__private_forum_test__%') then
    raise exception 'Forum create/delete capture or content exclusion failed';
  end if;

  update public.profiles set favorite_game = '__audit_test_game__',
    full_name = '__private_audit_test__' where id = member_id;
  select * into strict event from public.owner_audit_events
    where source_table = 'profiles' and actor_id = member_id
      and transaction_id = txid_current()::text
    order by created_at desc limit 1;
  if event.actor_role <> 'member' or event.target_id <> member_id::text
    or event.new_values->>'favorite_game' <> '__audit_test_game__'
    or not ('full_name' = any(event.private_fields))
    or event.new_values ? 'full_name' or event.previous_values ? 'full_name'
    or to_jsonb(event)::text like '%__private_audit_test__%' then
    raise exception 'Member attribution or private value exclusion failed';
  end if;

  select count(*) into baseline from public.owner_audit_events;
  update public.profiles set profile_views = profile_views + 1 where id = member_id;
  if (select count(*) from public.owner_audit_events) <> baseline then
    raise exception 'Routine counters must not generate audit noise';
  end if;
  update public.profiles set favorite_game = '__audit_test_second__' where id = member_id;

  perform set_config('request.jwt.claim.sub', founder::text, true);
  search_result := public.owner_search_audit(
    p_query => txid_current()::text, p_actor => member_id::text,
    p_category => 'accounts', p_audience => 'member', p_target => member_id::text, p_limit => 1
  );
  if jsonb_array_length(search_result->'events') <> 1 or not (search_result->>'has_more')::boolean then
    raise exception 'Filtered first-page search failed';
  end if;
  cursor := search_result->'next_cursor';
  next_page := public.owner_search_audit(
    p_query => txid_current()::text, p_actor => member_id::text,
    p_category => 'accounts', p_audience => 'member', p_target => member_id::text,
    p_before => (cursor->>'at')::timestamptz, p_before_id => cursor->>'id', p_limit => 1
  );
  if jsonb_array_length(next_page->'events') <> 1
    or next_page->'events'->0->>'id' = search_result->'events'->0->>'id' then
    raise exception 'Cursor pagination lost or duplicated a record';
  end if;
  if jsonb_array_length(public.owner_search_audit(p_query => '__private_audit_test__')->'events') <> 0 then
    raise exception 'Private profile values leaked into search';
  end if;
  rejected := false;
  begin
    update public.owner_audit_events set target_label = 'changed' where id = event.id;
  exception when raise_exception then rejected := true;
  end;
  if not rejected then raise exception 'Audit history was mutable'; end if;
  rejected := false;
  begin
    delete from public.owner_audit_events where id = event.id;
  exception when raise_exception then rejected := true;
  end;
  if not rejected then raise exception 'Unexpired audit history was deletable'; end if;

  if public.owner_legacy_audit_category('match_result_finalized','match') <> 'matches'
    or public.owner_legacy_audit_category('sanction_issued','profile') <> 'staff' then
    raise exception 'Historical actions must retain their meaningful categories';
  end if;
  insert into public.staff_activity_log(actor_id, action, target_type, target_id, reason)
    values(founder, 'audit_test_legacy', 'profile', member_id::text, 'Testing historical log availability');
  if jsonb_array_length(public.owner_search_audit(p_query => 'audit_test_legacy')->'events') <> 1 then
    raise exception 'Existing staff logs were not included';
  end if;

  insert into public.owner_audit_events(id, created_at, actor_name, actor_role, category,
    action, source_table, target_id, target_label, changed_fields, previous_values, new_values, transaction_id)
  values(expired_id, now() - interval '13 months', 'System / service', 'system', 'staff',
    'audit_test_expired', 'audit_test', expired_id::text, 'Expired test',
    '{}', '{}', '{}', txid_current()::text);
  perform public.owner_expire_audit_events();
  if exists(select 1 from public.owner_audit_events where id = expired_id)
    or not exists(select 1 from public.owner_audit_events where id = event.id) then
    raise exception 'Retention must remove only expired new history';
  end if;
  if not (public.owner_audit_coverage()->>'cleanup_scheduled')::boolean
    or exists(select 1 from jsonb_array_elements(public.owner_audit_coverage()->'sources') source
      where not (source->>'active')::boolean) then
    raise exception 'Capture triggers or retention schedule are inactive';
  end if;

  perform set_config('request.jwt.claim.sub', '', true);
  rejected := false;
  begin
    perform public.owner_search_audit();
  exception when raise_exception then rejected := sqlerrm = 'Founder access is required';
  end;
  if not rejected then raise exception 'Anonymous audit access was allowed'; end if;
end;
$$;

rollback;
