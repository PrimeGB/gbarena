-- These awards are reviewed and granted by staff, not awarded automatically.
insert into public.staff_award_catalog (name, award_group, purpose, exclusive) values
  ('Bug Finder', 'Community', 'For reporting a verified issue that helps improve the site.', false),
  ('Bug Hunter', 'Community', 'For consistently reporting useful, verified site issues.', false),
  ('Critical Discovery', 'Community', 'For responsibly reporting a significant site issue to staff.', false),
  ('Fix Investigator', 'Community', 'For providing clear steps and evidence that help staff reproduce an issue.', false),
  ('Quality Vanguard', 'Community', 'For repeatedly testing improvements and providing actionable feedback.', false),
  ('Early Warning', 'Community', 'For alerting staff to an emerging issue before it affects more members.', false),
  ('Idea Forge', 'Community', 'For a community suggestion adopted to improve GameBattles.', false),
  ('Community Architect', 'Community', 'For several valuable ideas that improve the community experience.', false),
  ('Newcomer Guide', 'Community', 'For helping new members find their footing on GameBattles.', false),
  ('Knowledge Keeper', 'Community', 'For creating useful guides or resources for other members.', false),
  ('Problem Solver', 'Community', 'For helping members resolve difficult site questions.', false),
  ('Community Voice', 'Community', 'For constructive feedback that represents the needs of members.', false),
  ('Bridge Builder', 'Community', 'For bringing players together and strengthening the community.', false),
  ('Event Supporter', 'Community', 'For helping staff run a successful community event.', false),
  ('Recruiting Ally', 'Community', 'For helping players and teams connect with one another.', false),
  ('Positive Influence', 'Community', 'For consistently encouraging a welcoming and respectful community.', false),
  ('Community Defender', 'Community', 'For responsibly reporting conduct that threatens the community.', false),
  ('Community Historian', 'Community', 'For preserving memorable GameBattles stories and milestones.', false),
  ('Opening Strike', 'Players', 'For an outstanding opening performance in a verified match.', false),
  ('Last Stand', 'Players', 'For a remarkable last-player-standing defense in a verified match.', false),
  ('Precision Strike', 'Players', 'For exceptional accuracy in a verified featured match.', false),
  ('Objective Specialist', 'Players', 'For exceptional objective play in a verified match.', false),
  ('Iron Defense', 'Players', 'For an exceptional defensive performance in a verified match.', false),
  ('Breakthrough', 'Players', 'For a decisive offensive play in a verified match.', false),
  ('Battlefield Adaptation', 'Players', 'For adapting tactics to overcome a difficult opponent.', false),
  ('Rivalry Victor', 'Players', 'For winning a notable staff-verified rivalry match.', false),
  ('Squad Anchor', 'Players', 'For reliable support that helps a team win a featured match.', false),
  ('Tactical Commander', 'Players', 'For outstanding tactical leadership in a featured match.', false),
  ('Team Synergy', 'Players', 'For exceptional teamwork in a staff-reviewed match.', false),
  ('Resilient Competitor', 'Players', 'For returning to competition and delivering a notable performance.', false),
  ('Road Warrior', 'Players', 'For a notable run through a challenging tournament bracket.', false),
  ('Bracket Breaker', 'Players', 'For a remarkable upset during a verified tournament run.', false),
  ('Final Round Hero', 'Players', 'For a decisive play in the final round of a featured match.', false),
  ('Consistent Contender', 'Players', 'For sustained competitive performance across a season.', false),
  ('Veteran Competitor', 'Players', 'For a long-standing contribution to fair competition.', false),
  ('Sportsmanship Standard', 'Players', 'For exemplary respect toward opponents in competition.', false),
  ('Staff Vanguard', 'Staff', 'For exceptional service to GameBattles as a staff member.', false),
  ('Dispute Specialist', 'Staff', 'For careful, fair handling of complex match disputes.', false),
  ('Match Integrity Officer', 'Staff', 'For outstanding work protecting the integrity of competition.', false),
  ('Tournament Operations', 'Staff', 'For exceptional work running official tournaments.', false),
  ('Community Steward', 'Staff', 'For outstanding support and care for community members.', false),
  ('Staff Mentor', 'Staff', 'For helping train and support fellow staff members.', false),
  ('Investigation Excellence', 'Staff', 'For a thorough and well-documented staff investigation.', false),
  ('Fair Decision', 'Staff', 'For consistently thoughtful and impartial staff decisions.', false),
  ('Behind the Scenes', 'Staff', 'For essential staff work that keeps the site running smoothly.', false),
  ('Rapid Response', 'Staff', 'For responding effectively to a time-sensitive community issue.', false),
  ('Staff Reliability', 'Staff', 'For dependable service and follow-through over time.', false),
  ('Event Commander', 'Staff', 'For leading an outstanding official community event.', false),
  ('Service Above Self', 'Staff', 'For going beyond normal duties to help players and staff.', false),
  ('Staff Legacy', 'Staff', 'For a lasting positive impact through dedicated staff service.', false)
on conflict (name) do nothing;

with site_updates as (
  select id from public.forum_posts
  where author = 'Prime' and category = 'News & Updates' and pinned and not hidden
    and subject ilike '%Site Updates%'
  order by created_at desc
  limit 1
)
update public.forum_posts as post
set message = concat_ws(
  E'\n\n', nullif(trim(post.message), ''),
  'Latest release: 50 new awards recognize players, staff, and community contributions, including members who help us find and report site bugs.'
)
from site_updates
where post.id = site_updates.id
  and coalesce(post.message, '') not like '%50 new awards recognize players, staff, and community contributions%';
