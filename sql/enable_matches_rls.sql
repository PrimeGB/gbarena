-- Enable RLS on matches so the existing Supabase policies are enforced.
-- Run this in your Supabase SQL editor or include it in your migration pipeline.

alter table if exists matches enable row level security;
