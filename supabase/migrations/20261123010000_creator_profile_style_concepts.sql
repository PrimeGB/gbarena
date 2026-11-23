begin;

alter table public.creator_profile_styles
  drop constraint creator_profile_styles_theme_check,
  add constraint creator_profile_styles_theme_check
    check (theme in (
      'classic', 'gold', 'ice', 'inferno', 'legacy', 'viper', 'eclipse', 'champion',
      'sovereign', 'aftershock', 'rival', 'spotlight'
    ));

create or replace function public.gb_save_creator_profile_style(
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
  if p_theme is null or p_theme not in (
    'classic', 'gold', 'ice', 'inferno', 'legacy', 'viper', 'eclipse', 'champion',
    'sovereign', 'aftershock', 'rival', 'spotlight'
  ) or p_show_name is null or p_show_logo is null then
    raise exception 'Choose a valid profile style and options';
  end if;
  insert into public.creator_profile_styles(user_id, theme, show_name, show_logo, updated_at)
  values (v_target, p_theme, p_show_name, p_show_logo, now())
  on conflict (user_id) do update set theme = excluded.theme, show_name = excluded.show_name,
    show_logo = excluded.show_logo, updated_at = excluded.updated_at;
end;
$$;

commit;
