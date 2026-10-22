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

### Version Control
- GitHub

---

## Staff Portal Access

The staff portal uses a private, Owner-managed roster with individual work-area
grants for match review, forum moderation, awards, and staff-roster updates. Only
an Owner can assign or remove staff access; the roster permission can edit position
and duty descriptions but cannot change permissions. The staff roster is available
only to approved accounts, and staff members still need an assigned work area to
use its tools.

Before using the portal in a deployed environment, apply the staff portal Supabase
and staff-email allowlist Supabase migrations, then promote the initial Owner
through the trusted Supabase SQL Editor using
[the one-time Owner bootstrap script](./sql/bootstrap_staff_owner.sql).
Do not add the Owner's account email or service-role credentials to source control,
and do not enable self-service Owner claims.

The grants define work-area boundaries. Each area's data-changing tools must also
enforce `has_staff_permission(...)` in its database policies or RPCs before being
made available as operational staff tools.

Match reviewers can enter an official score with a required written reason.
Finalization and team/player record updates happen atomically, only once, and are
saved to a staff review log. Forum-moderation and award actions are not enabled
until their workflows and database checks are implemented.

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
