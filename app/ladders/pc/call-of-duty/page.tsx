"use client";

import Link from "next/link";

const codTitles = [
  {
    title: "Call of Duty: Modern Warfare (2019)",
    slug: "modern-warfare-4",
    image:
      "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2000950/header.jpg?t=1778886798",
    ladders: ["Singles", "Duos", "Team"],
  },
  {
    title: "Call of Duty: Black Ops 6",
    slug: "black-ops-6",
    image:
      "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/2933620/header.jpg",
    ladders: ["Singles", "Duos", "Team"],
  },
  {
    title: "Call of Duty: Modern Warfare III (2023)",
    slug: "modern-warfare-iii",
    image:
      "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3595270/7d0f21912a075c33bbb5ea558100e187ceb234ac/header.jpg?t=1778886604",
    ladders: ["Singles", "Duos", "Team"],
  },
  {
    title: "Call of Duty: Modern Warfare II (2022)",
    slug: "modern-warfare-ii",
    image:
      "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3595230/ce4d5e53b36cb9d3c4309d1df72bf8663bbbc7ef/header.jpg",
    ladders: ["Singles", "Duos", "Team"],
  },
  {
    title: "Call of Duty: Modern Warfare 2 (2009)",
    slug: "mw2",
    image:
      "https://cdn.cloudflare.steamstatic.com/steam/apps/10180/header.jpg",
    ladders: ["Singles", "Duos", "Team"],
  },
  {
    title: "Call of Duty: Vanguard",
    slug: "vanguard",
    image:
      "https://cdn.cloudflare.steamstatic.com/steam/apps/1985820/header.jpg",
    ladders: ["Singles", "Duos", "Team"],
  },
  {
    title: "Call of Duty: Black Ops Cold War",
    slug: "black-ops-cold-war",
    image:
      "https://cdn.cloudflare.steamstatic.com/steam/apps/1985810/header.jpg",
    ladders: ["Singles", "Duos", "Team"],
  },
];

function ladderSlug(ladder: string) {
  return ladder.toLowerCase().replaceAll(" ", "-");
}

export default function PCCallOfDutyPage() {
  return (
    <>
      <style>{`
        *{margin:0;padding:0;box-sizing:border-box;}
        body{background:#000;font-family:Tahoma,Verdana,Arial,sans-serif;color:#d7e2ee;}
        a{text-decoration:none;}

        .page{
          min-height:100vh;
          background:radial-gradient(circle at top,rgba(210,225,255,.22),transparent 42%),#000;
          padding:26px;
        }

        .wrapper{
          width:1080px;
          margin:0 auto;
          background:#07111b;
          border:1px solid #d8e6ff;
          box-shadow:0 0 35px rgba(220,235,255,.36);
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
          border-bottom:2px solid #d8e6ff;
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

        .pc-mark{
          min-width:132px;
          height:58px;
          border-radius:34px;
          background:radial-gradient(circle at 30% 25%,#fff 0,#8f9eb1 42%,#1b2533 100%);
          border:2px solid #e7f0ff;
          display:flex;
          align-items:center;
          justify-content:center;
          color:#fff;
          font-size:24px;
          font-weight:bold;
          text-transform:uppercase;
          box-shadow:0 0 18px rgba(230,240,255,.4), inset 0 0 18px rgba(0,0,0,.7);
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

        @media(max-width:768px){
          .page{padding:10px;}
          main.page > .wrapper{
            width:100% !important;
            margin:0;
          }
          .top-strip{
            height:auto;
            min-height:28px;
            flex-wrap:wrap;
            justify-content:flex-start;
            gap:8px 14px;
            padding:8px 12px;
          }
          .header{
            min-height:0;
            flex-wrap:wrap;
            justify-content:flex-start;
            gap:14px;
            padding:14px;
          }
          .header > div:first-child{min-width:0;}
          .logo-main{
            font-size:clamp(24px,9vw,38px);
            line-height:1.1;
            overflow-wrap:anywhere;
          }
          .logo-sub{
            font-size:10px;
            letter-spacing:1px;
            line-height:1.4;
          }
          .nav{
            height:auto;
            flex-wrap:wrap;
            justify-content:flex-start;
            gap:10px 16px;
            padding:10px 12px;
          }
          .title-bar{padding:16px 12px;}
          .title-bar h1{font-size:clamp(22px,7vw,30px);}
          .title-bar p{font-size:13px;line-height:1.5;}
          .content{padding:12px;}
          .games-grid{grid-template-columns:minmax(0,1fr);gap:12px;}
          .game-card{min-width:0;}
          .game-title{
            height:auto;
            min-height:44px;
            padding:10px 12px;
            overflow-wrap:anywhere;
          }
          .game-image{
            height:auto;
            aspect-ratio:16 / 9;
          }
          .ladder-item{
            grid-template-columns:minmax(0,1fr);
            row-gap:6px;
            padding:10px;
          }
          .ladder-name{
            min-width:0;
            overflow-wrap:anywhere;
          }
          .ladder-link{
            font-size:10px;
            white-space:normal;
            overflow-wrap:anywhere;
          }
          .footer{
            min-height:34px;
            height:auto;
            padding:8px;
            text-align:center;
          }
        }
      `}</style>

      <main className="page">
        <div className="wrapper">
          <div className="top-strip">
            <Link href="/home">Home</Link>
            <Link href="/profile">My Profile</Link>
            <Link href="/forums">Forums</Link>
          </div>

          <header className="header">
            <div>
              <div className="logo-main">GameBattles</div>
              <div className="logo-sub">Where Gaming Finds Its Edge</div>
            </div>

            <div className="pc-mark">PC</div>
          </header>

          <nav className="nav">
            <Link href="/home">Home</Link>
            <Link href="/members">Members</Link>
            <Link href="/forums">Forums</Link>
            <Link href="/teams/top">Top Teams</Link>
            <Link href="/players/top">Top Players</Link>
          </nav>

          <section className="title-bar">
            <h1>PC Call of Duty Ladders</h1>
            <p>
              Choose a Call of Duty title below. Each title has its own teams,
              ladders, matches, and standings.
            </p>
          </section>

          <section className="content">
            <div className="games-grid">
              {codTitles.map((game) => (
                <div className="game-card" key={game.slug}>
                  <div className="game-title">{game.title}</div>

                  <Link
                    className="game-image"
                    href={`/ladders/pc/call-of-duty/${game.slug}`}
                  >
                    <img loading="lazy" decoding="async" src={game.image} alt={game.title} />
                  </Link>

                  <div className="card-body">
                    <div className="ladder-list">
                      {game.ladders.map((ladder) => {
                        const currentLadderSlug = ladderSlug(ladder);

                        return (
                          <div
                            className="ladder-item"
                            key={`${game.slug}-${currentLadderSlug}`}
                          >
                            <div className="ladder-name">{ladder} Ladder</div>

                            <Link
                              className="ladder-link"
                              href={`/team-hub?platform=pc&category=call-of-duty&game=${game.slug}&ladder=${currentLadderSlug}`}
                            >
                              View/Create Team
                            </Link>

                            <Link
                              className="ladder-link"
                              href={`/ladders/pc/call-of-duty/${game.slug}/${currentLadderSlug}/rankings`}
                            >
                              Current Ladder Rankings
                            </Link>
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