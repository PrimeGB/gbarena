"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../../../../../lib/supabase";

type TeamRow = {
  id: string;
  name: string | null;
  tag: string | null;
  logo_url: string | null;
  avatar_url: string | null;
  platform: string | null;
  category: string | null;
  game: string | null;
  ladder: string | null;
  wins: number | null;
  losses: number | null;
  streak: number | null;
  xp: number | null;
  rating_points: number | null;
  created_at: string | null;
};

function prettyText(value: string | null | undefined) {
  if (!value) return "Unknown";
  if (value === "mw2") return "Modern Warfare 2";
  if (value === "modern-warfare-4") return "Modern Warfare 4";
  if (value === "modern-warfare-iii") return "Modern Warfare III";
  if (value === "black-ops-6") return "Black Ops 6";

  return value
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function ordinal(value: number) {
  const mod100 = value % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${value}th`;

  const mod10 = value % 10;
  if (mod10 === 1) return `${value}st`;
  if (mod10 === 2) return `${value}nd`;
  if (mod10 === 3) return `${value}rd`;
  return `${value}th`;
}

function winPct(wins: number, losses: number) {
  const total = wins + losses;
  if (total <= 0) return ".000";
  return (wins / total).toFixed(3).replace("0", "");
}

function levelFromPoints(points: number) {
  return Math.max(1, Math.floor(points / 100));
}

function streakText(streak: number) {
  if (streak > 0) return `${streak}W`;
  if (streak < 0) return `${Math.abs(streak)}L`;
  return "-";
}

export default function LadderRankingsPage() {
  const params = useParams();
  const game = String(params?.game || "modern-warfare-4");
  const ladder = String(params?.ladder || "team");

  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const gameTitle = prettyText(game);
  const ladderTitle = `${prettyText(ladder)} Ladder`;

  const rankedTeams = useMemo(() => {
    return [...teams].sort((a, b) => {
      const ratingA = Number(a.rating_points || 100);
      const ratingB = Number(b.rating_points || 100);
      const winsA = Number(a.wins || 0);
      const winsB = Number(b.wins || 0);
      const lossesA = Number(a.losses || 0);
      const lossesB = Number(b.losses || 0);

      if (ratingB !== ratingA) return ratingB - ratingA;
      if (winsB !== winsA) return winsB - winsA;
      if (lossesA !== lossesB) return lossesA - lossesB;
      return String(a.created_at || "").localeCompare(String(b.created_at || ""));
    });
  }, [teams]);

  useEffect(() => {
    async function loadTeams() {
      setLoading(true);
      setError("");

      const { data, error: teamsError } = await supabase
        .from("teams")
        .select("id,name,tag,logo_url,avatar_url,platform,category,game,ladder,wins,losses,streak,xp,rating_points,created_at")
        .eq("platform", "xbox")
        .eq("category", "call-of-duty")
        .eq("game", game)
        .eq("ladder", ladder)
        .order("rating_points", { ascending: false })
        .order("wins", { ascending: false })
        .order("losses", { ascending: true });

      if (teamsError) {
        setError(teamsError.message);
        setLoading(false);
        return;
      }

      setTeams((data || []) as TeamRow[]);
      setLoading(false);
    }

    loadTeams();
  }, [game, ladder]);

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:#07111b;font-family:Tahoma,Verdana,Arial,sans-serif;color:#111;}
        a{text-decoration:none;}

        .page{
          min-height:100vh;
          background:linear-gradient(to bottom,#0b2337,#02070c);
          padding:12px;
        }

        .shell{
          max-width:980px;
          margin:0 auto;
          border-left:1px solid #315f88;
          border-right:1px solid #315f88;
          background:#f4f4f4;
          box-shadow:0 0 30px rgba(0,0,0,.65);
        }

        .top-nav{
          height:34px;
          display:flex;
          align-items:stretch;
          background:linear-gradient(to bottom,#ffffff,#d9d9d9);
          border:1px solid #bcbcbc;
          border-bottom:0;
        }

        .top-nav a{
          color:#111;
          min-width:86px;
          padding:0 12px;
          display:flex;
          align-items:center;
          justify-content:center;
          border-right:1px solid #c7c7c7;
          font-size:11px;
          font-weight:900;
          text-transform:uppercase;
        }

        .top-nav a.active{
          background:#d9d9d9;
          color:#b00000;
          box-shadow:inset 0 -3px 0 #c40000;
        }

        .ladder-box{
          border:1px solid #c7c7c7;
          background:#fff;
          border-radius:5px 5px 0 0;
          overflow:hidden;
        }

        .tabs{
          height:34px;
          display:flex;
          align-items:end;
          padding-left:10px;
          background:#f8f8f8;
          border-bottom:1px solid #d0d0d0;
        }

        .tab{
          height:28px;
          min-width:72px;
          padding:0 12px;
          display:flex;
          align-items:center;
          justify-content:center;
          border:1px solid #c9c9c9;
          border-bottom:0;
          background:linear-gradient(to bottom,#fff,#dedede);
          color:#111;
          font-size:10px;
          font-weight:900;
          margin-right:3px;
          border-radius:4px 4px 0 0;
        }

        .tab.active{background:#fff;color:#111;}

        .hero{
          min-height:82px;
          display:flex;
          align-items:center;
          justify-content:space-between;
          padding:9px 14px 9px 18px;
          border-bottom:1px solid #d0d0d0;
          background:#fff;
        }

        .hero-left{display:flex;align-items:center;gap:10px;}

        .ladder-icon{
          width:62px;
          height:62px;
          border-radius:9px;
          border:1px solid #999;
          background:linear-gradient(135deg,#050505,#333);
          color:#fff;
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:27px;
          font-weight:900;
          box-shadow:inset 0 0 12px rgba(255,255,255,.2);
        }

        .hero-title{color:#999;font-size:28px;line-height:29px;font-weight:400;}
        .season{font-size:11px;color:#777;line-height:16px;}
        .season strong{color:#555;}
        .king{color:#064ba8;font-weight:900;}

        .hero-right{
          display:flex;
          align-items:center;
          gap:14px;
        }

        .your-team{
          height:32px;
          padding:0 20px;
          border:1px solid #1684d3;
          border-radius:5px;
          background:linear-gradient(to bottom,#4db8ff,#0074c8);
          color:#fff;
          font-size:12px;
          font-weight:900;
          display:flex;
          align-items:center;
          justify-content:center;
        }

        .region{
          width:64px;
          height:55px;
          border-radius:50%;
          background:radial-gradient(circle,#ffefef,#b40000 60%,#680000);
          color:#fff;
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:14px;
          font-weight:900;
          text-shadow:0 1px 3px #000;
          border:1px solid #b9b9b9;
        }

        .sub-tabs{
          display:flex;
          flex-wrap:wrap;
          padding:10px 10px 0 10px;
          border-bottom:1px solid #d0d0d0;
          background:#fdfdfd;
        }

        .sub-tab{
          height:34px;
          padding:0 13px;
          display:flex;
          align-items:center;
          justify-content:center;
          background:linear-gradient(to bottom,#fff,#e5e5e5);
          border:1px solid #c9c9c9;
          border-bottom:0;
          color:#111;
          font-size:10px;
          font-weight:900;
          margin-right:4px;
          border-radius:4px 4px 0 0;
        }

        .sub-tab.active{
          background:#fff;
          color:#b00000;
          box-shadow:inset 0 3px 0 #c40000;
        }

        .standings-wrap{padding:0 10px 14px 10px;background:#fff;}

        .standings{
          width:100%;
          border-collapse:collapse;
          font-size:12px;
          color:#111;
        }

        .standings th{
          height:34px;
          background:#e3e3e3;
          border-bottom:1px solid #cfcfcf;
          color:#111;
          font-size:11px;
          font-weight:900;
          text-align:left;
          padding:0 7px;
          white-space:nowrap;
        }

        .standings td{
          min-height:34px;
          border-bottom:1px solid #ebebeb;
          padding:5px 7px;
          vertical-align:middle;
          background:#fff;
        }

        .standings tr:nth-child(even) td{background:#f7f7f7;}
        .standings tr:hover td{background:#eef6ff;}

        .place{width:72px;white-space:nowrap;font-weight:400;color:#111;}
        .up-arrow{color:#0b8c18;font-size:12px;font-weight:900;margin-left:4px;}
        .team-cell{display:flex;align-items:center;gap:8px;font-weight:900;}

        .team-logo{
          width:24px;
          height:24px;
          border:1px solid #999;
          background:#111;
          display:flex;
          align-items:center;
          justify-content:center;
          overflow:hidden;
          color:#fff;
          font-size:10px;
          font-weight:900;
          flex-shrink:0;
        }
        .team-logo img{width:100%;height:100%;object-fit:contain;display:block;}
        .team-name{color:#0753a3;font-weight:900;}
        .hot{color:#ff6d00;margin-right:3px;}
        .wins{color:#00860b;font-weight:900;text-align:center;}
        .losses{color:#c40000;font-weight:900;text-align:center;}
        .center{text-align:center;}

        .level-bar{
          height:23px;
          width:52px;
          background:linear-gradient(to right,#7d7d7d,#222);
          border:1px solid #111;
          color:#fff;
          display:flex;
          align-items:center;
          justify-content:center;
          font-weight:900;
          margin:0 auto;
        }

        .rep-bar{
          width:54px;
          height:22px;
          border:1px solid #000;
          background:linear-gradient(to bottom,#5cff5c,#008000);
          color:#fff;
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:11px;
          font-weight:900;
          text-shadow:0 1px 2px #000;
        }

        .ping{
          width:13px;
          height:9px;
          background:repeating-linear-gradient(to right,#00bd00 0,#00bd00 2px,#002b00 2px,#002b00 3px);
          border:1px solid #005000;
          margin:0 auto;
        }

        .empty,.loading,.error{
          padding:34px;
          text-align:center;
          color:#555;
          font-size:13px;
          font-weight:900;
        }
        .error{color:#a00000;}

        @media(max-width:760px){
          .top-nav{overflow-x:auto;}
          .hero{align-items:flex-start;flex-direction:column;gap:12px;}
          .hero-right{width:100%;justify-content:space-between;}
          .standings-wrap{overflow-x:auto;}
          .standings{min-width:820px;}
        }
      `}</style>

      <main className="page">
        <div className="shell">
          <nav className="top-nav">
            <a href="/home">Home</a>
            <a className="active" href="/ladders/xbox/call-of-duty">Ladders</a>
            <a href="/tournaments">Tournaments</a>
            <a href="/free-agents">Free Agents</a>
            <a href="/teams/create">Create a Team</a>
            <a href="/forums">Forums</a>
            <a href="/teams/top">Leaderboards</a>
            <a href="/support">Support</a>
          </nav>

          <section className="ladder-box">
            <div className="tabs">
              <a className="tab active" href="#">Team</a>
              <a className="tab" href="#">Doubles</a>
              <a className="tab" href="#">Singles</a>
            </div>

            <div className="hero">
              <div className="hero-left">
                <div className="ladder-icon">GB</div>
                <div>
                  <div className="hero-title">{ladderTitle}</div>
                  <div className="season">Season: <strong>Current</strong></div>
                  <div className="season">
                    Total Teams: <strong>{rankedTeams.length}</strong>
                    {rankedTeams[0]?.name ? (
                      <> | Current King: <span className="king">{rankedTeams[0].name}</span></>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="hero-right">
                <a className="your-team" href="/profile/teams">View Your Team</a>
                <div className="region">NA</div>
              </div>
            </div>

            <div className="sub-tabs">
              <a className="sub-tab active" href="#">Standings</a>
              <a className="sub-tab" href={`/matches/finder?platform=xbox&category=call-of-duty&game=${game}&ladder=${ladder}`}>Match Finder</a>
              <a className="sub-tab" href="#">Schedule</a>
              <a className="sub-tab" href="#">Scoreboard</a>
              <a className="sub-tab" href="#">Playoff Bracket</a>
              <a className="sub-tab" href={`/ladders/xbox/call-of-duty/${game}/${ladder}/rules`}>Rules</a>
              <a className="sub-tab" href="/support">Support</a>
            </div>

            <div className="standings-wrap">
              {loading ? (
                <div className="loading">Loading live ladder standings...</div>
              ) : error ? (
                <div className="error">{error}</div>
              ) : rankedTeams.length === 0 ? (
                <div className="empty">No teams have joined this ladder yet.</div>
              ) : (
                <table className="standings">
                  <thead>
                    <tr>
                      <th>Place ▲</th>
                      <th>Team Name</th>
                      <th className="center">W</th>
                      <th className="center">L</th>
                      <th className="center">Pct</th>
                      <th className="center">Strk</th>
                      <th className="center">Level</th>
                      <th className="center">XP</th>
                      <th className="center">Rep</th>
                      <th className="center">Ping</th>
                    </tr>
                  </thead>

                  <tbody>
                    {rankedTeams.map((team, index) => {
                      const wins = Number(team.wins || 0);
                      const losses = Number(team.losses || 0);
                      const points = Number(team.rating_points || 100);
                      const streak = Number(team.streak || 0);
                      const rep = Math.min(100, Math.max(60, 90 + wins - losses));

                      return (
                        <tr key={team.id}>
                          <td className="place">
                            {ordinal(index + 1)} <span className="up-arrow">▲</span>
                          </td>

                          <td>
                            <a className="team-cell" href={`/teams/${team.id}`}>
                              <span className="team-logo">
                                {team.logo_url ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={team.logo_url} alt={`${team.name || "Team"} logo`} />
                                ) : (
                                  team.tag || "GB"
                                )}
                              </span>
                              <span className="team-name">
                                {index < 3 ? <span className="hot">🔥</span> : null}
                                {team.name || "Unnamed Team"}
                              </span>
                            </a>
                          </td>

                          <td className="wins">{wins}</td>
                          <td className="losses">{losses}</td>
                          <td className="center">{winPct(wins, losses)}</td>
                          <td className="center">{streakText(streak)}</td>
                          <td className="center"><div className="level-bar">{levelFromPoints(points)}</div></td>
                          <td className="center">{points}</td>
                          <td className="center"><div className="rep-bar">{rep}%</div></td>
                          <td className="center"><div className="ping" /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
