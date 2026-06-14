"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabase";

type PlayerResult = {
  id: string;
  username: string | null;
  email?: string | null;
};

type TeamResult = {
  id: string;
  name: string | null;
  tag: string | null;
  platform: string | null;
  game: string | null;
  ladder: string | null;
  logo_url: string | null;
  wins: number | null;
  losses: number | null;
};

function cleanText(value: string | null | undefined, fallback = "Unknown") {
  if (!value) return fallback;
  return value;
}

function prettyText(value: string | null | undefined) {
  if (!value) return "Unknown";

  if (value === "mw2") return "Call of Duty: Modern Warfare 2";
  if (value === "modern-warfare-ii") return "Call of Duty: Modern Warfare II";
  if (value === "modern-warfare-4") return "Call of Duty: Modern Warfare 4";
  if (value === "black-ops-6") return "Call of Duty: Black Ops 6";
  if (value === "modern-warfare-iii") return "Call of Duty: Modern Warfare III";
  if (value === "black-ops-cold-war") return "Call of Duty: Black Ops Cold War";

  return value
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function SearchPageInner() {
  const searchParams = useSearchParams();
  const query = String(searchParams.get("q") || "").trim();

  const [players, setPlayers] = useState<PlayerResult[]>([]);
  const [teams, setTeams] = useState<TeamResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState("");

  const safeQuery = useMemo(() => query.replace(/[%_]/g, ""), [query]);

  useEffect(() => {
    let mounted = true;

    async function runSearch() {
      setPageError("");

      if (!safeQuery) {
        setPlayers([]);
        setTeams([]);
        return;
      }

      setLoading(true);

      const playerSearch = supabase
        .from("profiles")
        .select("id, username, email")
        .ilike("username", `%${safeQuery}%`)
        .limit(20);

      const teamSearch = supabase
        .from("teams")
        .select("id, name, tag, platform, game, ladder, logo_url, wins, losses")
        .or(`name.ilike.%${safeQuery}%,tag.ilike.%${safeQuery}%`)
        .limit(20);

      const [playerResponse, teamResponse] = await Promise.all([
        playerSearch,
        teamSearch,
      ]);

      if (!mounted) return;

      if (playerResponse.error && teamResponse.error) {
        setPageError("Search could not be loaded. Check the profiles and teams table permissions.");
        setPlayers([]);
        setTeams([]);
        setLoading(false);
        return;
      }

      setPlayers(playerResponse.error ? [] : ((playerResponse.data || []) as PlayerResult[]));
      setTeams(teamResponse.error ? [] : ((teamResponse.data || []) as TeamResult[]));
      setLoading(false);
    }

    runSearch();

    return () => {
      mounted = false;
    };
  }, [safeQuery]);

  return (
    <>
      <style>{`
        *{margin:0;padding:0;box-sizing:border-box;}
        body{background:#000;font-family:Tahoma,Verdana,Arial,sans-serif;color:#d7e2ee;}
        a{text-decoration:none;}

        .page{
          min-height:100vh;
          background:
            radial-gradient(circle at top,rgba(45,100,150,.22),transparent 42%),
            linear-gradient(to bottom,#02060a,#000);
          padding:32px 22px;
        }

        .wrap{
          max-width:1050px;
          margin:0 auto;
          background:#07111b;
          border:1px solid #315f88;
          box-shadow:0 0 28px rgba(0,80,140,.35), inset 0 0 22px rgba(0,0,0,.7);
        }

        .top-strip{
          height:30px;
          background:linear-gradient(to bottom,#8b0000,#3b0000);
          border-bottom:1px solid #b32222;
          display:flex;
          align-items:center;
          justify-content:flex-end;
          gap:18px;
          padding:0 14px;
        }

        .top-strip a{
          color:#fff;
          font-size:12px;
          font-weight:bold;
          text-transform:uppercase;
        }

        .header{
          min-height:104px;
          background:linear-gradient(to bottom,#173956,#07111b);
          border-bottom:2px solid #315f88;
          display:flex;
          align-items:center;
          justify-content:space-between;
          padding:0 24px;
        }

        .title-block h1{
          color:#f2c14e;
          font-size:34px;
          font-weight:900;
          text-transform:uppercase;
          text-shadow:0 2px 4px #000;
        }

        .title-block p{
          color:#cfe2f2;
          font-size:13px;
          margin-top:7px;
          font-weight:900;
          text-transform:uppercase;
        }

        .home-btn{
          border:1px solid #6ba8d6;
          background:linear-gradient(to bottom,#214765,#0b1c2d);
          color:#f5f8ff;
          font-size:13px;
          font-weight:900;
          text-transform:uppercase;
          padding:12px 18px;
        }

        .search-panel{padding:18px;}

        .search-box{
          border:1px solid #244b70;
          background:#050b12;
          padding:14px;
          margin-bottom:14px;
        }

        .search-line{
          color:#fff;
          font-size:15px;
          font-weight:900;
          text-transform:uppercase;
        }

        .search-line span{color:#d7ad4a;}

        .small-note{
          color:#8aa7c0;
          font-size:12px;
          margin-top:7px;
          line-height:18px;
        }

        .grid{
          display:grid;
          grid-template-columns:1fr 1fr;
          gap:14px;
        }

        .panel{
          border:1px solid #244b70;
          background:#050b12;
          min-height:260px;
        }

        .panel-title{
          height:34px;
          background:linear-gradient(to bottom,#18344f,#091521);
          border-bottom:1px solid #244b70;
          display:flex;
          align-items:center;
          justify-content:center;
          color:#d7ad4a;
          font-size:12px;
          font-weight:900;
          text-transform:uppercase;
          letter-spacing:1px;
        }

        .result-list{padding:10px;}

        .result-row{
          min-height:62px;
          border:1px solid rgba(255,255,255,.08);
          background:linear-gradient(to bottom,#071827,#030910);
          margin-bottom:8px;
          display:grid;
          grid-template-columns:52px 1fr 82px;
          gap:10px;
          align-items:center;
          padding:9px;
        }

        .result-row:hover{
          border-color:#d7ad4a;
          background:linear-gradient(to bottom,#0c253b,#06101a);
        }

        .avatar{
          width:46px;
          height:46px;
          border:1px solid #315f88;
          background:#000;
          display:flex;
          align-items:center;
          justify-content:center;
          overflow:hidden;
          color:#d7ad4a;
          font-size:15px;
          font-weight:900;
          text-transform:uppercase;
        }

        .avatar img{
          width:100%;
          height:100%;
          object-fit:cover;
          display:block;
        }

        .main-text{min-width:0;}

        .name{
          color:#7fc7ff;
          font-size:14px;
          font-weight:900;
          text-transform:uppercase;
          white-space:nowrap;
          overflow:hidden;
          text-overflow:ellipsis;
        }

        .sub{
          color:#cfe2f2;
          font-size:11px;
          margin-top:5px;
          line-height:16px;
          white-space:nowrap;
          overflow:hidden;
          text-overflow:ellipsis;
        }

        .view-btn{
          height:28px;
          border:1px solid #4b95d8;
          background:linear-gradient(to bottom,#1c4b72,#0a1724);
          color:#fff;
          font-size:10px;
          font-weight:900;
          text-transform:uppercase;
          display:flex;
          align-items:center;
          justify-content:center;
        }

        .view-btn:hover{
          color:#d7ad4a;
          border-color:#d7ad4a;
        }

        .empty,.loading,.error{
          padding:34px 12px;
          color:#cfe2f2;
          text-align:center;
          font-size:13px;
          font-weight:900;
          text-transform:uppercase;
          line-height:20px;
        }

        .error{color:#ff9c9c;}

        .footer{
          height:36px;
          background:#07111b;
          border-top:1px solid #244b70;
          display:flex;
          align-items:center;
          justify-content:center;
          color:#a9c3db;
          font-size:11px;
        }

        @media(max-width:780px){
          .grid{grid-template-columns:1fr;}
          .header{flex-direction:column;gap:12px;text-align:center;padding:18px;}
        }
      `}</style>

      <main className="page">
        <div className="wrap">
          <div className="top-strip">
            <Link href="/home">Home</Link>
            <Link href="/profile">My Profile</Link>
            <Link href="/members">Members</Link>
            <Link href="/forums">Forums</Link>
          </div>

          <header className="header">
            <div className="title-block">
              <h1>Search</h1>
              <p>Find players and teams on GameBattles</p>
            </div>

            <Link className="home-btn" href="/home">
              Back Home
            </Link>
          </header>

          <section className="search-panel">
            <div className="search-box">
              <div className="search-line">
                Search Results For: <span>{query || "Nothing Entered"}</span>
              </div>
              <div className="small-note">
                Player results search usernames. Team results search team names and clan tags.
              </div>
            </div>

            {pageError && <div className="error">{pageError}</div>}

            {!pageError && !query && (
              <div className="empty">Type a username, player name, team name, or clan tag from the homepage search bar.</div>
            )}

            {!pageError && query && (
              <div className="grid">
                <div className="panel">
                  <div className="panel-title">Players</div>

                  <div className="result-list">
                    {loading ? (
                      <div className="loading">Searching players...</div>
                    ) : players.length === 0 ? (
                      <div className="empty">No players found.</div>
                    ) : (
                      players.map((player) => {
                        const playerName = player.username || "Unknown Player";

                        return (
                          <div className="result-row" key={player.id}>
                            <div className="avatar">
                              {playerName.slice(0, 2)}
                            </div>

                            <div className="main-text">
                              <div className="name">{playerName}</div>
                              <div className="sub">GameBattles Member</div>
                            </div>

                            <Link className="view-btn" href={`/profile?userId=${player.id}`}>
                              View
                            </Link>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="panel">
                  <div className="panel-title">Teams</div>

                  <div className="result-list">
                    {loading ? (
                      <div className="loading">Searching teams...</div>
                    ) : teams.length === 0 ? (
                      <div className="empty">No teams found.</div>
                    ) : (
                      teams.map((team) => (
                        <div className="result-row" key={team.id}>
                          <div className="avatar">
                            {team.logo_url ? (
                              <img src={team.logo_url} alt={team.name || "Team"} />
                            ) : (
                              cleanText(team.tag, "GB").slice(0, 2)
                            )}
                          </div>

                          <div className="main-text">
                            <div className="name">{cleanText(team.name, "Unknown Team")}</div>
                            <div className="sub">
                              {prettyText(team.platform)} / {prettyText(team.game)} / {prettyText(team.ladder)}
                              {" · "}
                              {team.wins || 0}-{team.losses || 0}
                            </div>
                          </div>

                          <Link className="view-btn" href={`/teams/${team.id}`}>
                            View
                          </Link>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>

          <footer className="footer">© 2026 Competitive Gaming Network</footer>
        </div>
      </main>
    </>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div style={{ color: "white", padding: 40 }}>Loading Search...</div>}>
      <SearchPageInner />
    </Suspense>
  );
}
