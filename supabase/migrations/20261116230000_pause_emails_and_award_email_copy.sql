-- Site-wide email pause switch. Resume with:
--   update public.app_settings set value = 'false' where key = 'emails_paused';
begin;

insert into public.app_settings (key, value)
select 'emails_paused', 'true'
where not exists (select 1 from public.app_settings where key = 'emails_paused');
update public.app_settings set value = 'true' where key = 'emails_paused';

create or replace function public.gb_emails_paused()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce((select lower(value) = 'true' from public.app_settings where key = 'emails_paused'), false);
$$;
revoke all on function public.gb_emails_paused() from public, anon, authenticated;

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
  if new.recipient_id is null or coalesce(new.related_type, '') = 'welcome' or public.gb_emails_paused() then
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
  if public.gb_emails_paused() then
    return new;
  end if;

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

-- Award notifications name the award and explain how it was earned.
create or replace function public.gb_on_award_granted()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_name text;
  v_purpose text;
begin
  select name, nullif(btrim(purpose), '') into v_name, v_purpose
  from public.staff_award_catalog where id = new.award_id;
  v_name := coalesce(v_name, 'Award');

  if new.recipient_id is not null then
    perform public.gb_notify(
      new.recipient_id,
      'You earned an award: ' || v_name,
      'Congratulations on earning the ' || v_name || '! It has been added to your profile.'
        || coalesce(E'\n\nHow you earned it: ' || v_purpose, ''),
      'award', null
    );
  end if;

  if new.recipient_team_id is not null then
    perform public.gb_notify_team(
      new.recipient_team_id,
      'Your team earned an award: ' || v_name,
      'Congratulations on earning the ' || v_name || '! It has been added to your team profile.'
        || coalesce(E'\n\nHow it was earned: ' || v_purpose, ''),
      'award', null
    );
  end if;

  return new;
end;
$$;

commit;
