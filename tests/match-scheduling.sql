-- Run inside a transaction with the scheduling migration, then roll back.
do $$
declare
  original public.match_posts%rowtype;
  first_post uuid := gen_random_uuid();
  second_post uuid := gen_random_uuid();
  future_time timestamptz := now() + interval '40 days';
  rejected boolean := false;
begin
  select p.* into original from public.match_posts p
  where cardinality(p.posting_roster) = 1
    and exists (select 1 from public.team_members m where m.team_id = p.team_id and m.user_id = p.posting_roster[1])
    and public.gb_gaming_account_id(p.posting_roster[1], p.platform, p.category, p.game) is not null
  order by p.created_at desc limit 1;
  if original.id is null then raise exception 'Missing eligible match post fixture'; end if;

  insert into public.match_posts
  select (jsonb_populate_record(null::public.match_posts, to_jsonb(p) || jsonb_build_object(
    'id', first_post, 'match_time', future_time::text, 'created_at', now(), 'status', 'open'
  ))).* from public.match_posts p where p.id = original.id;

  begin
    insert into public.match_posts
    select (jsonb_populate_record(null::public.match_posts, to_jsonb(p) || jsonb_build_object(
      'id', gen_random_uuid(), 'match_time', (future_time + interval '14 minutes 59 seconds')::text,
      'created_at', now(), 'status', 'open'
    ))).* from public.match_posts p where p.id = original.id;
  exception when raise_exception then
    if sqlerrm not like '%within 15 minutes%' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'A post less than 15 minutes away was allowed'; end if;

  insert into public.match_posts
  select (jsonb_populate_record(null::public.match_posts, to_jsonb(p) || jsonb_build_object(
    'id', second_post, 'match_time', (future_time + interval '15 minutes')::text,
    'created_at', now(), 'status', 'open'
  ))).* from public.match_posts p where p.id = original.id;
  if (select count(*) from public.match_posts where id in (first_post, second_post) and status = 'open') <> 2 then
    raise exception 'Two posts 15 minutes apart were not allowed';
  end if;
  rejected := false;
  begin
    perform public.gb_check_team_match_schedule(original.team_id, (future_time - interval '1 minute')::text, null);
  exception when raise_exception then rejected := true;
  end;
  if not rejected then raise exception 'Earlier schedule conflict was not rejected'; end if;
  perform public.gb_check_team_match_schedule(original.team_id, (future_time + interval '30 minutes')::text, null);
  perform public.gb_check_team_match_schedule(original.team_id, future_time::text, first_post);
  if exists (select 1 from pg_indexes where schemaname = 'public' and indexname = 'idx_match_posts_unique_open_ladder_time') then
    raise exception 'Unrelated teams are still restricted to one post per ladder time';
  end if;
end;
$$;
