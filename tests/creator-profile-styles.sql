-- Run against an isolated migrated database. All fixtures roll back.
begin;

do $$
declare
  founder uuid := gen_random_uuid();
  creator uuid := gen_random_uuid();
  other_creator uuid := gen_random_uuid();
  outsider uuid := gen_random_uuid();
  request_id bigint;
begin
  insert into auth.users(id, raw_user_meta_data) values
    (founder, jsonb_build_object('username', 'founder' || substr(founder::text, 1, 8))),
    (creator, jsonb_build_object('username', 'creator' || substr(creator::text, 1, 8))),
    (other_creator, jsonb_build_object('username', 'other' || substr(other_creator::text, 1, 8))),
    (outsider, jsonb_build_object('username', 'outsider' || substr(outsider::text, 1, 8)));
  update public.profiles set role = 'owner' where id = founder;
  insert into public.ambassadors(user_id, tier, slug) values
    (creator, 'affiliate', 'test-' || substr(creator::text, 1, 8)),
    (other_creator, 'ambassador', 'test-' || substr(other_creator::text, 1, 8));
  if has_table_privilege('authenticated', 'public.creator_profile_requests', 'select')
    or has_table_privilege('anon', 'public.creator_profile_styles', 'select') then
    raise exception 'Creator tables must not be directly readable';
  end if;
  perform set_config('request.jwt.claim.sub', creator::text, true);
  perform public.gb_save_creator_profile_style('ice', true, false);
  if not exists (select 1 from public.gb_creator_profile_style(creator) where tier = 'affiliate' and theme = 'ice' and show_name and not show_logo) then
    raise exception 'Member style and options must be saved and readable';
  end if;
  perform public.gb_save_creator_profile_style('sovereign', true, true);
  if not exists (select 1 from public.gb_creator_profile_style(creator) where theme = 'sovereign') then
    raise exception 'New Ambassador styles must be saved and readable';
  end if;
  perform public.gb_save_creator_profile_style('aftershock', true, true);
  perform public.gb_save_creator_profile_style('rival', true, true);
  perform public.gb_save_creator_profile_style('spotlight', true, true);
  if not exists (select 1 from public.gb_creator_profile_style(creator) where theme = 'spotlight') then
    raise exception 'New profile styles must remain selectable';
  end if;
  begin
    perform public.gb_save_creator_profile_style('gold', true, true, other_creator);
    raise exception 'Members must not change another player style';
  exception when others then
    if sqlerrm <> 'Founder access required' then raise; end if;
  end;
  begin
    perform public.gb_save_creator_profile_style('not-a-theme', true, true);
    raise exception 'Unknown styles must be rejected';
  exception when others then
    if sqlerrm <> 'Choose a valid profile style and options' then raise; end if;
  end;
  perform public.gb_submit_creator_profile_idea('Please use a blue and silver background.');
  begin
    perform public.staff_creator_profile_requests();
    raise exception 'Members must not read the private request queue';
  exception when others then
    if sqlerrm <> 'Founder access required' then raise; end if;
  end;
  perform set_config('request.jwt.claim.sub', outsider::text, true);
  begin
    perform public.gb_save_creator_profile_style('gold', true, true);
    raise exception 'Non-members must not save creator styles';
  exception when others then
    if sqlerrm <> 'This player is not an active Affiliate or Ambassador' then raise; end if;
  end;
  perform set_config('request.jwt.claim.sub', founder::text, true);
  perform public.gb_save_creator_profile_style('inferno', false, true, creator);
  if not exists (select 1 from public.gb_creator_profile_style(creator) where theme = 'inferno' and not show_name and show_logo) then
    raise exception 'Founder must be able to assign a style';
  end if;
  select id into request_id from public.staff_creator_profile_requests() where user_id = creator and status = 'new';
  if request_id is null then raise exception 'Founder must see design requests'; end if;
  perform public.staff_review_creator_profile_request(request_id, 'reviewed');
  if not exists (select 1 from public.staff_creator_profile_requests() where id = request_id and status = 'reviewed') then
    raise exception 'Request review status must persist';
  end if;
  update public.ambassadors set active = false where user_id = creator;
  if exists (select 1 from public.gb_creator_profile_style(creator)) then
    raise exception 'Inactive members must not expose a creator style';
  end if;
end;
$$;
rollback;
