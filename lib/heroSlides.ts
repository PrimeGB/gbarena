// Keep a few image slides between the program promotions.
export const CURATED_SLIDES: string[] = [
  "https://images.unsplash.com/photo-1593305841991-05c297ba4575?q=80&w=1600&auto=format&fit=crop",
  "/retro-systems/retro-lan-room.png",
  "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/2933620/header.jpg",
];

export type NewPromoKind =
  | "rivalry" | "teammate" | "friends" | "rematch"
  | "event-bracket" | "event-night" | "event-community"
  | "construction" | "blueprint"
  | "game-showcase"
  | "affiliate-awards" | "affiliate-community" | "affiliate-creator";

export const NEW_PROMOS: Record<NewPromoKind, {
  category: "rivalry" | "event" | "construction" | "games" | "affiliate";
  tag: string;
  title: string;
  highlight: string;
  body: string;
  href: string;
  action: string;
  bannerTitle: string;
  bannerText: string;
}> = {
  rivalry: {
    category: "rivalry", tag: "The rivalry starts here", title: "Think you're", highlight: "better?",
    body: "Settle it on the ladder. Create a team, choose a solos ladder and challenge your rival.",
    href: "/teams/create", action: "Create a team", bannerTitle: "SETTLE THE RIVALRY", bannerText: "Take it to the solos ladder.",
  },
  teammate: {
    category: "rivalry", tag: "Teammates. Rivals. Legends.", title: "Teammate talking", highlight: "big?",
    body: "Take the debate into a 1v1. Create your solos team and let the match do the talking.",
    href: "/teams/create", action: "Create a team", bannerTitle: "TEAMMATE VS TEAMMATE", bannerText: "Take the debate to a 1v1.",
  },
  friends: {
    category: "rivalry", tag: "Friends make the best rivals", title: "Your friends.", highlight: "Your matchup.",
    body: "Challenge a friend on a solos ladder and make every game a story worth telling.",
    href: "/teams/create", action: "Create a team", bannerTitle: "FRIENDS FACE OFF", bannerText: "Create a team and play 1v1.",
  },
  rematch: {
    category: "rivalry", tag: "Keep the rivalry going", title: "Play. Rematch.", highlight: "Keep score.",
    body: "The match page shows the head-to-head record between the same two teams. Who will lead the series?",
    href: "/teams/create", action: "Create a team", bannerTitle: "THE RECORD REMEMBERS", bannerText: "Build your head-to-head rivalry.",
  },
  "event-bracket": {
    category: "event", tag: "Your idea. Our help.", title: "Your friends.", highlight: "Our bracket.",
    body: "Want a 16-player single-elimination tournament? Tell us your idea and staff can discuss hosting it.",
    href: "/tournaments/request", action: "Request an event", bannerTitle: "YOUR OWN BRACKET", bannerText: "Ask us to host your event.",
  },
  "event-night": {
    category: "event", tag: "Make game night an event", title: "Bring the crew.", highlight: "We'll talk format.",
    body: "Planning a friendly tournament? Send us the game, player count and format you have in mind.",
    href: "/tournaments/request", action: "Tell us your idea", bannerTitle: "GAME NIGHT, UPGRADED", bannerText: "Plan a friendly tournament.",
  },
  "event-community": {
    category: "event", tag: "Community tournaments", title: "A tournament", highlight: "for your people.",
    body: "Friends, teammates or your community: ask staff about hosting a friendly event together.",
    href: "/tournaments/request", action: "Request an event", bannerTitle: "YOUR COMMUNITY EVENT", bannerText: "Tell staff what you have in mind.",
  },
  construction: {
    category: "construction", tag: "Work in progress", title: "Pardon our", highlight: "progress.",
    body: "GameBattles is a work in progress. We're building, improving and adding more for the community.",
    href: "/suggestions", action: "Share an idea", bannerTitle: "SITE UNDER CONSTRUCTION", bannerText: "Help shape what's next.",
  },
  blueprint: {
    category: "construction", tag: "Building GameBattles together", title: "Good things are", highlight: "underway.",
    body: "We're still working on the site. Your feedback helps us make GameBattles better.",
    href: "/suggestions", action: "Send feedback", bannerTitle: "WORK IN PROGRESS", bannerText: "We're building for the community.",
  },
  "game-showcase": {
    category: "games", tag: "New ladders, more ways to compete", title: "Your game.", highlight: "Your ladder.",
    body: "Explore new game-specific ladders, team formats, settings and standings across GameBattles.",
    href: "/ladders", action: "Explore the ladders", bannerTitle: "MORE GAMES. MORE LADDERS.", bannerText: "Find your next competition.",
  },
  "affiliate-awards": {
    category: "affiliate", tag: "Ambassadors & affiliates", title: "Help us grow.", highlight: "Earn recognition.",
    body: "Represent GameBattles and work toward exclusive profile awards and program badges.",
    href: "/ambassadors", action: "Explore the program", bannerTitle: "HELP US GROW", bannerText: "Explore awards and badges.",
  },
  "affiliate-community": {
    category: "affiliate", tag: "Grow the community", title: "Bring your people.", highlight: "Make your mark.",
    body: "Creators and community builders can join our affiliate program and work toward ambassador perks.",
    href: "/ambassadors", action: "Learn how", bannerTitle: "MAKE YOUR MARK", bannerText: "Become a GB affiliate.",
  },
  "affiliate-creator": {
    category: "affiliate", tag: "Creators welcome", title: "Your community.", highlight: "Your spotlight.",
    body: "Help introduce players to GameBattles and discover the profile awards and badges available as you grow.",
    href: "/ambassadors", action: "See the program", bannerTitle: "CREATORS WELCOME", bannerText: "Build with GameBattles.",
  },
};

export const NEW_PROMO_KINDS = Object.keys(NEW_PROMOS) as NewPromoKind[];

export type HeroPromoKind = "discord" | "invite" | "challenges" | "tournaments" | "ambassadors" | "building";

export type HeroSlide =
  | { kind: "image"; src: string }
  | { kind: HeroPromoKind | NewPromoKind };

export function isNewPromoKind(kind: HeroPromoKind | NewPromoKind): kind is NewPromoKind {
  return Object.prototype.hasOwnProperty.call(NEW_PROMOS, kind);
}

export function buildHeroRotation(images: string[]): HeroSlide[] {
  const promos: (HeroPromoKind | NewPromoKind)[] = [
    "rivalry", "event-bracket", "affiliate-awards", "teammate", "game-showcase", "construction",
    "tournaments", "event-night", "friends", "affiliate-community", "discord",
    "rematch", "blueprint", "event-community", "challenges", "affiliate-creator",
    "ambassadors", "invite", "building",
  ];
  const slides: HeroSlide[] = [];
  for (let index = 0; index < promos.length; index += 1) {
    slides.push({ kind: promos[index] });
    const start = Math.floor(index * images.length / promos.length);
    const end = Math.floor((index + 1) * images.length / promos.length);
    for (let imageIndex = start; imageIndex < end; imageIndex += 1) {
      slides.push({ kind: "image", src: images[imageIndex] });
    }
  }
  return slides;
}

export function nextHeroSlideIndex(slides: HeroSlide[], current: number, loadedImages: ReadonlySet<string>, direction: 1 | -1 = 1): number {
  for (let offset = 1; offset <= slides.length; offset += 1) {
    const next = (current + direction * offset + slides.length * offset) % slides.length;
    const slide = slides[next];
    if (slide.kind !== "image" || loadedImages.has(slide.src)) return next;
  }
  return current;
}

export async function getHeroSlides(): Promise<string[]> {
  return CURATED_SLIDES;
}
