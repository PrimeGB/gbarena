export default function TopTeamsPage() {

  const teams = [
    {
      rank: 1,
      team: "Team Reaper",
      game: "Call of Duty",
      points: 5420,
      wins: 62,
      streak: "11W",
      page: "/teams/reaper"
    },
    {
      rank: 2,
      team: "Nova Elite",
      game: "Fortnite",
      points: 5180,
      wins: 57,
      streak: "8W",
      page: "/teams/nova-elite"
    },
    {
      rank: 3,
      team: "Ghost Ops",
      game: "Battlefield 6",
      points: 5035,
      wins: 54,
      streak: "5W",
      page: "/teams/ghost-ops"
    },
    {
      rank: 4,
      team: "Vortex",
      game: "Call of Duty",
      points: 4910,
      wins: 50,
      streak: "3W",
      page: "/teams/vortex"
    },
    {
      rank: 5,
      team: "Toxic Gaming",
      game: "Fortnite",
      points: 4770,
      wins: 48,
      streak: "2L",
      page: "/teams/toxic-gaming"
    },
    {
      rank: 6,
      team: "Blitz Unit",
      game: "Battlefield 6",
      points: 4625,
      wins: 45,
      streak: "4W",
      page: "/teams/blitz-unit"
    },
    {
      rank: 7,
      team: "Frostbite",
      game: "Call of Duty",
      points: 4510,
      wins: 43,
      streak: "2W",
      page: "/teams/frostbite"
    },
    {
      rank: 8,
      team: "Zero Hour",
      game: "Fortnite",
      points: 4380,
      wins: 41,
      streak: "1W",
      page: "/teams/zero-hour"
    }
  ];

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

        .top-strip{
          height:22px;
          background:linear-gradient(to bottom,#c40000,#6a0000);
          border-bottom:1px solid #140000;
          display:flex;
          align-items:center;
          padding:0 12px;
          color:#fff;
          font-size:10px;
        }

        .wrapper{
          width:1240px;
          margin:0 auto;
        }

        .header{
          height:92px;
          background:#0a1622;
          border-left:1px solid #3b7fc2;
          border-right:1px solid #3b7fc2;
          border-bottom:2px solid #4f93d6;
          display:flex;
          align-items:center;
          padding:0 14px;
        }

        .logo-main{
          font-size:30px;
          font-weight:bold;
          color:#eaf5ff;
          letter-spacing:-1px;
        }

        .logo-sub{
          color:#f2c14e;
          font-size:10px;
          text-transform:uppercase;
          margin-top:5px;
        }

        .nav{
          height:32px;
          background:#0a1622;
          border-left:1px solid #3b7fc2;
          border-right:1px solid #3b7fc2;
          border-bottom:1px solid #3b7fc2;
          display:flex;
          align-items:center;
          gap:16px;
          padding:0 12px;
        }

        .nav a{
          font-size:10px;
          text-transform:uppercase;
          color:#d7eaff;
        }

        .nav a:hover{
          color:#f2c14e;
        }

        .layout{
          margin-top:8px;
          display:grid;
          grid-template-columns:240px 1fr;
          gap:10px;
        }

        .panel{
          background:#0a1622;
          border:1px solid #3b7fc2;
        }

        .panel-title{
          height:24px;
          background:#0f2a40;
          border-bottom:1px solid #3b7fc2;
          display:flex;
          align-items:center;
          padding-left:8px;
          font-size:10px;
          font-weight:bold;
          color:#f2c14e;
          text-transform:uppercase;
        }

        .sidebar a{
          display:block;
          padding:8px;
          border-bottom:1px solid #16324a;
          color:#d7eaff;
          font-size:10px;
        }

        .sidebar a:hover{
          background:#12324b;
          color:#fff;
        }

        .page-info{
          padding:10px;
          font-size:11px;
          line-height:1.5;
          color:#c8d8e8;
          border-bottom:1px solid #16324a;
        }

        .rank-table{
          width:100%;
          border-collapse:collapse;
        }

        .rank-table th{
          background:#07111b;
          border-bottom:1px solid #3b7fc2;
          color:#f2c14e;
          font-size:10px;
          text-transform:uppercase;
          padding:10px 6px;
          text-align:left;
        }

        .rank-table td{
          padding:10px 6px;
          border-bottom:1px solid #16324a;
          font-size:11px;
          color:#d7eaff;
        }

        .rank-table tr:nth-child(even){
          background:#09131d;
        }

        .rank-table tr:hover{
          background:#12324b;
        }

        .rank-number{
          color:#f2c14e;
          font-weight:bold;
        }

        .team-link{
          color:#7fc0ff;
          font-weight:bold;
        }

        .team-link:hover{
          color:#fff;
          text-decoration:underline;
        }

        .game-title{
          color:#9cff9c;
          font-weight:bold;
        }

        .points{
          color:#7fc0ff;
          font-weight:bold;
        }

        .wins{
          color:#9cff9c;
        }

        .streak{
          color:#ffcb6b;
          font-weight:bold;
        }

        .footer{
          margin-top:8px;
          height:26px;
          background:#0a1622;
          border:1px solid #3b7fc2;
          display:flex;
          align-items:center;
          justify-content:center;
          color:#a9c3db;
          font-size:10px;
        }

      `}</style>

      <div className="top-strip">
        GameBattles Top Teams Rankings
      </div>

      <div className="wrapper">

        <header className="header">

          <div>
            <div className="logo-main">
              Top Teams
            </div>

            <div className="logo-sub">
              Competitive Team Rankings
            </div>
          </div>

        </header>

        <nav className="nav">
          <a href="/">Home</a>
          <a href="/latest-news">Latest News</a>
          <a href="/players/top">Top Players</a>
          <a href="/forums">Forums</a>
          <a href="/members">Members</a>
        </nav>

        <div className="layout">

          <aside className="panel">

            <div className="panel-title">
              Team Rankings
            </div>

            <div className="sidebar">
              <a href="/teams/top">Top Teams</a>
              <a href="#">Highest Win Streaks</a>
              <a href="#">Most Active Teams</a>
              <a href="#">Top Weekly Earners</a>
              <a href="#">Tournament Champions</a>
            </div>

          </aside>

          <main className="panel">

            <div className="panel-title">
              Weekly Team Rankings
            </div>

            <div className="page-info">
              Teams are ranked by weekly points earned from competitive matches,
              tournaments, ladder wins, and overall activity. Team names are clickable
              so players can quickly visit team pages and view roster information,
              records, and match history.
            </div>

            <table className="rank-table">

              <thead>

                <tr>
                  <th>#</th>
                  <th>Team Name</th>
                  <th>Game Title</th>
                  <th>Weekly Points</th>
                  <th>Wins</th>
                  <th>Current Streak</th>
                </tr>

              </thead>

              <tbody>

                {teams.map((team) => (

                  <tr key={team.rank}>

                    <td className="rank-number">
                      {team.rank}
                    </td>

                    <td>
                      <a
                        href={team.page}
                        className="team-link"
                      >
                        {team.team}
                      </a>
                    </td>

                    <td className="game-title">
                      {team.game}
                    </td>

                    <td className="points">
                      {team.points}
                    </td>

                    <td className="wins">
                      {team.wins}
                    </td>

                    <td className="streak">
                      {team.streak}
                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </main>

        </div>

        <footer className="footer">
          © 2026 Competitive Gaming Team Rankings
        </footer>

      </div>
    </>
  );
}