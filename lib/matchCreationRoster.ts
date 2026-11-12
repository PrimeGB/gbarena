export function getPlayerOptions(ladder: string | null, isRedSec: boolean, teamSizes?: string[]) {
  if (isRedSec) return ["2v2", "3v3", "4v4"];
  if (ladder === "rapid-royal-duos") return ["2v2", "3v3"];
  if (ladder === "singles") return ["1v1"];
  if (ladder === "duos") return ["2v2"];
  return teamSizes?.length ? teamSizes : ["3v3", "4v4", "5v5", "6v6", "7v7", "8v8"];
}

export function getRequiredRosterSize(ladder: string | null, players: string) {
  const normalized = String(players || "").toLowerCase();

  if (ladder === "singles" || normalized === "1v1") return 1;
  if (ladder === "duos" || normalized.startsWith("2v")) return 2;

  const match = normalized.match(/(\d+)v/);
  if (match) return Number(match[1]);

  return 1;
}
