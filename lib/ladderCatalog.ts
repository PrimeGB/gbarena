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
  "call-of-duty":
    "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2000950/header.jpg?t=1778886798",
  battlefield:
    "https://drop-assets.ea.com/images/2I7VhVjwdzBgmbpeldmM8t/4f2dcad2d115abd786aa2bb9ff38d89f/battlefield-6-standard-edition-16x9.jpg?im=AspectCrop%3D%2816%2C9%29%2CxPosition%3D0.5%2CyPosition%3D0.5356481481481481",
  apex: "/games/apex-1.jpg",
  fortnite: "/games/fn-3.jpg",
  "rocket-league": "https://cdn.cloudflare.steamstatic.com/steam/apps/252950/header.jpg",
  "rainbow-six": "/games/r6-1.jpg",
  "old-school": "/New%20folder/mw2.jpg",
  "clash-of-clans": "/games/clash-of-clans.jpg",
  "clash-royale": "/games/clash-royale.jpg",
  "cod-mobile": "/games/cod-mobile.jpg",
  uno: "/games/uno.jpg",
};

const gameImages: Record<string, Record<string, string>> = {
  "call-of-duty": {
    "modern-warfare-4":
      "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2000950/header.jpg?t=1778886798",
    "modern-warfare-ii":
      "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3595230/ce4d5e53b36cb9d3c4309d1df72bf8663bbbc7ef/header.jpg",
    "modern-warfare-iii":
      "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3595270/7d0f21912a075c33bbb5ea558100e187ceb234ac/header.jpg?t=1778886604",
    "black-ops-6":
      "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/2933620/header.jpg",
    "black-ops-cold-war":
      "https://cdn.cloudflare.steamstatic.com/steam/apps/1985810/header.jpg",
    vanguard: "https://cdn.cloudflare.steamstatic.com/steam/apps/1985820/header.jpg",
    mw2: "/New%20folder/mw2.jpg",
  },
  battlefield: {
    "battlefield-6": categoryImages.battlefield,
    redsec: categoryImages.battlefield,
    "battlefield-2042": "https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/1517290/header.jpg",
    "battlefield-v": "https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/1238810/header.jpg",
    "battlefield-1": "https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/1238840/header.jpg",
  },
  apex: {
    "battle-royale": "/games/apex-1.jpg",
    ranked: "/games/apex-2.jpg",
    mixtape: "/games/apex-3.jpg",
    wildcard: "/games/apex-4.jpg",
  },
  fortnite: {
    "battle-royale": "/games/fn-3.jpg",
    "zero-build": "/games/fn-4.jpg",
    ranked: "/games/fn-1.jpg",
    reload: "/games/fn-2.jpg",
  },
  "rocket-league": {
    soccar: categoryImages["rocket-league"],
    hoops: categoryImages["rocket-league"],
    rumble: categoryImages["rocket-league"],
    dropshot: categoryImages["rocket-league"],
    "snow-day": categoryImages["rocket-league"],
  },
  "rainbow-six": {
    ranked: "https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/359550/header.jpg",
    standard: "/games/r6-1.jpg",
    "quick-match": "/games/r6-2.jpg",
    competitive: "/games/r6-3.jpg",
  },
  "old-school": {
    "cod4-2007": "/New%20folder/cod4.jpg",
    "waw-2008": "/New%20folder/waw.jpg",
    "mw2-2009": "/New%20folder/mw2.jpg",
    "bo1-2010": "/New%20folder/bo1.jpg",
    "mw3-2011": "/New%20folder/mw3.jpg",
    "bo2-2012": "/New%20folder/bo2.jpg",
  },
  "clash-of-clans": { "friendly-war": categoryImages["clash-of-clans"] },
  "clash-royale": {
    "1v1": categoryImages["clash-royale"],
    "2v2": categoryImages["clash-royale"],
  },
  "cod-mobile": {
    multiplayer: categoryImages["cod-mobile"],
    "battle-royale": categoryImages["cod-mobile"],
  },
  uno: {
    classic: categoryImages.uno,
    "2v2": categoryImages.uno,
  },
};

export function categoryImage(category: string) {
  return categoryImages[category] || null;
}

export function ladderGameImage(category: string, game: string) {
  return gameImages[category]?.[game] || categoryImage(category);
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
        { slug: "rapid-royal-duos", title: "Rapid Royal" },
        { slug: "redsec", title: "RedSec" },
      ]
    : standard;
}

export function isValidLadder(category: string, game: string, ladder: string) {
  return laddersForGame(category, game).some((item) => item.slug === ladder);
}
