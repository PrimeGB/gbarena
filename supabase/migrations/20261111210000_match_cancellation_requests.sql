create table public.match_cancellation_requests (
  match_id uuid primary key references public.matches(id) on delete cascade,
  requesting_team_id uuid not null references public.teams(id),
  status text not null check (status in ('pending', 'accepted', 'denied')),
  requested_at timestamptz not null default now(),
  responded_at timestamptz
);

alter table public.match_cancellation_requests enable row level security;
create policy "Cancellation requests are visible"
  on public.match_cancellation_requests for select to anon, authenticated using (true);
revoke all on public.match_cancellation_requests from public, anon, authenticated;
grant select on public.match_cancellation_requests to anon, authenticated;

create function public.gb_manage_match_cancellation(p_match_id uuid, p_team_id uuid, p_action text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  m public.matches%rowtype;
  request public.match_cancellation_requests%rowtype;
  opponent uuid;
begin
  if auth.uid() is null or p_team_id is null or p_action is null
      or p_action not in ('request', 'accept', 'deny') then
    raise exception 'Invalid cancellation request.';
  end if;
  select * into m from public.matches where id = p_match_id for update;
  if not found then raise exception 'Match not found.'; end if;
  if p_team_id is distinct from m.posting_team_id and p_team_id is distinct from m.accepting_team_id then
    raise exception 'Your team is not in this match.';
  end if;
  if not exists (select 1 from public.teams where id = p_team_id and owner_id = auth.uid())
     and not exists (
       select 1 from public.team_members where team_id = p_team_id and user_id = auth.uid()
       and lower(coalesce(role, '')) in ('leader', 'co-leader', 'coleader', 'co_leader', 'captain', 'owner')
     ) then
    raise exception 'Only a team leader, co-leader, or captain can manage cancellation requests.';
  end if;
  if coalesce(m.finalized, false) or coalesce(lower(m.reporting_status), 'none') not in ('none', '')
     or coalesce(lower(m.status), '') not in ('upcoming', 'playing') then
    raise exception 'Cancellation is unavailable after a result is reported or the match ends.';
  end if;
  opponent := case when p_team_id = m.posting_team_id then m.accepting_team_id else m.posting_team_id end;
  if opponent is null then raise exception 'The opposing team is missing.'; end if;
  select * into request from public.match_cancellation_requests where match_id = m.id;

  if p_action = 'request' then
    if request.status = 'pending' then raise exception 'A cancellation request is already pending.'; end if;
    insert into public.match_cancellation_requests (match_id, requesting_team_id, status, requested_at, responded_at)
    values (m.id, p_team_id, 'pending', now(), null)
    on conflict (match_id) do update set requesting_team_id = excluded.requesting_team_id,
      status = 'pending', requested_at = now(), responded_at = null;
    perform public.gb_notify_team(opponent, 'Match cancellation requested',
      'The other team requested to cancel your match. Open the match page to accept or deny.', 'match', m.id);
  else
    if request.status is distinct from 'pending' then raise exception 'There is no pending cancellation request.'; end if;
    if request.requesting_team_id is distinct from opponent then
      raise exception 'Only the other team can respond to a cancellation request.';
    end if;
    update public.match_cancellation_requests set status = case when p_action = 'accept' then 'accepted' else 'denied' end,
      responded_at = now() where match_id = m.id;
    if p_action = 'accept' then
      update public.matches set status = 'cancelled' where id = m.id;
    end if;
    perform public.gb_notify_team(opponent, 'Match cancellation ' || case when p_action = 'accept' then 'accepted' else 'denied' end,
      case when p_action = 'accept' then 'Both teams agreed to cancel the match.' else 'The other team denied your cancellation request. The match remains scheduled.' end,
      'match', m.id);
  end if;
end;
$$;
revoke all on function public.gb_manage_match_cancellation(uuid, uuid, text) from public, anon;
grant execute on function public.gb_manage_match_cancellation(uuid, uuid, text) to authenticated;

create function public.gb_guard_match_cancellation()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if new.status = 'cancelled' and old.status is distinct from 'cancelled'
     and not public.gb_is_db_role()
     and not (auth.uid() is not null and public.has_staff_permission('match_review')) then
    raise exception 'Match cancellation requires both teams to agree.';
  end if;
  return new;
end;
$$;
create trigger matches_guard_cancellation before update of status on public.matches
for each row execute function public.gb_guard_match_cancellation();

notify pgrst, 'reload schema';
