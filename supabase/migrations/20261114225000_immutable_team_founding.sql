alter table public.teams add column founder_id uuid;
comment on column public.teams.founder_id is
  'Original founding account. Historical UUID retained if the account is removed; null when the creator was not recorded.';

create function public.gb_guard_team_founding()
returns trigger language plpgsql set search_path=public,pg_temp
as $$
begin
  if tg_op='INSERT' then
    new.created_at:=now();
    new.founder_id:=new.owner_id;
  elsif (new.created_at,new.founder_id) is distinct from (old.created_at,old.founder_id) then
    raise exception using errcode='22000',message='Team founding details cannot be changed.';
  end if;
  return new;
end;
$$;
revoke all on function public.gb_guard_team_founding() from public,anon,authenticated;
create trigger teams_guard_founding before insert or update on public.teams
for each row execute function public.gb_guard_team_founding();

update public.owner_audit_sources
set recorded_fields=recorded_fields || array['created_at','founder_id']
where table_name='teams';

notify pgrst,'reload schema';

do $$
declare thread_id bigint;
begin
  select id into thread_id from public.forum_posts
    where author='Prime' and category='News & Updates' and pinned and not hidden
      and subject ilike '%Site Updates%'
    order by created_at desc limit 1;
  if thread_id is null then raise exception 'Pinned Site Updates thread not found'; end if;
  update public.forum_posts set message=concat_ws(E'\n\n',nullif(trim(message),''),
    'Team pages now show their saved founding date below the Team ID. New teams also record who founded them, and founding details stay fixed even if the team changes leaders. Older teams keep their real saved dates; we have not guessed founders where the original creator was never recorded.')
    where id=thread_id and coalesce(message,'') not like '%Team pages now show their saved founding date%';
end;
$$;
