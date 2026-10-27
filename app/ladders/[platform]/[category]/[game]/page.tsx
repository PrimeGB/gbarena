"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ladderCategoryLabel,
  ladderGameLabel,
  ladderPlatformLabel,
  laddersForGame,
} from "../../../../../lib/ladderCatalog";

export default function LadderGamePage() {
  const { platform, category, game } = useParams<{
    platform: string;
    category: string;
    game: string;
  }>();
  const platformName = ladderPlatformLabel(platform);
  const categoryName = ladderCategoryLabel(category);
  const gameName = ladderGameLabel(category, game);
  const ladders = laddersForGame(category, game);

  if (!platformName || !categoryName || !gameName) {
    return (
      <main className="page">
        <h1>Ladder not found</h1>
        <Link href={`/ladders/${platform}`}>Back to ladders</Link>
      </main>
    );
  }

  return (
    <main className="page">
      <section className="panel">
        <Link className="back-link" href={`/ladders/${platform}/${category}`}>
          {platformName} {categoryName}
        </Link>
        <p className="eyebrow">{platformName} Ladders</p>
        <h1>{gameName}</h1>
        <p className="intro">
          Choose a ladder to view standings or create a team. These ladders are
          available to every visitor; signing in does not change this list.
        </p>
        <div className="ladder-list">
          {ladders.map((ladder) => (
            <article className="ladder" key={ladder.slug}>
              <div>
                <h2>{ladder.title}</h2>
                <p>{gameName} {ladder.title} Ladder</p>
              </div>
              <div className="actions">
                <Link
                  href={`/team-hub?platform=${platform}&category=${category}&game=${game}&ladder=${ladder.slug}`}
                >
                  View/Create Team
                </Link>
                <Link
                  href={`                  /ladders/${platform}/${category}/${game}/${ladder.slug}/rankings`}
                >
                  Current Ladder Rankings
                </Link>
                                  <Link
                                    href={`/ladders/${platform}/${category}/${game}/${ladder.slug}/rules`}
                                  >
                                    Rules
                                  </Link>
              </div>
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
          max-width: 900px;
          margin: 0 auto;
          padding: 24px;
          border: 1px solid #2d6f9f;
          background: #071522;
          box-shadow: 0 0 34px #000c;
        }
        .back-link,
        .actions a {
          color: #9bd8ff;
          font-weight: 700;
          text-decoration: none;
        }
        .back-link:hover,
        .actions a:hover {
          color: #f2c14e;
          text-decoration: underline;
        }
        .eyebrow {
          margin-top: 26px;
          color: #9bd8ff;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
        }
        h1 {
          margin: 6px 0 10px;
          color: #f2c14e;
          font-size: 30px;
          text-transform: uppercase;
        }
        .intro {
          margin-bottom: 22px;
          color: #cfe2f2;
          line-height: 1.6;
        }
        .ladder-list {
          display: grid;
          gap: 12px;
        }
        .ladder {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          padding: 16px;
          border: 1px solid #244b70;
          background: #050c14;
        }
        h2 {
          margin: 0 0 5px;
          color: #fff;
          font-size: 18px;
        }
        .ladder p {
          margin: 0;
          color: #a9c3db;
          font-size: 12px;
        }
        .actions {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          justify-content: flex-end;
          font-size: 12px;
        }
        @media (max-width: 650px) {
          .ladder {
            align-items: flex-start;
            flex-direction: column;
          }
          .actions {
            justify-content: flex-start;
          }
        }
      `}</style>
    </main>
  );
}
