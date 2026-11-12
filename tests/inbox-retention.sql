-- Run after inbox-retention-fixture.sql and the inbox retention migration.
create function pg_temp.assert_true(ok boolean, message text) returns void language plpgsql as $$
begin
  if ok is distinct from true then raise exception 'Assertion failed: %', message; end if;
end;
$$;

select pg_temp.assert_true(not exists (select 1 from public.messages where subject = 'Old system'),
  'expired system messages are deleted');
select pg_temp.assert_true((select is_archived from public.messages where subject = 'Old player'),
  'expired received messages are removed without deleting the sent copy');
select pg_temp.assert_true(not has_function_privilege('anon', 'public.gb_delete_inbox_message(uuid)', 'execute')
  and not has_column_privilege('authenticated', 'public.messages', 'is_saved', 'update')
  and not has_column_privilege('authenticated', 'public.messages', 'created_at', 'insert')
  and has_column_privilege('authenticated', 'public.messages', 'is_read', 'update'),
  'only authenticated recipient operations can control retention');

select set_config('request.jwt.claim.sub', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', false);
set role authenticated;
select pg_temp.assert_true((select count(*) = 1 from public.messages), 'recipient cannot see expired messages');
do $$
begin
  begin
    perform public.gb_delete_inbox_message('00000000-0000-0000-0000-000000000003');
    raise exception 'Expected unread deletion to fail';
  exception when raise_exception then
    if sqlerrm <> 'Open the message before deleting it' then raise; end if;
  end;
  begin
    perform public.gb_save_inbox_message('00000000-0000-0000-0000-000000000002', true);
    raise exception 'Expected expired save to fail';
  exception when raise_exception then
    if sqlerrm <> 'This inbox message is no longer available' then raise; end if;
  end;
end;
$$;
select public.gb_save_inbox_message('00000000-0000-0000-0000-000000000003', true);
update public.messages set is_read = true where id = '00000000-0000-0000-0000-000000000003';
reset role;
update public.messages set created_at = now() - interval '61 days' where id = '00000000-0000-0000-0000-000000000003';
select public.gb_expire_inbox_messages();
set role authenticated;
select pg_temp.assert_true((select is_saved from public.messages where id = '00000000-0000-0000-0000-000000000003'),
  'saved messages survive expiry');
select pg_temp.assert_true((public.gb_save_inbox_message('00000000-0000-0000-0000-000000000003', false)->>'removed')::boolean,
  'unsaving an old message removes it immediately');
select pg_temp.assert_true(not exists (select 1 from public.messages where id = '00000000-0000-0000-0000-000000000003'),
  'removed messages cannot be read by the recipient');
reset role;

select set_config('request.jwt.claim.sub', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', false);
set role authenticated;
select pg_temp.assert_true((select count(*) = 2 from public.messages), 'the sender keeps both sent messages');
do $$
begin
  begin
    perform public.gb_delete_inbox_message('00000000-0000-0000-0000-000000000002');
    raise exception 'Expected sender deletion to fail';
  exception when raise_exception then
    if sqlerrm <> 'This inbox message is no longer available' then raise; end if;
  end;
end;
$$;
reset role;

insert into public.messages (id, sender_id, recipient_id, subject, body, is_read) values
  ('00000000-0000-0000-0000-000000000004', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Read player', 'body', true),
  ('00000000-0000-0000-0000-000000000005', null, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Read system', 'body', true);
select set_config('request.jwt.claim.sub', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', false);
set role authenticated;
select public.gb_delete_inbox_message('00000000-0000-0000-0000-000000000004');
select public.gb_delete_inbox_message('00000000-0000-0000-0000-000000000005');
reset role;
select pg_temp.assert_true((select is_archived from public.messages where id = '00000000-0000-0000-0000-000000000004'),
  'manually deleting a player message preserves the sender copy');
select pg_temp.assert_true(not exists (select 1 from public.messages where id = '00000000-0000-0000-0000-000000000005'),
  'manually deleting a system message deletes the row');

select set_config('request.jwt.claim.sub', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', false);
set role authenticated;
insert into public.messages (sender_id, recipient_id, sender_type, subject, body, message_type, is_read, is_archived)
values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'player', 'New message', 'body', 'player', false, false);
select pg_temp.assert_true(exists (select 1 from public.messages where subject = 'New message'),
  'normal sending and reading sent messages still work');
reset role;
