create unique index if not exists profiles_username_normalized_unique
  on public.profiles (lower(btrim(username)))
  where username is not null and btrim(username) <> '';
