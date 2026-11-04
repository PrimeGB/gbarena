alter table public.profiles
  add column if not exists secondary_email text default null;

create unique index if not exists profiles_secondary_email_key
  on public.profiles (lower(secondary_email))
  where secondary_email is not null;

-- A linked second email can never be changed or removed once set.
create or replace function public.lock_secondary_email()
returns trigger
language plpgsql
as $$
begin
  if old.secondary_email is not null
     and new.secondary_email is distinct from old.secondary_email then
    raise exception 'Linked email cannot be changed';
  end if;
  return new;
end;
$$;

drop trigger if exists lock_secondary_email on public.profiles;
create trigger lock_secondary_email
  before update on public.profiles
  for each row execute function public.lock_secondary_email();
