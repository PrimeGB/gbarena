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

function movement(currentRank: number, previousRank: number | null) {
  if (!previousRank || previousRank === currentRank) return "same";
  if (previousRank > currentRank) return "up";
  return "down";
}

export default function LadderRankingsPage() {
  const params = useParams();
  const game = String(params?.game || "mw2");
  const ladder = String(params?.ladder || "singles");

  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [previousRanks, setPreviousRanks] = useState<Record<string, number>>({});
  const [myTeamId, setMyTeamId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const gameTitle = prettyText(game);
  const ladderTitle = `${gameTitle} - ${prettyText(ladder)} Ladder`;

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
    async function loadPage() {
      setLoading(true);
      setError("");

      const storageKey = `gb-ranks-xbox-call-of-duty-${game}-${ladder}`;

      if (typeof window !== "undefined") {
        const savedRanks = window.localStorage.getItem(storageKey);
        if (savedRanks) {
          try {
            setPreviousRanks(JSON.parse(savedRanks));
          } catch {
            setPreviousRanks({});
          }
        }
      }

      const { data, error: teamsError } = await supabase
        .from("teams")
        .select(
          "id,name,tag,logo_url,avatar_url,platform,category,game,ladder,wins,losses,streak,xp,rating_points,created_at"
        )
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

      const loadedTeams = (data || []) as TeamRow[];
      setTeams(loadedTeams);

      const sortedNow = [...loadedTeams].sort((a, b) => {
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

      const newRankSnapshot: Record<string, number> = {};
      sortedNow.forEach((team, index) => {
        newRankSnapshot[team.id] = index + 1;
      });

      if (typeof window !== "undefined") {
        window.localStorage.setItem(storageKey, JSON.stringify(newRankSnapshot));
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.id) {
        const { data: memberData } = await supabase
          .from("team_members")
          .select("team_id, teams!inner(id,platform,category,game,ladder)")
          .eq("user_id", user.id)
          .eq("teams.platform", "xbox")
          .eq("teams.category", "call-of-duty")
          .eq("teams.game", game)
          .eq("teams.ladder", ladder)
          .limit(1)
          .maybeSingle();

        setMyTeamId(memberData?.team_id || null);
      }

      setLoading(false);
    }

    loadPage();
  }, [game, ladder]);

  const viewTeamHref = myTeamId ? `/teams/${myTeamId}` : "/profile/teams";

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:#050b12;font-family:Tahoma,Verdana,Arial,sans-serif;color:#eaf6ff;}
        a{text-decoration:none;}

        .page{
          min-height:100vh;
          background:radial-gradient(circle at top,#173d5f 0,#07111d 42%,#02060a 100%);
          padding:14px;
        }

        .shell{
          max-width:980px;
          margin:0 auto;
          border:1px solid #2d6f9f;
          background:#071522;
          box-shadow:0 0 34px rgba(0,0,0,.85), inset 0 0 18px rgba(65,150,210,.18);
        }

        .ladder-box{
          border:1px solid #4c8fc2;
          background:#091827;
          overflow:hidden;
        }

        .tabs{
          height:38px;
          display:flex;
          align-items:end;
          padding-left:10px;
          background:linear-gradient(to bottom,#1b5c8d,#0a263d 55%,#06131f);
          border-bottom:1px solid #66a7d7;
        }

        .tab{
          height:30px;
          min-width:82px;
          padding:0 14px;
          display:flex;
          align-items:center;
          justify-content:center;
          border:1px solid #5a94bc;
          border-bottom:0;
          background:linear-gradient(to bottom,#234b67,#0b2338);
          color:#cbeaff;
          font-size:10px;
          font-weight:900;
          margin-right:4px;
          border-radius:4px 4px 0 0;
          text-transform:uppercase;
          text-shadow:0 1px 2px #000;
        }

        .tab.active{
          background:linear-gradient(to bottom,#ebf8ff,#61a6d8 45%,#154b73);
          color:#03111d;
          text-shadow:none;
        }

        .hero{
          min-height:100px;
          display:flex;
          align-items:center;
          justify-content:space-between;
          padding:13px 16px;
          border-bottom:1px solid #2e6d9b;
          background:
            linear-gradient(to bottom,rgba(37,96,140,.95),rgba(7,25,40,.96)),
            radial-gradient(circle at right,#1f6a9e,#071522 60%);
        }

        .hero-left{display:flex;align-items:center;gap:14px;}

        .ladder-icon{
          width:76px;
          height:76px;
          border-radius:8px;
          border:1px solid #9ec9e8;
          background:
            linear-gradient(135deg,rgba(0,0,0,.18),rgba(255,255,255,.1)),
            url("https://upload.wikimedia.org/wikipedia/en/5/52/Call_of_Duty_Modern_Warfare_2_%282009%29_cover.png");
          background-size:cover;
          background-position:center;
          box-shadow:inset 0 0 14px rgba(255,255,255,.18),0 0 14px rgba(48,152,220,.38);
          flex-shrink:0;
        }

        .hero-title{
          color:#ffffff;
          font-size:26px;
          line-height:29px;
          font-weight:900;
          text-transform:uppercase;
          text-shadow:0 2px 4px #000;
          letter-spacing:.3px;
        }

        .season{
          font-size:11px;
          color:#b8dfff;
          line-height:17px;
          font-weight:900;
          text-transform:uppercase;
        }

        .season strong{color:#ffffff;}

        .hero-right{display:flex;align-items:center;gap:12px;}

        .your-team{
          height:34px;
          padding:0 21px;
          border:1px solid #9fd8ff;
          border-radius:4px;
          background:linear-gradient(to bottom,#77c7ff,#1478bd 50%,#06436e);
          color:#fff;
          font-size:12px;
          font-weight:900;
          display:flex;
          align-items:center;
          justify-content:center;
          text-shadow:0 1px 2px #000;
          box-shadow:inset 0 1px 0 rgba(255,255,255,.45);
        }

        .sub-tabs{
          display:flex;
          flex-wrap:wrap;
          padding:10px 10px 0 10px;
          border-bottom:1px solid #2d6f9f;
          background:linear-gradient(to bottom,#102f49,#081926);
        }

        .sub-tab{
          height:33px;
          padding:0 14px;
          display:flex;
          align-items:center;
          justify-content:center;
          background:linear-gradient(to bottom,#255979,#0d2b42);
          border:1px solid #4d87b1;
          border-bottom:0;
          color:#cdeeff;
          font-size:10px;
          font-weight:900;
          margin-right:4px;
          border-radius:4px 4px 0 0;
          text-transform:uppercase;
          text-shadow:0 1px 2px #000;
        }

        .sub-tab.active{
          background:linear-gradient(to bottom,#f2fbff,#72b6e2 45%,#1a5a86);
          color:#03121d;
          text-shadow:none;
        }

        .standings-wrap{
          padding:0 10px 14px 10px;
          background:linear-gradient(to bottom,#0b1d2d,#071522);
        }

        .standings{
          width:100%;
          border-collapse:collapse;
          font-size:13px;
          color:#eaf6ff;
          border-left:1px solid #214b68;
          border-right:1px solid #214b68;
        }

        .standings th{
          height:34px;
          background:linear-gradient(to bottom,#d7edf9,#6ea9cc 50%,#245d83);
          border-bottom:1px solid #9fd8ff;
          color:#061622;
          font-size:11px;
          font-weight:900;
          text-align:left;
          padding:0 8px;
          white-space:nowrap;
          text-transform:uppercase;
        }

        .standings td{
          height:46px;
          border-bottom:1px solid #173a55;
          padding:6px 8px;
          vertical-align:middle;
          background:#0b2032;
        }

        .standings tr:nth-child(even) td{background:#0e2a41;}
        .standings tr:hover td{background:#153d5b;}

        .place{
          width:92px;
          white-space:nowrap;
          font-weight:900;
          color:#ffffff;
        }

        .move{
          display:inline-flex;
          align-items:center;
          justify-content:center;
          width:20px;
          margin-right:5px;
          font-size:14px;
          font-weight:900;
        }

        .move.up{color:#16e044;}
        .move.down{color:#ff3131;}
        .move.same{color:#9ab6c8;}

        .team-cell{
          display:flex;
          align-items:center;
          gap:11px;
          font-weight:900;
        }

        .team-logo{
          width:38px;
          height:38px;
          border:1px solid #9ed7ff;
          background:#081018;
          display:flex;
          align-items:center;
          justify-content:center;
          overflow:hidden;
          color:#fff;
          font-size:11px;
          font-weight:900;
          flex-shrink:0;
          box-shadow:inset 0 0 8px rgba(255,255,255,.15),0 0 8px rgba(89,166,220,.25);
        }

        .team-logo img{
          width:100%;
          height:100%;
          object-fit:cover;
          display:block;
        }

        .team-name-wrap{
          display:flex;
          flex-direction:column;
          line-height:15px;
        }

        .team-name{
          color:#9bd8ff;
          font-size:14px;
          font-weight:900;
          text-shadow:0 1px 2px #000;
          letter-spacing:.2px;
        }

        .team-tag{
          color:#d9ecff;
          font-size:10px;
          font-weight:900;
          opacity:.75;
          text-transform:uppercase;
        }

        .wins{color:#24e455;font-weight:900;text-align:center;}
        .losses{color:#ff3d3d;font-weight:900;text-align:center;}
        .center{text-align:center;}

        .level-bar{
          height:23px;
          width:54px;
          background:linear-gradient(to bottom,#7bc5f4,#18547a 55%,#082236);
          border:1px solid #9ed7ff;
          color:#fff;
          display:flex;
          align-items:center;
          justify-content:center;
          font-weight:900;
          margin:0 auto;
          text-shadow:0 1px 2px #000;
        }

        .empty,.loading,.error{
          padding:34px;
          text-align:center;
          color:#b9dcf6;
          font-size:13px;
          font-weight:900;
        }

        .error{color:#ff7373;}

        @media(max-width:760px){
          .hero{align-items:flex-start;flex-direction:column;gap:12px;}
          .hero-right{width:100%;justify-content:flex-start;}
          .standings-wrap{overflow-x:auto;}
          .standings{min-width:720px;}
        }
      `}</style>

      <main className="page">
        <div className="shell">
          <section className="ladder-box">
            <div className="tabs">
              <a className={ladder === "team" ? "tab active" : "tab"} href={`/ladders/xbox/call-of-duty/${game}/team/rankings`}>
                Team
              </a>
              <a className={ladder === "doubles" ? "tab active" : "tab"} href={`/ladders/xbox/call-of-duty/${game}/doubles/rankings`}>
                Doubles
              </a>
              <a className={ladder === "singles" ? "tab active" : "tab"} href={`/ladders/xbox/call-of-duty/${game}/singles/rankings`}>
                Singles
              </a>
            </div>

            <div className="hero">
              <div className="hero-left">
                <div className="ladder-icon" />
                <div>
                  <div className="hero-title">{ladderTitle}</div>
                  <div className="season">
                    Season: <strong>Current</strong>
                  </div>
                </div>
              </div>

              <div className="hero-right">
                <a className="your-team" href={viewTeamHref}>
                  View Your Team
                </a>
              </div>
            </div>

            <div className="sub-tabs">
              <a className="sub-tab active" href="#">
                Standings
              </a>
              <a className="sub-tab" href={`/matches/finder?platform=xbox&category=call-of-duty&game=${game}&ladder=${ladder}`}>
                Match Finder
              </a>
              <a className="sub-tab" href={`/ladders/xbox/call-of-duty/${game}/${ladder}/playoff-bracket`}>
                Playoff Bracket
              </a>
              <a className="sub-tab" href={`/ladders/xbox/call-of-duty/${game}/${ladder}/rules`}>
                Rules
              </a>
              <a className="sub-tab" href="/support">
                Support
              </a>
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
                      <th>Place</th>
                      <th>Team Name</th>
                      <th className="center">W</th>
                      <th className="center">L</th>
                      <th className="center">Pct</th>
                      <th className="center">Strk</th>
                      <th className="center">Level</th>
                      <th className="center">XP</th>
                    </tr>
                  </thead>

                  <tbody>
                    {rankedTeams.map((team, index) => {
                      const wins = Number(team.wins || 0);
                      const losses = Number(team.losses || 0);
                      const points = Number(team.rating_points || 100);
                      const streak = Number(team.streak || 0);
                      const currentRank = index + 1;
                      const move = movement(currentRank, previousRanks[team.id] || null);

                      return (
                        <tr key={team.id}>
                          <td className="place">
                            <span className={`move ${move}`}>
                              {move === "up" ? "▲" : move === "down" ? "▼" : "—"}
                            </span>
                            {ordinal(currentRank)}
                          </td>

                          <td>
                            <a className="team-cell" href={`/teams/${team.id}`}>
                              <span className="team-logo">
                                {team.avatar_url || team.logo_url ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={team.avatar_url || team.logo_url || ""} alt={`${team.name || "Team"} avatar`} />
                                ) : (
                                  team.tag || "GB"
                                )}
                              </span>

                              <span className="team-name-wrap">
                                <span className="team-name">{team.name || "Unnamed Team"}</span>
                                <span className="team-tag">{team.tag || "No Tag"}</span>
                              </span>
                            </a>
                          </td>

                          <td className="wins">{wins}</td>
                          <td className="losses">{losses}</td>
                          <td className="center">{winPct(wins, losses)}</td>
                          <td className="center">{streakText(streak)}</td>
                          <td className="center">
                            <div className="level-bar">{levelFromPoints(points)}</div>
                          </td>
                          <td className="center">{points}</td>
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