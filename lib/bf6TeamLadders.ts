export const bf6TeamLadders = {
  "domination-5v5": { title: "5v5 Domination", players: "5v5", mode: "Domination", presets: ["GB Domination (Provisional)"] },
  "obliteration-4v4": { title: "4v4 Squad Obliteration", players: "4v4", mode: "Squad Obliteration", presets: ["ESB Squad Obliteration"] },
  "conquest-8v8": { title: "8v8 Conquest", players: "8v8", mode: "Conquest", presets: ["ESB Conquest Small", "SnP T8 Conquest"] },
  "conquest-12v12": { title: "12v12 Conquest", players: "12v12", mode: "Conquest", presets: ["ESB Conquest Small"] },
  "conquest-32v32": { title: "32v32 Conquest", players: "32v32", mode: "Conquest", presets: ["GB Conquest (Provisional)"] },
} as const;

export type Bf6TeamLadder = keyof typeof bf6TeamLadders;

export function getBf6TeamLadder(category: string, game: string, ladder?: string | null) {
  if (category !== "battlefield" || game !== "battlefield-6" || !ladder || !Object.prototype.hasOwnProperty.call(bf6TeamLadders, ladder)) return null;
  return bf6TeamLadders[ladder as Bf6TeamLadder];
}

export function getBf6TeamRosterSize(category: string, game: string, ladder?: string | null) {
  const format = getBf6TeamLadder(category, game, ladder);
  return format ? Number(format.players.split("v")[0]) : null;
}

export const bf6TeamSources = [
  { title: "ESB 4v4 Squad Obliteration rules", url: "https://esport-battlefield.com/ruleset-bf6-4v4-squad-oblit/" },
  { title: "ESB 8v8 and 12v12 Conquest Small rules", url: "https://esport-battlefield.com/battlefield-6-12v12-esb-conquest-small/" },
  { title: "SnP T8 Conquest rules", url: "https://snp.teamwarfare.net/ladders/bf6-snp-t8-cq-s3-emea" },
  { title: "Nightcups 5v5 Domination test tournament", url: "https://nightcups.eu/tournaments/domination-5v5-kickoff" },
  { title: "EA Portal Builder guide", url: "https://www.ea.com/games/battlefield/battlefield-6/news/portal-101-verified-experiences" },
];
