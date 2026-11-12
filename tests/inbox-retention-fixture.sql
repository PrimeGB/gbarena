-- Isolated PostgreSQL fixture; never run against a live database.
create schema if not exists auth;
create or replace function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;
create schema cron;
create function cron.schedule(text, text, text) returns bigint language sql as $$ select 1::bigint $$;
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid,
  recipient_id uuid not null,
  sender_type text not null default 'player',
  subject text not null,
  body text not null,
  message_type text not null default 'player',
  related_type text,
  related_id uuid,
  is_read boolean not null default false,
  is_archived boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.messages enable row level security;
grant all on public.messages to anon, authenticated;
grant usage on schema auth to anon, authenticated;
create policy "Users can read their messages" on public.messages for select
  using (auth.uid() = recipient_id or auth.uid() = sender_id);
create policy "Users can update received messages" on public.messages for update
  using (auth.uid() = recipient_id) with check (auth.uid() = recipient_id);
create policy "Users can send player messages" on public.messages for insert
  with check (auth.uid() = sender_id);
insert into public.messages (id, sender_id, recipient_id, subject, body, is_read, created_at) values
  ('00000000-0000-0000-0000-000000000001', null, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Old system', 'body', false, now() - interval '61 days'),
  ('00000000-0000-0000-0000-000000000002', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Old player', 'body', false, now() - interval '61 days'),
  ('00000000-0000-0000-0000-000000000003', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Recent', 'body', false, now() - interval '1 day');
