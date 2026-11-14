# GameBattles

## Bringing Back Competitive Gaming

GameBattles is a modern recreation inspired by the golden era of online competitive gaming.

Our mission is to restore the rivalries, rankings, ladders, tournaments, team battles, and community-driven competition that made online gaming unforgettable.

Built by gamers, for gamers.

---

## Current Status

🚧 Active Development

GameBattles is currently being rebuilt from the ground up using modern technology while preserving the competitive spirit that made the original experience special.

The platform is not yet publicly released.

The signed-in activity page provides a general feed and saved Favorites.
Community updates remain in the feed for 48 hours unless saved. The profile's
Following box previews recent activity from followed players and teams.
Players can react to match and award moments and share activity links. Staff
create the first free Saturday Community Cup (default start: 8 PM Eastern); the
next one is then scheduled automatically each week. Weekly winners receive 5
credits and a winner award per player. Staff can award the previous month's top
team 25 credits and a champion award per player. Apply the community and
competition migration in `supabase/migrations` before deploying these features.

The home-page hero uses only its existing curated images. It no longer adds
storefront or trending-game art automatically; future game art should feature
games that have ladders on GameBattles.

The award catalog includes staff-reviewed player, staff, and community awards.
Signed-in members can submit site bugs through the Suggestions Box. Staff review
reports and award cumulative Bug Finder tiers after confirming a unique issue
has been fixed (1, 3, 5, and 10 fixes). Referral links are available from a
player's awards page; an invite qualifies after the new member verifies their
email and links a gaming account not already claimed by another account. The
referral tiers unlock at 1, 3, 5, and 10 qualified invites. Staff review bug
reports in the Awards & Trophy Management portal, where decisions are audited.
Apply the tiered bug and referral awards migration in `supabase/migrations`
before deploying these features.

### Monthly seasons, Hall of Fame and community moments

`/players/top` offers current and past monthly season boards for players and
teams, globally, per game, and per game/ladder (combined across platforms).
`/teams/top` redirects to the real team board rather than example teams.
Seasons use UTC calendar months. Only finalized completed matches count.
Season recognition requires at least five matches and one win on the relevant
board; records sort by wins, then losses, with equal records sharing places.
The global Top 10 includes everyone tied at an eligible Top 10 place.
All-time records are preserved.

The dashboard's Awards & Achievements section links to `/champions`, the Hall
of Fame. Completed seasons grant exclusive edition badges for global Top 10
and global/game/game-and-ladder champions. Rare honours recognise ten wins
without a loss, fifty matches with a win, and a third global season title.
Player award pages show earned season badges. Team pages keep their original
compact layout with an Achievements label in the main box; small earned awards
there are deferred, and no seasonal gallery is shown on team pages. Clearly marked
fictional previews illustrate recognition when no competitors have qualified.
Season honours are separate from manually granted awards and credit rewards.
The compact Hall of Fame opens on the latest season with recognition, showing
players and teams together. Multiple category titles share one champion entry;
the Top 10 and rare collection remain visible alongside instead of repeating
tall award cards. Empty selections show labelled examples without an extra
preview click. Each seasonal award has its own original metallic illustration:
a winged cup, star medal, unbroken phoenix, forged hammer and orbital crown.

Apply `20261114220000_season_archives_and_honours.sql` and
`20261114221000_community_feed_milestones.sql` before deploying these views.
The protected archive and honour tables are refreshed by `gb-season-archives`
every minute and after migration. Corrected results queue affected seasons;
the worker reconciles archives, revoked/reassigned badges, and later Dynasty
eligibility. Pending-correction boards read finalized results immediately.
Honour changes are included in Founder audit history.

The community and profile Following feeds include wins, new teams, public
friendships, captured team rank climbs, tournament champions, awards and season
honours. Rival moments require a win against the same opponent after losing
their immediately previous finalized meeting in the same game and ladder.
Friendships require both players' public-friend settings; private/revoked
sources also disappear from Favorites. Tournament wins use a recorded decision,
staff decision log or reward timestamp, never bracket creation time, and do
not attribute historical wins to a team's present-day membership.

Existing free weekly team-cup scheduling is preserved; events require an
announced template. Free singles tournaments are **Coming soon**, with game,
platform and schedule TBD. There is no solo registration or invented event.
Run `supabase/tests/season_competition.sql` after the migrations to exercise
eligibility, ties, rarity, result corrections and feed privacy in a rolled-back
transaction (the fixture bypasses only new-match roster admission).

## Team founding history

Directly above Achievements, team headers show their saved founding date in
UTC, plus a linked original founder when recorded. Existing creation dates are preserved; unknown legacy
creators are not inferred from the current leader. Apply
`20261114225000_immutable_team_founding.sql` before deploying this header.
New teams have their founding date and founding account recorded by the
database, ignoring client-supplied founding details. These fields cannot be
edited, including when leadership changes. Historical founder identifiers
survive account removal; an unavailable account is labelled rather than
reassigned. Verified historical creators may be recorded through a one-time
admin migration, never inferred automatically or exposed as an editable field.
`supabase/tests/team_founding.sql` checks spoofed inputs,
immutability, normal edits and leadership transfers inside a rollback.

