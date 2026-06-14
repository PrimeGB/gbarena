"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

type TeamRow = {
  id: string;
  name: string | null;
  tag: string | null;
  platform: string | null;
  game: string | null;
  ladder: string | null;
  wins: number | null;
  losses: number | null;
  streak: number | null;
  xp: number | null;
  rating_points: number | null;
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

export default function TopTeamsPage() {
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadTeams() {
      setLoading(true);
      setError("");

      const { data, error: loadError } = await supabase
        .from("teams")
        .select("id,name,tag,platform,game,ladder,wins,losses,streak,xp,rating_points")
        .order("rating_points", { ascending: false })
        .order("wins", { ascending: false })
        .order("losses", { ascending: true })
        .order("created_at", { ascending: true })
        .limit(100);

      if (loadError) {
        setError(loadError.message);
        setTeams([]);
        setLoading(false);
        return;
      }

      setTeams((data || []) as TeamRow[]);
      setLoading(false);
    }

    loadTeams();
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
        .team-link{color:#7fc7ff;font-weight:900;text-decoration:none;text-transform:uppercase;}
        .team-link:hover{color:#d7ad4a;}
        .meta{color:#8aa7c0;font-size:10px;text-transform:uppercase;}
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
            <a href="/home">Home</a>
            <a href="/profile">My Profile</a>
            <a href="/forums">Forums</a>
          </div>

          <header className="header">
            <div>
              <div className="title-main">GameBattles</div>
              <div className="title-sub">Top Teams</div>
            </div>
          </header>

          <nav className="nav">
            <a href="/home">Home</a>
            <a href="/profile/teams">My Teams</a>
            <a href="/members">Members</a>
            <a href="/forums">Forums</a>
          </nav>

          <section className="panel">
            <div className="panel-title">Overall Team Rankings</div>

            {loading ? (
              <div className="loading">Loading top teams...</div>
            ) : error ? (
              <div className="error">{error}</div>
            ) : teams.length === 0 ? (
              <div className="empty">No teams ranked yet.</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Place</th>
                    <th>Team</th>
                    <th>Game</th>
                    <th>Ladder</th>
                    <th>W</th>
                    <th>L</th>
                    <th>Streak</th>
                    <th>GB Points</th>
                  </tr>
                </thead>
                <tbody>
                  {teams.map((team, index) => (
                    <tr key={team.id}>
                      <td className="place">{ordinal(index + 1)}</td>
                      <td>
                        <a className="team-link" href={`/teams/${team.id}`}>{team.name || "Team"}</a>
                        <div className="meta">{team.tag ? `[${team.tag}]` : ""} {prettyText(team.platform)}</div>
                      </td>
                      <td>{prettyText(team.game)}</td>
                      <td>{prettyText(team.ladder)}</td>
                      <td className="win">{team.wins || 0}</td>
                      <td className="loss">{team.losses || 0}</td>
                      <td>{team.streak || 0}</td>
                      <td className="points">{team.rating_points ?? 100}</td>
                    </tr>
                  ))}
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
