"use client";

type Award = {
  id: number;
  name: string;
  group: string;
  purpose: string;
  col: number;
  row: number;
};

const awards: Award[] = [
  { id: 1, name: "Founder Trophy", group: "Founder", purpose: "Given to original founding members who joined before public launch.", col: 0, row: 0 },
  { id: 2, name: "Founder Badge", group: "Founder", purpose: "Permanent badge for original early supporters.", col: 1, row: 0 },
  { id: 3, name: "Alpha Tester Medal", group: "Tester", purpose: "Given to users who tested the earliest private build.", col: 2, row: 0 },
  { id: 4, name: "Beta Tester Medal", group: "Tester", purpose: "Given to users who helped test before public launch.", col: 3, row: 0 },
  { id: 5, name: "Community Contributor Plaque", group: "Community", purpose: "Given to users who helped grow the community.", col: 4, row: 0 },
  { id: 6, name: "Staff Pick Star", group: "Community", purpose: "Given to users selected by staff for standout activity.", col: 5, row: 0 },

  { id: 7, name: "Tournament Winner Trophy", group: "Tournament", purpose: "Given to winners of official tournaments.", col: 0, row: 1 },
  { id: 8, name: "Tournament Runner-Up Trophy", group: "Tournament", purpose: "Given to second-place tournament teams or players.", col: 1, row: 1 },
  { id: 9, name: "Tournament Finalist Trophy", group: "Tournament", purpose: "Given to finalists in official tournaments.", col: 2, row: 1 },
  { id: 10, name: "Grand Champion Crown", group: "Champion", purpose: "Given to top-level championship winners.", col: 3, row: 1 },
  { id: 11, name: "World Champion Trophy", group: "Champion", purpose: "Given to the highest world-level champion.", col: 4, row: 1 },
  { id: 12, name: "Major Champion Shield", group: "Champion", purpose: "Given to winners of major competitive events.", col: 5, row: 1 },

  { id: 13, name: "Top 100 Team Ribbon", group: "Ranking", purpose: "Given to teams reaching Top 100.", col: 0, row: 2 },
  { id: 14, name: "Top 50 Team Ribbon", group: "Ranking", purpose: "Given to teams reaching Top 50.", col: 1, row: 2 },
  { id: 15, name: "Top 25 Team Ribbon", group: "Ranking", purpose: "Given to teams reaching Top 25.", col: 2, row: 2 },
  { id: 16, name: "Top 10 Team Ribbon", group: "Ranking", purpose: "Given to teams reaching Top 10.", col: 3, row: 2 },
  { id: 17, name: "Top 5 Team Ribbon", group: "Ranking", purpose: "Given to teams reaching Top 5.", col: 4, row: 2 },
  { id: 18, name: "#1 Ranked Team Shield", group: "Ranking", purpose: "Given to the team holding the number one rank.", col: 5, row: 2 },

  { id: 19, name: "Ladder Champion Shield", group: "Ladder", purpose: "Given to ladder champions.", col: 0, row: 3 },
  { id: 20, name: "Season Champion Shield", group: "Season", purpose: "Given to season winners.", col: 1, row: 3 },
  { id: 21, name: "Undefeated Season Shield", group: "Season", purpose: "Given to teams or players with an undefeated season.", col: 2, row: 3 },
  { id: 22, name: "Rival Slayer Shield", group: "Rivalry", purpose: "Given for defeating a major rival.", col: 3, row: 3 },
  { id: 23, name: "First Win Badge", group: "Wins", purpose: "Given after a first official win.", col: 4, row: 3 },
  { id: 24, name: "100 Wins Badge", group: "Wins", purpose: "Given after 100 wins.", col: 5, row: 3 },

  { id: 25, name: "500 Wins Badge", group: "Wins", purpose: "Given after 500 wins.", col: 0, row: 4 },
  { id: 26, name: "1000 Wins Badge", group: "Wins", purpose: "Given after 1000 wins.", col: 1, row: 4 },
  { id: 27, name: "1 Year Service Medal", group: "Service", purpose: "Given after one year as a member.", col: 2, row: 4 },
  { id: 28, name: "3 Year Service Medal", group: "Service", purpose: "Given after three years as a member.", col: 3, row: 4 },
  { id: 29, name: "5 Year Service Medal", group: "Service", purpose: "Given after five years as a member.", col: 4, row: 4 },
  { id: 30, name: "Community Legend Crown", group: "Legacy", purpose: "Given to legendary community members.", col: 5, row: 4 },

  { id: 31, name: "Hall of Fame Plaque", group: "Legacy", purpose: "Given to Hall of Fame members.", col: 4, row: 4 },
  { id: 32, name: "GameBattles Immortal Crystal", group: "Legacy", purpose: "Given as the highest lifetime achievement award.", col: 5, row: 4 },

  { id: 33, name: "Launch Supporter Medal", group: "Launch", purpose: "Given to users who supported the launch period.", col: 0, row: 0 },
  { id: 34, name: "Discord Founder Badge", group: "Launch", purpose: "Given to early Discord members.", col: 1, row: 0 },
  { id: 35, name: "Username Reserved Badge", group: "Launch", purpose: "Given to users who reserved names early.", col: 2, row: 0 },
  { id: 36, name: "Early Access Shield", group: "Launch", purpose: "Given to users who tested the private build.", col: 3, row: 0 },
  { id: 37, name: "Bug Hunter Medal", group: "Tester", purpose: "Given to users who reported useful bugs.", col: 4, row: 0 },
  { id: 38, name: "Feedback Veteran Medal", group: "Tester", purpose: "Given to users who gave strong site feedback.", col: 5, row: 0 },

  { id: 39, name: "Profile Pioneer Badge", group: "User", purpose: "Given to users who completed profiles early.", col: 0, row: 1 },
  { id: 40, name: "Team Builder Shield", group: "Team", purpose: "Given to users who created active teams.", col: 1, row: 1 },
  { id: 41, name: "Roster Leader Medal", group: "Team", purpose: "Given to leaders who built full rosters.", col: 2, row: 1 },
  { id: 42, name: "Captain's Honor Shield", group: "Team", purpose: "Given to trusted captains.", col: 3, row: 1 },
  { id: 43, name: "Recruiter Badge", group: "Team", purpose: "Given to users who invited active members.", col: 4, row: 1 },
  { id: 44, name: "Verified Team Badge", group: "Team", purpose: "Given to verified teams.", col: 5, row: 1 },

  { id: 45, name: "Match Finder Medal", group: "Matches", purpose: "Given to active match finder users.", col: 0, row: 2 },
  { id: 46, name: "Clutch Victory Medal", group: "Matches", purpose: "Given for a major comeback win.", col: 1, row: 2 },
  { id: 47, name: "Clean Sweep Trophy", group: "Matches", purpose: "Given for sweeping a match series.", col: 2, row: 2 },
  { id: 48, name: "Perfect Record Shield", group: "Matches", purpose: "Given for a perfect record milestone.", col: 3, row: 2 },
  { id: 49, name: "Playoff Champion Trophy", group: "Playoffs", purpose: "Given to playoff bracket winners.", col: 4, row: 2 },
  { id: 50, name: "Playoff Finalist Medal", group: "Playoffs", purpose: "Given to playoff finalists.", col: 5, row: 2 },

  { id: 51, name: "Division Champion Shield", group: "Division", purpose: "Given to division winners.", col: 0, row: 3 },
  { id: 52, name: "Elite Division Shield", group: "Division", purpose: "Given to elite division players or teams.", col: 1, row: 3 },
  { id: 53, name: "Pro Division Medal", group: "Division", purpose: "Given to pro division players or teams.", col: 2, row: 3 },
  { id: 54, name: "Rookie Breakout Badge", group: "User", purpose: "Given to standout new players.", col: 3, row: 3 },
  { id: 55, name: "Forum Veteran Badge", group: "Community", purpose: "Given to active forum members.", col: 4, row: 3 },
  { id: 56, name: "Helpful Member Medal", group: "Community", purpose: "Given to users who help others.", col: 5, row: 3 },

  { id: 57, name: "Sportsmanship Ribbon", group: "Community", purpose: "Given for respectful competition.", col: 0, row: 4 },
  { id: 58, name: "Content Creator Plaque", group: "Creator", purpose: "Given to creators who promote the site.", col: 1, row: 4 },
  { id: 59, name: "Featured Player Plaque", group: "Featured", purpose: "Given to players featured by staff.", col: 2, row: 4 },
  { id: 60, name: "Legendary Team Crystal", group: "Legacy", purpose: "Given to legendary teams.", col: 5, row: 4 },
];

