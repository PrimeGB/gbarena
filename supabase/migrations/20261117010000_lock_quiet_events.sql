-- Harvest Brawl and Forum Frontline stay paused until the site is busier.
update public.player_challenges set locked = true where id in ('2026-w48-harvest-brawl', '2026-w49-forum-frontline');

