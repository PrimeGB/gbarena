export type NewsCategory = {
  slug: string;
  title: string;
  intro: string;
  items: {
    label: string;
    title: string;
    description: string;
    link?: string;
    linkLabel?: string;
  }[];
};

export const newsCategories: NewsCategory[] = [
  {
    slug: "upcoming-updates",
    title: "Upcoming Updates",
    intro: "A place for work in progress and upcoming GameBattles improvements.",
    items: [
      {
        label: "In Progress",
        title: "More site improvements",
        description: "We are continuing to refine the experience. Confirmed changes and launch details will be shared here when they are ready.",
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
    items: [
      {
        label: "Accepted",
        title: "Top Clips community section",
        description: "A dedicated forum category is available for sharing clips and standout moments.",
        link: "/forums#top-clips",
        linkLabel: "Visit Top Clips",
      },
      {
        label: "Have an idea?",
        title: "Send a suggestion",
        description: "Share an improvement idea for the GameBattles team to review.",
        link: "/suggestions",
        linkLabel: "Submit a suggestion",
      },
    ],
  },
  {
    slug: "new-ladders",
    title: "New Ladders",
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