---

## Supported Games

- Call of Duty
- Battlefield
- Fortnite
- Apex Legends
- Rainbow Six Siege
- Rocket League

Additional titles may be added based on community demand.

---

## Technology Stack

### Frontend
- Next.js
- React
- TypeScript

### Backend
- Supabase
- PostgreSQL

### Hosting
- Vercel

### Feedback email notifications
Signed-in players' suggestions and bug reports are saved for staff review in
`/staff/feedback` and sent to the Prime owner inbox. Bug reports require a
verified account email and remain eligible for review in the Bug Finder queue
under `/staff/awards`. Staff can mark suggestions reviewed; that does not
automatically publish them as accepted suggestions.
New bug reports include the selected site area and any device or browser details
in the staff queue, owner inbox, and owner email.
To also email the owner, configure these server-side environment variables in the deployment:

- `SUPABASE_SERVICE_ROLE_KEY` — server-only key used to look up the Prime owner's account email
- `RESEND_API_KEY` — a Resend API key
- `EMAIL_FROM` — a sender address verified with Resend

The page reports separately if saving feedback or the email notification fails.

### Version Control
- GitHub

---

## Staff Administration

The private staff portal uses role-based permissions enforced by Supabase RPCs:

| Rank | Authority |
| --- | --- |
| Moderator | Review reports and handle basic moderation cases |
| Senior Staff | Moderator duties, escalations, and review of report decisions |
| Administrator | Match disputes, awards, staff oversight, and enforcement work |
| Founder — Prime | Full staff authority, including rank assignment and exclusive awards |

Apply the staff portal, private-roster, approved-email, and staff-administration
Supabase migrations in timestamp order before deploying these workflows. The staff
administration migration promotes the two configured Founder accounts and will
stop unless both accounts and their profile rows exist. It has not been applied to
production as part of this code change. Do not add account emails or service-role
credentials to source control, and do not enable self-service Founder claims.

Only Founder — Prime can assign or remove staff ranks. Rank and directory changes,
case decisions, match corrections, and award grants/revocations are recorded in the
append-only staff activity log with a reason and relevant before/after values.
Ordinary staff cannot edit or erase audit history.

Player reports are submitted through `/report` and reviewed in the staff dashboard.
Players can request profile awards through `/awards`; authorized staff search
players or teams, review requests, and manage grants in `/staff/awards`.
Staff-granted awards appear on player and team profiles; revoked awards remain
visible only to authorized award staff.
Match review continues to use the existing dispute-ticket workflow and writes its
finalized score changes to the activity log.

### Founder Site overview and audit history

The Founder-only Site overview card opens site totals, searchable activity logs,
account/team lookup, and logging coverage/service links. Audit searches support
actor, category, audience, target IDs, UTC date ranges, and transaction IDs.
Downloads are private JSON files containing all matching records up to 5,000;
narrow the filters for larger searches. Preparing a download is itself audited.

Apply `20261114190000_founder_searchable_audit.sql` before deploying the audit UI.
Database triggers capture saved changes to the allowlisted sources in
`owner_audit_sources`, including profiles, rosters, matches/disputes, forums,
reports, awards, credits, staff access, and tournaments. They retain actor
identity/role, target information, selected before/after values, changed-field
names, and a shared database transaction ID. Unauthenticated service writes
are labelled System / service rather than assigned to a guessed member.
Counter-only updates are not logged. Changes and their audit records commit
together; a logging failure fails the originating write.

New records are append-only for application users. A daily `pg_cron` job removes
records older than 12 months. Existing staff/moderation logs remain in their
original tables with their existing retention and appear in the combined search;
historical actor names use current profile names where snapshots were not saved.
Unlogged historical member actions cannot be reconstructed.

Private profile values, free-form report/proof contents, and gaming account IDs
are recorded only as changed-field markers. Passwords, tokens, private messages,
and payment details are not captured. Sign-ins, failed requests, browser errors,
and platform outages remain in the provider consoles, not this saved-action log.
Coverage reports list the actual enabled capture triggers and retention schedule.

Validation: `node --test tests/owner-audit.test.mjs` checks date boundaries and
change presentation. `supabase/tests/owner_audit.sql` runs database capture,
authorization, pagination, immutability, and retention assertions in a transaction
that rolls back; it requires a migrated database with Founder and member profiles.

---

## Roadmap

### Phase 1
- User Accounts
- Player Profiles
- Team Creation
- Ladder Rankings

### Phase 2
- Match Finder
- Match Reporting
- Dispute System
- Automated Rankings

### Phase 3
- Tournaments
- Playoffs
- Awards System
- Seasonal Competition

### Phase 4
- Mobile Optimization
- Advanced Statistics
- Expanded Game Support

---

## Mission Statement

GameBattles is more than a website.

It is an effort to restore the competitive gaming experience that built lifelong rivalries, friendships, and unforgettable moments.

The goal is simple:

*Bring Back Competitive Gaming.*
