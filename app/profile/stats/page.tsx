"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useUser } from "../../../lib/useUser";
import { supabase } from "../../../lib/supabase";

type PlayerStats = {
  wins: number;
  losses: number;
  win_pct: number | null;
  current_streak: number;
  current_streak_type: "W" | "L" | null;
  best_win_streak: number;
  last_10: ("W" | "L")[];
  by_game: { game: string | null; wins: number; losses: number }[];
};

type SeasonHistoryRow = {
  season_id: string;
  name: string;
  wins: number;
  losses: number;
  place: number;
  players: number;
  current: boolean;
};

function StatsContent() {
  const { user, loading } = useUser();
  const searchParams = useSearchParams();
  const requestedUserId = String(searchParams.get("userId") || "");
  const viewedUserId = requestedUserId || user?.id || "";
  const isOwn = !!user?.id && viewedUserId === user.id;

  const [username, setUsername] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [seasons, setSeasons] = useState<SeasonHistoryRow[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (loading || !viewedUserId) return;
    let cancelled = false;

    async function load() {
      const { data: profile } = await supabase
        .from("profiles")
        .select("username,stats_public")
        .eq("id", viewedUserId)
        .maybeSingle();
      const publicFlag = profile?.stats_public !== false;
      const canView = publicFlag || isOwn;

      let statsData: PlayerStats | null = null;
      let seasonData: SeasonHistoryRow[] = [];
      if (canView) {
        const [statsRes, seasonRes] = await Promise.all([
          supabase.rpc("gb_player_stats", { p_user: viewedUserId }),
          supabase.rpc("gb_player_season_history", { p_user: viewedUserId }),
        ]);
        statsData = statsRes.error ? null : (statsRes.data as PlayerStats);
        seasonData = seasonRes.error ? [] : ((seasonRes.data || []) as SeasonHistoryRow[]);
      }

      if (cancelled) return;
      setUsername(profile?.username || "Player");
      setIsPublic(publicFlag);
      setStats(statsData);
      setSeasons(seasonData);
      setReady(true);
    }

    queueMicrotask(load);
    return () => {
      cancelled = true;
    };
  }, [loading, viewedUserId, isOwn]);

  const backHref = requestedUserId ? `/profile?userId=${requestedUserId}` : "/profile";
  const hidden = ready && !isPublic && !isOwn;
  const total = stats ? stats.wins + stats.losses : 0;

  return (
    <main className="st-page">
      <style>{`
        body{background:#000;color:#d7e2ee;font-family:Tahoma,Verdana,Arial,sans-serif;}
        .st-page{max-width:900px;margin:0 auto;padding:28px 16px 60px;}
        .st-back{color:#7fb8ee;text-decoration:none;font-size:13px;}
        .st-title{font-size:26px;margin:10px 0 4px;color:#fff;}
        .st-sub{opacity:.7;font-size:13px;margin-bottom:18px;}
        .st-box{background:#07111b;border:1px solid #1d4468;border-radius:8px;margin-bottom:16px;overflow:hidden;}
        .st-box h2{margin:0;padding:10px 14px;font-size:14px;text-transform:uppercase;letter-spacing:.05em;background:linear-gradient(to bottom,#173956,#07111b);}
        .st-body{padding:14px;}
        .st-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px;}
        .st-stat{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:8px;padding:12px;text-align:center;}
        .st-stat b{display:block;font-size:22px;color:#ffe9a8;}
        .st-stat span{font-size:11px;opacity:.75;text-transform:uppercase;}
        .st-form{display:flex;gap:4px;flex-wrap:wrap;}
        .st-pip{width:24px;height:24px;border-radius:4px;display:inline-grid;place-items:center;font-size:11px;font-weight:800;color:#fff;}
        .st-pip.w{background:#2e8b3d;}
        .st-pip.l{background:#a33030;}
        .st-table{width:100%;border-collapse:collapse;font-size:13px;}
        .st-table td{padding:8px;border-top:1px solid rgba(255,255,255,.1);}
        .st-table tr:first-child td{border-top:0;}
        .st-table td:not(:first-child){text-align:right;}
        .st-empty{opacity:.75;font-size:14px;padding:6px 0;}
        @media (max-width:600px){.st-grid{grid-template-columns:repeat(2,1fr);}}
      `}</style>

      <Link className="st-back" href={backHref}>← Back to profile</Link>
      <h1 className="st-title">{ready ? `${username}'s Stats` : "Stats"}</h1>
      <div className="st-sub">Player Stats and Season History</div>

      {!ready && <div className="st-empty">Loading...</div>}

      {hidden && (
        <div className="st-box">
          <div className="st-body st-empty">This player has chosen to keep their stats private.</div>
        </div>
      )}

      {ready && !hidden && (
        <>
          {isOwn && !isPublic && (
            <div className="st-sub">Only you can see this. Turn on public stats in Account / Profile → Settings.</div>
          )}

          <div className="st-box">
            <h2>Player Stats</h2>
            <div className="st-body">
              {stats && total > 0 ? (
                <>
                  <div className="st-grid">
                    <div className="st-stat"><b>{stats.wins}-{stats.losses}</b><span>Record</span></div>
                    <div className="st-stat"><b>{stats.win_pct ?? 0}%</b><span>Win Rate</span></div>
                    <div className="st-stat"><b>{stats.current_streak_type ? `${stats.current_streak_type}${stats.current_streak}` : "-"}</b><span>Streak</span></div>
                    <div className="st-stat"><b>{stats.best_win_streak}</b><span>Best Win Streak</span></div>
                  </div>
                  <div className="st-form">
                    {stats.last_10.map((result, index) => (
                      <span key={index} className={`st-pip ${result === "W" ? "w" : "l"}`}>{result}</span>
                    ))}
                  </div>
                  {stats.by_game.length > 0 && (
                    <table className="st-table" style={{ marginTop: 14 }}>
                      <tbody>
                        {stats.by_game.map((row) => (
                          <tr key={row.game || "unknown"}>
                            <td>{row.game || "Unknown game"}</td>
                            <td>{row.wins}-{row.losses}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </>
              ) : (
                <div className="st-empty">No matches played yet.</div>
              )}
            </div>
          </div>

          <div className="st-box">
            <h2>Season History</h2>
            <div className="st-body">
              {seasons.length > 0 ? (
                <table className="st-table">
                  <tbody>
                    {seasons.map((row) => (
                      <tr key={row.season_id}>
                        <td>{row.name}{row.current ? " (current)" : ""}</td>
                        <td>{row.wins}-{row.losses}</td>
                        <td>#{row.place} of {row.players}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="st-empty">No season results yet.</div>
              )}
            </div>
          </div>
        </>
      )}
    </main>
  );
}

export default function PlayerStatsPage() {
  return (
    <Suspense fallback={null}>
      <StatsContent />
    </Suspense>
  );
}
