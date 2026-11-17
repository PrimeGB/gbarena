export type ChallengeStat =
  | "daily_completions" | "longest_streak" | "threads_started" | "threads_replied" | "engaged_threads" | "friends"
  | "messages_sent" | "players_followed" | "followers" | "reactions" | "match_comments" | "recruit_posts"
  | "match_posts" | "tournament_entries" | "bug_reports" | "suggestions";

export type ChallengeTrophy = {
  name: string;
  group: "Daily Challenges" | "Login Rewards" | "Site Interaction";
  requirement: string;
  stat: ChallengeStat;
  need: number;
};

// Mirrors gb_reconcile_challenge_trophies; every trophy is a different task.
export const CHALLENGE_TROPHIES: ChallengeTrophy[] = [
  { name: "Daily Grind Trophy", group: "Daily Challenges", stat: "daily_completions", need: 3, requirement: "Complete 3 Daily Challenges." },
  { name: "On Fire Trophy", group: "Login Rewards", stat: "longest_streak", need: 3, requirement: "Sign in 3 days in a row." },
  { name: "Thread Starter Trophy", group: "Site Interaction", stat: "threads_started", need: 1, requirement: "Start your first forum thread." },
  { name: "Chime In Trophy", group: "Site Interaction", stat: "threads_replied", need: 1, requirement: "Comment on another player's forum thread." },
  { name: "Conversation Starter Trophy", group: "Site Interaction", stat: "engaged_threads", need: 1, requirement: "Start a thread that gets replies from 2 players." },
  { name: "First Message Trophy", group: "Site Interaction", stat: "messages_sent", need: 1, requirement: "Send a message to another player." },
  { name: "Squad Up Trophy", group: "Site Interaction", stat: "friends", need: 1, requirement: "Add your first friend." },
  { name: "Inner Circle Trophy", group: "Site Interaction", stat: "friends", need: 5, requirement: "Have 5 friends on GameBattles." },
  { name: "Eagle Eye Trophy", group: "Site Interaction", stat: "players_followed", need: 3, requirement: "Follow 3 players." },
  { name: "Rising Star Trophy", group: "Site Interaction", stat: "followers", need: 1, requirement: "Get your first follower." },
  { name: "Hype Squad Trophy", group: "Site Interaction", stat: "reactions", need: 1, requirement: "React to a post in the activity feed." },
  { name: "Sideline Voice Trophy", group: "Site Interaction", stat: "match_comments", need: 1, requirement: "Comment on a match." },
  { name: "Call to Arms Trophy", group: "Site Interaction", stat: "recruit_posts", need: 1, requirement: "Post on the recruiting board." },
  { name: "Gauntlet Thrown Trophy", group: "Site Interaction", stat: "match_posts", need: 1, requirement: "Post a ladder match in the Match Finder." },
  { name: "Into the Bracket Trophy", group: "Site Interaction", stat: "tournament_entries", need: 1, requirement: "Sign up for a tournament." },
  { name: "Bug Reporter Trophy", group: "Site Interaction", stat: "bug_reports", need: 1, requirement: "Report a bug you find on the site." },
  { name: "Bright Idea Trophy", group: "Site Interaction", stat: "suggestions", need: 1, requirement: "Send a site suggestion or idea." },
];
const LIMITED_TROPHIES = [
  "Launch Week Trophy", "Harvest Brawl Trophy", "Forum Frontline Trophy", "Squad Link Trophy", "Frostbite Trophy",
  "Holiday Siege Trophy", "Countdown Clash Trophy", "New Year Rush Trophy", "Second Wind Trophy",
  "Winter Warfare Trophy", "New Dawn Trophy",
];

const ALL = new Set([...CHALLENGE_TROPHIES.map((trophy) => trophy.name), ...LIMITED_TROPHIES]);

export function hasChallengeTrophy(name: string) {
  return ALL.has(name);
}
