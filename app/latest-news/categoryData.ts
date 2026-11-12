export type NewsCategory = {
  slug: string;
  title: string;
  intro: string;
  showInMenu?: boolean;
  items: {
    label: string;
    title: string;
    description: string;
    link?: string;
    linkLabel?: string;
  }[];
};

export const acceptedSuggestions = [
  {
    title: "Top Clips community section",
    suggestion: "Create a community space for sharing clips and standout moments.",
    suggestedBy: "Not recorded",
    implementation: "A dedicated Top Clips category is available in the forums.",
    status: "Available now",
    link: "/forums#top-clips",
    linkLabel: "Visit Top Clips",
  },
];

export const newsCategories: NewsCategory[] = [
  {
    slug: "upcoming-updates",
    title: "Upcoming Updates",
    intro: "Recent launches and upcoming GameBattles improvements.",
    items: [
      {
        label: "Available Now",
        title: "Community feed and follows",
        description: "Follow players and teams, see following and follower counts on player profiles, and react to and share match results, team wins, awards, and other community moments.",
        link: "/activity",
        linkLabel: "Open the activity feed",
      },
      {
        label: "Available Now",
        title: "Free weekly Community Cups",
        description: "Saturday cups offer a weekly competition loop, with 5 credits and a winner award for each winning player. The monthly top team earns 25 credits and an award for each player.",
        link: "/tournaments",
        linkLabel: "Browse tournaments",
      },
      {
        label: "Available Now",
        title: "Easier mobile entry",
        description: "The homepage highlights active competitions and gives new players a clearer path to get started.",
        link: "/tournaments",
        linkLabel: "Find a competition",
      },
      {
        label: "Available Now",
        title: "Browse current competitions",
        description: "Explore the live catalog while additional improvements are in progress.",
        link: "/ladders",
        linkLabel: "Browse ladders",
      },
    ],
  },
  {
    slug: "accepted-suggestions",
    title: "Accepted Suggestions",
    intro: "Community ideas selected for GameBattles improvements.",
    items: [],
  },
  {
    slug: "new-ladders",
    title: "New Ladders",
    showInMenu: false,
    intro: "Ladder availability and competition updates across supported platforms.",
    items: [
      {
        label: "Ladder Catalog",
        title: "Browse games and platforms",
        description: "The catalog groups available ladders by platform, game, and category.",
        link: "/ladders",
        linkLabel: "Open the ladder catalog",
      },
      {
        label: "Game-specific",
        title: "Find the right competition",
        description: "Team links open the ladder pages relevant to that team's game and platform.",
      },
    ],
  },
  {
    slug: "tournaments",
    title: "Tournaments",
    showInMenu: false,
    intro: "Tournament announcements and entry points for GameBattles events.",
    items: [
      {
        label: "Tournament Hub",
        title: "Browse all tournaments",
        description: "See available events across games, or open a game-specific tournament page from a team.",
        link: "/tournaments",
        linkLabel: "View all tournaments",
      },
      {
        label: "Game-specific",
        title: "No active event?",
        description: "Game-specific tournament pages still explain the status and link back to the full event list.",
      },
    ],
  },
  {
    slug: "top-clips",
    title: "Top Clips",
    showInMenu: false,
    intro: "Community clips and standout competitive moments.",
    items: [
      {
        label: "Community",
        title: "Share a clip",
        description: "Use the Top Clips forum category to share standout moments with the community.",
        link: "/forums#top-clips",
        linkLabel: "Open the Top Clips forum",
      },
    ],
  },
  {
    slug: "rule-changes",
    title: "Rule Changes",
    intro: "Important rule information for accounts, teams, matches, and tournaments.",
    items: [
      {
        label: "Current Rules",
        title: "Review the community and match rules",
        description: "Check the current rules for fair play, proof, disputes, accounts, and tournament participation.",
        link: "/rules",
        linkLabel: "Read the full rules",
      },
      {
        label: "Announcements",
        title: "Rule updates will be posted here",
        description: "This category is the place to find noteworthy changes when the rules are updated.",
      },
    ],
  },
];

export const newsMenuCategories = newsCategories.filter((category) => category.showInMenu !== false);
