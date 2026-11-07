alter table public.staff_award_catalog
  add column if not exists auto_award boolean not null default false;

insert into public.staff_award_catalog (name, award_group, purpose, exclusive, auto_award) values
  ('Bug Finder', 'Community', 'Gold tier: awarded for one staff-confirmed site bug that has been fixed.', false, true),
  ('Bug Finder — Emerald', 'Community', 'Emerald tier: awarded for three staff-confirmed site bugs that have been fixed.', false, true),
  ('Bug Finder — Diamond', 'Community', 'Diamond tier: awarded for five staff-confirmed site bugs that have been fixed.', false, true),
  ('Bug Finder — Mythic', 'Community', 'Mythic tier: awarded for ten staff-confirmed site bugs that have been fixed.', false, true),
  ('Recruitment Recruit', 'Community', 'Bronze tier: awarded when one invited player verifies their email and links a unique gaming account.', false, true),
  ('Community Recruiter', 'Community', 'Silver tier: awarded for three qualified player referrals.', false, true),
  ('Recruitment Captain', 'Community', 'Gold tier: awarded for five qualified player referrals.', false, true),
  ('Recruitment Legend', 'Community', 'Diamond tier: awarded for ten qualified player referrals.', false, true)
on conflict (name) do update set
  award_group = excluded.award_group,
  purpose = excluded.purpose,
  exclusive = excluded.exclusive,
  auto_award = excluded.auto_award;

create table if not exists public.community_bug_reports (
  id bigint generated always as identity primary key,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (length(trim(title)) between 4 and 160),
  details text not null check (length(trim(details)) between 10 and 5000),
  status text not null default 'submitted'
    check (status in ('submitted', 'fixed', 'rejected', 'duplicate')),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  review_reason text not null default '',
  created_at timestamptz not null default now(),
  check (
    (status = 'submitted' and reviewed_by is null and reviewed_at is null)
    or (status <> 'submitted' and reviewed_by is not null and reviewed_at is not null)
  )
);

create index if not exists community_bug_reports_queue_idx
  on public.community_bug_reports(status, created_at desc);
create index if not exists community_bug_reports_reporter_idx
  on public.community_bug_reports(reporter_id, created_at desc);

alter table public.community_bug_reports enable row level security;
revoke all on public.community_bug_reports from public, anon, authenticated;

create or replace function public.gb_submit_bug_finder_report(
  p_title text,
  p_details text
)
returns bigint
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_report_id bigint;
begin
  if auth.uid() is null then
    raise exception 'Sign in to submit a bug report for award consideration';
  end if;
  if not exists (
    select 1 from auth.users
    where id = auth.uid() and email_confirmed_at is not null
  ) then
    raise exception 'Verify your email before submitting a bug report for award consideration';
  end if;
  if not exists (select 1 from public.profiles where id = auth.uid()) then
    raise exception 'Complete account setup before submitting a bug report';
  end if;
  if length(trim(coalesce(p_title, ''))) not between 4 and 160
     or length(trim(coalesce(p_details, ''))) not between 10 and 5000 then
    raise exception 'Enter a title and details within the allowed length';
  end if;
  if (
    select count(*)
    from public.community_bug_reports
    where reporter_id = auth.uid()
      and created_at > now() - interval '24 hours'
  ) >= 5 then
    raise exception 'You have reached the daily bug-report limit';
  end if;

  insert into public.community_bug_reports(reporter_id, title, details)
  values (auth.uid(), trim(p_title), trim(p_details))
  returning id into v_report_id;

  return v_report_id;
end;
$$;

revoke all on function public.gb_submit_bug_finder_report(text, text) from public, anon;
grant execute on function public.gb_submit_bug_finder_report(text, text) to authenticated;

