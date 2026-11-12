-- Run against a database with a recently expired post and valid roster; all changes roll back.
begin;

do $$
declare
  original public.match_posts%rowtype;
  new_post uuid := gen_random_uuid();
  rejected boolean := false;
begin
  select p.* into original
  from public.match_posts p
  where p.status = 'expired'
    and public.gb_match_scheduled_at(p.match_time) <= now()
    and cardinality(p.posting_roster) > 0
    and not exists (
      select 1 from public.matches m
      where (m.posting_team_id = p.team_id or m.accepting_team_id = p.team_id)
        and coalesce(lower(m.status), '') not in ('completed', 'cancelled')
    )
    and not exists (select 1 from public.match_posts other where other.team_id = p.team_id and other.status = 'open')
  order by p.created_at desc limit 1;
  if original.id is null then raise exception 'Missing expired post test fixture'; end if;

  update public.match_posts set status = 'open', match_time = now()::text where id = original.id;
  begin
    update public.match_posts set status = 'accepted' where id = original.id;
  exception when raise_exception then
    if sqlerrm not like '%passed its scheduled time%' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'A post was accepted at its expiry time'; end if;

  insert into public.match_posts
  select (jsonb_populate_record(null::public.match_posts, to_jsonb(p) || jsonb_build_object(
    'id', new_post, 'match_time', (now() + interval '30 days')::text,
    'created_at', now(), 'status', 'open'
  ))).*
  from public.match_posts p where p.id = original.id;

  if (select status from public.match_posts where id = original.id) <> 'expired' then
    raise exception 'Posting did not expire the old commitment';
  end if;
  perform public.gb_expire_open_match_posts();
  if (select status from public.match_posts where id = new_post) <> 'open' then
    raise exception 'A future post was expired';
  end if;

  rejected := false;
  begin
    insert into public.match_posts
    select (jsonb_populate_record(null::public.match_posts, to_jsonb(p) || jsonb_build_object(
      'id', gen_random_uuid(), 'match_time', (now() + interval '30 days 14 minutes')::text
    ))).*
    from public.match_posts p where p.id = new_post;
  exception when raise_exception then
    if sqlerrm not like '%within 15 minutes%' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'A future commitment did not block a post within 15 minutes'; end if;
end;
$$;

set local role anon;
select public.gb_expire_open_match_posts();

rollback;
