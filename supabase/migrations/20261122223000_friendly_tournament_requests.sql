create function public.gb_request_friendly_tournament(p_details text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_founder uuid;
  v_details text := btrim(p_details);
begin
  if v_user is null then raise exception 'Sign in to request a tournament.'; end if;
  if v_details is null or length(v_details) not between 20 and 4000 then
    raise exception 'Describe your tournament in 20 to 4,000 characters.';
  end if;
  if not exists (select 1 from public.profiles where id = v_user and username is not null) then
    raise exception 'Complete your profile before requesting a tournament.';
  end if;
  if public.gb_is_sanctioned(v_user, 'mute') then
    raise exception 'Your account is muted by staff and cannot send a request.';
  end if;
  select id into v_founder from public.profiles
    where lower(username) = 'prime' and role = 'owner' limit 1;
  if v_founder is null then raise exception 'The tournament request inbox is unavailable.'; end if;
  if v_founder = v_user then raise exception 'You cannot send a request to yourself.'; end if;

  perform pg_advisory_xact_lock(hashtextextended(v_user::text || ':tournament_request', 0));
  if (select count(*) from public.rate_limit_events
      where user_id = v_user and action = 'tournament_request'
        and created_at > now() - interval '10 minutes') >= 3 then
    raise exception 'Too many requests. Please wait before sending another.';
  end if;

  insert into public.messages
    (sender_id, recipient_id, sender_type, subject, body, message_type, related_type, is_read, is_archived)
  values
    (v_user, v_founder, 'player', 'Friendly tournament request', v_details,
     'player', 'tournament_request', false, false);
  insert into public.rate_limit_events(user_id, action) values (v_user, 'tournament_request');
end;
$$;

revoke all on function public.gb_request_friendly_tournament(text) from public, anon;
grant execute on function public.gb_request_friendly_tournament(text) to authenticated;

with site_updates as (
  select id from public.forum_posts
  where author = 'Prime' and category = 'News & Updates' and pinned and not hidden
    and subject ilike '%Site Updates%'
  order by created_at desc limit 1
)
update public.forum_posts as post
set message = concat_ws(E'\n\n', nullif(trim(post.message), ''),
  'Latest update: Explore new 1v1 rivalry, community and work-in-progress slides. You can also ask us about hosting a friendly tournament for your friends, and learn about our ambassador and affiliate program.')
from site_updates
where post.id = site_updates.id
  and coalesce(post.message, '') not like '%hosting a friendly tournament for your friends%';
