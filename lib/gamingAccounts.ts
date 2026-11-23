export type GamingAccount = {
  id: string;
  user_id: string;
  platform: string;
  category: string;
  game: string;
  account_id: string;
  locked_until?: string | null;
};

export type GamingGame = {
  category: string;
  value: string;
  label: string;
  platforms?: readonly string[];
};

export const gamingPlatforms = [
  { value: "xbox", label: "Xbox Gamertag" },
  { value: "playstation", label: "PlayStation Online ID" },
  { value: "nintendo", label: "Nintendo Switch ID" },
  { value: "pc", label: "PC (Steam / Battle.net / Epic / EA ID)" },
  { value: "mobile", label: "Mobile / In-game ID" },
  { value: "ea", label: "EA Account ID" },
] as const;

export const gamingGames: readonly GamingGame[] = [
  { category: "call-of-duty", value: "modern-warfare-4", label: "Modern Warfare (2019)" },
  { category: "call-of-duty", value: "modern-warfare-ii", label: "Modern Warfare II" },
  { category: "call-of-duty", value: "modern-warfare-iii", label: "Modern Warfare III" },
  { category: "call-of-duty", value: "black-ops-6", label: "Black Ops 6" },
  { category: "call-of-duty", value: "black-ops-cold-war", label: "Black Ops Cold War" },
  { category: "call-of-duty", value: "vanguard", label: "Vanguard" },
  { category: "call-of-duty", value: "mw2", label: "Modern Warfare 2" },
  { category: "battlefield", value: "battlefield-6", label: "Battlefield 6" },
  { category: "battlefield", value: "battlefield-2042", label: "Battlefield 2042" },
  { category: "battlefield", value: "battlefield-v", label: "Battlefield V" },
  { category: "battlefield", value: "battlefield-1", label: "Battlefield 1" },
  { category: "battlefield", value: "redsec", label: "RedSec" },
  { category: "apex", value: "battle-royale", label: "Battle Royale" },
  { category: "apex", value: "ranked", label: "Ranked" },
  { category: "apex", value: "mixtape", label: "Mixtape" },
  { category: "apex", value: "wildcard", label: "Wildcard" },
  { category: "fortnite", value: "battle-royale", label: "Battle Royale" },
  { category: "fortnite", value: "zero-build", label: "Zero Build" },
  { category: "fortnite", value: "ranked", label: "Ranked" },
  { category: "fortnite", value: "reload", label: "Reload" },
  { category: "fortnite", value: "box-fights", label: "Box Fights", platforms: ["xbox", "playstation", "pc", "nintendo"] },
  { category: "rocket-league", value: "soccar", label: "Soccar" },
  { category: "rocket-league", value: "hoops", label: "Hoops" },
  { category: "rocket-league", value: "rumble", label: "Rumble" },
  { category: "rocket-league", value: "dropshot", label: "Dropshot" },
  { category: "rocket-league", value: "snow-day", label: "Snow Day" },
  { category: "rainbow-six", value: "ranked", label: "Ranked" },
  { category: "rainbow-six", value: "standard", label: "Standard" },
  { category: "rainbow-six", value: "quick-match", label: "Quick Match" },
  { category: "rainbow-six", value: "competitive", label: "Competitive" },
  { category: "old-school", value: "cod4-2007", label: "Call of Duty 4: Modern Warfare" },
  { category: "old-school", value: "waw-2008", label: "World at War" },
  { category: "old-school", value: "mw2-2009", label: "Modern Warfare 2 (2009)" },
  { category: "old-school", value: "bo1-2010", label: "Black Ops" },
  { category: "old-school", value: "mw3-2011", label: "Modern Warfare 3" },
  { category: "old-school", value: "bo2-2012", label: "Black Ops II" },
  { category: "clash-of-clans", value: "friendly-war", label: "Friendly Challenge" },
  { category: "clash-royale", value: "1v1", label: "1v1 Friendly Battle" },
  { category: "clash-royale", value: "2v2", label: "2v2 Friendly Battle" },
  { category: "cod-mobile", value: "multiplayer", label: "Multiplayer" },
  { category: "cod-mobile", value: "battle-royale", label: "Battle Royale" },
  { category: "uno", value: "classic", label: "Classic" },
  { category: "uno", value: "2v2", label: "2v2 Team Play" },
  { category: "fighting-games", value: "street-fighter-6", label: "Street Fighter 6", platforms: ["xbox", "playstation", "pc", "nintendo"] },
  { category: "fighting-games", value: "brawlhalla", label: "Brawlhalla", platforms: ["xbox", "playstation", "pc", "nintendo", "mobile"] },
  { category: "fighting-games", value: "tekken-8", label: "Tekken 8", platforms: ["xbox", "playstation", "pc"] },
  { category: "fighting-games", value: "mortal-kombat-1", label: "Mortal Kombat 1", platforms: ["xbox", "playstation", "pc", "nintendo"] },
  { category: "fighting-games", value: "super-smash-bros-ultimate", label: "Super Smash Bros. Ultimate", platforms: ["nintendo"] },
  { category: "sports-games", value: "ea-sports-fc-27", label: "EA Sports FC 27", platforms: ["xbox", "playstation", "pc"] },
  { category: "sports-games", value: "nba-2k27", label: "NBA 2K27", platforms: ["xbox", "playstation", "pc"] },
  { category: "sports-games", value: "efootball", label: "eFootball", platforms: ["xbox", "playstation", "pc", "mobile"] },
  { category: "tactical-shooters", value: "counter-strike-2", label: "Counter-Strike 2", platforms: ["pc"] },
  { category: "tactical-shooters", value: "valorant", label: "VALORANT", platforms: ["xbox", "playstation", "pc"] },
  { category: "hero-shooters", value: "marvel-rivals", label: "Marvel Rivals", platforms: ["xbox", "playstation", "pc"] },
  { category: "hero-shooters", value: "overwatch-2", label: "Overwatch 2", platforms: ["xbox", "playstation", "pc", "nintendo"] },
  { category: "strategy-games", value: "chess", label: "Chess", platforms: ["pc", "mobile"] },
];