function AwardImage({ award }: { award: Award }) {
  return (
    <div
      className="award-image"
      style={{
        backgroundImage: "url('/awards/award-board.png')",
        backgroundPosition: `${award.col * 20}% ${award.row * 25}%`,
      }}
    />
  );
}

export default function StaffAwardsPage() {
  return (
    <>
      <style>{`
        *{ margin:0; padding:0; box-sizing:border-box; }

        body{
          background:#000;
          font-family:Tahoma,Verdana,Arial,sans-serif;
          color:#d7e2ee;
        }

        a{text-decoration:none;}

        .page{
          min-height:100vh;
          background:
            radial-gradient(circle at top,rgba(40,90,140,.35),transparent 42%),
            linear-gradient(to bottom,#02060a,#000);
          padding:28px;
        }

        .wrap{
          max-width:1280px;
          margin:0 auto;
          background:#07111b;
          border:1px solid #315f88;
          box-shadow:0 0 35px rgba(0,80,140,.45), inset 0 0 24px rgba(0,0,0,.75);
        }

        .top{
          height:34px;
          background:linear-gradient(to bottom,#8b0000,#3b0000);
          border-bottom:1px solid #b32222;
          display:flex;
          justify-content:flex-end;
          align-items:center;
          gap:18px;
          padding:0 14px;
        }

        .top a{
          color:#fff;
          font-size:12px;
          font-weight:bold;
          text-transform:uppercase;
        }

        .header{
          padding:22px;
          background:linear-gradient(to bottom,#173956,#07111b);
          border-bottom:2px solid #315f88;
          display:flex;
          justify-content:space-between;
          align-items:center;
        }

        .title{
          color:#f2c14e;
          font-size:32px;
          font-weight:900;
          text-transform:uppercase;
          text-shadow:0 2px 4px #000;
        }

        .sub{
          color:#cfe2f2;
          font-size:13px;
          margin-top:8px;
          line-height:20px;
        }

        .staff-badge{
          border:1px solid #d7ad4a;
          background:linear-gradient(to bottom,#4c3509,#120b02);
          color:#f2c14e;
          font-size:13px;
          font-weight:900;
          text-transform:uppercase;
          padding:12px 18px;
          box-shadow:0 0 14px rgba(242,193,78,.22);
        }

        .notice{
          margin:18px;
          padding:14px;
          border:1px solid #244b70;
          background:#050c14;
          color:#cfe2f2;
          font-size:13px;
          line-height:21px;
        }

        .section-title{
          margin:0 18px 12px;
          height:34px;
          background:linear-gradient(to bottom,#18344f,#091521);
          border:1px solid #244b70;
          color:#f2c14e;
          font-size:13px;
          font-weight:900;
          text-transform:uppercase;
          display:flex;
          align-items:center;
          padding:0 12px;
        }

        .award-grid{
          display:grid;
          grid-template-columns:repeat(4,1fr);
          gap:14px;
          padding:0 18px 18px;
        }

        .award-card{
          background:#050c14;
          border:1px solid #315f88;
          min-height:260px;
          padding:10px;
          box-shadow:inset 0 0 14px rgba(0,0,0,.75);
          display:grid;
          grid-template-columns:94px 1fr;
          gap:10px;
        }

        .award-card:hover{
          border-color:#d7ad4a;
          box-shadow:0 0 12px rgba(215,173,74,.24), inset 0 0 14px rgba(0,0,0,.75);
        }

        .award-art{
          width:94px;
          height:128px;
          border:1px solid #244b70;
          background:#000;
          overflow:hidden;
          align-self:start;
        }

        .award-image{
          width:100%;
          height:100%;
          background-repeat:no-repeat;
          background-size:600% 500%;
          filter:brightness(1.08) contrast(1.08);
        }

        .award-fields{
          display:flex;
          flex-direction:column;
        }

        .award-name{
          width:100%;
          background:#02070c;
          border:1px solid #315b7d;
          color:#fff;
          padding:7px;
          font-size:12px;
          font-weight:bold;
          margin-bottom:7px;
        }

        .award-group{
          width:100%;
          background:#02070c;
          border:1px solid #315b7d;
          color:#f2c14e;
          padding:7px;
          font-size:11px;
          font-weight:bold;
          margin-bottom:7px;
        }

        .award-purpose{
          width:100%;
          min-height:92px;
          background:#02070c;
          border:1px solid #315b7d;
          color:#d7e2ee;
          padding:7px;
          font-size:11px;
          line-height:15px;
          resize:none;
        }

        .footer{
          height:34px;
          border-top:1px solid #244b70;
          display:flex;
          align-items:center;
          justify-content:center;
          color:#a9c3db;
          font-size:11px;
        }

        @media(max-width:1100px){
          .award-grid{ grid-template-columns:repeat(2,1fr); }
        }

        @media(max-width:750px){
          .award-grid{ grid-template-columns:1fr; }
          .header{ flex-direction:column; align-items:flex-start; gap:12px; }
        }
      `}</style>

      <main className="page">
        <div className="wrap">
          <div className="top">
            <a href="/home">Home</a>
            <a href="/profile">Profile</a>
            <a href="/staff/awards">Awards Center</a>
          </div>

          <header className="header">
            <div>
              <div className="title">Awards Center</div>
              <div className="sub">
                Award builder for founder rewards, user rewards, tester rewards, ladder rewards, team rewards, tournament rewards, and staff-issued honors.
              </div>
            </div>

            <div className="staff-badge">Staff Access Only Later</div>
          </header>

          <div className="notice">
            This page is for compiling the full GameBattles award library. Awards use the approved realistic competitive-gaming style:
            metallic trophies, medals, shields, ribbons, plaques, crowns, and crystal awards.
          </div>

          <div className="section-title">Award Library — 60 Awards</div>

          <section className="award-grid">
            {awards.map((award) => (
              <div className="award-card" key={award.id}>
                <div className="award-art">
                  <AwardImage award={award} />
                </div>

                <div className="award-fields">
                  <input className="award-name" defaultValue={award.name} />
                  <input className="award-group" defaultValue={award.group} />
                  <textarea className="award-purpose" defaultValue={award.purpose} />
                </div>
              </div>
            ))}
          </section>

          <footer className="footer">© 2026 Competitive Gaming Network</footer>
        </div>
      </main>
    </>
  );
}