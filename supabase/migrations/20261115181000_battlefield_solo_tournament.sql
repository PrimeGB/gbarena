insert into public.tournaments
  (title, platform, game, format, team_size, starts_at, max_teams, is_free, entry_fee,
   entry_fee_credits, prize_credits, prize, rules, status, entry_kind, min_players, winner_award, target_score)
select 'Battlefield 6 1v1 TDM Tournament', null, 'Battlefield 6', 'Single Elimination - First to 25 kills',
  '1v1 Team Deathmatch', null, 32, true, 0, 0, 10, 'Tournament Winner Trophy',
  E'Date and time: TBD.\n\n1v1 Team Deathmatch. First player to 25 kills wins. This tournament uses a kill target rather than the solo ladder time-limit rule. Single elimination with a randomly seeded bracket. At least 12 players are required; up to 32 can enter. Registration is free and open to supported crossplay systems.\n\nPlayers report the final score on their bracket match. The opponent confirms it or disputes it for staff review. The champion receives 10 credits and the Tournament Winner Trophy profile award. Match setup details will be announced before the event.',
  'upcoming', 'player', 12, 'Tournament Winner Trophy', 25
where not exists (select 1 from public.tournaments where title = 'Battlefield 6 1v1 TDM Tournament');
