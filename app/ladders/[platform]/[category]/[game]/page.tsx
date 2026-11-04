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
        <div className="topline">
          <Link className="back-link" href={`/ladders/${platform}/${category}`}>
            ← {platformName} {categoryName}
          </Link>
          <span className="platform-pill">{platformName}</span>
        </div>
        <div className="context-links">
          <Link href={`/tournaments?platform=${platform}&category=${category}&game=${game}`}>
            {gameName} tournaments
          </Link>
        </div>
        <p className="eyebrow">{categoryName} · {platformName} Ladders</p>
        <h1>{gameName}</h1>
        <p className="intro">Choose the {gameName} ladder you want to compete in.</p>
        <div className="ladder-list">
          {ladders.map((ladder) => (
            <article className="ladder" key={ladder.slug}>
              <div className="ladder-info">
                <span className="ladder-kicker">{gameName} · {platformName}</span>
                <h2>{ladder.title}</h2>
                <p>{ladder.title} competition and standings</p>
              </div>
              <div className="actions">
                <Link
                  className="action-secondary"
                  href={`/team-hub?platform=${platform}&category=${category}&game=${game}&ladder=${ladder.slug}`}
                >
                  Find or create a team
                </Link>
                <Link
                  className="action-primary"
                  href={`/ladders/${platform}/${category}/${game}/${ladder.slug}/rankings`}
                >
                  View rankings
                </Link>
                <Link
                  className="action-rules"
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
          padding: 48px 20px;
          background:
            radial-gradient(ellipse at 50% 0%, rgba(35,104,161,.24), transparent 50%),
            #050a11;
          color: #eaf1f8;
          font-family: var(--font-geist-sans), Arial, sans-serif;
        }
        .panel {
          max-width: 960px;
          margin: 0 auto;
          padding: 34px;
          border: 1px solid rgba(130,168,205,.2);
          border-radius: 16px;
          background: rgba(9,17,28,.96);
          box-shadow: 0 24px 70px rgba(0,0,0,.4);
        }
        .topline {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }
        .context-links {
          margin-top: 20px;
        }
        .context-links a {
          display: inline-flex;
          padding: 8px 12px;
          border: 1px solid rgba(88,153,209,.28);
          border-radius: 7px;
          color: #b6d8f3;
          font-size: 12px;
          font-weight: 600;
          text-decoration: none;
        }
        .context-links a:hover {
          border-color: #438dca;
          color: #fff;
        }
        .back-link {
          color: #9eb9d2;
          font-size: 13px;
          text-decoration: none;
        }
        .back-link:hover { color: #fff; }
        .platform-pill {
          padding: 6px 10px;
          border: 1px solid rgba(88,153,209,.28);
          border-radius: 999px;
          background: rgba(42,108,161,.12);
          color: #a9d6f5;
          font-size: 11px;
          font-weight: 650;
        }
        .eyebrow {
          margin: 34px 0 8px;
          color: #82b8e4;
          font-size: 12px;
          font-weight: 650;
          letter-spacing: .1em;
          text-transform: uppercase;
        }
        h1 {
          margin: 0;
          color: #f3f6fa;
          font-size: clamp(28px,4vw,38px);
          letter-spacing: -.04em;
        }
        .intro {
          margin: 10px 0 26px;
          color: #aab9c9;
          font-size: 14px;
          line-height: 1.65;
        }
        .ladder-list {
          display: grid;
          grid-template-columns: repeat(auto-fit,minmax(265px,1fr));
          gap: 14px;
        }
        .ladder {
          display: flex;
          min-height: 218px;
          flex-direction: column;
          justify-content: space-between;
          gap: 24px;
          padding: 20px;
          border: 1px solid #273c51;
          border-radius: 12px;
          background: linear-gradient(145deg,#101e2d,#09111b);
          transition: border-color .15s ease, transform .15s ease;
        }
        .ladder:hover {
          transform: translateY(-2px);
          border-color: #3b76a6;
        }
        .ladder-kicker {
          color: #8299af;
          font-size: 10px;
          font-weight: 650;
          letter-spacing: .08em;
          text-transform: uppercase;
        }
        h2 {
          margin: 9px 0 5px;
          color: #f2f6fa;
          font-size: 21px;
          letter-spacing: -.02em;
        }
        .ladder p {
          margin: 0;
          color: #96a9bc;
          font-size: 12px;
        }
        .actions {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 10px;
          font-size: 12px;
        }
        .actions a {
          color: #acd0ec;
          font-weight: 600;
          text-decoration: none;
        }
        .actions a:hover { color: #fff; }
        .action-primary,
        .action-secondary {
          padding: 9px 11px;
          border: 1px solid #2d5272;
          border-radius: 7px;
        }
        .action-primary {
          border-color: #3376aa;
          background: #17517f;
          color: #fff !important;
        }
        .action-primary:hover { background: #20699e; }
        .action-rules { padding: 6px 2px; }
        @media (max-width: 600px) {
          .page { padding: 22px 12px; }
          .panel { padding: 22px 18px; }
        }
      `}</style>
    </main>
  );
}
