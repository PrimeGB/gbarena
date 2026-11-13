import { newsCategories } from "../app/latest-news/categoryData";
import { categoriesForPlatform, gamesForCategory, ladderPlatforms, laddersForGame } from "./ladderCatalog";
import type { SiteSearchResult } from "./searchRanking";

const pages: [string, string, string, string][] = [
  ["/home", "Home", "GameBattles home page", "main menu"],
  ["/getting-started", "Getting Started", "Learn how to join and compete", "beginner guide new account"],
  ["/about", "About GameBattles", "Learn about the community", "about us"],
  ["/general-info", "General Information", "Information about GameBattles", "help guide"],
  ["/rules", "Rules", "Community, match and tournament rules", "proof disputes fair play cheating"],
  ["/latest-news", "Latest News", "News and updates", "announcements changes"],
  ["/forums", "Forums", "Community discussions and updates", "posts threads questions suggestions clips"],
  ["/recruit", "Recruit Players", "Find teammates and recruit players", "looking for team lft recruitment"],
  ["/champions", "Champions", "Competition champions", "winners"],
  ["/activity", "Community Activity", "See activity from players and teams", "feed following followers"],
  ["/tournaments", "Tournaments", "Browse events and weekly cups", "competition prizes credits"],
  ["/matches/finder", "Find a Match", "Find matches and opponents", "match finder challenge play"],
  ["/matches/finder/help", "Match Finder Help", "How to post, accept and play matches", "guide finding opponent challenge"],
  ["/matches/create", "Create a Match", "Set up a match", "challenge schedule opponent"],
  ["/players/top", "Top Players", "Player leaderboard and rankings", "best rank standings"],
  ["/teams/top", "Top Teams", "Team leaderboard and rankings", "best rank standings"],
  ["/members", "Members", "Browse players and members", "people usernames"],
  ["/players", "Players", "Browse players", "members people"],
  ["/awards", "Awards", "Browse trophies and awards", "achievements badges"],
  ["/history", "History", "GameBattles history", "past legacy"],
  ["/support", "Support", "Get help and contact staff", "help ticket dispute report"],
  ["/support/account", "Account Support", "Help with account problems", "login password account issue"],
  ["/support/matches", "Match Support", "Help with match problems", "results proof report"],
  ["/support/dispute-ticket", "Match Dispute", "Submit a match dispute ticket", "support proof report score"],
  ["/report", "Report a Player", "Report a player or conduct concern", "abuse cheating moderation"],
  ["/contact", "Contact", "Contact GameBattles", "help support"],
  ["/join", "Join", "Create your GameBattles account", "register sign up"],
  ["/login", "Log In", "Sign in to your account", "login password"],
  ["/ladders", "Ladders", "Browse games and competitions", "platforms games ranks"],
  ["/teams/create", "Create a Team", "Start a new team", "make squad roster"],
  ["/team-hub", "Team Hub", "Manage and find teams", "roster squad"],
  ["/profile", "Profile", "View your player profile", "account"],
  ["/profile/edit", "Edit Profile", "Update your profile and account settings", "username avatar privacy"],
  ["/profile/teams", "My Teams", "View your teams and invitations", "team roster"],
  ["/profile/inbox", "Inbox", "Read and send messages", "mail chat message"],
  ["/profile/friends", "Friends", "View and manage friends", "requests"],
  ["/profile/gaming-accounts", "Gaming Accounts", "Manage your gaming IDs", "gamertag psn xbox steam"],
  ["/profile/stats", "Player Stats", "View your player statistics", "record wins losses"],
  ["/profile/matches", "My Matches", "View your matches", "schedule results history"],
  ["/profile/security", "Account Security", "Manage account security", "password login"],
  ["/profile/awards", "My Awards", "View your earned awards", "trophies achievements"],
  ["/suggestions", "Site Suggestions", "Suggest improvements", "ideas feedback"],
  ["/staff", "Staff", "Meet the GameBattles staff", "admins moderators"],
  ["/credits-terms", "Credits Terms", "Information about credits", "payments terms"],
  ["/disclaimer", "Disclaimer", "GameBattles disclaimer", "legal"],
];

export const siteSearchIndex: SiteSearchResult[] = [
  ...pages.map(([href, title, description, keywords]) => ({
    id: `page:${href}`, href, title, description, keywords, type: "Page",
  })),
  ...newsCategories.flatMap((category) => [
    {
      id: `news:${category.slug}`,
      href: `/latest-news/${category.slug}`,
      title: category.title,
      description: category.intro,
      keywords: "news updates",
      type: "News",
    },
    ...category.items.map((item, index) => ({
      id: `news:${category.slug}:${index}`,
      href: `/latest-news/${category.slug}`,
      title: item.title,
      description: item.description,
      keywords: `${category.title} ${item.label}`,
      type: "News",
    })),
  ]),
  ...ladderPlatforms.flatMap((platform) => [
    {
      id: `platform:${platform.value}`, href: `/ladders/${platform.value}`,
      title: `${platform.label} Ladders`, description: `Browse ${platform.label} games and ladders`,
      keywords: platform.value === "playstation" ? "ps ps4 ps5" : platform.value === "nintendo" ? "switch" : "",
      type: "Platform",
    },
    ...categoriesForPlatform(platform.value).flatMap((category) => {
      const base = `/ladders/${platform.value}/${category.value}`;
      const aliases = category.value === "call-of-duty" ? "cod" : category.value === "battlefield" ? "bf" : category.value === "rainbow-six" ? "r6 siege" : "";
      return [
        {
          id: `category:${base}`, href: base, title: `${category.label} - ${platform.label}`,
          description: `${category.label} games and ladders on ${platform.label}`,
          keywords: aliases, type: "Game",
        },
        ...gamesForCategory(category.value).flatMap((game) => {
          const gamePath = `${base}/${game.value}`;
          return [
            {
              id: `game:${gamePath}`, href: gamePath,
              title: `${game.label} - ${platform.label}`,
              description: `${category.label} ladders on ${platform.label}`,
              keywords: `${aliases} ${game.value}`, type: "Game",
            },
            ...laddersForGame(category.value, game.value).flatMap((ladder) => [
              {
                id: `ladder:${gamePath}:${ladder.slug}`,
                href: `${gamePath}/${ladder.slug}/rankings`,
                title: `${ladder.title} - ${game.label} - ${platform.label}`,
                description: `${category.label} ladder rankings on ${platform.label}`,
                keywords: `${aliases} ${game.value} ${ladder.slug}`,
                type: "Ladder",
              },
              {
                id: `ladder-rules:${gamePath}:${ladder.slug}`,
                href: `${gamePath}/${ladder.slug}/rules`,
                title: `${ladder.title} Rules - ${game.label} - ${platform.label}`,
                description: `${category.label} ladder rules on ${platform.label}`,
                keywords: `${aliases} ${game.value} ${ladder.slug}`,
                type: "Rules",
              },
            ]),
          ];
        }),
      ];
    }),
  ]),
];
