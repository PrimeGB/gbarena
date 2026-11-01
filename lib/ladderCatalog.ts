import { gamingCategories, gamingGames } from "./gamingAccounts";

export const ladderPlatforms = [
  { value: "xbox", label: "Xbox" },
  { value: "playstation", label: "PlayStation" },
  { value: "nintendo", label: "Nintendo Switch" },
  { value: "pc", label: "PC" },
  { value: "mobile", label: "Mobile" },
] as const;

const mobileCategories = ["clash-of-clans", "clash-royale", "cod-mobile", "uno"];
const consoleCategories = gamingCategories
  .map((item) => item.value as string)
  .filter((value) => !mobileCategories.includes(value));

// Categories each platform actually has. Nintendo Switch only gets games released on it.
const platformCategories: Record<string, string[]> = {
  xbox: consoleCategories,
  playstation: consoleCategories,
  pc: consoleCategories,
  nintendo: ["fortnite", "apex", "rocket-league"],
  mobile: mobileCategories,
};

const categoryImages: Record<string, string> = {
  "clash-of-clans": "/games/clash-of-clans.jpg",
  "clash-royale": "/games/clash-royale.jpg",
  "cod-mobile": "/games/cod-mobile.jpg",
  uno: "/games/uno.jpg",
};

export function categoryImage(category: string) {
  return categoryImages[category] || null;
}

export function categoriesForPlatform(platform: string) {
  const allowed = platformCategories[platform] || [];
  return gamingCategories.filter((item) => allowed.includes(item.value));
}

export function isCategoryOnPlatform(platform: string, category: string) {
  return (platformCategories[platform] || []).includes(category);
}

export function ladderPlatformLabel(platform: string) {
  return ladderPlatforms.find((item) => item.value === platform)?.label || null;
}

export function ladderCategoryLabel(category: string) {
  return gamingCategories.find((item) => item.value === category)?.label || null;
}

export function gamesForCategory(category: string) {
  return gamingGames.filter((game) => game.category === category);
}

export function ladderGameLabel(category: string, game: string) {
  return gamingGames.find((item) => item.category === category && item.value === game)?.label || null;
}

export function laddersForGame(category: string, game: string) {
  const standard = [
    { slug: "singles", title: "Singles" },
    { slug: "duos", title: "Duos" },
    { slug: "team", title: "Team" },
  ];
  const singles = standard[0];
  const duos = standard[1];
  if (category === "clash-of-clans") return [singles];
  if (category === "clash-royale") return game === "2v2" ? [duos] : [singles];
  if (category === "uno") return game === "2v2" ? [duos] : [singles];
  return category === "battlefield" && game === "battlefield-6"
    ? [
        { slug: "rapid-royal-duos", title: "Rapid Royal Duos" },
        { slug: "redsec", title: "RedSec" },
      ]
    : standard;
}

export function isValidLadder(category: string, game: string, ladder: string) {
  return laddersForGame(category, game).some((item) => item.slug === ladder);
}
