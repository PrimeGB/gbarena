alter table public.match_posts add column if not exists additional_rules jsonb;
alter table public.matches add column if not exists additional_rules jsonb;

alter table public.match_posts
  add constraint match_posts_additional_rules_object
  check (additional_rules is null or (jsonb_typeof(additional_rules) = 'object' and octet_length(additional_rules::text) <= 16384));

create or replace function public.gb_copy_match_additional_rules()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.match_post_id is not null then
    select additional_rules into new.additional_rules
    from public.match_posts
    where id = new.match_post_id;
  end if;
  return new;
end;
$$;

create trigger copy_match_additional_rules
before insert on public.matches
for each row execute function public.gb_copy_match_additional_rules();

create or replace function public.gb_guard_additional_match_rules()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.additional_rules is distinct from old.additional_rules then
    raise exception 'Posted match rules cannot be changed.';
  end if;
  return new;
end;
$$;

create trigger guard_post_additional_rules
before update on public.match_posts
for each row execute function public.gb_guard_additional_match_rules();

create trigger guard_match_additional_rules
before update on public.matches
for each row execute function public.gb_guard_additional_match_rules();

notify pgrst, 'reload schema';
