alter policy forum_posts_read on public.forum_posts to authenticated;
create policy forum_posts_anonymous_read on public.forum_posts
  for select to anon using (not hidden);

alter policy forum_replies_read on public.forum_replies to authenticated;
create policy forum_replies_anonymous_read on public.forum_replies
  for select to anon using (not hidden);
