-- Launch Week stays paused until the site reaches 100 members.
update public.player_challenges set locked = true where id = '2026-w47-launch-week';
