alter table public.profiles add column if not exists created_at timestamptz;

update public.profiles p
set created_at = u.created_at
from auth.users u
where u.id = p.id and p.created_at is null;

update public.profiles set created_at = now() where created_at is null;

alter table public.profiles alter column created_at set default now();
