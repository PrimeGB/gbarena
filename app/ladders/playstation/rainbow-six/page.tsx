"use client";

import { usePathname } from "next/navigation";

type PlatformKey = "xbox" | "playstation" | "pc";

const siegeTitles = [
  {
    title: "Rainbow Six Siege Ranked",
    slug: "ranked",
    image:
      "https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/359550/header.jpg",
    ladders: ["Team"],
  },
  {
    title: "Rainbow Six Siege Standard",
    slug: "standard",
    image:
      "https://cdn.cloudflare.steamstatic.com/steam/apps/359550/ss_09b0a21f8f8c74913ef75466c1c1eaa4a52cbe38.1920x1080.jpg",
    ladders: ["Team"],
  },
  {
    title: "Rainbow Six Siege Quick Match",
    slug: "quick-match",
    image:
      "https://cdn.cloudflare.steamstatic.com/steam/apps/359550/ss_f0a4f92dc5b42a3842bb2e2f29e0ca7d63ccf7b7.1920x1080.jpg",
    ladders: ["Team"],
  },
  {
    title: "Rainbow Six Siege Competitive",
    slug: "competitive",
    image:
      "https://cdn.cloudflare.steamstatic.com/steam/apps/359550/ss_9ffef5c1d82277d91c10f7326dd4c5c00466176e.1920x1080.jpg",
    ladders: ["Team", "Academy Team"],
  },
];

const platformStyles: Record<
  PlatformKey,
  {
    name: string;
    title: string;
    markClass: string;
    backgroundGlow: string;
    boxShadow: string;
  }
> = {
  xbox: {
    name: "Xbox",
    title: "Xbox Rainbow Six Siege Ladders",
    markClass: "xbox-mark",
    backgroundGlow:
      "radial-gradient(circle at top,rgba(20,130,60,.36),transparent 42%),#000",
    boxShadow: "0 0 35px rgba(0,255,100,.32)",
  },
  playstation: {
    name: "PlayStation",
    title: "PlayStation Rainbow Six Siege Ladders",
    markClass: "playstation-mark",
    backgroundGlow:
      "radial-gradient(circle at top,rgba(30,90,220,.42),transparent 42%),#000",
    boxShadow: "0 0 35px rgba(40,120,255,.42)",
  },
  pc: {
    name: "PC",
    title: "PC Rainbow Six Siege Ladders",
    markClass: "pc-mark",
    backgroundGlow:
      "radial-gradient(circle at top,rgba(120,90,220,.42),transparent 42%),#000",
    boxShadow: "0 0 35px rgba(140,90,255,.38)",
  },
};

function ladderSlug(ladder: string) {
  if (ladder === "Academy Team") return "academy-team";
  return ladder.toLowerCase().replaceAll(" ", "-");
}

function getPlatformFromPath(pathname: string): PlatformKey {
  if (pathname.includes("/ladders/playstation/")) return "playstation";
  if (pathname.includes("/ladders/pc/")) return "pc";
  return "xbox";
}

