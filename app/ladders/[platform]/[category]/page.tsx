"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  gamesForCategory,
  ladderCategoryLabel,
  ladderGameImage,
  ladderPlatformLabel,
  laddersForGame,
} from "../../../../lib/ladderCatalog";

export default function LadderCategoryPage() {
  const { platform, category } = useParams<{ platform: string; category: string }>();
  const platformName = ladderPlatformLabel(platform);
  const categoryName = ladderCategoryLabel(category);

  if (!platformName || !categoryName) {
    return (
      <main className="page">
        <h1>Ladder not found</h1>
        <Link href="/home">Back to home</Link>
      </main>
    );
  }

  return (
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
          <div className="platform-mark">{platformName}</div>
        </header>
        <nav className="nav" aria-label="Main navigation">
          <Link href="/home">Home</Link>
          <Link href={`/ladders/${platform}`}>{platformName} Ladders</Link>
          <Link href="/members">Members</Link>
          <Link href="/forums">Forums</Link>
          <Link href="/teams/top">Top Teams</Link>
          <Link href="/players/top">Top Players</Link>
        </nav>
        <section className="title-bar">
          <Link className="back-link" href={`/ladders/${platform}`}>
            ← {platformName} Ladders
          </Link>
          <h1>{platformName} {categoryName} Ladders</h1>
          <p>Choose a game or mode below. Each one has its own teams, ladders, matches, and standings.</p>
        </section>
        <section className="content">
          <div className="games-grid">
            {gamesForCategory(category).map((game) => {
              const gameUrl = `/ladders/${platform}/${category}/${game.value}`;
              const image = ladderGameImage(category, game.value);

              return (
                <article className="game-card" key={game.value}>
                  <Link className="game-title" href={gameUrl}>{game.label}</Link>
                  {image && (
                    <Link className="game-image" href={gameUrl} aria-label={`Open ${game.label}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={image} alt={game.label} loading="lazy" decoding="async" />
                    </Link>
                  )}
                  <div className="card-body">
                    <div className="ladder-list">
                      {laddersForGame(category, game.value).map((ladder) => (
                        <div className="ladder-item" key={ladder.slug}>
                          <span className="ladder-name">{ladder.title} Ladder</span>
                          <Link
                            className="ladder-link"
                            href={`/team-hub?platform=${platform}&category=${category}&game=${game.value}&ladder=${ladder.slug}`}
                          >
                            View/Create Team
                          </Link>
                          <Link
                            className="ladder-link"
                            href={`/ladders/${platform}/${category}/${game.value}/${ladder.slug}/rankings`}
                          >
                            Rankings
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
        <footer className="footer">© 2026 Competitive Gaming Network</footer>
      </div>
      <style jsx>{`
        .page {
          min-height: 100vh;
          padding: 26px 18px;
          background: radial-gradient(circle at top, rgba(20, 80, 130, .36), transparent 42%), #000;
          color: #d7e2ee;
          font-family: Tahoma, Verdana, Arial, sans-serif;
        }
        .wrapper {
          width: min(1080px, 100%);
          margin: 0 auto;
          background: #07111b;
          border: 1px solid #2f6f9f;
          box-shadow: 0 0 35px rgba(0, 90, 160, .5);
        }
        .top-strip {
          min-height: 28px;
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 18px;
          padding: 0 14px;
          background: linear-gradient(to bottom, #9a0000, #3a0000);
          border-bottom: 1px solid #b10000;
        }
        .top-strip a,
        .nav a {
          color: #fff;
          font-size: 12px;
          font-weight: bold;
          text-transform: uppercase;
          text-decoration: none;
        }
        .header {
          min-height: 108px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          padding: 14px 24px;
          background: linear-gradient(to bottom, #15324b, #07111b);
          border-bottom: 2px solid #2f6f9f;
        }
        .logo-main {
          color: #f4f8ff;
          font-size: clamp(30px, 5vw, 46px);
          font-weight: bold;
          font-style: italic;
          line-height: 1;
          text-transform: uppercase;
          text-shadow: 0 2px 4px #000;
        }
        .logo-sub {
          margin-top: 7px;
          color: #67bdff;
          font-size: 11px;
          font-weight: bold;
          letter-spacing: 3px;
          text-transform: uppercase;
        }
        .platform-mark {
          display: grid;
          min-width: 112px;
          min-height: 48px;
          place-items: center;
          padding: 8px 14px;
          border: 2px solid #8cccff;
          border-radius: 30px;
          background: radial-gradient(circle at 30% 25%, #8cccff, #17466c 70%);
          color: #fff;
          font-size: 18px;
          font-weight: bold;
          text-align: center;
          text-shadow: 0 2px 4px #000;
        }
        .nav {
          min-height: 36px;
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          align-items: center;
          gap: 12px 28px;
          padding: 8px 18px;
          background: linear-gradient(to bottom, #10283d, #07111b);
          border-bottom: 1px solid #244b70;
        }
        .nav a {
          color: #d7eaff;
        }
        .nav a:hover,
        .top-strip a:hover {
          color: #f2c14e;
        }
        .title-bar {
          padding: 20px 24px;
          background: linear-gradient(to bottom, #205077, #0a1724);
          border-bottom: 1px solid #2f638f;
          text-align: center;
        }
        .back-link {
          color: #8cccff;
          font-size: 12px;
          font-weight: bold;
          text-decoration: none;
          text-transform: uppercase;
        }
        h1 {
          margin: 8px 0;
          color: #f2c14e;
          font-size: clamp(23px, 4vw, 30px);
          text-transform: uppercase;
          text-shadow: 0 1px 2px #000;
        }
        .title-bar p {
          margin: 0;
          color: #cfe2f2;
          font-size: 14px;
          line-height: 22px;
        }
        .content {
          padding: 24px;
        }
        .games-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
        }
        .game-card {
          min-width: 0;
          background: #050c14;
          border: 1px solid #244b70;
          box-shadow: inset 0 0 18px rgba(0, 0, 0, .75);
        }
        .game-title {
          display: block;
          padding: 14px;
          background: linear-gradient(to bottom, #15324b, #091521);
          border-bottom: 1px solid #244b70;
          color: #fff;
          font-size: 15px;
          font-weight: bold;
          text-decoration: none;
          text-transform: uppercase;
        }
        .game-title:hover {
          color: #f2c14e;
        }
        .game-image {
          display: block;
          height: 190px;
          overflow: hidden;
          background: #000;
          border-bottom: 1px solid #244b70;
        }
        .game-image img {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          transition: transform .18s ease, filter .18s ease;
        }
        .game-image:hover img {
          transform: scale(1.03);
          filter: brightness(1.12);
        }
        .card-body {
          padding: 14px;
        }
        .ladder-list {
          border: 1px solid #172d40;
        }
        .ladder-item {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto auto;
          align-items: center;
          gap: 10px 18px;
          min-height: 42px;
          padding: 8px 10px;
          border-bottom: 1px solid #172d40;
          font-size: 12px;
        }
        .ladder-item:last-child {
          border-bottom: 0;
        }
        .ladder-name {
          color: #d7e2ee;
          font-weight: bold;
          text-transform: uppercase;
        }
        .ladder-link {
          color: #8cccff;
          font-size: 11px;
          font-weight: bold;
          text-decoration: none;
          text-transform: uppercase;
          white-space: nowrap;
        }
        .ladder-link:hover {
          color: #f2c14e;
          text-decoration: underline;
        }
        .footer {
          min-height: 34px;
          display: flex;
          justify-content: center;
          align-items: center;
          background: #07111b;
          border-top: 1px solid #244b70;
          color: #a9c3db;
          font-size: 11px;
        }
        @media (max-width: 720px) {
          .page {
            padding: 12px 8px;
          }
          .header,
          .content {
            padding: 16px;
          }
          .games-grid {
            grid-template-columns: 1fr;
          }
          .game-image {
            height: clamp(150px, 42vw, 230px);
          }
        }
        @media (max-width: 430px) {
          .top-strip {
            gap: 12px;
            padding: 6px 10px;
          }
          .top-strip a,
          .nav a {
            font-size: 10px;
          }
          .platform-mark {
            min-width: 80px;
            font-size: 14px;
          }
          .ladder-item {
            grid-template-columns: 1fr 1fr;
          }
          .ladder-name {
            grid-column: 1 / -1;
          }
        }
      `}</style>
    </main>
  );
}
