alter table public.tournaments alter column starts_at drop not null;

insert into public.tournaments
  (title, platform, game, format, team_size, starts_at, check_in_minutes, max_teams, is_free, entry_fee, prize, rules, status)
select
  'Rapid Royal Trios Kill Race Tournament',
  null,
  'Battlefield 6',
  'Kill Race - Best of 1 Bracket',
  '3v3 (Trios)',
  null,
  30,
  null,
  true,
  0,
  'TBD',
  $rules$TOURNAMENT DATE: TBD - the date and time will be announced here and in Discord.

FORMAT
- Trios only. Teams of exactly 3 players (no subs unless staff approve one before check-in).
- Single elimination bracket seeded by registration order. Every match is a Best of 1 kill race; the final may be Best of 3.
- Teams must check in 30 minutes before start or they forfeit their spot.

HOW A KILL RACE WORKS
1. Team A loads in against an enemy player (the opposing team's designated player or a staff-provided opponent).
2. Team A's players play until all three have died once. Once a player dies they spectate and may not play again that round.
3. Team A's total kills are recorded when the last player dies.
4. Team B then loads in and does the same.
5. The team with the most total kills wins. If kills are tied, a one-life sudden death round is played with the same rules.

RULES
- Players must have their own account and a verified gamer tag on their profile.
- Every kill must be earned from enemy players or the staff-approved opponent. Deliberate team-kill boosting, glitching, or exploiting is an instant disqualification.
- Both teams must record the match (screen capture or stream) and keep the footage until the tournament ends.
- Each team captain must submit the kill totals with screenshots. Disputes go through a Support ticket within 15 minutes of the match.
- If a player disconnects before their first death, the team may reconnect once. A second disconnect counts as that player's death.
- Teams that are 10 minutes late to a match forfeit.
- Cheating, harassment or toxic behavior results in removal and a ladder ban.
- Staff decisions are final.$rules$,
  'upcoming'
where not exists (
  select 1 from public.tournaments where title = 'Rapid Royal Trios Kill Race Tournament'
);