export const gamingCategories = [
  { value: "call-of-duty", label: "Call of Duty" },
  { value: "battlefield", label: "Battlefield" },
  { value: "apex", label: "Apex Legends" },
  { value: "fortnite", label: "Fortnite" },
  { value: "rocket-league", label: "Rocket League" },
  { value: "rainbow-six", label: "Rainbow Six Siege" },
  { value: "old-school", label: "Old School" },
  { value: "clash-of-clans", label: "Clash of Clans" },
  { value: "clash-royale", label: "Clash Royale" },
  { value: "cod-mobile", label: "Call of Duty: Mobile" },
  { value: "uno", label: "UNO" },
  { value: "fighting-games", label: "Fighting Games" },
  { value: "sports-games", label: "Sports Games" },
  { value: "tactical-shooters", label: "Tactical Shooters" },
  { value: "hero-shooters", label: "Hero Shooters" },
  { value: "strategy-games", label: "Strategy Games" },
] as const;

export function gamingPlatformLabel(platform: string) {
  return gamingPlatforms.find((item) => item.value === platform)?.label || platform;
}

export function gamingGamesForPlatform(platform: string) {
  if (platform === "ea") {
    return gamingGames.filter(
      (game) =>
        (game.category === "sports-games" && game.value === "ea-sports-fc-27") ||
        game.category === "battlefield" ||
        game.category === "apex",
    );
  }
  return gamingGames.filter(
    (game) => !game.platforms || game.platforms.includes(platform),
  );
}

export function gamingCategoriesForPlatform(platform: string) {
  const availableGames = gamingGamesForPlatform(platform);
  return gamingCategories.filter((category) =>
    availableGames.some((game) => game.category === category.value),
  );
}

export function gamingCategoryLabel(category: string) {
  return gamingCategories.find((item) => item.value === category)?.label || category;
}

export function gamingGameLabel(category: string, game: string) {
  return gamingGames.find(
    (item) => item.category === category && item.value === game,
  )?.label || game;
}

export function findGamingAccount(
  accounts: GamingAccount[],
  platform: string,
  category: string,
  game: string,
  userId?: string,
) {
  return accounts.find(
    (account) =>
      account.platform === platform &&
      account.category === category &&
      account.game === game &&
      (!userId || account.user_id === userId),
  );
}

export function profilePlatformAccountId(
  profile: Record<string, unknown> | null | undefined,
  platform: string,
) {
  const fields: Record<string, string[]> = {
    xbox: ["gt_xbox", "xbox_gt"],
    playstation: ["gt_playstation", "psn_gt"],
    nintendo: ["gt_nintendo", "nintendo_gt"],
    pc: ["gt_pc", "pc_gt"],
  };
  const value = (fields[platform.toLowerCase()] || [])
    .map((field) => profile?.[field])
    .find((candidate) => typeof candidate === "string" && candidate.trim());

  return typeof value === "string" ? value.trim() : null;
}

export function resolveGamingAccountId(
  gameSpecificId: string | null | undefined,
  profile: Record<string, unknown> | null | undefined,
  platform: string,
) {
  return gameSpecificId?.trim() || profilePlatformAccountId(profile, platform);
}

export function isMatchEligibleGamingId(gamingId: string | null | undefined) {
  return typeof gamingId === "string" && gamingId.trim().length > 0;
}
