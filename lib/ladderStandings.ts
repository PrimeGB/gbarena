import { supabase } from "./supabase";

export async function ladderPlatforms(category: string, game: string, platform: string): Promise<string[]> {
  const { data, error } = await supabase.rpc("gb_ladder_platforms", {
    p_category: category,
    p_game: game,
    p_platform: platform,
  });
  if (error) throw new Error(`Could not load compatible systems: ${error.message}`);
  if (!Array.isArray(data) || !data.length) throw new Error("No compatible systems were returned for this ladder.");
  return data as string[];
}

export type RankedTeam = {
  id: string;
  platform: string | null;
  rating_points: number | null;
  wins: number | null;
  losses: number | null;
  created_at: string | null;
};

export function compareRankedTeams(a: RankedTeam, b: RankedTeam) {
  return (b.rating_points ?? 100) - (a.rating_points ?? 100)
    || (b.wins ?? 0) - (a.wins ?? 0)
    || (a.losses ?? 0) - (b.losses ?? 0)
    || String(a.created_at ?? "").localeCompare(String(b.created_at ?? ""))
    || a.id.localeCompare(b.id);
}

export async function rankedLadderTeams(category: string, game: string, ladder: string, platform: string): Promise<RankedTeam[]> {
  const platforms = await ladderPlatforms(category, game, platform);
  const { data, error } = await supabase.from("teams")
    .select("id,platform,rating_points,wins,losses,created_at")
    .in("platform", platforms).eq("category", category).eq("game", game).eq("ladder", ladder)
    .or("wins.gt.0,losses.gt.0");
  if (error) throw new Error(`Could not load ladder rankings: ${error.message}`);
  return ((data || []) as RankedTeam[]).sort(compareRankedTeams);
}
