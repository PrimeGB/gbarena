import { supabase } from "./supabase";
import { platformLabel } from "./competitionConfig";

export type LeaderRow = {
  id: string;
  label: string;
  value: number;
  sub: string;
  href?: string;
};

export type LeaderboardResult = {
  rows: LeaderRow[];
  note?: string;
  series?: { label: string; value: number }[];
};

type TeamRow = {
  id: string;
  name: string | null;
  tag: string | null;
  rating_points: number | null;
  wins: number | null;
  losses: number | null;
  platform: string | null;
  category: string | null;
  game: string | null;
  ladder: string | null;
  created_at: string | null;
  region?: string | null;
  current_streak?: number | null;
};

function teamLabel(t: TeamRow) {
  return `${t.tag ? `[${t.tag}] ` : ""}${t.name || "Unnamed Team"}`;
}

function winPct(w: number, l: number) {
  const total = w + l;
  return total ? `${Math.round((w / total) * 100)}%` : "—";
}

async function loadTeams(filter?: (t: TeamRow) => boolean): Promise<TeamRow[]> {
  const { data, error } = await supabase
    .from("teams")
    .select("*")
    .or("wins.gt.0,losses.gt.0")
    .order("rating_points", { ascending: false })
    .limit(500);
  if (error) throw new Error(error.message);
  const rows = (data || []) as TeamRow[];
  return filter ? rows.filter(filter) : rows;
}

function toRow(t: TeamRow, value: number, sub: string): LeaderRow {
  return { id: t.id, label: teamLabel(t), value, sub, href: `/teams/${t.id}` };
}

export async function globalBoard(): Promise<LeaderboardResult> {
  const teams = await loadTeams();
  return {
    rows: teams.map((t) => toRow(t, t.rating_points ?? 100, `${platformLabel(t.platform)} · ${winPct(t.wins || 0, t.losses || 0)}`)),
    note: "Top teams across every game and platform, ranked by rating.",
  };
}

export async function gameBoard(game: string): Promise<LeaderboardResult> {
  const teams = await loadTeams((t) => t.game === game);
  return { rows: teams.map((t) => toRow(t, t.rating_points ?? 100, `${platformLabel(t.platform)} · ${winPct(t.wins || 0, t.losses || 0)}`)) };
}

export async function platformBoard(platform: string): Promise<LeaderboardResult> {
  const teams = await loadTeams((t) => (t.platform || "").toLowerCase() === platform.toLowerCase());
  return { rows: teams.map((t) => toRow(t, t.rating_points ?? 100, `${t.game || "All games"} · ${winPct(t.wins || 0, t.losses || 0)}`)) };
}

export async function ladderBoard(category: string, game: string, ladder: string): Promise<LeaderboardResult> {
  const teams = await loadTeams((t) => t.category === category && t.game === game && t.ladder === ladder);
  return { rows: teams.map((t) => toRow(t, t.rating_points ?? 100, `${platformLabel(t.platform)} · ${winPct(t.wins || 0, t.losses || 0)}`)) };
}

export async function regionalBoard(region: string): Promise<LeaderboardResult> {
  const teams = await loadTeams((t) => (t.region || "Unspecified") === region);
  return {
    rows: teams.map((t) => toRow(t, t.rating_points ?? 100, `${t.game || "All games"} · ${platformLabel(t.platform)}`)),
    note: "Regional standings populate as teams set a region on their profile.",
  };
}

export async function playerBoard(): Promise<LeaderboardResult> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("xp", { ascending: false })
    .limit(100);
  if (error) throw new Error(error.message);
  const rows = (data || []) as { id: string; username: string | null; xp?: number | null }[];
  return {
    rows: rows.map((p) => ({ id: p.id, label: p.username || "Player", value: p.xp ?? 0, sub: `${(p.xp ?? 0).toLocaleString()} XP`, href: `/players/${p.id}` })),
    note: "Individual players ranked by earned XP.",
  };
}

export async function rookieBoard(): Promise<LeaderboardResult> {
  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .gte("created_at", cutoff)
    .order("xp", { ascending: false })
    .limit(100);
  if (error) throw new Error(error.message);
  const rows = (data || []) as { id: string; username: string | null; xp?: number | null }[];
  return {
    rows: rows.map((p) => ({ id: p.id, label: p.username || "Player", value: p.xp ?? 0, sub: `${(p.xp ?? 0).toLocaleString()} XP · joined recently`, href: `/players/${p.id}` })),
    note: "Best rookies: players who joined in the last 90 days, ranked by XP.",
  };
}

export async function improvedBoard(): Promise<LeaderboardResult> {
  const { data, error } = await supabase
    .from("team_match_rank_movement")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1000);
  if (error) throw new Error(error.message);
  const totals = new Map<string, number>();
  for (const row of (data || []) as Record<string, unknown>[]) {
    const teamId = String(row.team_id ?? "");
    const delta = Number(row.delta ?? row.movement ?? row.rank_change ?? 0);
    if (teamId) totals.set(teamId, (totals.get(teamId) ?? 0) + delta);
  }
  const ranked = [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 50);
  let rows: LeaderRow[] = ranked.map(([id, delta]) => ({ id, label: id.slice(0, 8), value: delta, sub: `+${delta} rank spots`, href: `/teams/${id}` }));
  if (!rows.length) {
    const teams = await loadTeams();
    rows = teams.slice(0, 50).map((t) => toRow(t, t.wins || 0, `${t.wins || 0} wins`));
    return { rows, note: "Most improved (by recent rank movement). Showing win leaders until movement data accrues." };
  }
  return { rows, note: "Most improved teams by accumulated rank movement." };
}

export async function streakBoard(): Promise<LeaderboardResult> {
  const teams = await loadTeams();
  return {
    rows: teams
      .map((t) => toRow(t, t.current_streak ?? t.wins ?? 0, t.current_streak != null ? `${t.current_streak} win streak` : `${t.wins || 0} wins`))
      .sort((a, b) => b.value - a.value)
      .slice(0, 50),
    note: "Current win streaks. Teams without a tracked streak fall back to total wins.",
  };
}

export async function activeBoard(): Promise<LeaderboardResult> {
  const { data, error } = await supabase.from("match_participants").select("*").limit(5000);
  if (error) throw new Error(error.message);
  const counts = new Map<string, number>();
  for (const row of (data || []) as Record<string, unknown>[]) {
    const uid = String(row.user_id ?? row.player_id ?? "");
    if (uid) counts.set(uid, (counts.get(uid) ?? 0) + 1);
  }
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 50);
  return {
    rows: top.map(([id, count]) => ({ id, label: id.slice(0, 8), value: count, sub: `${count} matches`, href: `/players/${id}` })),
    note: "Most active competitors by matches played.",
  };
}

export async function historySeries(): Promise<LeaderboardResult> {
  const { data, error } = await supabase
    .from("team_match_rank_movement")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(200);
  if (error) throw new Error(error.message);
  const points = (data || []).map((row) => {
    const r = row as Record<string, unknown>;
    return { label: String(r.created_at ?? "").slice(5, 10), value: Number(r.rank ?? r.new_rank ?? r.movement ?? 0) };
  });
  return {
    rows: [],
    series: points,
    note: points.length ? "Rank movement over recent matches." : "Historical ranking data will appear as matches are played.",
  };
}