create or replace function public.gb_reconcile_bug_finder_awards(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_fixed_count integer;
  v_tier record;
begin
  if p_user_id is null then
    return;
  end if;

  select count(*) into v_fixed_count
  from public.community_bug_reports
  where reporter_id = p_user_id and status = 'fixed';

  for v_tier in
    select * from (values
      (1, 'Bug Finder'),
      (3, 'Bug Finder — Emerald'),
      (5, 'Bug Finder — Diamond'),
      (10, 'Bug Finder — Mythic')
    ) as tiers(required_count, award_name)
  loop
    if v_fixed_count >= v_tier.required_count then
      perform public.gb_grant_auto_award(p_user_id, v_tier.award_name);
    end if;
  end loop;
end;
$$;

revoke all on function public.gb_reconcile_bug_finder_awards(uuid) from public, anon, authenticated;

create or replace function public.staff_list_bug_finder_reports()
returns setof jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.has_staff_permission('awards') then
    raise exception 'Administrator access is required to review bug reports';
  end if;

  return query
    select jsonb_build_object(
      'id', reports.id,
      'title', reports.title,
      'details', reports.details,
      'reporter', coalesce(profiles.username, 'Deleted account'),
      'created_at', reports.created_at
    )
    from public.community_bug_reports reports
    left join public.profiles profiles on profiles.id = reports.reporter_id
    where reports.status = 'submitted'
    order by reports.created_at asc
    limit 100;
end;
$$;

revoke all on function public.staff_list_bug_finder_reports() from public, anon;
grant execute on function public.staff_list_bug_finder_reports() to authenticated;

create or replace function public.staff_review_bug_finder_report(
  p_report_id bigint,
  p_result text,
  p_review_reason text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_report public.community_bug_reports%rowtype;
begin
  if not public.has_staff_permission('awards') then
    raise exception 'Administrator access is required to review bug reports';
  end if;
  if coalesce(p_result, '') not in ('fixed', 'rejected', 'duplicate') then
    raise exception 'Choose a valid bug report outcome';
  end if;
  if length(trim(coalesce(p_review_reason, ''))) not between 10 and 1000 then
    raise exception 'Enter a review reason between 10 and 1000 characters';
  end if;

  select * into v_report
  from public.community_bug_reports
  where id = p_report_id and status = 'submitted'
  for update;
  if not found then
    raise exception 'Pending bug report not found';
  end if;

  update public.community_bug_reports
  set status = p_result,
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      review_reason = trim(p_review_reason)
  where id = p_report_id;

  insert into public.staff_activity_log(
    actor_id, action, target_type, target_id, previous_values, new_values, reason
  ) values (
    auth.uid(),
    'bug_finder_report_reviewed',
    'community_bug_report',
    p_report_id::text,
    jsonb_build_object('status', v_report.status),
    jsonb_build_object('status', p_result, 'reporter_id', v_report.reporter_id),
    trim(p_review_reason)
  );

  if p_result = 'fixed' then
    perform public.gb_reconcile_bug_finder_awards(v_report.reporter_id);
  end if;
end;
$$;

revoke all on function public.staff_review_bug_finder_report(bigint, text, text) from public, anon;
grant execute on function public.staff_review_bug_finder_report(bigint, text, text) to authenticated;

create table if not exists public.community_referral_codes (
  owner_id uuid primary key references public.profiles(id) on delete cascade,
  code text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.community_referrals (
  invited_user_id uuid primary key references public.profiles(id) on delete cascade,
  referrer_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  check (invited_user_id <> referrer_id)
);

create table if not exists public.community_referral_signups (
  user_id uuid primary key references auth.users(id) on delete cascade,
  referral_code text not null check (referral_code ~ '^[0-9a-f]{32}$'),
  created_at timestamptz not null default now()
);

create index if not exists community_referrals_referrer_idx
  on public.community_referrals(referrer_id, created_at desc);
create index if not exists gaming_accounts_referral_identity_idx
  on public.gaming_accounts(platform, category, game, lower(trim(account_id)));

alter table public.community_referral_codes enable row level security;
alter table public.community_referrals enable row level security;
alter table public.community_referral_signups enable row level security;
revoke all on public.community_referral_codes from public, anon, authenticated;
revoke all on public.community_referrals from public, anon, authenticated;
revoke all on public.community_referral_signups from public, anon, authenticated;

create or replace function public.gb_capture_referral_on_signup()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_code text := lower(trim(coalesce(new.raw_user_meta_data ->> 'referral_code', '')));
begin
  if v_code ~ '^[0-9a-f]{32}$' then
    insert into public.community_referral_signups(user_id, referral_code)
    values (new.id, v_code)
    on conflict (user_id) do nothing;
  end if;
  return new;
end;
$$;

revoke all on function public.gb_capture_referral_on_signup() from public, anon, authenticated;
drop trigger if exists auth_user_capture_community_referral on auth.users;
create trigger auth_user_capture_community_referral
after insert on auth.users
for each row execute function public.gb_capture_referral_on_signup();

create or replace function public.gb_is_qualified_referral(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from auth.users invited
    where invited.id = p_user_id
      and invited.email_confirmed_at is not null
      and exists (
        select 1
        from public.gaming_accounts accounts
        where accounts.user_id = invited.id
          and not exists (
            select 1
            from public.gaming_accounts duplicate_accounts
            where duplicate_accounts.user_id <> accounts.user_id
              and duplicate_accounts.platform = accounts.platform
              and duplicate_accounts.category = accounts.category
              and duplicate_accounts.game = accounts.game
              and lower(trim(duplicate_accounts.account_id)) = lower(trim(accounts.account_id))
          )
      )
  );
$$;

revoke all on function public.gb_is_qualified_referral(uuid) from public, anon, authenticated;

create or replace function public.gb_attribute_referral()
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_referrer_id uuid;
  v_existing_referrer uuid;
  v_rows_inserted integer;
begin
  if auth.uid() is null then
    raise exception 'Sign in to apply a referral';
  end if;
  if not exists (
    select 1 from auth.users
    where id = auth.uid() and email_confirmed_at is not null
  ) then
    raise exception 'Verify your email before applying a referral';
  end if;
  if not exists (select 1 from public.profiles where id = auth.uid()) then
    raise exception 'Complete account setup before applying a referral';
  end if;

  select owner_id into v_referrer_id
  from public.community_referral_signups signups
  join public.community_referral_codes codes on codes.code = signups.referral_code
  where signups.user_id = auth.uid();
  if v_referrer_id is null or v_referrer_id = auth.uid() then
    delete from public.community_referral_signups where user_id = auth.uid();
    return false;
  end if;

  select referrer_id into v_existing_referrer
  from public.community_referrals
  where invited_user_id = auth.uid();
  if v_existing_referrer is not null then
    delete from public.community_referral_signups where user_id = auth.uid();
    return v_existing_referrer = v_referrer_id;
  end if;

  insert into public.community_referrals(invited_user_id, referrer_id)
  values (auth.uid(), v_referrer_id)
  on conflict (invited_user_id) do nothing;
  get diagnostics v_rows_inserted = row_count;

  if v_rows_inserted = 1 then
    perform public.gb_reconcile_referral_awards(v_referrer_id);
    delete from public.community_referral_signups where user_id = auth.uid();
    return true;
  end if;

  select referrer_id into v_existing_referrer
  from public.community_referrals
  where invited_user_id = auth.uid();
  delete from public.community_referral_signups where user_id = auth.uid();
  return v_existing_referrer = v_referrer_id;
end;
$$;

revoke all on function public.gb_attribute_referral() from public, anon;
grant execute on function public.gb_attribute_referral() to authenticated;

create or replace function public.gb_reconcile_referral_awards(p_referrer_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_qualified_count integer;
  v_tier record;
begin
  if p_referrer_id is null then
    return;
  end if;

  select count(*) into v_qualified_count
  from public.community_referrals referrals
  where referrals.referrer_id = p_referrer_id
    and public.gb_is_qualified_referral(referrals.invited_user_id);

  for v_tier in
    select * from (values
      (1, 'Recruitment Recruit'),
      (3, 'Community Recruiter'),
      (5, 'Recruitment Captain'),
      (10, 'Recruitment Legend')
    ) as tiers(required_count, award_name)
  loop
    if v_qualified_count >= v_tier.required_count then
      perform public.gb_grant_auto_award(p_referrer_id, v_tier.award_name);
    end if;
  end loop;
end;
$$;

revoke all on function public.gb_reconcile_referral_awards(uuid) from public, anon, authenticated;

create or replace function public.gb_referral_progress()
returns table (
  referral_code text,
  qualified_referrals integer,
  pending_referrals integer
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then
    raise exception 'Sign in to view referral progress';
  end if;

  insert into public.community_referral_codes(owner_id, code)
  values (auth.uid(), lower(replace(gen_random_uuid()::text, '-', '')))
  on conflict (owner_id) do nothing;

  return query
    select codes.code,
      count(referrals.invited_user_id) filter (
        where public.gb_is_qualified_referral(referrals.invited_user_id)
      )::integer,
      count(referrals.invited_user_id) filter (
        where not public.gb_is_qualified_referral(referrals.invited_user_id)
      )::integer
    from public.community_referral_codes codes
    left join public.community_referrals referrals on referrals.referrer_id = codes.owner_id
    where codes.owner_id = auth.uid()
    group by codes.code;
end;
$$;

revoke all on function public.gb_referral_progress() from public, anon;
grant execute on function public.gb_referral_progress() to authenticated;

create or replace function public.gb_on_referral_gaming_account()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.gb_reconcile_referral_awards(referrals.referrer_id)
  from public.community_referrals referrals
  where referrals.invited_user_id = new.user_id;
  return new;
end;
$$;

drop trigger if exists gaming_accounts_referral_awards on public.gaming_accounts;
create trigger gaming_accounts_referral_awards
after insert on public.gaming_accounts
for each row execute function public.gb_on_referral_gaming_account();

with site_updates as (
  select id from public.forum_posts
  where author = 'Prime' and category = 'News & Updates' and pinned and not hidden
    and subject ilike '%Site Updates%'
  order by created_at desc
  limit 1
)
update public.forum_posts as post
set message = concat_ws(
  E'\n\n', nullif(trim(post.message), ''),
  'New community awards recognize confirmed bug fixes and players who bring active members to GameBattles.'
)
from site_updates
where post.id = site_updates.id
  and coalesce(post.message, '') not like '%confirmed bug fixes and players who bring active members%';
