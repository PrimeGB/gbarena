-- Enable RLS on match_posts so the existing Supabase policies are enforced.
-- Run this in your Supabase SQL editor or include it in your migration pipeline.

alter table if exists match_posts enable row level security;
