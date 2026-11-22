begin;

do $$
declare
  founder uuid;
  player uuid;
  request_id uuid;
  rejected boolean;
begin
  select id into strict founder from public.profiles
    where lower(username) = 'prime' and role = 'owner';
  select id into strict player from public.profiles
    where role = 'member' and username is not null
      and not public.gb_is_sanctioned(id, 'mute')
    order by created_at limit 1;

  if has_function_privilege('anon', 'public.gb_request_friendly_tournament(text)', 'EXECUTE')
    or not has_function_privilege('authenticated', 'public.gb_request_friendly_tournament(text)', 'EXECUTE') then
    raise exception 'Tournament requests must be available only to authenticated users';
  end if;

  perform set_config('request.jwt.claim.sub', '', true);
  rejected := false;
  begin
    perform public.gb_request_friendly_tournament('A 16-player single-elimination event');
  exception when raise_exception then
    rejected := sqlerrm = 'Sign in to request a tournament.';
  end;
  if not rejected then raise exception 'Anonymous requests must be rejected'; end if;

  perform set_config('request.jwt.claim.sub', player::text, true);
  rejected := false;
  begin
    perform public.gb_request_friendly_tournament('too short');
  exception when raise_exception then
    rejected := sqlerrm = 'Describe your tournament in 20 to 4,000 characters.';
  end;
  if not rejected then raise exception 'Short requests must be rejected'; end if;

  perform public.gb_request_friendly_tournament('A 16-player single-elimination event for our friends.');
  select id into strict request_id from public.messages
    where sender_id = player and recipient_id = founder
      and subject = 'Friendly tournament request'
      and body = 'A 16-player single-elimination event for our friends.'
      and sender_type = 'player' and related_type = 'tournament_request';
  if request_id is null then raise exception 'Request must create a replyable player message'; end if;
end;
$$;

rollback;
