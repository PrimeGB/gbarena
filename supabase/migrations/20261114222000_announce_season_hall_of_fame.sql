do $$
declare thread_id bigint;
begin
  select id into thread_id from public.forum_posts
    where author='Prime' and category='News & Updates' and pinned and not hidden
      and subject ilike '%Site Updates%'
    order by created_at desc limit 1;
  if thread_id is null then raise exception 'Pinned Site Updates thread not found'; end if;
  update public.forum_posts set message=concat_ws(E'\n\n',nullif(trim(message),''),
    'Monthly season recognition and the Hall of Fame are here! Browse past player and team leaderboards, see season champions across games and ladders, and earn exclusive season badges, Top 10 recognition and rare achievements. At least five official matches and one win are needed to qualify, and tied records share places. The Hall of Fame is in the dashboard Awards & Achievements area, with clearly marked examples while we build our first champions.',
    'The community feed now celebrates friendships, match wins, teams climbing the ranks, new teams, tournament champions, earned awards and winning a rematch against a rival. Public-friend settings are respected. Free singles tournaments are coming soon, with the game and schedule still to be announced; team events remain in the tournament hub. We have also cleaned up the homepage slideshow by removing its large GameBattles slogan overlay.')
    where id=thread_id and coalesce(message,'') not like '%Monthly season recognition and the Hall of Fame are here!%';
end;
$$;
