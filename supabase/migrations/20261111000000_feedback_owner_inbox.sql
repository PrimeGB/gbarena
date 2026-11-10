create or replace function public.gb_submit_owner_feedback(p_type text, p_title text, p_details text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_owner uuid;
  v_username text;
  v_title text := trim(p_title);
  v_details text := trim(p_details);
begin
  if v_user is null then raise exception 'Sign in to submit feedback.'; end if;
  if p_type is null or p_type not in ('Suggestion', 'Bug Report')
    or v_title is null or length(v_title) not between 4 and 160
    or v_details is null or length(v_details) not between 10 and 5000 then
    raise exception 'Enter a title and details within the allowed length.';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_user::text || ':owner_feedback', 0));
  if (select count(*) from public.rate_limit_events
      where user_id = v_user and action = 'owner_feedback'
        and created_at > now() - interval '10 minutes') >= 3 then
    raise exception 'Too many submissions. Please wait before sending more feedback.';
  end if;

  select id into v_owner from public.profiles
    where lower(username) = 'prime' and role = 'owner';
  if v_owner is null then raise exception 'The owner inbox is unavailable.'; end if;
  select username into v_username from public.profiles where id = v_user;
  if v_username is null then raise exception 'Complete your profile before submitting feedback.'; end if;

  insert into public.messages
    (sender_id, recipient_id, sender_type, subject, body, message_type, is_read, is_archived)
  values
    (null, v_owner, 'system', p_type || ': ' || v_title,
     'From: ' || v_username || E'\n\n' || v_details, 'system', false, false);
  insert into public.rate_limit_events(user_id, action) values (v_user, 'owner_feedback');
end;
$$;

revoke all on function public.gb_submit_owner_feedback(text, text, text) from public, anon;
grant execute on function public.gb_submit_owner_feedback(text, text, text) to authenticated;

create or replace function public.gb_owner_feedback_email()
returns text
language sql
security definer
set search_path = public, auth, pg_temp
as $$
  select u.email from public.profiles p
  join auth.users u on u.id = p.id
  where lower(p.username) = 'prime' and p.role = 'owner';
$$;

revoke all on function public.gb_owner_feedback_email() from public, anon, authenticated;
grant execute on function public.gb_owner_feedback_email() to service_role;
