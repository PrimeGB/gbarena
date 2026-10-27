"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  gamesForCategory,
  ladderCategoryLabel,
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
      <section className="panel">
        <Link className="back-link" href={`/ladders/${platform}`}>
          {platformName} ladders
        </Link>
        <p className="eyebrow">{platformName} Ladders</p>
        <h1>{categoryName}</h1>
        <p className="intro">
          Pick a game or mode. Each one has its own teams, ladders, matches and
          rankings.
        </p>
        <div className="grid">
          {gamesForCategory(category).map((game) => (
            <article className="card" key={game.value}>
              <Link className="title" href={`/ladders/${platform}/${category}/${game.value}`}>
                {game.label}
              </Link>
              {laddersForGame(category, game.value).map((ladder) => (
                <div className="row" key={ladder.slug}>
                  <span>{ladder.title} Ladder</span>
                  <Link
                    href={`/team-hub?platform=${platform}&category=${category}&game=${game.value}&ladder=${ladder.slug}`}
                  >
                    View/Create Team
                  </Link>
                  <Link
                    href={`/ladders/${platform}/${category}/${game.value}/${ladder.slug}/rankings`}
                  >
                    Rankings
                  </Link>
                </div>
              ))}
            </article>
          ))}
        </div>
      </section>
      <style jsx>{`
        .page {
          min-height: 100vh;
          padding: 32px 18px;
          background: radial-gradient(circle at top, #173d5f, #02060a 65%);
          color: #eaf6ff;
          font-family: Tahoma, Verdana, Arial, sans-serif;
        }
        .panel {
          max-width: 1000px;
          margin: 0 auto;
        }
        .back-link,
        .eyebrow {
          color: #8fb8d8;
          font-size: 13px;
          text-decoration: none;
        }
        h1 {
          margin: 6px 0;
          font-size: 34px;
        }
        .intro {
          color: #b7cfe3;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 14px;
          margin-top: 18px;
        }
        .card {
          background: #0b2238;
          border: 1px solid #1e4568;
          border-radius: 8px;
          padding: 14px;
        }
        .title {
          display: block;
          margin-bottom: 10px;
          color: #f0c14b;
          font-size: 18px;
          font-weight: 700;
          text-decoration: none;
        }
        .row {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          align-items: center;
          padding: 8px 0;
          border-top: 1px solid #16385a;
          font-size: 13px;
        }
        .row span {
          flex: 1 1 100%;
          font-weight: 700;
        }
        .row :global(a) {
          color: #6cc4ff;
          text-decoration: none;
        }
      `}</style>
    </main>
  );
}
