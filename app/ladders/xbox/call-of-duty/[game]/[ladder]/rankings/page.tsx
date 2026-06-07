"use client";

import { useEffect, useState } from "react";
import { useUser } from "../../../../../../../lib/useUser";
import { supabase } from "../../../../../../../lib/supabase";

type AppUser = {
  id: string;
};

const standings = [
  { rank: 1, team: "Team Reaper", wins: 182, loss: 1, streak: "105W" },
  { rank: 2, team: "Nova Elite", wins: 125, loss: 0, streak: "7W" },
  { rank: 3, team: "Ghost Ops", wins: 65, loss: 0, streak: "65W" },
  { rank: 4, team: "Vortex", wins: 83, loss: 1, streak: "14W" },
  { rank: 5, team: "Toxic Gaming", wins: 74, loss: 5, streak: "1L" },
  { rank: 6, team: "Blitz Unit", wins: 85, loss: 16, streak: "2W" },
];

export default function TopTeamsPage() {
  const { user } = useUser();
  const currentUser = user as AppUser | null;

  const [hasTeam, setHasTeam] = useState(false);

  useEffect(() => {
    async function checkTeams() {
      if (!currentUser?.id) {
        setHasTeam(false);
        return;
      }

      const { data } = await supabase
        .from("team_members")
        .select("id")
        .eq("user_id", currentUser.id)
        .limit(1);

      setHasTeam(!!data && data.length > 0);
    }

    checkTeams();
  }, [currentUser]);

  const ladderButtonText = hasTeam ? "View Team" : "Join Ladder";
  const ladderButtonLink = "/profile/teams";

  return (
    <>
      <style>{`
        *{
          margin:0;
          padding:0;
          box-sizing:border-box;
        }

        body{
          background:#000;
          font-family:Tahoma,Verdana,Arial,sans-serif;
          color:#d7e2ee;
        }

        a{
          text-decoration:none;
        }

        .page{
          min-height:100vh;
          background:
            radial-gradient(circle at top,rgba(20,80,130,.36),transparent 42%),
            #000;
          padding:54px 70px;
        }

        .top-area{
          max-width:1180px;
          margin:0 auto 28px;
          display:flex;
          justify-content:space-between;
          align-items:flex-start;
        }

        .ladder-heading{
          display:flex;
          gap:24px;
          align-items:flex-start;
          padding-top:14px;
        }

        .cover{
          width:172px;
          height:124px;
          background:#050c14;
          border:1px solid #2f6f9f;
          border-radius:4px;
          overflow:hidden;
          box-shadow:0 0 18px rgba(0,90,160,.5);
        }

        .cover img{
          width:100%;
          height:100%;
          object-fit:cover;
          object-position:center;
          display:block;
        }

        .ladder-text{
          padding-top:12px;
        }

        .game-name{
          color:#f2c14e;
          font-size:16px;
          font-weight:900;
          letter-spacing:1.4px;
          text-transform:uppercase;
          margin-bottom:10px;
          text-shadow:0 1px 2px #000;
        }

        .eyebrow{
          color:#67bdff;
          font-size:13px;
          font-weight:900;
          letter-spacing:3px;
          text-transform:uppercase;
          margin-bottom:12px;
        }

        .title{
          font-size:34px;
          line-height:38px;
          font-weight:900;
          color:#fff;
          margin-bottom:0;
          text-shadow:0 2px 4px #000;
        }

        .join-btn{
          margin-top:78px;
          width:150px;
          height:52px;
          background:linear-gradient(to bottom,#d60000,#700000);
          border:1px solid #ff4b4b;
          border-radius:4px;
          color:#fff;
          font-size:14px;
          font-weight:900;
          text-transform:uppercase;
          display:flex;
          align-items:center;
          justify-content:center;
          box-shadow:0 3px 8px rgba(0,0,0,.45);
          text-shadow:0 1px 2px #000;
        }

        .join-btn:hover{
          background:linear-gradient(to bottom,#f00000,#870000);
        }

        .layout{
          max-width:1180px;
          margin:0 auto;
          display:grid;
          grid-template-columns:1fr 360px;
          gap:20px;
        }

        .info-box,
        .standings-box,
        .details-box{
          background:#07111b;
          border:1px solid #244b70;
          border-radius:4px;
          box-shadow:inset 0 0 18px rgba(0,0,0,.75);
        }

        .info-box{
          padding:22px;
          margin-bottom:32px;
        }

        .box-header{
          display:flex;
          justify-content:space-between;
          align-items:center;
          border-bottom:1px solid #244b70;
          padding-bottom:16px;
          margin-bottom:18px;
        }

        .box-title{
          font-size:14px;
          font-weight:900;
          letter-spacing:1.6px;
          text-transform:uppercase;
          color:#f2c14e;
          text-shadow:0 1px 2px #000;
        }

        .info-content{
          display:flex;
          gap:18px;
          align-items:flex-start;
          color:#d7e2ee;
          font-size:14px;
          line-height:22px;
        }

        .ladder-icon{
          min-width:38px;
          height:38px;
          border-radius:50%;
          background:linear-gradient(to bottom,#205077,#0a1724);
          border:1px solid #4b95d8;
          color:#f2c14e;
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:21px;
          font-weight:900;
          box-shadow:inset 0 0 12px rgba(0,0,0,.75);
        }

        .standings-box{
          overflow:hidden;
        }

        .standings-header{
          height:50px;
          background:linear-gradient(to bottom,#15324b,#091521);
          display:grid;
          grid-template-columns:115px 1fr 92px 92px 82px;
          align-items:center;
          padding:0 18px;
          color:#fff;
          font-size:12px;
          font-weight:900;
          letter-spacing:1.7px;
          text-transform:uppercase;
          border-bottom:1px solid #244b70;
        }

        .standings-header .first{
          color:#fff;
          font-size:14px;
        }

        .standings-header div:nth-child(2){
          padding-left:12px;
        }

        .standings-header div:nth-child(3),
        .standings-header div:nth-child(4),
        .standings-header div:nth-child(5){
          text-align:right;
        }

        .row{
          min-height:72px;
          display:grid;
          grid-template-columns:115px 1fr 92px 92px 82px;
          align-items:center;
          padding:0 18px;
          border-top:1px solid #172d40;
          background:#07111b;
        }

        .row:nth-child(even){
          background:#0b1825;
        }

        .rank{
          display:flex;
          align-items:center;
          gap:8px;
          font-size:25px;
          font-weight:900;
          color:#fff;
        }

        .suffix{
          font-size:13px;
          margin-left:-6px;
        }

        .up{
          color:#00ff88;
          font-size:13px;
        }

        .down{
          color:#ff4d4d;
          font-size:13px;
        }

        .team{
          display:flex;
          align-items:center;
          gap:12px;
          color:#fff;
          font-size:16px;
          font-weight:bold;
          padding-left:12px;
        }

        .team:hover{
          color:#f2c14e;
        }

        .avatar{
          width:36px;
          height:36px;
          border-radius:3px;
          background:linear-gradient(135deg,#205077,#0a1724);
          border:1px solid #4b95d8;
          display:flex;
          align-items:center;
          justify-content:center;
          color:#f2c14e;
          font-size:14px;
          font-weight:900;
          box-shadow:inset 0 0 12px rgba(0,0,0,.75);
        }

        .wins{
          color:#00ff88;
          font-weight:900;
          font-size:14px;
          text-align:right;
        }

        .loss{
          color:#ff4d4d;
          font-weight:900;
          font-size:14px;
          text-align:right;
        }

        .streak{
          color:#f2c14e;
          font-weight:900;
          font-size:14px;
          text-align:right;
        }

        .details-box{
          padding:22px;
        }

        .details-title{
          font-size:14px;
          font-weight:900;
          letter-spacing:1.6px;
          text-transform:uppercase;
          border-bottom:1px solid #244b70;
          padding-bottom:16px;
          margin-bottom:14px;
          color:#f2c14e;
          text-shadow:0 1px 2px #000;
        }

        .detail-row{
          display:grid;
          grid-template-columns:1fr 1fr;
          gap:10px;
          padding:14px 0;
          font-size:15px;
        }

        .detail-label{
          color:#8aa7c0;
        }

        .detail-value{
          color:#fff;
          font-weight:bold;
          text-align:right;
        }

        .rules-btn,
        .match-btn,
        .bracket-btn{
          height:48px;
          border:1px solid #4b95d8;
          color:#fff;
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:13px;
          font-weight:900;
          text-transform:uppercase;
          letter-spacing:1px;
          margin:18px 0 8px;
          background:linear-gradient(to bottom,#205077,#0a1724);
          text-shadow:0 1px 2px #000;
        }

        .rules-btn:hover,
        .match-btn:hover,
        .bracket-btn:hover{
          border-color:#f2c14e;
          color:#f2c14e;
          filter:brightness(1.15);
        }

        .playoff-note{
          color:#8aa7c0;
          font-size:12px;
          line-height:18px;
          text-align:center;
          margin-bottom:18px;
        }

        .footer{
          max-width:1180px;
          margin:34px auto 0;
          color:#8aa7c0;
          font-size:12px;
          text-align:center;
        }
      `}</style>

      <main className="page">
        <section className="top-area">
          <div className="ladder-heading">
            <div className="cover">
              <img src="/mw4.jpeg" alt="Call of Duty" />
            </div>

            <div className="ladder-text">
              <div className="game-name">Call of Duty: Modern Warfare 4</div>
              <div className="eyebrow"># Ladder · Season: Spring 2026 ▾</div>
              <h1 className="title">Team Ladder</h1>
            </div>
          </div>

          <a className="join-btn" href={ladderButtonLink}>
            {ladderButtonText}
          </a>
        </section>

        <section className="layout">
          <div>
            <div className="info-box">
              <div className="box-header">
                <div className="box-title">What Is Team Ladder?</div>
              </div>

              <div className="info-content">
                <div className="ladder-icon">#</div>
                <p>
                  Team Ladder works like every other competitive ladder, but it
                  is built for teams of 3 or more players. Create or join a
                  team, compete in ladder matches, climb the standings, and
                  review the Team Ladder rules for full match, roster, and
                  playoff details.
                </p>
              </div>
            </div>

            <div className="standings-box">
              <div className="standings-header">
                <div className="first">Standings</div>
                <div>Team</div>
                <div>Wins</div>
                <div>Loss</div>
                <div>Streak</div>
              </div>

              {standings.map((team) => (
                <div className="row" key={team.rank}>
                  <div className="rank">
                    {team.rank}
                    <span className="suffix">
                      {team.rank === 1
                        ? "st"
                        : team.rank === 2
                        ? "nd"
                        : team.rank === 3
                        ? "rd"
                        : "th"}
                    </span>
                    <span className={team.streak.includes("L") ? "down" : "up"}>
                      {team.streak.includes("L") ? "▼" : "▲"}
                    </span>
                  </div>

                  <a className="team" href="/profile/teams">
                    <div className="avatar">
                      {team.team.slice(0, 2).toUpperCase()}
                    </div>
                    {team.team}
                  </a>

                  <div className="wins">{team.wins}</div>
                  <div className="loss">{team.loss}</div>
                  <div className="streak">{team.streak}</div>
                </div>
              ))}
            </div>
          </div>

          <aside className="details-box">
            <div className="details-title">Ladder Details</div>

            <div className="detail-row">
              <div className="detail-label">Price</div>
              <div className="detail-value">Free to Play</div>
            </div>

            <div className="detail-row">
              <div className="detail-label">Region</div>
              <div className="detail-value">Open</div>
            </div>

            <div className="detail-row">
              <div className="detail-label">Total Teams</div>
              <div className="detail-value">0</div>
            </div>

            <div className="detail-row">
              <div className="detail-label">Current Season</div>
              <div className="detail-value">Spring 2026</div>
            </div>

            <div className="detail-row">
              <div className="detail-label">Season Ends</div>
              <div className="detail-value">Coming Soon</div>
            </div>

            <a className="rules-btn" href="/rules/team-ladder">
              Ladder Rules
            </a>

            <a className="match-btn" href="/matches">
              Match Finder
            </a>

            <div className="detail-row">
              <div className="detail-label">Roster Lock Starts</div>
              <div className="detail-value">TBA</div>
            </div>

            <div className="detail-row">
              <div className="detail-label">Playoff Bracket Starts</div>
              <div className="detail-value">TBA</div>
            </div>

            <a className="bracket-btn" href="/tournaments/playoffs">
              View Playoff Bracket
            </a>

            <div className="playoff-note">Viewable during playoffs.</div>
          </aside>
        </section>

        <footer className="footer">
          © 2026 Competitive Gaming Ladder Rankings
        </footer>
      </main>
    </>
  );
}