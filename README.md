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
To email the site owner when a suggestion or bug is submitted, configure these
server-side environment variables in the deployment:

- `SITE_OWNER_EMAIL` — the site owner's notification address
- `RESEND_API_KEY` — a Resend API key
- `EMAIL_FROM` — a sender address verified with Resend

The submission endpoint reports an error instead of showing success when delivery
is not configured or the email provider rejects the message.

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
