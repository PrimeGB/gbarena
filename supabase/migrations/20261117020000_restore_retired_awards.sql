-- Bring back 30 retired award designs, each with its own task that no other award covers.
begin;

insert into public.staff_award_catalog (name, award_group, purpose, exclusive, auto_award) values
  ('100 Wins Badge', 'Wins', 'Win 100 official ladder matches.', false, true),
  ('Ladder Champion Shield', 'Ladder', 'Hold the #1 spot on any ladder for 7 days in a row.', false, false),
  ('Top 10 Team Ribbon', 'Ranking', 'Lead a team into the top 10 of a ladder''s live standings.', false, false),
  ('Breakthrough', 'Players', 'Earn your team''s first-ever ladder win.', false, false),
  ('Clutch Victory Medal', 'Matches', 'Win a match that goes all the way to the deciding map or round.', false, false),
  ('Top Fragger Medal', 'Matches', 'Finish as top fragger in a staff-reviewed featured match.', false, false),
  ('Last Stand', 'Players', 'Win a round as the last player alive on your team in a featured match.', false, false),
  ('Rivalry Respect Trophy', 'Highlights', 'Congratulate your opponent in the match comments after a loss.', false, false),
  ('Weekly Cup Winner', 'Competition', 'Win a staff-run weekly cup.', false, false),
  ('Tournament Third Place Medal', 'Tournament', 'Finish third in an official tournament.', false, false),
  ('Tournament Finalist Trophy', 'Tournament', 'Reach the final four of an official tournament.', false, false),
  ('Bracket Breaker', 'Players', 'Knock the top seed out of an official tournament.', false, false),
  ('Undefeated Season Shield', 'Season', 'Win an official tournament without dropping a single map or round.', false, false),
  ('Major Champion Shield', 'Champion', 'Win a major: an official tournament with 32 or more entrants.', false, false),
  ('Season Champion Shield', 'Season', 'Win a seasonal cup event such as a summer or winter championship.', false, false),
  ('Grand Champion Crown', 'Champion', 'Finish #1 in the regular season and win the playoffs in the same season.', false, false),
  ('GameBattles Immortal Crystal', 'Legacy', 'Win the year-end Grand Finals between season playoff champions.', true, false),
  ('Community Legend Crown', 'Legacy', 'Voted Community Member of the Year by the players.', false, false),
  ('Welcome Wagon Trophy', 'Community', 'Be the first to welcome a new member in their introduction thread.', false, false),
  ('Community Contributor Plaque', 'Community', 'Have one of your forum threads pinned by staff.', false, false),
  ('Featured Player Plaque', 'Featured', 'Be featured in a staff Player Spotlight post.', false, false),
  ('Streamer Spotlight Medal', 'Community', 'Stream a GameBattles match live and share it with the community.', false, false),
  ('Creative Mind Trophy', 'Community', 'Create artwork, a logo or a graphic that GameBattles uses.', false, false),
  ('Community Architect', 'Community', 'Help staff design and launch a new ladder or game.', false, false),
  ('Critical Discovery', 'Community', 'Report a bug that staff rate as critical, such as a security or data issue.', false, false),
  ('Holiday Event Medal', 'Events', 'Take part in a staff-run holiday community event.', false, false),
  ('Alpha Tester Medal', 'Tester', 'Help test a new GameBattles feature before it goes live.', false, false),
  ('Staff Mentor', 'Staff', 'Train and guide a new member of the staff team.', false, false),
  ('Match Integrity Officer', 'Staff', 'Uncover a cheating or ringer case and keep the ladders fair.', false, false),
  ('3 Year Service Medal', 'Service', 'Serve on the GameBattles staff team for three years.', false, false)
on conflict (name) do update set award_group = excluded.award_group, purpose = excluded.purpose,
  exclusive = excluded.exclusive, auto_award = excluded.auto_award;

-- 100 Wins is granted by the existing profile win trigger; catch up anyone who already qualifies.
select public.gb_grant_auto_award(p.id, '100 Wins Badge')
from public.profiles p where coalesce(p.wins, 0) >= 100;

commit;
