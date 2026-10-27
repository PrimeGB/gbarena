"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ladderCategoryLabel,
  ladderPlatformLabel,
} from "../../../lib/ladderCatalog";
import { gamingCategories } from "../../../lib/gamingAccounts";

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
        <Link className="back-link" href="/home">
          Home
        </Link>
        <h1>{platformName} Ladders</h1>
        <div className="grid">
          {gamingCategories.map((category) => (
            <Link
              className="card"
              key={category.value}
              href={`/ladders/${platform}/${category.value}`}
            >
              {ladderCategoryLabel(category.value)}
            </Link>
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
        }
        .back-link {
          color: #8fb8d8;
          font-size: 13px;
          text-decoration: none;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 14px;
          margin-top: 18px;
        }
        .card {
          padding: 22px 16px;
          background: #0b2238;
          border: 1px solid #1e4568;
          border-radius: 8px;
          color: #f0c14b;
          font-size: 18px;
          font-weight: 700;
          text-decoration: none;
        }
      `}</style>
    </main>
  );
}
