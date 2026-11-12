-- Run inside a transaction with the scheduling migration, then roll back.
do $$
declare
  original public.match_posts%rowtype;
  accepting public.teams%rowtype;
  first_post uuid := gen_random_uuid();
  second_post uuid := gen_random_uuid();
  blocker uuid := gen_random_uuid();
  first_match uuid;
  future_time timestamptz := now() + interval '50 days';
  rejected boolean := false;
begin
  select p.* into original from public.match_posts p
  where p.crossplay and cardinality(p.posting_roster) = 1
    and exists (select 1 from public.team_members m where m.team_id = p.team_id and m.user_id = p.posting_roster[1])
    and public.gb_gaming_account_id(p.posting_roster[1], p.platform, p.category, p.game) is not null
    and exists (
      select 1 from public.teams t
      where t.id <> p.team_id and t.owner_id is not null and t.category = p.category and t.game = p.game and t.ladder = p.ladder
        and t.platform <> p.platform and t.platform = any(public.gb_ladder_platforms(p.category, p.game, p.platform))
        and exists (select 1 from public.team_members tm where tm.team_id = t.id and tm.user_id = t.owner_id)
        and public.gb_gaming_account_id(t.owner_id, t.platform, p.category, p.game) is not null
    )
  order by p.created_at desc limit 1;
  select t.* into accepting from public.teams t
  where t.id <> original.team_id and t.owner_id is not null and t.category = original.category
    and t.game = original.game and t.ladder = original.ladder and t.platform <> original.platform
    and t.platform = any(public.gb_ladder_platforms(original.category, original.game, original.platform))
    and exists (select 1 from public.team_members tm where tm.team_id = t.id and tm.user_id = t.owner_id)
    and public.gb_gaming_account_id(t.owner_id, t.platform, original.category, original.game) is not null limit 1;
  if original.id is null or accepting.id is null then raise exception 'Missing cross-play acceptance fixtures'; end if;

  insert into public.match_posts
  select (jsonb_populate_record(null::public.match_posts, to_jsonb(p) || jsonb_build_object(
    'id', first_post, 'match_time', future_time::text, 'created_at', now(), 'status', 'open'
  ))).* from public.match_posts p where p.id = original.id;
  insert into public.match_posts
  select (jsonb_populate_record(null::public.match_posts, to_jsonb(p) || jsonb_build_object(
    'id', second_post, 'match_time', (future_time + interval '15 minutes')::text, 'created_at', now(), 'status', 'open'
  ))).* from public.match_posts p where p.id = original.id;
  insert into public.match_posts
  select (jsonb_populate_record(null::public.match_posts, to_jsonb(p) || jsonb_build_object(
    'id', blocker, 'team_id', accepting.id, 'platform', accepting.platform,
    'posting_roster', array[accepting.owner_id], 'match_time', (future_time + interval '14 minutes')::text,
    'created_at', now(), 'status', 'open'
  ))).* from public.match_posts p where p.id = original.id;
  perform set_config('request.jwt.claim.sub', accepting.owner_id::text, true);
  begin
    perform public.accept_match_post(first_post, accepting.id, array[accepting.owner_id]);
  exception when raise_exception then
    if sqlerrm not like '%within 15 minutes%' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'Accepting team schedule conflict was allowed'; end if;
  update public.match_posts set status = 'cancelled' where id = blocker;
  select match_id into first_match from public.accept_match_post(first_post, accepting.id, array[accepting.owner_id]);
  if first_match is null then raise exception 'First match was not accepted'; end if;
  perform public.accept_match_post(second_post, accepting.id, array[accepting.owner_id]);
  if not exists (select 1 from public.matches where match_post_id = second_post and status = 'upcoming') then
    raise exception 'Second match exactly 15 minutes later was not accepted';
  end if;
end;
$$;
