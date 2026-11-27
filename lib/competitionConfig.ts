// Central competition configuration.
// Single source of truth for rules shared across ladders, tournaments, and
// match creation so the same settings are never defined twice.

export type CompetitionRules = {
  disputeWindowHours: number;
  singleTeamEscalationHours: number;
  proofRequiredForHighValue: boolean;
  minRating: number;
  defaultRating: number;
  winRatingDelta: number;
  lossRatingDelta: number;
  maxRosterSize: number;
};

export const COMPETITION_RULES: CompetitionRules = {
  disputeWindowHours: 3,
  singleTeamEscalationHours: 3,
  proofRequiredForHighValue: true,
  minRating: 0,
  defaultRating: 100,
  winRatingDelta: 25,
  lossRatingDelta: -25,
  maxRosterSize: 6,
};

export const PLATFORM_LABELS: Record<string, string> = {
  pc: "PC",
  xbox: "Xbox",
  playstation: "PlayStation",
  psn: "PlayStation",
  switch: "Nintendo Switch",
  mobile: "Mobile",
};

export function platformLabel(platform: string | null | undefined): string {
  if (!platform) return "Unknown";
  return PLATFORM_LABELS[platform.toLowerCase()] ?? platform;
}

export const RANKING_DIMENSIONS = [
  "global",
  "game",
  "platform",
  "ladder",
  "regional",
  "players",
  "rookie",
  "improved",
  "streak",
  "active",
  "history",
] as const;

export type RankingDimension = (typeof RANKING_DIMENSIONS)[number];

export const RANKING_DIMENSION_LABELS: Record<RankingDimension, string> = {
  global: "Global",
  game: "By Game",
  platform: "By Platform",
  ladder: "By Ladder",
  regional: "Regional",
  players: "Players",
  rookie: "Best Rookie",
  improved: "Most Improved",
  streak: "Win Streak",
  active: "Most Active",
  history: "History Graph",
};