export default function RainbowSixLaddersPage() {
  const pathname = usePathname();
  const platformKey = getPlatformFromPath(pathname);
  const platform = platformStyles[platformKey];

  return (
    <>
      <style>{`
        *{margin:0;padding:0;box-sizing:border-box;}
        body{background:#000;font-family:Tahoma,Verdana,Arial,sans-serif;color:#d7e2ee;}
        a{text-decoration:none;}

        .page{
          min-height:100vh;
          background:${platform.backgroundGlow};
          padding:26px;
        }

        .wrapper{
          width:1080px;
          margin:0 auto;
          background:#07111b;
          border:1px solid #2f6f9f;
          box-shadow:${platform.boxShadow};
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

        .platform-mark{
          min-width:150px;
          height:58px;
          display:flex;
          align-items:center;
          justify-content:center;
          color:#fff;
          font-size:22px;
          font-weight:bold;
          text-transform:uppercase;
          text-shadow:0 2px 4px #000;
          box-shadow:inset 0 0 18px rgba(0,0,0,.7);
        }

        .xbox-mark{
          border-radius:34px;
          background:radial-gradient(circle at 30% 25%,#baffba 0,#28c928 38%,#062f06 100%);
          border:2px solid #9aff9a;
          box-shadow:0 0 18px rgba(0,255,100,.35), inset 0 0 18px rgba(0,0,0,.7);
        }

        .playstation-mark{
          border-radius:12px;
          background:radial-gradient(circle at 30% 25%,#d9ecff 0,#2d7dff 38%,#061a55 100%);
          border:2px solid #9bc9ff;
          box-shadow:0 0 18px rgba(60,140,255,.42), inset 0 0 18px rgba(0,0,0,.7);
          letter-spacing:1px;
        }

        .pc-mark{
          border-radius:8px;
          background:radial-gradient(circle at 30% 25%,#e2d7ff 0,#7f4cff 42%,#180a45 100%);
          border:2px solid #c4aaff;
          box-shadow:0 0 18px rgba(140,90,255,.42), inset 0 0 18px rgba(0,0,0,.7);
          letter-spacing:2px;
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

        .nav a:hover{
          color:#f2c14e;
        }

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

        .info-note{
          margin-top:10px;
          color:#8cccff;
          font-size:12px;
          line-height:20px;
        }

        .content{
          padding:24px;
        }

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
          position:relative;
        }

        .game-image img{
          width:100%;
          height:100%;
          object-fit:cover;
          object-position:center center;
          display:block;
          transition:transform .18s ease, filter .18s ease;
        }

        .game-image:after{
          content:"";
          position:absolute;
          inset:0;
          background:
            linear-gradient(to bottom,rgba(0,0,0,.08),rgba(0,0,0,.46)),
            radial-gradient(circle at center,transparent 0%,rgba(0,0,0,.22) 100%);
          pointer-events:none;
        }

        .game-image:hover img{
          transform:scale(1.03);
          filter:brightness(1.12);
        }

        .card-body{
          padding:14px;
        }

        .ladder-list{
          border:1px solid #172d40;
        }

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

        .ladder-item:last-child{
          border-bottom:none;
        }

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

        @media(max-width:1100px){
          .wrapper{
            width:100%;
          }
        }

        @media(max-width:850px){
          .page{
            padding:12px;
          }

          .header{
            flex-direction:column;
            justify-content:center;
            gap:14px;
            padding:18px;
            text-align:center;
          }

          .nav{
            height:auto;
            flex-wrap:wrap;
            padding:10px;
            gap:14px;
          }

          .games-grid{
            grid-template-columns:1fr;
          }

          .ladder-item{
            grid-template-columns:1fr;
            gap:8px;
            padding:12px;
          }

          .ladder-link{
            display:block;
          }
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

            <div className={`platform-mark ${platform.markClass}`}>
              {platform.name}
            </div>
          </header>

          <nav className="nav">
            <a href="/home">Home</a>
            <a href="/members">Members</a>
            <a href="/forums">Forums</a>
            <a href="/teams/top">Top Teams</a>
            <a href="/players/top">Top Players</a>
          </nav>

          <section className="title-bar">
            <h1>{platform.title}</h1>
            <p>
              Choose a Rainbow Six Siege ladder below. Each ladder has its own
              teams, matches, standings, rankings, and match history.
            </p>

            <div className="info-note">
              Rainbow Six Siege is built around tactical team play, objective
              rounds, attacking, defending, operators, utility, and 5v5 strategy.
            </div>
          </section>

          <section className="content">
            <div className="games-grid">
              {siegeTitles.map((game) => (
                <div className="game-card" key={game.title}>
                  <div className="game-title">{game.title}</div>

                  <a
                    className="game-image"
                    href={`/ladders/${platformKey}/rainbow-six/${game.slug}`}
                  >
                    <img src={game.image} alt={game.title} />
                  </a>

                  <div className="card-body">
                    <div className="ladder-list">
                      {game.ladders.map((ladder) => {
                        const currentLadderSlug = ladderSlug(ladder);

                        const teamHubUrl = `/team-hub?platform=${platformKey}&category=rainbow-six&game=${game.slug}&ladder=${currentLadderSlug}`;

                        const rankingsUrl = `/ladders/${platformKey}/rainbow-six/${game.slug}/${currentLadderSlug}/rankings`;

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