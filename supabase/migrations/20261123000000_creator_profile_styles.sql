begin;

create table public.creator_profile_styles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  theme text not null default 'classic' check (theme in ('classic', 'gold', 'ice', 'inferno', 'legacy', 'viper', 'eclipse', 'champion')),
  show_name boolean not null default true,
  show_logo boolean not null default true,
  updated_at timestamptz not null default now()
);
alter table public.creator_profile_styles enable row level security;
revoke all on public.creator_profile_styles from public, anon, authenticated;

create table public.creator_profile_requests (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  tier text not null check (tier in ('affiliate', 'ambassador')),
  idea text not null check (length(trim(idea)) between 10 and 2000),
  status text not null default 'new' check (status in ('new', 'reviewed')),
  created_at timestamptz not null default now()
);
alter table public.creator_profile_requests enable row level security;
revoke all on public.creator_profile_requests from public, anon, authenticated;

create function public.gb_creator_profile_style(p_user uuid)
returns table (tier text, theme text, show_name boolean, show_logo boolean)
language sql stable security definer set search_path = public, pg_temp
as $$
  select a.tier, coalesce(s.theme, 'classic'), coalesce(s.show_name, true), coalesce(s.show_logo, true)
  from public.ambassadors a left join public.creator_profile_styles s on s.user_id = a.user_id
  where a.user_id = p_user and a.active;
$$;
revoke all on function public.gb_creator_profile_style(uuid) from public;
grant execute on function public.gb_creator_profile_style(uuid) to anon, authenticated;

create function public.gb_save_creator_profile_style(
  p_theme text, p_show_name boolean, p_show_logo boolean, p_user uuid default null
)
returns void
language plpgsql volatile security definer set search_path = public, pg_temp
as $$
declare v_target uuid := coalesce(p_user, auth.uid());
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  if v_target <> auth.uid() then perform public.gb_require_founder(); end if;
  if not exists (select 1 from public.ambassadors where user_id = v_target and active) then
    raise exception 'This player is not an active Affiliate or Ambassador';
  end if;
  if p_theme is null or p_theme not in ('classic', 'gold', 'ice', 'inferno', 'legacy', 'viper', 'eclipse', 'champion')
    or p_show_name is null or p_show_logo is null then
    raise exception 'Choose a valid profile style and options';
  end if;
  insert into public.creator_profile_styles(user_id, theme, show_name, show_logo, updated_at)
  values (v_target, p_theme, p_show_name, p_show_logo, now())
  on conflict (user_id) do update set theme = excluded.theme, show_name = excluded.show_name,
    show_logo = excluded.show_logo, updated_at = excluded.updated_at;
end;
$$;
revoke all on function public.gb_save_creator_profile_style(text, boolean, boolean, uuid) from public, anon;
grant execute on function public.gb_save_creator_profile_style(text, boolean, boolean, uuid) to authenticated;

create function public.gb_submit_creator_profile_idea(p_idea text)
returns void
language plpgsql volatile security definer set search_path = public, pg_temp
as $$
declare v_tier text;
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  select tier into v_tier from public.ambassadors where user_id = auth.uid() and active;
  if v_tier is null then raise exception 'Active Affiliate or Ambassador membership required'; end if;
  if p_idea is null or length(trim(p_idea)) not between 10 and 2000 then
    raise exception 'Describe your idea in 10 to 2,000 characters';
  end if;
  insert into public.creator_profile_requests(user_id, tier, idea) values (auth.uid(), v_tier, trim(p_idea));
end;
$$;
revoke all on function public.gb_submit_creator_profile_idea(text) from public, anon;
grant execute on function public.gb_submit_creator_profile_idea(text) to authenticated;

create function public.staff_creator_profile_requests()
returns table (id bigint, user_id uuid, username text, tier text, idea text, status text, created_at timestamptz)
language plpgsql stable security definer set search_path = public, pg_temp
as $$
begin
  perform public.gb_require_founder();
  return query select r.id, r.user_id, p.username, r.tier, r.idea, r.status, r.created_at
    from public.creator_profile_requests r join public.profiles p on p.id = r.user_id
    order by (r.status = 'new') desc, r.created_at desc limit 200;
end;
$$;
create function public.staff_review_creator_profile_request(p_id bigint, p_status text)
returns void
language plpgsql volatile security definer set search_path = public, pg_temp
as $$
begin
  perform public.gb_require_founder();
  if p_status is null or p_status not in ('new', 'reviewed') then raise exception 'Invalid request status'; end if;
  update public.creator_profile_requests set status = p_status where id = p_id;
  if not found then raise exception 'Design request not found'; end if;
end;
$$;
revoke all on function public.staff_creator_profile_requests() from public, anon;
revoke all on function public.staff_review_creator_profile_request(bigint, text) from public, anon;
grant execute on function public.staff_creator_profile_requests() to authenticated;
grant execute on function public.staff_review_creator_profile_request(bigint, text) to authenticated;

commit;
