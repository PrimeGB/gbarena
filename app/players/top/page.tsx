"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";

type PlayerRow = {
  id: string;
  username: string | null;
  gb_wins: number | null;
  gb_losses: number | null;
  gb_rank_points: number | null;
};

type PlayerContext = {
  game: string | null;
  ladder: string | null;
};

function prettyText(value: string | null | undefined) {
  if (!value) return "Unknown";
  if (value === "mw2") return "MW2";
  if (value === "modern-warfare-4") return "MW4";
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
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [playerContexts, setPlayerContexts] = useState<Record<string, PlayerContext>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadPlayers() {
      setLoading(true);
      setError("");

      const { data, error: loadError } = await supabase
        .from("profiles")
        .select("id,username,gb_wins,gb_losses,gb_rank_points")
        .order("gb_rank_points", { ascending: false })
        .order("gb_wins", { ascending: false })
        .order("gb_losses", { ascending: true })
        .limit(100);

      if (loadError) {
        setError(loadError.message);
        setPlayers([]);
        setLoading(false);
        return;
      }

      const loadedPlayers = (data || []) as PlayerRow[];
      setPlayers(loadedPlayers);

      const playerIds = loadedPlayers.map((player) => player.id);
      if (playerIds.length > 0) {
        const { data: memberships, error: membershipError } = await supabase
          .from("team_members")
          .select("user_id,team_id")
          .in("user_id", playerIds);

        if (membershipError) {
          setError(membershipError.message);
          setLoading(false);
          return;
        }

        const teamIds = [...new Set((memberships || []).map((membership) => membership.team_id))];
        if (teamIds.length > 0) {
          const { data: teams, error: teamsError } = await supabase
            .from("teams")
            .select("id,game,ladder")
            .in("id", teamIds);

          if (teamsError) {
            setError(teamsError.message);
            setLoading(false);
            return;
          }

          const teamsById = new Map((teams || []).map((team) => [team.id, team]));
          const contexts: Record<string, PlayerContext> = {};
          (memberships || []).forEach((membership) => {
            const team = teamsById.get(membership.team_id);
            if (!contexts[membership.user_id] && team) {
              contexts[membership.user_id] = { game: team.game, ladder: team.ladder };
            }
          });
          setPlayerContexts(contexts);
        } else {
          setPlayerContexts({});
        }
      } else {
        setPlayerContexts({});
      }

      setLoading(false);
    }

    loadPlayers();
  }, []);

  return (
    <>
      <style>{`
        *{margin:0;padding:0;box-sizing:border-box;}
        body{background:#000;font-family:Tahoma,Verdana,Arial,sans-serif;color:#d7e2ee;}
        .page{min-height:100vh;background:linear-gradient(to bottom,#02060a,#000);padding:32px 22px;}
        .wrap{max-width:1060px;margin:0 auto;background:#07111b;border:1px solid #315f88;}
        .top-strip{height:30px;background:linear-gradient(to bottom,#8b0000,#3b0000);border-bottom:1px solid #b32222;display:flex;align-items:center;justify-content:flex-end;gap:18px;padding:0 14px;}
        .top-strip a{color:#fff;font-size:12px;font-weight:bold;text-transform:uppercase;text-decoration:none;}
        .header{min-height:92px;background:linear-gradient(to bottom,#173956,#07111b);border-bottom:2px solid #315f88;display:flex;align-items:center;padding:0 22px;}
        .title-main{color:#f2c14e;font-size:14px;font-weight:900;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;}
        .title-sub{color:#fff;font-size:30px;font-weight:900;text-transform:uppercase;text-shadow:0 2px 4px #000;}
        .nav{height:36px;background:linear-gradient(to bottom,#10283d,#07111b);border-bottom:1px solid #244b70;display:flex;align-items:center;justify-content:center;gap:28px;}
        .nav a{color:#d7eaff;font-size:12px;font-weight:bold;text-transform:uppercase;text-decoration:none;}
        .nav a:hover{color:#d7ad4a;}
        .panel{margin:16px;border:1px solid #244b70;background:#050b12;}
        .panel-title{height:32px;background:linear-gradient(to bottom,#18344f,#091521);border-bottom:1px solid #244b70;display:flex;align-items:center;justify-content:center;color:#d7ad4a;font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:1px;}
        table{width:100%;border-collapse:collapse;font-size:12px;}
        th{background:#050c14;color:#fff;padding:10px 8px;border-bottom:1px solid #244b70;text-align:center;font-size:11px;text-transform:uppercase;}
        td{color:#cfe2f2;padding:10px 8px;border-bottom:1px solid rgba(255,255,255,.06);text-align:center;}
        th:nth-child(2),td:nth-child(2){text-align:left;}
        .place{color:#d7ad4a;font-weight:900;}
        .member-link{color:#7fc7ff;font-weight:900;text-decoration:none;text-transform:uppercase;}
        .member-link:hover{color:#d7ad4a;}
        .win{color:#36e86b;font-weight:900;}
        .loss{color:#ff5555;font-weight:900;}
        .points{color:#fff;font-weight:900;}
        .empty,.loading,.error{padding:36px;text-align:center;color:#cfe2f2;font-size:14px;font-weight:900;text-transform:uppercase;}
        .error{color:#ff7777;}
        .footer{height:36px;background:#07111b;border-top:1px solid #244b70;display:flex;align-items:center;justify-content:center;color:#a9c3db;font-size:11px;}
      `}</style>

      <main className="page">
        <div className="wrap">
          <div className="top-strip">
            <Link href="/home">Home</Link>
            <Link href="/profile">My Profile</Link>
            <Link href="/forums">Forums</Link>
          </div>

          <header className="header">
            <div>
              <div className="title-main">GameBattles</div>
              <div className="title-sub">Top Players</div>
            </div>
          </header>

          <nav className="nav">
            <Link href="/home">Home</Link>
            <Link href="/profile/teams">My Teams</Link>
            <Link href="/members">Members</Link>
            <Link href="/forums">Forums</Link>
          </nav>

          <section className="panel">
            <div className="panel-title">Overall Player Rankings</div>

            {loading ? (
              <div className="loading">Loading top players...</div>
            ) : error ? (
              <div className="error">{error}</div>
            ) : players.length === 0 ? (
              <div className="empty">No players ranked yet.</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Place</th>
                    <th>Member</th>
                    <th>Game</th>
                    <th>Ladder</th>
                    <th>W</th>
                    <th>L</th>
                    <th>Streak</th>
                    <th>GB Points</th>
                  </tr>
                </thead>
                <tbody>
                  {players.map((player, index) => {
                    const context = playerContexts[player.id];
                    return (
                    <tr key={player.id}>
                      <td className="place">{ordinal(index + 1)}</td>
                      <td>
                        <Link className="member-link" href={`/profile?userId=${encodeURIComponent(player.id)}`}>
                          {player.username || "Player"}
                        </Link>
                      </td>
                      <td>{prettyText(context?.game)}</td>
                      <td>{prettyText(context?.ladder)}</td>
                      <td className="win">{player.gb_wins || 0}</td>
                      <td className="loss">{player.gb_losses || 0}</td>
                      <td>—</td>
                      <td className="points">{player.gb_rank_points ?? 0}</td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </section>

          <footer className="footer">© 2026 Competitive Gaming Network</footer>
        </div>
      </main>
    </>
  );
}
