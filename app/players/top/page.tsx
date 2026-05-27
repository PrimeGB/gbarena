export default function TopPlayersPage() {
  const players = [
    {
      rank: 1,
      username: "xReaper",
      points: 2840,
      wins: 42,
      streak: "9W"
    },
    {
      rank: 2,
      username: "Nova",
      points: 2715,
      wins: 38,
      streak: "5W"
    },
    {
      rank: 3,
      username: "Ghost",
      points: 2650,
      wins: 37,
      streak: "3W"
    },
    {
      rank: 4,
      username: "Toxic",
      points: 2495,
      wins: 35,
      streak: "2W"
    },
    {
      rank: 5,
      username: "Frost",
      points: 2430,
      wins: 31,
      streak: "1L"
    },
    {
      rank: 6,
      username: "Rogue",
      points: 2380,
      wins: 30,
      streak: "4W"
    },
    {
      rank: 7,
      username: "Blitz",
      points: 2290,
      wins: 28,
      streak: "2W"
    },
    {
      rank: 8,
      username: "Vex",
      points: 2200,
      wins: 25,
      streak: "1W"
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

        .page-info{
          padding:10px;
          font-size:11px;
          line-height:1.5;
          color:#c8d8e8;
          border-bottom:1px solid #16324a;
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
        GameBattles Top Players Rankings
      </div>

      <div className="wrapper">

        <header className="header">

          <div>
            <div className="logo-main">Top Players</div>

            <div className="logo-sub">
              Weekly Competitive Rankings
            </div>
          </div>

        </header>

        <nav className="nav">
          <a href="/">Home</a>
          <a href="/latest-news">Latest News</a>
          <a href="/forums">Forums</a>
          <a href="/members">Members</a>
          <a href="/teams/top">Top Teams</a>
        </nav>

        <div className="layout">

          <aside className="panel">

            <div className="panel-title">
              Rankings Menu
            </div>

            <div className="sidebar">
              <a href="/players/top">Top Players</a>
              <a href="#">Top Teams</a>
              <a href="#">Top Weekly Earners</a>
              <a href="#">Highest Win Streaks</a>
              <a href="#">Most Active Players</a>
            </div>

          </aside>

          <main className="panel">

            <div className="panel-title">
              Weekly Player Rankings
            </div>

            <div className="page-info">
              Players are ranked by weekly points earned from competitive matches,
              tournaments, and ladder wins. Rankings update automatically and show
              where players stand against the rest of the community.
            </div>

            <table className="rank-table">

              <thead>
                <tr>
                  <th>#</th>
                  <th>Username</th>
                  <th>Weekly Points</th>
                  <th>Wins</th>
                  <th>Current Streak</th>
                </tr>
              </thead>

              <tbody>

                {players.map((player) => (
                  <tr key={player.rank}>

                    <td className="rank-number">
                      {player.rank}
                    </td>

                    <td>
                      {player.username}
                    </td>

                    <td className="points">
                      {player.points}
                    </td>

                    <td className="wins">
                      {player.wins}
                    </td>

                    <td className="streak">
                      {player.streak}
                    </td>

                  </tr>
                ))}

              </tbody>

            </table>

          </main>

        </div>

        <footer className="footer">
          © 2026 Competitive Gaming Rankings
        </footer>

      </div>
    </>
  );
}