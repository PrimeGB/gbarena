"use client";

const battlefieldTitles = [
  {
    title: "Battlefield 6",
    slug: "battlefield-6",
    image:
      "https://drop-assets.ea.com/images/2I7VhVjwdzBgmbpeldmM8t/4f2dcad2d115abd786aa2bb9ff38d89f/battlefield-6-standard-edition-16x9.jpg?im=AspectCrop%3D%2816%2C9%29%2CxPosition%3D0.5%2CyPosition%3D0.5356481481481481",
    ladders: ["Singles", "Duos", "Team"],
  },
  {
    title: "Battlefield 2042",
    slug: "battlefield-2042",
    image:
      "https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/1517290/header.jpg",
    ladders: ["Singles", "Duos", "Team"],
  },
  {
    title: "Battlefield V",
    slug: "battlefield-v",
    image:
      "https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/1238810/header.jpg",
    ladders: ["Singles", "Duos", "Team"],
  },
  {
    title: "Battlefield 1",
    slug: "battlefield-1",
    image:
      "https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/1238840/header.jpg",
    ladders: ["Singles", "Duos", "Team"],
  },
];

function ladderSlug(ladder: string) {
  return ladder.toLowerCase().replaceAll(" ", "-");
}

export default function XboxBattlefieldPage() {
  return (
    <>
      <style>{`
        *{margin:0;padding:0;box-sizing:border-box;}
        body{background:#000;font-family:Tahoma,Verdana,Arial,sans-serif;color:#d7e2ee;}
        a{text-decoration:none;}

        .page{
          min-height:100vh;
          background:radial-gradient(circle at top,rgba(20,80,130,.36),transparent 42%),#000;
          padding:26px;
        }

        .wrapper{
          width:1080px;
          margin:0 auto;
          background:#07111b;
          border:1px solid #2f6f9f;
          box-shadow:0 0 35px rgba(0,90,160,.5);
        }

        .top-strip{
          height:28px;
          background:linear-gradient(to bottom,#9a0000,#3a0000);
          border-bottom:1px solid #b10000;
          display:flex;
          justify-content:flex-end;
          align-items:center;
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
          min-height:108px;
          background:linear-gradient(to bottom,#15324b,#07111b);
          border-bottom:2px solid #2f6f9f;
          display:flex;
          justify-content:space-between;
          align-items:center;
          padding:0 24px;
        }

        .logo-main{
          color:#f4f8ff;
          font-size:46px;
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
          margin-top:7px;
        }

        .xbox-mark{
          min-width:132px;
          height:58px;
          border-radius:34px;
          background:radial-gradient(circle at 30% 25%,#baffba 0,#28c928 38%,#062f06 100%);
          border:2px solid #9aff9a;
          display:flex;
          align-items:center;
          justify-content:center;
          color:#fff;
          font-size:24px;
          font-weight:bold;
          text-transform:uppercase;
          box-shadow:0 0 18px rgba(0,255,100,.35), inset 0 0 18px rgba(0,0,0,.7);
          text-shadow:0 2px 4px #000;
        }

        .nav{
          height:36px;
          background:linear-gradient(to bottom,#10283d,#07111b);
          border-bottom:1px solid #244b70;
          display:flex;
          align-items:center;
          justify-content:center;
          gap:28px;
          padding:0 18px;
        }

        .nav a{
          color:#d7eaff;
          font-size:12px;
          font-weight:bold;
          text-transform:uppercase;
        }

        .nav a:hover{color:#f2c14e;}

        .title-bar{
          background:linear-gradient(to bottom,#205077,#0a1724);
          border-bottom:1px solid #2f638f;
          padding:22px 24px;
          text-align:center;
        }

        .title-bar h1{
          color:#f2c14e;
          font-size:30px;
          text-transform:uppercase;
          margin-bottom:8px;
          text-shadow:0 1px 2px #000;
        }

        .title-bar p{
          color:#cfe2f2;
          font-size:14px;
          line-height:22px;
        }

        .content{padding:24px;}

        .games-grid{
          display:grid;
          grid-template-columns:1fr 1fr;
          gap:18px;
        }

        .game-card{
          background:#050c14;
          border:1px solid #244b70;
          box-shadow:inset 0 0 18px rgba(0,0,0,.75);
        }

        .game-title{
          height:44px;
          background:linear-gradient(to bottom,#15324b,#091521);
          border-bottom:1px solid #244b70;
          display:flex;
          align-items:center;
          padding:0 14px;
          color:#fff;
          font-size:15px;
          font-weight:bold;
          text-transform:uppercase;
        }

        .game-image{
          height:190px;
          background:#000;
          border-bottom:1px solid #244b70;
          overflow:hidden;
          display:block;
        }

        .game-image img{
          width:100%;
          height:100%;
          object-fit:cover;
          object-position:center center;
          display:block;
          transition:transform .18s ease, filter .18s ease;
        }

        .game-image:hover img{
          transform:scale(1.03);
          filter:brightness(1.12);
        }

        .card-body{padding:14px;}

        .ladder-list{border:1px solid #172d40;}

        .ladder-item{
          min-height:42px;
          border-bottom:1px solid #172d40;
          padding:0 10px;
          display:grid;
          grid-template-columns:1fr auto auto;
          align-items:center;
          column-gap:22px;
          font-size:12px;
        }

        .ladder-item:last-child{border-bottom:none;}

        .ladder-name{
          color:#d7e2ee;
          font-weight:bold;
          text-transform:uppercase;
        }

        .ladder-link{
          color:#8cccff;
          font-size:11px;
          font-weight:bold;
          text-transform:uppercase;
          white-space:nowrap;
          cursor:pointer;
        }

        .ladder-link:hover{
          color:#f2c14e;
          text-decoration:underline;
        }

        .footer{
          height:34px;
          background:#07111b;
          border-top:1px solid #244b70;
          display:flex;
          justify-content:center;
          align-items:center;
          color:#a9c3db;
          font-size:11px;
        }
      `}</style>

      <main className="page">
        <div className="wrapper">
          <div className="top-strip">
            <a href="/home">Home</a>
            <a href="/profile">My Profile</a>
            <a href="/forums">Forums</a>
          </div>

          <header className="header">
            <div>
              <div className="logo-main">GameBattles</div>
              <div className="logo-sub">Where Gaming Finds Its Edge</div>
            </div>

            <div className="xbox-mark">Xbox</div>
          </header>

          <nav className="nav">
            <a href="/home">Home</a>
            <a href="/members">Members</a>
            <a href="/forums">Forums</a>
            <a href="/teams/top">Top Teams</a>
            <a href="/players/top">Top Players</a>
          </nav>

          <section className="title-bar">
            <h1>Xbox Battlefield Ladders</h1>
            <p>
              Choose a Battlefield title below. Each title has its own teams,
              ladders, matches, and standings.
            </p>
          </section>

          <section className="content">
            <div className="games-grid">
              {battlefieldTitles.map((game) => (
                <div className="game-card" key={game.title}>
                  <div className="game-title">{game.title}</div>

                  <a
                    className="game-image"
                    href={`/ladders/xbox/battlefield/${game.slug}`}
                  >
                    <img src={game.image} alt={game.title} />
                  </a>

                  <div className="card-body">
                    <div className="ladder-list">
                      {game.ladders.map((ladder) => {
                        const currentLadderSlug = ladderSlug(ladder);
                        const teamHubUrl = `/team-hub?platform=xbox&category=battlefield&game=${game.slug}&ladder=${currentLadderSlug}`;
                        const rankingsUrl = `/ladders/xbox/battlefield/${game.slug}/${currentLadderSlug}/rankings`;

                        return (
                          <div
                            className="ladder-item"
                            key={`${game.title}-${ladder}`}
                          >
                            <div className="ladder-name">{ladder} Ladder</div>

                            <a className="ladder-link" href={teamHubUrl}>
                              View/Create Team
                            </a>

                            <a className="ladder-link" href={rankingsUrl}>
                              Current Ladder Rankings
                            </a>
                          </div>
                        );
                      })}
                    </div>
                  </div>
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