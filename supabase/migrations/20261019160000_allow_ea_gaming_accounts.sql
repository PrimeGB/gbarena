alter table public.gaming_accounts
  drop constraint if exists gaming_accounts_platform_check;

alter table public.gaming_accounts
  add constraint gaming_accounts_platform_check
  check (platform in ('xbox', 'playstation', 'nintendo', 'pc', 'ea'));

notify pgrst, 'reload schema';
