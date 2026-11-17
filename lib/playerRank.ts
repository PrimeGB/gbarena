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
  { key: "recruit", name: "Recruit", light: "#a9b6c4", dark: "#3c4652", glow: "rgba(169,182,196,.35)" },
  { key: "private", name: "Private", light: "#e0a466", dark: "#6b3f1d", glow: "rgba(224,164,102,.4)" },
  { key: "corporal", name: "Corporal", light: "#ff9466", dark: "#7a2f17", glow: "rgba(255,148,102,.4)" },
  { key: "sergeant", name: "Sergeant", light: "#f2f6fa", dark: "#6e7b88", glow: "rgba(230,240,250,.45)" },
  { key: "lieutenant", name: "Lieutenant", light: "#ffd96b", dark: "#9a6510", glow: "rgba(255,217,107,.5)" },
  { key: "captain", name: "Captain", light: "#6bf5bb", dark: "#0c6b47", glow: "rgba(107,245,187,.45)" },
  { key: "major", name: "Major", light: "#7fd0ff", dark: "#173f8c", glow: "rgba(127,208,255,.5)" },
  { key: "colonel", name: "Colonel", light: "#d2a8ff", dark: "#4f2290", glow: "rgba(210,168,255,.5)" },
  { key: "general", name: "General", light: "#ff7a7a", dark: "#7e1020", glow: "rgba(255,122,122,.55)" },
  { key: "legend", name: "Legend", light: "#fff1a8", dark: "#a8326e", glow: "rgba(255,214,120,.7)" },
];

/** Total XP needed to reach a level (level 1 = 0 XP). */
export function xpForLevel(level: number) {
  const n = Math.max(1, Math.min(MAX_LEVEL, level)) - 1;
  return 40 * n + 5 * n * Math.max(0, n - 1);
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
