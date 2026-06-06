type PageProps = {
  params: {
    platform: string;
  };
};

const platformNames: Record<string, string> = {
  playstation: "PlayStation",
  xbox: "Xbox",
  nintendo: "Nintendo",
  pc: "PC",
};

const codTitles = [
  {
    title: "Call of Duty: Black Ops 6",
    status: "Active",
    ladders: ["1v1", "2v2", "4v4", "Search and Destroy", "Hardpoint"],
  },
  {
    title: "Call of Duty: Modern Warfare III",
    status: "Active",
    ladders: ["1v1", "2v2", "4v4", "Search and Destroy", "Control"],
  },
  {
    title: "Call of Duty: Warzone",
    status: "Active",
    ladders: ["Duos", "Trios", "Quads", "Kill Race"],
  },
  {
    title: "Call of Duty: Modern Warfare II",
    status: "Legacy",
    ladders: ["1v1", "2v2", "4v4", "Search and Destroy"],
  },
];

export default function CallOfDutyPage({ params }: PageProps) {
  const platformName = platformNames[params.platform] || "Platform";

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
            radial-gradient(circle at top,rgba(18,80,130,.32),transparent 42%),
            #000;
          padding:28px;
        }

        .wrapper{
          width:1060px;
          margin:0 auto;
          border:1px solid #2f6f9f;
          background:#07111b;
          box-shadow:0 0 35px rgba(0,90,160,.45);
        }

        .top-bar{
          height:28px;
          background:linear-gradient(to bottom,#9a0000,#3a0000);
          border-bottom:1px solid #b10000;
          display:flex;
          align-items:center;
          justify-content:flex-end;
          padding:0 12px;
          gap:18px;
        }

        .top-bar a{
          color:#fff;
          font-size:12px;
          font-weight:bold;
          text-transform:uppercase;
        }

        .header{
          min-height:104px;
          background:linear-gradient(to bottom,#15324b,#07111b);
          border-bottom:2px solid #2f6f9f;
          display:flex;
          align-items:center;
          justify-content:space-between;
          padding:0 24px;
        }

        .logo-main{
          color:#f4f8ff;
          font-size:44px;
          font-weight:bold;
          font-style:italic;
          text-transform:uppercase;
          line-height:42px;
          text-shadow:0 2px 4px #000;
        }

        .logo-sub{
          color:#67bdff;
          font-size:12px;
          font-weight:bold;
          letter-spacing:4px;
          text-transform:uppercase;
          margin-top:6px;
        }

        .platform-badge{
          background:#050c14;
          border:1px solid #4b95d8;
          padding:14px 18px;
          color:#f2c14e;
          font-size:16px;
          font-weight:bold;
          text-transform:uppercase;
          box-shadow:inset 0 0 12px rgba(0,0,0,.7);
        }

        .nav{
          height:34px;
          background:linear-gradient(to bottom,#10283d,#07111b);
          border-bottom:1px solid #244b70;
          display:flex;
          align-items:center;
          padding:0 18px;
          gap:22px;
        }

        .nav a{
          color:#d7eaff;
          font-size:12px;
          font-weight:bold;
          text-transform:uppercase;
        }

        .nav a:hover{
          color:#f2c14e;
        }

        .title-bar{
          background:linear-gradient(to bottom,#205077,#0a1724);
          border-top:1px solid rgba(255,255,255,.08);
          border-bottom:1px solid #2f638f;
          padding:18px 24px;
        }

        .title-bar h1{
          color:#f2c14e;
          font-size:26px;
          text-transform:uppercase;
          margin-bottom:6px;
          text-shadow:0 1px 2px #000;
        }

        .title-bar p{
          color:#cfe2f2;
          font-size:14px;
          line-height:22px;
        }

        .content{
          padding:22px;
        }

        .game-list{
          display:grid;
          grid-template-columns:1fr;
          gap:14px;
        }

        .game-card{
          background:#050c14;
          border:1px solid #244b70;
          box-shadow:inset 0 0 18px rgba(0,0,0,.75);
        }

        .game-card-header{
          min-height:46px;
          background:linear-gradient(to bottom,#15324b,#091521);
          border-bottom:1px solid #244b70;
          display:flex;
          align-items:center;
          justify-content:space-between;
          padding:0 16px;
        }

        .game-title{
          color:#fff;
          font-size:17px;
          font-weight:bold;
          text-transform:uppercase;
        }

        .status{
          color:#00ff88;
          font-size:12px;
          font-weight:bold;
          text-transform:uppercase;
        }

        .status.legacy{
          color:#f2c14e;
        }

        .ladder-row{
          display:grid;
          grid-template-columns:1fr 130px 130px 130px;
          align-items:center;
          min-height:44px;
          border-bottom:1px solid #172d40;
          padding:0 14px;
          gap:12px;
        }

        .ladder-row:last-child{
          border-bottom:none;
        }

        .ladder-name{
          color:#d7e2ee;
          font-size:14px;
          font-weight:bold;
        }

        .ladder-info{
          color:#8aa7c0;
          font-size:12px;
          text-align:center;
        }

        .ladder-button{
          height:28px;
          background:linear-gradient(to bottom,#d60000,#700000);
          border:1px solid #ff4b4b;
          color:#fff;
          font-size:11px;
          font-weight:bold;
          text-transform:uppercase;
          display:flex;
          align-items:center;
          justify-content:center;
          text-shadow:0 1px 2px #000;
        }

        .ladder-button:hover{
          background:linear-gradient(to bottom,#f00000,#870000);
        }

        .footer{
          height:32px;
          background:#07111b;
          border-top:1px solid #244b70;
          display:flex;
          align-items:center;
          justify-content:center;
          color:#a9c3db;
          font-size:11px;
        }

        @media(max-width:1100px){
          .wrapper{
            width:100%;
          }
        }

        @media(max-width:760px){
          .page{
            padding:12px;
          }

          .header{
            flex-direction:column;
            align-items:flex-start;
            gap:14px;
            padding:20px;
          }

          .logo-main{
            font-size:34px;
            line-height:34px;
          }

          .nav{
            flex-wrap:wrap;
            height:auto;
            padding:12px 18px;
          }

          .ladder-row{
            grid-template-columns:1fr;
            padding:12px;
          }

          .ladder-info{
            text-align:left;
          }
        }
      `}</style>

      <main className="page">
        <div className="wrapper">
          <div className="top-bar">
            <a href="/home">Home</a>
            <a href="/profile">My Profile</a>
            <a href="/forums">Forums</a>
          </div>

          <header className="header">
            <div>
              <div className="logo-main">GameBattles</div>
              <div className="logo-sub">Where Gaming Finds Its Edge</div>
            </div>

            <div className="platform-badge">{platformName}</div>
          </header>

          <nav className="nav">
            <a href="/home">Home</a>
            <a href="/members">Members</a>
            <a href="/forums">Forums</a>
            <a href="/teams/top">Top Teams</a>
            <a href="/players/top">Top Players</a>
          </nav>

          <section className="title-bar">
            <h1>{platformName} Call of Duty Ladders</h1>
            <p>
              Select a Call of Duty title below to view available ladders,
              match formats, teams, standings, and competition options.
            </p>
          </section>

          <section className="content">
            <div className="game-list">
              {codTitles.map((game) => (
                <div className="game-card" key={game.title}>
                  <div className="game-card-header">
                    <div className="game-title">{game.title}</div>
                    <div
                      className={
                        game.status === "Legacy" ? "status legacy" : "status"
                      }
                    >
                      {game.status}
                    </div>
                  </div>

                  {game.ladders.map((ladder) => (
                    <div className="ladder-row" key={`${game.title}-${ladder}`}>
                      <div className="ladder-name">{ladder} Ladder</div>
                      <div className="ladder-info">Teams: 0</div>
                      <div className="ladder-info">Matches: 0</div>
                      <a
                        className="ladder-button"
                        href={`/ladders/${params.platform}/call-of-duty/${game.title
                          .toLowerCase()
                          .replaceAll(":", "")
                          .replaceAll(" ", "-")}/${ladder
                          .toLowerCase()
                          .replaceAll(" ", "-")}`}
                      >
                        View Ladder
                      </a>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </section>

          <footer className="footer">© 2026 Competitive Gaming Network</footer>
        </div>
      </main>
    </>
  );
}