export const XP_PER_WIN = 25;
export const XP_PER_LOSS = 5;
export const MAX_LEVEL = 50;
export const DIVISIONS = ["I", "II", "III", "IV", "V"] as const;

export type RankTier = {
  key: string;
  name: string;
  light: string;
  dark: string;
  glow: string;
};

export const RANK_TIERS: RankTier[] = [
  { key: "rookie", name: "Rookie", light: "#c7d6e8", dark: "#3c4652", glow: "rgba(136,182,255,.4)" },
  { key: "contender", name: "Contender", light: "#f0a35e", dark: "#6b3f1d", glow: "rgba(240,163,94,.45)" },
  { key: "challenger", name: "Challenger", light: "#6fb4ff", dark: "#17407a", glow: "rgba(111,180,255,.45)" },
  { key: "striker", name: "Striker", light: "#ffd34d", dark: "#8a5c10", glow: "rgba(255,211,77,.5)" },
  { key: "veteran", name: "Veteran", light: "#cdb4ff", dark: "#4a2a85", glow: "rgba(176,128,255,.5)" },
  { key: "ace", name: "Ace", light: "#4fe3cd", dark: "#0b5e52", glow: "rgba(79,227,205,.5)" },
  { key: "commander", name: "Commander", light: "#ff5a62", dark: "#73101c", glow: "rgba(255,90,98,.5)" },
  { key: "phantom", name: "Phantom", light: "#b878ff", dark: "#45177e", glow: "rgba(184,120,255,.55)" },
  { key: "titan", name: "Titan", light: "#ffc63d", dark: "#7e5505", glow: "rgba(255,198,61,.55)" },
  { key: "legend", name: "Legend", light: "#ffd98a", dark: "#8a2a12", glow: "rgba(255,166,77,.65)" },
];

/** Total XP needed to reach a level (level 1 = 0 XP). */
export function xpForLevel(level: number) {
  const n = Math.max(1, Math.min(MAX_LEVEL, level)) - 1;
  return 100 * n + 40 * n * Math.max(0, n - 1);
}

export type PlayerRank = {
  level: number;
  tier: RankTier;
  tierIndex: number;
  division: number;
  title: string;
  xp: number;
  levelXp: number;
  nextXp: number | null;
  progress: number;
};

export function rankFromXp(rawXp: number | null | undefined): PlayerRank {
  const xp = Math.max(0, Math.floor(Number(rawXp) || 0));
  let level = 1;
  while (level < MAX_LEVEL && xpForLevel(level + 1) <= xp) level += 1;
  const tierIndex = Math.floor((level - 1) / 5);
  const division = ((level - 1) % 5) + 1;
  const tier = RANK_TIERS[tierIndex];
  const levelXp = xpForLevel(level);
  const nextXp = level < MAX_LEVEL ? xpForLevel(level + 1) : null;
  const progress = nextXp === null ? 1 : (xp - levelXp) / (nextXp - levelXp);
  return {
    level,
    tier,
    tierIndex,
    division,
    title: `${tier.name} ${DIVISIONS[division - 1]}`,
    xp,
    levelXp,
    nextXp,
    progress: Math.max(0, Math.min(1, progress)),
  };
}
