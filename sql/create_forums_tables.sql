-- Run these in your Supabase SQL editor (or psql) to create forum tables

create table if not exists forum_posts (
  id bigserial primary key,
  subject text not null,
  message text,
  system text,
  game text,
  ladder text,
  type text,
  category text,
  author text,
  replies integer default 0,
  views integer default 0,
  created_at timestamptz default now()
);

create table if not exists forum_replies (
  id bigserial primary key,
  post_id bigint references forum_posts(id) on delete cascade,
  author text,
  message text,
  created_at timestamptz default now()
);

create index if not exists idx_forum_posts_created on forum_posts(created_at desc);
create index if not exists idx_forum_replies_post on forum_replies(post_id);
