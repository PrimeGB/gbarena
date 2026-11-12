begin;

alter table public.messages add column is_saved boolean not null default false;
create index messages_inbox_expiration_idx on public.messages (created_at)
  where not is_saved and (not is_archived or sender_id is null);

revoke insert, update on public.messages from anon, authenticated;
grant insert (sender_id, recipient_id, sender_type, subject, body, message_type, related_type, related_id, is_read, is_archived)
  on public.messages to authenticated;
grant update (is_read) on public.messages to authenticated;

drop policy "Users can read their messages" on public.messages;
create policy "Users can read their messages" on public.messages
  for select using (
    auth.uid() = sender_id
    or (
      auth.uid() = recipient_id
      and not is_archived
      and (is_saved or created_at > now() - interval '60 days')
    )
  );

drop policy "Users can update received messages" on public.messages;
create policy "Users can update received messages" on public.messages
  for update using (
    auth.uid() = recipient_id and not is_archived
    and (is_saved or created_at > now() - interval '60 days')
  ) with check (auth.uid() = recipient_id);

create function public.gb_save_inbox_message(p_message_id uuid, p_saved boolean)
returns jsonb language plpgsql security definer set search_path = public, pg_temp
as $$
declare m public.messages%rowtype;
begin
  if auth.uid() is null or p_saved is null then raise exception 'Sign in and choose whether to save this message'; end if;
  select * into m from public.messages
    where id = p_message_id and recipient_id = auth.uid() for update;
  if not found or m.is_archived or (not m.is_saved and m.created_at <= now() - interval '60 days') then
    raise exception 'This inbox message is no longer available';
  end if;
  if not p_saved and m.created_at <= now() - interval '60 days' then
    if m.sender_id is null then
      delete from public.messages where id = m.id;
    else
      update public.messages set is_saved = false, is_archived = true where id = m.id;
    end if;
    return jsonb_build_object('saved', false, 'removed', true);
  end if;
  update public.messages set is_saved = p_saved where id = m.id;
  return jsonb_build_object('saved', p_saved, 'removed', false);
end;
$$;
revoke all on function public.gb_save_inbox_message(uuid, boolean) from public, anon;
grant execute on function public.gb_save_inbox_message(uuid, boolean) to authenticated;

create function public.gb_delete_inbox_message(p_message_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp
as $$
declare m public.messages%rowtype;
begin
  if auth.uid() is null then raise exception 'Sign in to delete an inbox message'; end if;
  select * into m from public.messages
    where id = p_message_id and recipient_id = auth.uid() for update;
  if not found or m.is_archived or (not m.is_saved and m.created_at <= now() - interval '60 days') then
    raise exception 'This inbox message is no longer available';
  end if;
  if not m.is_read then raise exception 'Open the message before deleting it'; end if;
  if m.sender_id is null then
    delete from public.messages where id = m.id;
  else
    update public.messages set is_archived = true, is_saved = false where id = m.id;
  end if;
end;
$$;
revoke all on function public.gb_delete_inbox_message(uuid) from public, anon;
grant execute on function public.gb_delete_inbox_message(uuid) to authenticated;

create function public.gb_expire_inbox_messages()
returns void language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  delete from public.messages
    where sender_id is null and not is_saved and created_at <= now() - interval '60 days';
  update public.messages set is_archived = true
    where sender_id is not null and not is_archived and not is_saved
      and created_at <= now() - interval '60 days';
end;
$$;
revoke all on function public.gb_expire_inbox_messages() from public, anon, authenticated;

select public.gb_expire_inbox_messages();
select cron.schedule('gb-expire-inbox-messages', '17 * * * *', 'select public.gb_expire_inbox_messages()');

commit;
notify pgrst, 'reload schema';
