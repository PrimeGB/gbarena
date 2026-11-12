-- Production-safe regression test: all rows and notifications are rolled back.
-- Storage tests exercise authorization on object metadata, not actual file bytes.
begin;

update public.app_settings set value = '' where key = 'discord_webhook_url';

do $$
#variable_conflict use_variable
declare
  original public.match_posts%rowtype;
  accepting public.teams%rowtype;
  owner_a uuid;
  staff_user uuid;
  post_id uuid;
  match_id uuid;
  result jsonb;
  first_wins integer;
  first_losses integer;
  second_wins integer;
  second_losses integer;
  wins_required integer;
  queue_item jsonb;
  evidence_path text;
  format_number integer;
  i integer;
begin
  select p.* into original from public.match_posts p
  join public.teams a on a.id = p.team_id
  where cardinality(p.posting_roster) = 1 and a.owner_id = p.posting_roster[1]
    and exists (select 1 from public.team_members m where m.team_id = a.id and m.user_id = a.owner_id)
    and public.gb_gaming_account_id(a.owner_id, p.platform, p.category, p.game) is not null
    and exists (
      select 1 from public.teams t
      where t.id <> a.id and t.owner_id is not null and t.owner_id <> a.owner_id
        and t.category = p.category and t.game = p.game and t.ladder = p.ladder
        and (t.platform = p.platform or (p.crossplay and t.platform = any(public.gb_ladder_platforms(p.category, p.game, p.platform))))
        and exists (select 1 from public.team_members tm where tm.team_id = t.id and tm.user_id = t.owner_id)
        and public.gb_gaming_account_id(t.owner_id, t.platform, p.category, p.game) is not null
        and not exists (
          select 1 from public.matches m where coalesce(m.result_processed, false)
            and coalesce(m.completed_at, m.created_at) > now() - interval '24 hours'
            and (a.owner_id = any(coalesce(m.winning_user_ids, '{}') || coalesce(m.losing_user_ids, '{}')))
            and (t.owner_id = any(coalesce(m.winning_user_ids, '{}') || coalesce(m.losing_user_ids, '{}')))
        )
    )
  order by p.created_at desc limit 1;
  if original.id is null then raise exception 'Missing eligible posting team fixture'; end if;
  select owner_id into owner_a from public.teams where id = original.team_id;
  select t.* into accepting from public.teams t
  where t.id <> original.team_id and t.owner_id is not null and t.owner_id <> owner_a
    and t.category = original.category and t.game = original.game and t.ladder = original.ladder
    and (t.platform = original.platform or (original.crossplay and t.platform = any(public.gb_ladder_platforms(original.category, original.game, original.platform))))
    and exists (select 1 from public.team_members tm where tm.team_id = t.id and tm.user_id = t.owner_id)
    and public.gb_gaming_account_id(t.owner_id, t.platform, original.category, original.game) is not null
    and not exists (
      select 1 from public.matches m where coalesce(m.result_processed, false)
        and coalesce(m.completed_at, m.created_at) > now() - interval '24 hours'
        and owner_a = any(coalesce(m.winning_user_ids, '{}') || coalesce(m.losing_user_ids, '{}'))
        and t.owner_id = any(coalesce(m.winning_user_ids, '{}') || coalesce(m.losing_user_ids, '{}'))
    )
  limit 1;
  select id into staff_user from public.profiles
    where role in ('owner', 'admin', 'senior_staff') and id not in (owner_a, accepting.owner_id)
    and not (id = any(original.posting_roster)) limit 1;
  if accepting.id is null or staff_user is null then raise exception 'Missing accepting team or independent staff fixture'; end if;
  wins_required := case coalesce(nullif(regexp_replace(coalesce(original.best_of, ''), '[^0-9]', '', 'g'), '')::integer, 3)
    when 7 then 4 when 5 then 3 when 1 then 1 else 2 end;

  for i in 1..2 loop
    post_id := gen_random_uuid();
    perform set_config('request.jwt.claim.sub', owner_a::text, true);
    execute 'set local role authenticated';
    insert into public.match_posts
    select (jsonb_populate_record(null::public.match_posts, to_jsonb(p) || jsonb_build_object(
      'id', post_id, 'match_time', (now() + interval '90 days' + i * interval '20 minutes')::text,
      'created_at', now(), 'status', 'open'
    ))).* from public.match_posts p where p.id = original.id;
    execute 'reset role';
    perform set_config('request.jwt.claim.sub', accepting.owner_id::text, true);
    select a.match_id into match_id from public.accept_match_post(post_id, accepting.id, array[accepting.owner_id]) a;
    if match_id is null or not exists (select 1 from public.match_participants mp where mp.match_id = match_id and mp.team_id = accepting.id) then
      raise exception 'Match acceptance or roster snapshot failed';
    end if;
    update public.matches m set match_time = now()::text where m.id = match_id;
    select coalesce(wins, 0) into first_wins from public.teams where id = original.team_id;
    select coalesce(losses, 0) into first_losses from public.teams where id = original.team_id;
    select coalesce(wins, 0) into second_wins from public.teams where id = accepting.id;
    select coalesce(losses, 0) into second_losses from public.teams where id = accepting.id;
    perform set_config('request.jwt.claim.sub', owner_a::text, true);
    result := public.report_match_score(match_id, original.team_id, wins_required, 0);
    if result->>'ok' is distinct from 'true' then raise exception 'Score report failed: %', result; end if;
    perform set_config('request.jwt.claim.sub', accepting.owner_id::text, true);
    if i = 1 then
      result := public.confirm_match_and_apply(match_id, accepting.owner_id);
      if result->>'ok' is distinct from 'true' then raise exception 'Score confirmation failed: %', result; end if;
      if not exists (select 1 from public.matches m where m.id = match_id and m.status = 'completed' and m.result_processed and m.winning_team_id = original.team_id) then
        raise exception 'Confirmed match was not finalized correctly';
      end if;
      if (select coalesce(wins, 0) from public.teams where id = original.team_id) <> first_wins + 1
        or (select coalesce(losses, 0) from public.teams where id = accepting.id) <> second_losses + 1 then
        raise exception 'Confirmed result did not update team records: %', result;
      end if;
      result := public.confirm_match_and_apply(match_id, accepting.owner_id);
      if (select coalesce(wins, 0) from public.teams where id = original.team_id) <> first_wins + 1 then
        raise exception 'Confirming twice duplicated stats';
      end if;
    else
      result := public.dispute_match_score(match_id, 'Wrong score');
      if result->>'ok' is distinct from 'true' then raise exception 'Score dispute failed: %', result; end if;
      if not exists (select 1 from public.messages where recipient_id = owner_a and related_id = match_id and subject like 'Score disputed:%')
        or not exists (select 1 from public.messages where recipient_id = accepting.owner_id and related_id = match_id and subject like 'Score disputed:%') then
        raise exception 'Both teams were not notified of the dispute';
      end if;
      if (select coalesce(wins, 0) from public.teams where id = original.team_id) <> first_wins
        or (select coalesce(losses, 0) from public.teams where id = accepting.id) <> second_losses then
        raise exception 'Disputed result changed team records';
      end if;

      for i in 1..2 loop
        perform set_config('request.jwt.claim.sub', (case when i = 1 then owner_a else accepting.owner_id end)::text, true);
        evidence_path := match_id::text || '/' || (case when i = 1 then original.team_id else accepting.id end)::text || '/test-proof.png';
        execute 'set local role authenticated';
        insert into storage.objects(bucket_id, name) values ('dispute-evidence', evidence_path);
        insert into public.dispute_tickets(match_id, team_id, opponent_team_id, created_by, dispute_reason, dispute_description, status, evidence_paths)
        values (match_id, case when i = 1 then original.team_id else accepting.id end,
          case when i = 1 then accepting.id else original.team_id end,
          auth.uid(), 'Wrong score', 'Rollback test evidence', 'open', jsonb_build_array(evidence_path));
        execute 'reset role';
        if not public.has_submitted_dispute_ticket(match_id, case when i = 1 then original.team_id else accepting.id end) then
          raise exception 'Ticket submission was not recorded';
        end if;
        if i = 1 then
          perform set_config('request.jwt.claim.sub', staff_user::text, true);
          if exists (select 1 from public.staff_get_match_review_queue() q where q->>'match_id' = match_id::text) then
            raise exception 'Staff queue exposed the case before both teams filed';
          end if;
          begin
            update public.matches m set match_time = (now() - interval '2 hours')::text where m.id = match_id;
            if not exists (select 1 from public.staff_get_match_review_queue() q where q->>'match_id' = match_id::text) then
              raise exception 'Staff queue did not release a one-sided case after the deadline';
            end if;
            raise exception using errcode = 'P0002', message = 'Rollback deadline test';
          exception when sqlstate 'P0002' then
            null;
          end;
        end if;
      end loop;
      perform set_config('request.jwt.claim.sub', staff_user::text, true);
      select q into queue_item from public.staff_get_match_review_queue() q where q->>'match_id' = match_id::text;
      if queue_item is null or (queue_item->>'submitted_team_count')::integer <> 2 then
        raise exception 'Both teams'' tickets did not reach the staff review queue';
      end if;
      execute 'set local role authenticated';
      if (select count(*) from storage.objects where bucket_id = 'dispute-evidence' and name like match_id::text || '/%') <> 2 then
        raise exception 'Staff could not access both teams'' evidence';
      end if;
      execute 'reset role';
      foreach format_number in array array[1, 2, 3, 5, 7] loop
        begin
          update public.matches m set best_of = 'Best of ' || format_number where m.id = match_id;
          result := public.staff_finalize_disputed_match(match_id, 0,
            case format_number when 1 then 1 when 5 then 3 when 7 then 4 else 2 end,
            'Rollback test: evidence reviewed.');
          if result->>'ok' is distinct from 'true' then raise exception 'Staff decision rejected: %', result; end if;
          raise exception using errcode = 'P0002', message = 'Rollback format test';
        exception when sqlstate 'P0002' then
          null;
        end;
      end loop;
      result := public.staff_finalize_disputed_match(match_id, 0, wins_required, 'Rollback test: evidence reviewed.');
      if result->>'ok' is distinct from 'true'
        or not exists (select 1 from public.matches m where m.id = match_id and m.status = 'completed' and m.result_processed and m.winning_team_id = accepting.id)
        or exists (select 1 from public.dispute_tickets t where t.match_id = match_id and t.status <> 'resolved') then
        raise exception 'Staff could not resolve the disputed match: %', result;
      end if;
      if (select coalesce(losses, 0) from public.teams where id = original.team_id) <> first_losses + 1
        or (select coalesce(wins, 0) from public.teams where id = accepting.id) <> second_wins + 1 then
        raise exception 'Staff decision did not update team records';
      end if;
    end if;
  end loop;
  raise notice 'Confirmed and disputed lifecycle checks passed; rolling back.';
end;
$$;

rollback;
