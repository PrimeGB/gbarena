"use client";

import { useState } from "react";

type TeamRole = "leader" | "co-leader" | "captain" | "member";
type MatchStatus = "open" | "accepted" | "cancelled";
type RulesType = "Preset" | "Custom";

type MatchPost = {
  id: number;
  players: string;
  mode: string;
  rulesType: RulesType;
  time: string;
  status: MatchStatus;
  isMyPost: boolean;
};

export default function MatchFinderPage() {
  const viewerRole: TeamRole = "leader";

  const canPostMatches =
    viewerRole === "leader" ||
    viewerRole === "co-leader" ||
    viewerRole === "captain";

  const [matches, setMatches] = useState<MatchPost[]>([
    {
      id: 48291,
      players: "4v4",
      mode: "Search and Destroy",
      rulesType: "Preset",
      time: "8:00 PM",
      status: "open",
      isMyPost: false,
    },
    {
      id: 48292,
      players: "3v3",
      mode: "Team Deathmatch",
      rulesType: "Custom",
      time: "8:15 PM",
      status: "open",
      isMyPost: false,
    },
    {
      id: 48293,
      players: "4v4",
      mode: "Search and Destroy",
      rulesType: "Preset",
      time: "8:30 PM",
      status: "open",
      isMyPost: true,
    },
    {
      id: 48294,
      players: "5v5",
      mode: "Control",
      rulesType: "Preset",
      time: "9:00 PM",
      status: "accepted",
      isMyPost: false,
    },
    {
      id: 48295,
      players: "4v4",
      mode: "Hardpoint",
      rulesType: "Custom",
      time: "9:15 PM",
      status: "open",
      isMyPost: false,
    },
  ]);

  function acceptMatch(id: number) {
    setMatches((current) =>
      current.map((match) =>
        match.id === id ? { ...match, status: "accepted" } : match
      )
    );
  }

  function cancelMatch(id: number) {
    setMatches((current) =>
      current.map((match) =>
        match.id === id ? { ...match, status: "cancelled" } : match
      )
    );
  }

  return (
    <>
      <style>{`
        *{margin:0;padding:0;box-sizing:border-box;}

        body{
          background:#000;
          font-family:Tahoma,Verdana,Arial,sans-serif;
          color:#d7e2ee;
        }

        a{text-decoration:none;}

        button{
          font-family:Tahoma,Verdana,Arial,sans-serif;
        }

        .page{
          min-height:100vh;
          background:
            radial-gradient(circle at top,rgba(45,100,150,.28),transparent 42%),
            linear-gradient(to bottom,#02060a,#000);
          padding:32px 22px;
        }

        .wrap{
          max-width:1120px;
          margin:0 auto;
          background:#07111b;
          border:1px solid #315f88;
          box-shadow:0 0 28px rgba(0,80,140,.38), inset 0 0 22px rgba(0,0,0,.72);
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
          background:
            linear-gradient(to right,rgba(0,0,0,.55),rgba(0,0,0,.08)),
            linear-gradient(to bottom,#173956,#07111b);
          border-bottom:2px solid #315f88;
          display:flex;
          align-items:center;
          justify-content:space-between;
          padding:0 24px;
        }

        .game-header{
          display:flex;
          align-items:center;
          gap:18px;
        }

        .game-cover{
          width:126px;
          height:78px;
          border:1px solid #315f88;
          background:linear-gradient(135deg,#07111b,#02070c 48%,#142f47);
          overflow:hidden;
          box-shadow:0 0 14px rgba(0,0,0,.55);
        }

        .game-cover img{
          width:100%;
          height:100%;
          object-fit:cover;
          object-position:center;
          display:block;
        }

        .game-name{
          color:#f2c14e;
          font-size:15px;
          font-weight:900;
          letter-spacing:1.3px;
          text-transform:uppercase;
          margin-bottom:8px;
          text-shadow:0 1px 2px #000;
        }

        .ladder-name{
          color:#fff;
          font-size:30px;
          font-weight:900;
          text-transform:uppercase;
          text-shadow:0 2px 4px #000;
        }

        .header-badge{
          border:1px solid #6ba8d6;
          background:linear-gradient(to bottom,#214765,#0b1c2d);
          color:#f5f8ff;
          font-size:15px;
          font-weight:900;
          text-transform:uppercase;
          padding:14px 22px;
          text-shadow:0 2px 4px #000;
          box-shadow:inset 0 0 14px rgba(255,255,255,.05);
        }

        .nav{
          height:36px;
          background:linear-gradient(to bottom,#10283d,#07111b);
          border-bottom:1px solid #244b70;
          display:flex;
          align-items:center;
          justify-content:center;
          gap:28px;
        }

        .nav a{
          color:#d7eaff;
          font-size:12px;
          font-weight:bold;
          text-transform:uppercase;
        }

        .nav a:hover{color:#d7ad4a;}

        .title-bar{
          background:linear-gradient(to bottom,#1d496e,#0a1724);
          border-bottom:1px solid #315f88;
          padding:18px 24px;
          text-align:center;
        }

        .title-bar h1{
          color:#d7ad4a;
          font-size:30px;
          text-transform:uppercase;
          text-shadow:0 1px 2px #000;
        }

        .content{padding:18px;}

        .finder-layout{
          display:grid;
          grid-template-columns:232px 1fr;
          gap:14px;
        }

        .panel{
          background:#050b12;
          border:1px solid #244b70;
          box-shadow:inset 0 0 18px rgba(0,0,0,.75);
        }

        .panel-header{
          min-height:36px;
          background:linear-gradient(to bottom,#18344f,#091521);
          border-bottom:1px solid #244b70;
          display:flex;
          align-items:center;
          justify-content:center;
          padding:0 12px;
          color:#d7ad4a;
          font-size:12px;
          font-weight:900;
          text-transform:uppercase;
          letter-spacing:1px;
        }

        .side-body{padding:12px;}

        .ladder-card{
          border:1px solid #1f3d5a;
          background:linear-gradient(to bottom,#091724,#06101a);
          padding:12px;
          margin-bottom:12px;
        }

        .ladder-title{
          color:#d7ad4a;
          font-size:12px;
          font-weight:900;
          text-transform:uppercase;
          margin-bottom:9px;
          padding-bottom:8px;
          border-bottom:1px solid rgba(255,255,255,.08);
        }

        .ladder-line{
          color:#cfe2f2;
          font-size:12px;
          line-height:23px;
          border-bottom:1px solid rgba(255,255,255,.05);
        }

        .ladder-line:last-child{border-bottom:0;}

        .ladder-line span{color:#8aa7c0;}

        .help-box,
        .quick-create{
          height:40px;
          width:100%;
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:12px;
          font-weight:900;
          text-transform:uppercase;
          margin-top:10px;
        }

        .help-box{
          border:1px solid #4b95d8;
          background:linear-gradient(to bottom,#1c4b72,#0a1724);
          color:#fff;
        }

        .help-box:hover{
          border-color:#d7ad4a;
          color:#d7ad4a;
        }

        .quick-create{
          border:1px solid #e8c46a;
          background:linear-gradient(to bottom,#d6a943,#7b560e);
          color:#07111b;
        }

        .main-body{padding:12px;}

        .board{
          border:1px solid #244b70;
          background:#02070c;
        }

        .board-head,
        .match-row{
          display:grid;
          grid-template-columns:1fr 1.45fr 1fr 1fr 230px;
        }

        .board-head{
          background:linear-gradient(to bottom,#112b42,#07111b);
          border-bottom:1px solid #244b70;
        }

        .board-head div{
          color:#d7ad4a;
          font-size:11px;
          font-weight:900;
          text-transform:uppercase;
          padding:10px;
          border-right:1px solid rgba(255,255,255,.06);
          text-align:center;
        }

        .board-head div:last-child{border-right:0;}

        .match-row{
          min-height:58px;
          border-bottom:1px solid rgba(255,255,255,.07);
          background:#050b12;
        }

        .match-row:nth-child(even){background:#07111b;}

        .match-row:hover{background:#081b2a;}

        .match-cell{
          padding:10px;
          border-right:1px solid rgba(255,255,255,.055);
          display:flex;
          align-items:center;
          justify-content:center;
          color:#cfe2f2;
          font-size:13px;
          font-weight:900;
          text-align:center;
        }

        .match-cell:last-child{border-right:0;}

        .players{
          color:#fff;
          font-size:15px;
        }

        .mode{
          color:#7fc7ff;
        }

        .rules-type{
          color:#d7ad4a;
          text-transform:uppercase;
        }

        .time{color:#cfe2f2;}

        .actions{
          display:flex;
          flex-wrap:wrap;
          gap:6px;
          align-items:center;
          justify-content:center;
        }

        .mini-btn{
          min-width:76px;
          height:27px;
          border:1px solid #4b95d8;
          background:linear-gradient(to bottom,#1c4b72,#0a1724);
          color:#fff;
          font-size:10px;
          font-weight:900;
          text-transform:uppercase;
          cursor:pointer;
          display:flex;
          align-items:center;
          justify-content:center;
        }

        .mini-btn.gold{
          border-color:#e8c46a;
          background:linear-gradient(to bottom,#d6a943,#7b560e);
          color:#07111b;
        }

        .mini-btn.red{
          border-color:#e34242;
          background:linear-gradient(to bottom,#bd1717,#5c0000);
          color:#fff;
        }

        .mini-btn.disabled{
          opacity:.42;
          cursor:not-allowed;
        }

        .mini-btn:hover:not(.disabled){filter:brightness(1.13);}

        .cancelled-text{
          color:#ff7777;
          font-size:11px;
          font-weight:900;
          text-transform:uppercase;
        }

        .accepted-text{
          color:#d7ad4a;
          font-size:11px;
          font-weight:900;
          text-transform:uppercase;
        }

        .footer{
          height:36px;
          background:#07111b;
          border-top:1px solid #244b70;
          display:flex;
          justify-content:center;
          align-items:center;
          color:#a9c3db;
          font-size:11px;
        }

        @media(max-width:980px){
          .finder-layout{grid-template-columns:1fr;}

          .board{overflow-x:auto;}

          .board-head,
          .match-row{
            min-width:820px;
          }

          .header{
            flex-direction:column;
            justify-content:center;
            gap:12px;
            padding:18px;
            text-align:center;
          }

          .nav{
            height:auto;
            padding:10px;
            flex-wrap:wrap;
            gap:14px;
          }
        }
      `}</style>

      <main className="page">
        <div className="wrap">
          <div className="top-strip">
            <a href="/home">Home</a>
            <a href="/profile">My Profile</a>
            <a href="/forums">Forums</a>
          </div>

          <header className="header">
            <div className="game-header">
              <div className="game-cover">
                <img src="/mw4.jpeg" alt="Call of Duty: Modern Warfare 4" />
              </div>

              <div>
                <div className="game-name">Call of Duty: Modern Warfare 4</div>
                <div className="ladder-name">Team Ladder</div>
              </div>
            </div>

            <div className="header-badge">Match Finder</div>
          </header>

          <nav className="nav">
            <a href="/home">Home</a>
            <a href="/profile/teams">My Teams</a>
            <a href="/members">Members</a>
            <a href="/forums">Forums</a>
            <a href="/teams/top">Top Teams</a>
          </nav>

          <section className="title-bar">
            <h1>Match Finder</h1>
          </section>

          <section className="content">
            <div className="finder-layout">
              <aside className="panel">
                <div className="panel-header">Ladder Menu</div>

                <div className="side-body">
                  <div className="ladder-card">
                    <div className="ladder-title">Current Ladder</div>
                    <div className="ladder-line"><span>Platform:</span> Xbox</div>
                    <div className="ladder-line"><span>Game:</span> MW4</div>
                    <div className="ladder-line"><span>Ladder:</span> Team</div>
                    <div className="ladder-line"><span>Roster:</span> 8 Players</div>
                    <div className="ladder-line"><span>Rules:</span> GB Default</div>
                  </div>

                  <a className="help-box" href="/matches/finder/help">
                    How Match Finder Works
                  </a>

                  <a className="quick-create" href="/matches/create">
                    Create Match
                  </a>
                </div>
              </aside>

              <section className="panel">
                <div className="panel-header">Open Match Posts</div>

                <div className="main-body">
                  <div className="board">
                    <div className="board-head">
                      <div>Players</div>
                      <div>Mode</div>
                      <div>Rules</div>
                      <div>Time</div>
                      <div>Actions</div>
                    </div>

                    {matches.map((match) => (
                      <div className="match-row" key={match.id}>
                        <div className="match-cell players">{match.players}</div>

                        <div className="match-cell mode">{match.mode}</div>

                        <div className="match-cell rules-type">
                          {match.rulesType}
                        </div>

                        <div className="match-cell time">{match.time}</div>

                        <div className="match-cell">
                          <div className="actions">
                            <a className="mini-btn" href={`/matches/${match.id}/rules`}>
                              View
                            </a>

                            {match.status === "cancelled" && (
                              <span className="cancelled-text">Cancelled</span>
                            )}

                            {match.status === "accepted" && (
                              <span className="accepted-text">Accepted</span>
                            )}

                            {match.status === "open" &&
                              match.isMyPost &&
                              canPostMatches && (
                                <button
                                  className="mini-btn red"
                                  type="button"
                                  onClick={() => cancelMatch(match.id)}
                                >
                                  Cancel
                                </button>
                              )}

                            {match.status === "open" &&
                              !match.isMyPost &&
                              canPostMatches && (
                                <button
                                  className="mini-btn gold"
                                  type="button"
                                  onClick={() => acceptMatch(match.id)}
                                >
                                  Accept
                                </button>
                              )}

                            {match.status === "open" &&
                              !match.isMyPost &&
                              !canPostMatches && (
                                <button className="mini-btn disabled" type="button">
                                  Accept
                                </button>
                              )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </div>
          </section>

          <footer className="footer">© 2026 Competitive Gaming Network</footer>
        </div>
      </main>
    </>
  );
}