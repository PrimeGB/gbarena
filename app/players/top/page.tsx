"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";

type Board = "overall" | "week" | "month" | "season";
type PlayerRow = {
  id: string;
  username: string | null;
  gb_wins: number | null;
  gb_losses: number | null;
  gb_rank_points: number | null;
};
type Standing = { id: string; name: string | null; wins: number; losses: number; rank: number };
type Season = { id: string; name: string; starts_at: string; ends_at: string };
type PlayerContext = { game: string | null; ladder: string | null };

const boards: { id: Board; label: string; detail: string }[] = [
  { id: "overall", label: "Overall", detail: "All-time GB points" },
  { id: "week", label: "Weekly", detail: "This week's matches" },
  { id: "month", label: "Monthly", detail: "This month's matches" },
  { id: "season", label: "Season", detail: "Current & past seasons" },
];

const previewStandings: Standing[] = [
  { id: "preview-1", name: "Player One", wins: 12, losses: 2, rank: 1 },
  { id: "preview-2", name: "Player Two", wins: 9, losses: 3, rank: 2 },
  { id: "preview-3", name: "Player Three", wins: 6, losses: 4, rank: 3 },
];

function prettyText(value: string | null | undefined) {
  if (!value) return "Unknown";
  if (value === "mw2") return "MW2";
  if (value === "modern-warfare-4") return "Modern Warfare (2019)";
  return value.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function ordinal(value: number) {
  const mod100 = value % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${value}th`;
  if (value % 10 === 1) return `${value}st`;
  if (value % 10 === 2) return `${value}nd`;
  if (value % 10 === 3) return `${value}rd`;
  return `${value}th`;
}

export default function TopPlayersPage() {
  const [board, setBoard] = useState<Board>("overall");
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [playerContexts, setPlayerContexts] = useState<Record<string, PlayerContext>>({});
  const [standings, setStandings] = useState<Standing[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [seasonId, setSeasonId] = useState("");
  const [seasonLoading, setSeasonLoading] = useState(true);
  const [seasonError, setSeasonError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadSeasons() {
      const { data: current, error: currentError } = await supabase.rpc("gb_current_season");
      if (cancelled) return;
      if (currentError) {
        setSeasonError(currentError.message);
        setSeasonLoading(false);
        return;
      }
      const { data, error: listError } = await supabase
        .from("seasons")
        .select("id,name,starts_at,ends_at")
        .order("starts_at", { ascending: false });
      if (cancelled) return;
      if (listError) {
        setSeasonError(listError.message);
      } else {
        const available = (data || []) as Season[];
        setSeasons(available);
        setSeasonId(current?.id || available[0]?.id || "");
      }
      setSeasonLoading(false);
    }
    loadSeasons();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadBoard() {
      setLoading(true);
      setError("");
      setShowPreview(false);

      if (board === "season" && seasonLoading) return;
      if (board === "season" && seasonError) {
        setError(seasonError);
        setLoading(false);
        return;
      }
      if (board === "season" && !seasonId) {
        setStandings([]);
        setLoading(false);
        return;
      }

      if (board !== "overall") {
        const result = board === "season"
          ? await supabase.rpc("gb_season_standings", { p_season: seasonId, p_kind: "players", p_limit: 100 })
          : await supabase.rpc("gb_leaderboard", { p_period: board, p_kind: "players", p_limit: 100 });
        if (cancelled) return;
        if (result.error) {
          setError(result.error.message);
          setStandings([]);
        } else {
          setStandings((result.data || []) as Standing[]);
        }
        setLoading(false);
        return;
      }

      const { data, error: loadError } = await supabase
        .from("profiles")
        .select("id,username,gb_wins,gb_losses,gb_rank_points")
        .order("gb_rank_points", { ascending: false })
        .order("gb_wins", { ascending: false })
        .order("gb_losses", { ascending: true })
        .limit(100);
      if (cancelled) return;
      if (loadError) {
        setError(loadError.message);
        setLoading(false);
        return;
      }

      const loadedPlayers = (data || []) as PlayerRow[];
      const playerIds = loadedPlayers.map((player) => player.id);
      const contexts: Record<string, PlayerContext> = {};
      if (playerIds.length > 0) {
        const { data: memberships, error: membershipError } = await supabase
          .from("team_members").select("user_id,team_id").in("user_id", playerIds);
        if (cancelled) return;
        if (membershipError) {
          setError(membershipError.message);
          setLoading(false);
          return;
        }
        const teamIds = [...new Set((memberships || []).map((membership) => membership.team_id))];
        if (teamIds.length > 0) {
          const { data: teams, error: teamsError } = await supabase
            .from("teams").select("id,game,ladder").in("id", teamIds);
          if (cancelled) return;
          if (teamsError) {
            setError(teamsError.message);
            setLoading(false);
            return;
          }
          const teamsById = new Map((teams || []).map((team) => [team.id, team]));
          (memberships || []).forEach((membership) => {
            const team = teamsById.get(membership.team_id);
            if (!contexts[membership.user_id] && team) {
              contexts[membership.user_id] = { game: team.game, ladder: team.ladder };
            }
          });
        }
      }
      setPlayers(loadedPlayers);
      setPlayerContexts(contexts);
      setLoading(false);
    }
    loadBoard();
    return () => { cancelled = true; };
  }, [board, seasonId, seasonLoading, seasonError]);

  const selectedBoard = boards.find((item) => item.id === board)!;
  const selectedSeason = seasons.find((season) => season.id === seasonId);
  const periodRows = showPreview ? previewStandings : standings;

  return (
    <>
      <style>{`
        .top-players-page{min-height:100vh;background:radial-gradient(ellipse at 50% 0,#10263b 0,#02070d 48%,#000 100%);padding:32px 22px 56px;font-family:Tahoma,Verdana,Arial,sans-serif;color:#d7e2ee;}
        .top-players-page *{box-sizing:border-box;}
        .tp-wrap{max-width:1060px;margin:0 auto;background:#07111b;border:1px solid #315f88;box-shadow:0 12px 40px #000b;}
        .tp-strip{min-height:30px;background:linear-gradient(to bottom,#8b0000,#3b0000);border-bottom:1px solid #b32222;display:flex;align-items:center;justify-content:flex-end;gap:18px;padding:5px 14px;}
        .tp-strip a{color:#fff;font-size:12px;font-weight:bold;text-transform:uppercase;text-decoration:none;}
        .tp-strip a:hover,.tp-strip a:focus-visible{color:#ffdc81;}
        .tp-header{position:relative;overflow:hidden;padding:24px 24px 25px;background:radial-gradient(ellipse at 87% 20%,#26577b 0,transparent 46%),linear-gradient(115deg,#173b58,#07111b 78%);border-bottom:1px solid #3b719d;}
        .tp-header:after{content:"";position:absolute;right:-30px;top:-95px;width:280px;height:280px;border:1px solid #7bbbe01c;transform:rotate(35deg);pointer-events:none;}
        .tp-eyebrow{color:#f2c14e;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:1.6px;margin:0 0 8px;}
        .tp-header h1{color:#fff;font-size:32px;font-weight:900;text-transform:uppercase;letter-spacing:.3px;text-shadow:0 2px 6px #000;margin:0;}
        .tp-header p{color:#b4cadb;font-size:13px;margin:8px 0 0;line-height:1.5;}
        .tp-content{padding:18px 16px 20px;}
        .tp-tabs{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-bottom:16px;}
        .tp-tab{min-width:0;text-align:left;background:linear-gradient(#122b40,#091826);border:1px solid #294e6c;border-top:2px solid #355f7d;color:#d7eaff;padding:11px 13px;cursor:pointer;font:inherit;}
        .tp-tab:hover{background:#173852;border-color:#6292b5;}
        .tp-tab[aria-pressed="true"]{background:linear-gradient(#274e69,#10273a);border-color:#5c9dcc;border-top-color:#f2c14e;box-shadow:inset 0 -2px 0 #f2c14e;}
        .tp-tab:focus-visible,.tp-preview-button:focus-visible,.tp-select:focus-visible,.tp-member:focus-visible{outline:2px solid #f2c14e;outline-offset:2px;}
        .tp-tab strong{display:block;color:#fff;font-size:13px;text-transform:uppercase;letter-spacing:.35px;}
        .tp-tab span{display:block;color:#aac0d1;font-size:11px;margin-top:5px;}
        .tp-panel{border:1px solid #2b5476;background:#050d16;}
        .tp-panel-header{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;padding:16px 18px;background:linear-gradient(105deg,#193a55,#0a1a29);border-bottom:1px solid #315c7c;}
        .tp-panel-header h2{color:#f2c14e;font-size:14px;letter-spacing:.8px;text-transform:uppercase;margin:0;}
        .tp-panel-header p{color:#b6cadb;font-size:12px;line-height:1.5;margin:6px 0 0;}
        .tp-season-picker{display:flex;flex-direction:column;gap:5px;color:#b6cadb;font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:.5px;}
        .tp-select{min-width:180px;padding:8px 30px 8px 10px;background:#071522;border:1px solid #4d7b9d;color:#fff;font:inherit;text-transform:none;}
        .tp-table-scroll{overflow-x:auto;}
        .tp-table{width:100%;border-collapse:collapse;font-size:12px;}
        .tp-table th{background:#07111b;color:#a8c0d3;padding:12px 10px;border-bottom:1px solid #284961;text-align:center;font-size:10px;letter-spacing:.65px;text-transform:uppercase;white-space:nowrap;}
        .tp-table td{color:#d5e5f1;padding:13px 10px;border-bottom:1px solid #183044;text-align:center;}
        .tp-table tbody tr:nth-child(even){background:#0b1824;}
        .tp-table tbody tr:hover{background:#112a3c;}
        .tp-table tbody tr:last-child td{border-bottom:0;}
        .tp-table th:nth-child(2),.tp-table td:nth-child(2){text-align:left;}
        .tp-table .tp-place{color:#f2c14e;font-weight:900;white-space:nowrap;}
        .tp-member{color:#83cbff;font-weight:900;text-decoration:none;overflow-wrap:anywhere;}
        .tp-member:hover{text-decoration:underline;color:#fff;}
        .tp-win{color:#65df8d!important;font-weight:900;}
        .tp-loss{color:#ff8585!important;font-weight:900;}
        .tp-points{color:#fff!important;font-weight:900;}
        .tp-status{padding:36px 20px;text-align:center;color:#bfd0de;font-size:13px;line-height:1.6;}
        .tp-status strong{display:block;color:#fff;font-size:15px;margin-bottom:4px;}
        .tp-error{color:#ff9d9d;}
        .tp-preview-button{margin-top:14px;padding:9px 14px;background:#163b56;border:1px solid #5486aa;color:#fff;font:700 12px Tahoma,Verdana,Arial,sans-serif;cursor:pointer;}
        .tp-preview-button:hover{background:#24597a;}
        .tp-preview-note{padding:10px 18px;background:#453611;color:#ffe4a3;border-bottom:1px solid #8a702d;font-size:12px;line-height:1.5;}
        .tp-footer{min-height:36px;background:#07111b;border-top:1px solid #244b70;display:flex;align-items:center;justify-content:center;color:#a9c3db;font-size:11px;}
        @media(max-width:600px){
          .top-players-page{padding:12px 10px 60px;}
          .tp-header{padding:21px 16px;}
          .tp-header h1{font-size:26px;}
          .tp-content{padding:12px 10px 16px;}
          .tp-tabs{grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;}
          .tp-tab{padding:11px 10px;}
          .tp-panel-header{padding:14px;}
          .tp-season-picker,.tp-select{width:100%;}
          .tp-table{min-width:520px;}
          .tp-overall-table{min-width:760px;}
          .tp-table th,.tp-table td{padding:12px 9px;}
        }
      `}</style>

      <main className="top-players-page">
        <div className="tp-wrap">
          <div className="tp-strip">
            <Link href="/home">Home</Link>
            <Link href="/profile">My Profile</Link>
            <Link href="/forums">Forums</Link>
          </div>
          <header className="tp-header">
            <div className="tp-eyebrow">GameBattles / Leaderboards</div>
            <h1>Top Players</h1>
            <p>See who is climbing the ranks across GameBattles.</p>
          </header>

          <div className="tp-content">
            <div className="tp-tabs" role="group" aria-label="Player leaderboard">
              {boards.map((item) => (
                <button key={item.id} type="button" className="tp-tab" aria-pressed={board === item.id} onClick={() => setBoard(item.id)}>
                  <strong>{item.label}</strong><span>{item.detail}</span>
                </button>
              ))}
            </div>

            <section className="tp-panel" aria-labelledby="tp-board-title" aria-busy={loading}>
              <div className="tp-panel-header">
                <div>
                  <h2 id="tp-board-title">{selectedBoard.label} Player Rankings</h2>
                  <p>{board === "overall"
                    ? "Ranked by all-time GB points, then wins and losses. Game and ladder show a player's team."
                    : board === "season"
                      ? "Ranked by wins, then fewer losses. Seasons run for one calendar month."
                      : `Ranked by wins, then fewer losses, from completed matches ${board === "week" ? "this week" : "this month"}.`}</p>
                </div>
                {board === "season" && seasons.length > 0 && (
                  <label className="tp-season-picker">
                    Choose season
                    <select className="tp-select" value={seasonId} onChange={(event) => setSeasonId(event.target.value)}>
                      {seasons.map((season) => <option key={season.id} value={season.id}>{season.name}</option>)}
                    </select>
                  </label>
                )}
              </div>

              {loading ? (
                <div className="tp-status" role="status">Loading player rankings...</div>
              ) : error ? (
                <div className="tp-status tp-error" role="alert">Unable to load player rankings: {error}</div>
              ) : board === "overall" && players.length === 0 ? (
                <div className="tp-status"><strong>No players ranked yet.</strong>Rankings will appear as players join.</div>
              ) : board !== "overall" && standings.length === 0 && !showPreview ? (
                <div className="tp-status">
                  <strong>No results yet{selectedSeason && board === "season" ? ` for ${selectedSeason.name}` : ""}.</strong>
                  Standings appear when matches are completed.
                  <div><button type="button" className="tp-preview-button" onClick={() => setShowPreview(true)}>See sample standings</button></div>
                </div>
              ) : board === "overall" ? (
                <div className="tp-table-scroll">
                  <table className="tp-table tp-overall-table">
                    <thead><tr><th scope="col">Place</th><th scope="col">Member</th><th scope="col">Game</th><th scope="col">Ladder</th><th scope="col">W</th><th scope="col">L</th><th scope="col">Streak</th><th scope="col">GB Points</th></tr></thead>
                    <tbody>{players.map((player, index) => {
                      const context = playerContexts[player.id];
                      return <tr key={player.id}>
                        <td className="tp-place">{ordinal(index + 1)}</td>
                        <td><Link className="tp-member" href={`/profile?userId=${encodeURIComponent(player.id)}`}>{player.username || "Player"}</Link></td>
                        <td>{prettyText(context?.game)}</td><td>{prettyText(context?.ladder)}</td>
                        <td className="tp-win">{player.gb_wins ?? 0}</td><td className="tp-loss">{player.gb_losses ?? 0}</td>
                        <td>—</td><td className="tp-points">{(player.gb_rank_points ?? 0).toLocaleString()}</td>
                      </tr>;
                    })}</tbody>
                  </table>
                </div>
              ) : (
                <>
                  {showPreview && <div className="tp-preview-note"><strong>Sample preview:</strong> These are example players, not actual rankings. Real results will appear when matches are completed.</div>}
                  <div className="tp-table-scroll">
                    <table className="tp-table">
                      <thead><tr><th scope="col">Place</th><th scope="col">Member</th><th scope="col">Wins</th><th scope="col">Losses</th><th scope="col">Win rate</th></tr></thead>
                      <tbody>{periodRows.map((player) => (
                        <tr key={player.id}>
                          <td className="tp-place">{ordinal(player.rank)}</td>
                          <td>{showPreview ? player.name : <Link className="tp-member" href={`/profile?userId=${encodeURIComponent(player.id)}`}>{player.name || "Player"}</Link>}</td>
                          <td className="tp-win">{player.wins}</td><td className="tp-loss">{player.losses}</td>
                          <td>{player.wins + player.losses > 0 ? `${Math.round(100 * player.wins / (player.wins + player.losses))}%` : "—"}</td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                </>
              )}
            </section>
          </div>
          <footer className="tp-footer">© 2026 Competitive Gaming Network</footer>
        </div>
      </main>
    </>
  );
}
