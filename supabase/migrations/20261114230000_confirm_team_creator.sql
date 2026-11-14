do $$
declare
  team_uuid constant uuid:='33728c25-c601-4905-aeaa-706f5dff353a';
  creator_uuid constant uuid:='7950eee8-fe53-457b-9844-23bac6f73d5b';
  original_date timestamptz;
  original_founder uuid;
begin
  if not exists(select 1 from public.profiles where id=creator_uuid and username='Prime') then
    raise exception 'Confirmed founding account not found';
  end if;
  lock table public.teams in access exclusive mode;
  select created_at,founder_id into strict original_date,original_founder
    from public.teams where id=team_uuid;
  if original_founder is not null and original_founder<>creator_uuid then
    raise exception 'Team already has a different recorded founder';
  end if;
  if not exists(select 1 from pg_trigger where tgrelid='public.teams'::regclass
      and tgname='teams_guard_founding' and tgenabled='O') then
    raise exception 'Founding protection must be enabled';
  end if;
  if original_founder is null then
    -- One-time historical attribution explicitly confirmed by the site Founder.
    -- The table lock and transaction keep normal writers protected throughout.
    alter table public.teams disable trigger teams_guard_founding;
    update public.teams set founder_id=creator_uuid where id=team_uuid;
    alter table public.teams enable trigger teams_guard_founding;
  end if;
  if not exists(select 1 from public.teams where id=team_uuid and founder_id=creator_uuid
      and created_at is not distinct from original_date) then
    raise exception 'Confirmed creator must retain the saved founding date';
  end if;
end;
$$;

do $$
declare thread_id bigint;
begin
  select id into thread_id from public.forum_posts
    where author='Prime' and category='News & Updates' and pinned and not hidden
      and subject ilike '%Site Updates%'
    order by created_at desc limit 1;
  if thread_id is null then raise exception 'Pinned Site Updates thread not found'; end if;
  update public.forum_posts set message=concat_ws(E'\n\n',nullif(trim(message),''),
    'The Founded line now sits directly above Achievements, with a profile link for recorded team creators. Confirmed historical creators can also be shown without changing the saved founding date. Founding details remain protected from edits.')
    where id=thread_id and coalesce(message,'') not like '%The Founded line now sits directly above Achievements%';
end;
$$;
