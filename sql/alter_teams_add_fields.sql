-- Add platform/game/ladder/owner fields to teams and enforce one active team per owner per ladder

alter table teams
add column if not exists platform text;

alter table teams
add column if not exists category text;

alter table teams
add column if not exists game text;

alter table teams
add column if not exists ladder text;

alter table teams
add column if not exists owner_id uuid;

-- Create a unique index to prevent multiple teams for the same owner/platform/game/ladder
create unique index if not exists ux_teams_owner_platform_game_ladder on teams(owner_id, platform, game, ladder);

-- Note: If you rely on integer IDs for profiles, adjust owner_id type accordingly.
