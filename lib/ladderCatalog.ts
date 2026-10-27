import { gamingCategories, gamingGames } from "./gamingAccounts";

export const ladderPlatforms = [
  { value: "xbox", label: "Xbox" },
  { value: "playstation", label: "PlayStation" },
  { value: "nintendo", label: "Nintendo Switch" },
  { value: "pc", label: "PC" },
] as const;

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
  return category === "battlefield" && game === "battlefield-6"
    ? [{ slug: "redsec", title: "RedSec" }, ...standard]
    : standard;
}

export function isValidLadder(category: string, game: string, ladder: string) {
  return laddersForGame(category, game).some((item) => item.slug === ladder);
}
