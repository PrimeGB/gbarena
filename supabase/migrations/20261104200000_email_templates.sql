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
    body := jsonb_build_object(
      'type', 'message',
      'to', v_email,
      'subject', coalesce(new.subject, 'New notification'),
      'body', coalesce(new.body, ''),
      'related_type', coalesce(new.related_type, ''),
      'related_id', coalesce(new.related_id::text, '')
    ),
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-webhook-secret', v_secret)
  );
  return new;
exception when others then
  return new;
end;
$$;

create or replace function public.gb_email_welcome()
returns trigger
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_url text;
  v_secret text;
  v_email text;
begin
  select value into v_url from public.app_settings where key = 'email_webhook_url';
  select value into v_secret from public.app_settings where key = 'email_webhook_secret';
  if coalesce(v_url, '') = '' or coalesce(v_secret, '') = '' then
    return new;
  end if;

  select email into v_email from auth.users where id = new.id;
  if v_email is null then
    return new;
  end if;

  perform net.http_post(
    url := v_url,
    body := jsonb_build_object('type', 'welcome', 'to', v_email, 'subject', 'Welcome to GameBattles!', 'body', ''),
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-webhook-secret', v_secret)
  );
  return new;
exception when others then
  return new;
end;
$$;

drop trigger if exists profiles_email_welcome on public.profiles;
create trigger profiles_email_welcome after insert on public.profiles
  for each row execute function public.gb_email_welcome();

notify pgrst, 'reload schema';
