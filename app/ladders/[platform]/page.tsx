"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  categoriesForPlatform,
  categoryImage,
  ladderCategoryLabel,
  ladderPlatformLabel,
} from "../../../lib/ladderCatalog";

export default function LadderPlatformPage() {
  const { platform } = useParams<{ platform: string }>();
  const platformName = ladderPlatformLabel(platform);

  if (!platformName) {
    return (
      <main className="page">
        <h1>Platform not found</h1>
        <Link href="/home">Back to home</Link>
      </main>
    );
  }

  return (
    <main className="page">
      <section className="panel">
        <header className="header">
          <div>
            <div className="logo-main">GameBattles</div>
            <div className="logo-sub">Where Gaming Finds Its Edge</div>
          </div>
          <div className="platform-mark">{platformName}</div>
        </header>
        <nav className="nav" aria-label="Main navigation">
          <Link href="/members">Members</Link>
          <Link href="/forums">Forums</Link>
          <Link href="/teams/top">Top Teams</Link>
          <Link href="/players/top">Top Players</Link>
        </nav>
        <div className="title-bar">
          <h1>{platformName} Ladders</h1>
          <p>Choose a game to view its ladders, teams, matches, and rankings.</p>
        </div>
        <div className="grid">
          {categoriesForPlatform(platform).map((category) => (
            <Link
              className="card"
              key={category.value}
              href={`/ladders/${platform}/${category.value}`}
            >
              {categoryImage(category.value) && (
                <span className="category-image">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img loading="lazy" decoding="async" src={categoryImage(category.value)!} alt="" />
                </span>
              )}
              <span className="category-name">{ladderCategoryLabel(category.value)}</span>
              <span className="category-action">View Ladders →</span>
            </Link>
          ))}
        </div>
        <footer className="footer">© 2026 Competitive Gaming Network</footer>
      </section>
      <style jsx>{`
        .page {
          min-height: 100vh;
          padding: 26px 18px;
          background: radial-gradient(circle at top, rgba(20, 80, 130, .36), transparent 42%), #000;
          color: #d7e2ee;
          font-family: Tahoma, Verdana, Arial, sans-serif;
        }
        .panel {
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
          text-decoration: none;
          text-transform: uppercase;
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
          text-shadow: 0 2px 4px #000;
          text-transform: uppercase;
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
          padding: 22px 24px;
          background: linear-gradient(to bottom, #205077, #0a1724);
          border-bottom: 1px solid #2f638f;
          text-align: center;
        }
        h1 {
          margin: 0 0 8px;
          color: #f2c14e;
          font-size: clamp(24px, 4vw, 30px);
          text-transform: uppercase;
          text-shadow: 0 1px 2px #000;
        }
        .title-bar p {
          margin: 0;
          color: #cfe2f2;
          font-size: 14px;
          line-height: 22px;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 18px;
          padding: 24px;
        }
        .card {
          min-width: 0;
          overflow: hidden;
          background: #050c14;
          border: 1px solid #244b70;
          box-shadow: inset 0 0 18px rgba(0, 0, 0, .75);
          color: #f2c14e;
          text-decoration: none;
        }
        .category-image {
          display: block;
          height: 150px;
          overflow: hidden;
          background: #000;
          border-bottom: 1px solid #244b70;
        }
        .category-image img {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform .18s ease, filter .18s ease;
        }
        .card:hover .category-image img {
          transform: scale(1.03);
          filter: brightness(1.12);
        }
        .category-name,
        .category-action {
          display: block;
          padding: 12px 14px 0;
          font-size: 16px;
          font-weight: bold;
          text-transform: uppercase;
        }
        .category-action {
          padding-top: 8px;
          padding-bottom: 14px;
          color: #8cccff;
          font-size: 11px;
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
        @media (max-width: 800px) {
          .grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            padding: 16px;
          }
          .category-image {
            height: clamp(120px, 24vw, 180px);
          }
        }
        @media (max-width: 480px) {
          .page {
            padding: 12px 8px;
          }
          .grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }
          .category-image {
            height: 180px;
          }
          .header {
            padding: 14px 16px;
          }
          .platform-mark {
            min-width: 80px;
            font-size: 14px;
          }
          .top-strip a,
          .nav a {
            font-size: 10px;
          }
        }
      `}</style>
    </main>
  );
}
