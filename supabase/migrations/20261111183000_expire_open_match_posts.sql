create function public.gb_expire_open_match_posts()
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  expired_count integer;
begin
  update public.match_posts
  set status = 'expired'
  where status = 'open'
    and public.gb_match_scheduled_at(match_time) <= now();
  get diagnostics expired_count = row_count;
  return expired_count;
end;
$$;

revoke all on function public.gb_expire_open_match_posts() from public;
grant execute on function public.gb_expire_open_match_posts() to anon, authenticated;

create function public.gb_expire_posts_before_insert()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.match_posts
  set status = 'expired'
  where status = 'open'
    and public.gb_match_scheduled_at(match_time) <= now()
    and (
      team_id = new.team_id
      or (platform, category, game, ladder, match_time)
         = (new.platform, new.category, new.game, new.ladder, new.match_time)
    );
  return new;
end;
$$;

create trigger match_posts_00_expire_due
before insert on public.match_posts
for each row execute function public.gb_expire_posts_before_insert();

create function public.gb_reject_expired_post_acceptance()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if old.status = 'open' and new.status = 'accepted'
     and public.gb_match_scheduled_at(old.match_time) <= now() then
    raise exception 'This match post has passed its scheduled time and can no longer be accepted.';
  end if;
  return new;
end;
$$;

create trigger match_posts_reject_expired_acceptance
before update on public.match_posts
for each row execute function public.gb_reject_expired_post_acceptance();

select public.gb_expire_open_match_posts();
select cron.schedule('gb-expire-open-match-posts', '* * * * *', 'select public.gb_expire_open_match_posts()');

notify pgrst, 'reload schema';
