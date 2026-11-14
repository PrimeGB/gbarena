begin;

do $$
declare
  template public.teams%rowtype;
  created public.teams%rowtype;
  team_uuid uuid:=gen_random_uuid();
  other_user uuid;
begin
  select * into strict template from public.teams where owner_id is not null order by created_at,id limit 1;
  select id into strict other_user from public.profiles where id<>template.owner_id limit 1;
  insert into public.teams(id,name,owner_id,platform,category,game,ladder,created_at,founder_id)
    values(team_uuid,'Founding protection test',template.owner_id,template.platform,template.category,
      'founding-test-game','singles','2000-01-01Z',other_user) returning * into created;
  if created.created_at<>now() or created.founder_id is distinct from template.owner_id then
    raise exception 'Creation time and founder must be captured by the database, not trusted from the client';
  end if;
  begin
    update public.teams set created_at='2001-01-01Z' where id=team_uuid;
    raise exception 'Backdating founding time was allowed';
  exception when sqlstate '22000' then
    if sqlerrm<>'Team founding details cannot be changed.' then raise; end if;
  end;
  begin
    update public.teams set founder_id=other_user where id=team_uuid;
    raise exception 'Replacing the original founder was allowed';
  exception when sqlstate '22000' then
    if sqlerrm<>'Team founding details cannot be changed.' then raise; end if;
  end;
  begin
    update public.teams set created_at=null,founder_id=null where id=team_uuid;
    raise exception 'Erasing founding details was allowed';
  exception when sqlstate '22000' then
    if sqlerrm<>'Team founding details cannot be changed.' then raise; end if;
  end;
  update public.teams set bio='Ordinary profile editing still works' where id=team_uuid;
  update public.teams set owner_id=other_user where id=team_uuid;
  if not exists(select 1 from public.teams where id=team_uuid and owner_id=other_user
      and founder_id=template.owner_id and created_at=created.created_at) then
    raise exception 'Ownership changes must preserve the original founding record';
  end if;
  begin
    update public.teams set created_at=created_at+interval '1 day' where id=template.id;
    raise exception 'Legacy founding date was editable';
  exception when sqlstate '22000' then
    if sqlerrm<>'Team founding details cannot be changed.' then raise; end if;
  end;
  if has_function_privilege('authenticated','public.gb_guard_team_founding()','EXECUTE') then
    raise exception 'Clients must not invoke the founding trigger directly';
  end if;
  if has_function_privilege('anon','public.gb_guard_team_founding()','EXECUTE') then
    raise exception 'Anonymous clients must not invoke the founding trigger directly';
  end if;
end;
$$;

rollback;
