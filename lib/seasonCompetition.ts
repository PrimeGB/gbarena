export type CompetitionKind = "players" | "teams";
export type CompetitionSeason = {
  id: string; number?: number; name: string; starts_at: string; ends_at: string;
};
export type SeasonScope = { scope: string; label: string };
export type SeasonHonour = {
  id: string; season_id: string; season_name: string; season_number: number;
  kind: CompetitionKind; scope: string; scope_label: string; entity_id: string;
  name: string; honour: string; place: number; wins: number; losses: number; awarded_at: string;
};

export const seasonHonourNames: Record<string, string> = {
  champion: "Season Champion",
  top10: "Season Top 10",
  undefeated: "Perfect Season Relic",
  iron_competitor: "Iron Competitor Crest",
  dynasty: "Three-Time Dynasty Seal",
};

export const rareSeasonAchievements = [
  { honour: "undefeated", name: "Perfect Season Relic", rule: "10 or more finalized wins with no losses in a completed monthly season." },
  { honour: "iron_competitor", name: "Iron Competitor Crest", rule: "50 finalized matches and at least one win in a completed monthly season." },
  { honour: "dynasty", name: "Three-Time Dynasty Seal", rule: "Three eligible global season championships. Earned with the third title." },
];

export function seasonBoardHref(season: string, kind: CompetitionKind, scope = "global") {
  return `/players/top?${new URLSearchParams({ board: "season", season, kind, scope })}`;
}

export function groupSeasonChampions(rows: SeasonHonour[]) {
  const groups = new Map<string, { honour: SeasonHonour; categories: { scope: string; label: string }[] }>();
  for (const honour of rows) {
    if (honour.honour !== "champion") continue;
    const key = `${honour.season_id}:${honour.kind}:${honour.entity_id}`;
    const group = groups.get(key);
    if (!group) groups.set(key, { honour, categories: [{ scope: honour.scope, label: honour.scope_label }] });
    else {
      if (honour.scope === "global") group.honour = honour;
      if (!group.categories.some((category) => category.scope === honour.scope)) {
        group.categories.push({ scope: honour.scope, label: honour.scope_label });
      }
    }
  }
  return [...groups.values()].sort((a, b) =>
    Number(b.honour.scope === "global") - Number(a.honour.scope === "global")
      || a.honour.kind.localeCompare(b.honour.kind) || a.honour.name.localeCompare(b.honour.name));
}

export function competitionActivityLabel(kind: string) {
  const labels: Record<string, string> = {
    match: "Match result", award: "Award earned", team: "New team", friend: "New friendship",
    rank: "Rank climb", rival: "Rival rematch won", tournament: "Tournament champion", season: "Season honour",
  };
  return labels[kind] || "Community update";
}

export function seasonPreviewHonours(seasonName: string, kind: CompetitionKind): SeasonHonour[] {
  return [
    { honour: "champion", name: kind === "teams" ? "Example Champions" : "Example Player", place: 1, wins: 18, losses: 2 },
    { honour: "top10", name: kind === "teams" ? "Example Contenders" : "Example Contender", place: 7, wins: 9, losses: 5 },
    { honour: "undefeated", name: kind === "teams" ? "Example Undefeated" : "Example Unbeaten", place: 2, wins: 12, losses: 0 },
  ].map((item, index) => ({
    ...item, id: `preview-${index}`, season_id: "preview", season_name: seasonName,
    season_number: 1, kind, scope: "global", scope_label: "All games & ladders",
    entity_id: `preview-${index}`, awarded_at: "2026-01-01T00:00:00Z",
  }));
}
