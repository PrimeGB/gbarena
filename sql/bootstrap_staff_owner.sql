-- Run once in the trusted Supabase SQL Editor after applying all migrations.
-- Replace the placeholder with the initial Owner account's sign-in email.
do $$
declare
  owner_email text := 'REPLACE_WITH_OWNER_EMAIL';
  owner_user_id uuid;
  matching_accounts integer;
begin
  select count(*), (array_agg(id))[1]
    into matching_accounts, owner_user_id
    from auth.users
    where lower(email) = lower(trim(owner_email));

  if matching_accounts <> 1 then
    raise exception 'Expected exactly one Supabase account for the configured Owner email';
  end if;

  update public.profiles
    set role = 'owner'
    where id = owner_user_id;

  if not found then
    raise exception 'The configured Owner account does not have a profile row';
  end if;
end;
$$;
