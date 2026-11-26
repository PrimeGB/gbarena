import { gamingCategories, gamingGames } from "./gamingAccounts";
import { bf6TeamLadders } from "./bf6TeamLadders";

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
  nintendo: ["fortnite", "apex", "rocket-league", "fighting-games", "hero-shooters"],
  mobile: [...mobileCategories, "fighting-games", "sports-games", "strategy-games"],
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
  "fighting-games": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1364780/header.jpg",
  "sports-games": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/4080220/ff6a3779f1ca83aae8ad3878454f6c11008ea24d/header.jpg?t=1793610006",
  "tactical-shooters": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/730/header.jpg",
  "hero-shooters": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2767030/header.jpg",
  "strategy-games": "/games/chess-ladder.svg",
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
    "box-fights": "/games/fn-2.jpg",
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
  "fighting-games": {
    "street-fighter-6": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1364780/header.jpg",
    brawlhalla: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/291550/header.jpg",
    "tekken-8": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1778820/header.jpg",
    "mortal-kombat-1": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1971870/header.jpg",
    "super-smash-bros-ultimate": "https://www.smashbros.com/assets_v2/img/sns/en.png?180613",
  },
  "sports-games": {
    "ea-sports-fc-27": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/4080220/ff6a3779f1ca83aae8ad3878454f6c11008ea24d/header.jpg?t=1793610006",
    "nba-2k27": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/4356430/9152438fde7de9f4c20b4fd9072ba69f844dacab/header.jpg?t=1792163139",
    efootball: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1665460/header.jpg",
  },
  "tactical-shooters": {
    "counter-strike-2": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/730/header.jpg",
    valorant: "https://cmsassets.rgpub.io/sanity/images/dsfx7636/news/083baed63d306ee9ba41df4971ac0f6bb0222032-1920x1080.jpg?accountingTag=VAL",
  },
  "hero-shooters": {
    "marvel-rivals": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2767030/header.jpg",
    "overwatch-2": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2357570/header.jpg",
  },
  "strategy-games": {
    chess: "/games/chess-ladder.svg",
  },
};

export function categoryImage(category: string) {
  return categoryImages[category] || null;
}

export function ladderGameImage(category: string, game: string) {
  return gameImages[category]?.[game] || categoryImage(category);
}

export const featuredGameArtwork = [
  { title: "Street Fighter 6", image: ladderGameImage("fighting-games", "street-fighter-6") },
  { title: "EA Sports FC 27", image: ladderGameImage("sports-games", "ea-sports-fc-27") },
  { title: "NBA 2K27", image: ladderGameImage("sports-games", "nba-2k27") },
  { title: "Counter-Strike 2", image: ladderGameImage("tactical-shooters", "counter-strike-2") },
  { title: "Marvel Rivals", image: ladderGameImage("hero-shooters", "marvel-rivals") },
  { title: "Super Smash Bros. Ultimate", image: ladderGameImage("fighting-games", "super-smash-bros-ultimate") },
  { title: "Brawlhalla", image: ladderGameImage("fighting-games", "brawlhalla") },
  { title: "eFootball", image: ladderGameImage("sports-games", "efootball") },
  { title: "Chess", image: ladderGameImage("strategy-games", "chess") },
  { title: "Battlefield 6", image: ladderGameImage("battlefield", "battlefield-6") },
  { title: "Rocket League", image: ladderGameImage("rocket-league", "soccar") },
];

export function categoriesForPlatform(platform: string) {
  const allowed = platformCategories[platform] || [];
  return gamingCategories.filter(
    (item) => allowed.includes(item.value) && gamesForCategory(item.value, platform).length > 0,
  );
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

export function gamesForCategory(category: string, platform?: string) {
  return gamingGames.filter(
    (game) =>
      game.category === category &&
      (!platform || !game.platforms || game.platforms.includes(platform)),
  );
}

export const standaloneGameCategories = ["fighting-games", "sports-games", "tactical-shooters", "hero-shooters", "strategy-games"] as const;

export function additionalLadderGamesForPlatform(platform: string) {
  const games = standaloneGameCategories.flatMap((category) =>
    isCategoryOnPlatform(platform, category) ? gamesForCategory(category, platform) : [],
  );
  const boxFights = isCategoryOnPlatform(platform, "fortnite")
    ? gamesForCategory("fortnite", platform).find((game) => game.value === "box-fights")
    : undefined;
  return boxFights ? [boxFights, ...games] : games;
}

export function ladderGameLabel(category: string, game: string) {
  return gamingGames.find((item) => item.category === category && item.value === game)?.label || null;
}

export function laddersForGame(category: string, game: string) {
  const standard = [
    { slug: "singles", title: "Solo" },
    { slug: "duos", title: "Duos" },
    { slug: "team", title: "Team" },
  ];
  const singles = standard[0];
  const duos = standard[1];
  const gameSpecific: Record<string, { slug: string; title: string }[]> = {
    "fighting-games/street-fighter-6": [singles],
    "fighting-games/brawlhalla": [singles, duos],
    "fighting-games/tekken-8": [singles],
    "fighting-games/mortal-kombat-1": [singles],
    "fighting-games/super-smash-bros-ultimate": [singles],
    "sports-games/ea-sports-fc-27": [singles, { slug: "team", title: "Clubs" }],
    "sports-games/nba-2k27": [
      singles,
      { slug: "team-3v3", title: "3v3" },
      { slug: "team-5v5", title: "5v5" },
    ],
    "sports-games/efootball": [
      singles,
      { slug: "co-op-2v2", title: "Co-op 2v2" },
      { slug: "co-op-3v3", title: "Co-op 3v3" },
    ],
    "tactical-shooters/counter-strike-2": [
      { slug: "singles", title: "1v1 Aim Duel" },
      { slug: "team", title: "5v5 Competitive" },
    ],
    "tactical-shooters/valorant": [
      { slug: "singles", title: "1v1 Custom Duel" },
      { slug: "team", title: "5v5 Competitive" },
    ],
    "hero-shooters/marvel-rivals": [
      { slug: "team-3v3", title: "3v3" },
      { slug: "team-6v6", title: "6v6 Competitive" },
    ],
    "hero-shooters/overwatch-2": [
      { slug: "team-5v5", title: "5v5 Competitive" },
      { slug: "team-6v6", title: "6v6 Competitive" },
    ],
    "strategy-games/chess": [singles],
    "fortnite/box-fights": [{ slug: "singles", title: "Box Fights 1v1" }],
  };
  const specific = gameSpecific[`${category}/${game}`];
  if (specific) return specific;
  if (category === "clash-of-clans") return [singles];
  if (category === "clash-royale") return game === "2v2" ? [duos] : [singles];
  if (category === "uno") return game === "2v2" ? [duos] : [singles];
  return category === "battlefield" && game === "battlefield-6"
    ? [
        { slug: "singles", title: "Solo TDM" },
        { slug: "rapid-royal-duos", title: "Rapid Royal" },
        { slug: "redsec", title: "RedSec" },
        ...Object.entries(bf6TeamLadders).map(([slug, ladder]) => ({ slug, title: ladder.title })),
      ]
    : standard;
}

export function isValidLadder(category: string, game: string, ladder: string) {
  return laddersForGame(category, game).some((item) => item.slug === ladder);
}

export function ladderTitleForGame(category: string, game: string, ladder: string) {
  return laddersForGame(category, game).find((item) => item.slug === ladder)?.title || null;
}

export function fullLadderTitle(game: string, ladder: string) {
  return ladder.toLowerCase().startsWith(game.toLowerCase()) ? ladder : `${game} ${ladder}`;
}
