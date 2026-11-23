"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { latestGlobalTeamChampions, type SeasonHonour } from "@/lib/seasonCompetition";
import "./awards-hall.css";

const destinations = [
  { title: "Season Top 10 Players", lines: ["SEASON", "TOP 10", "PLAYERS"], href: "/players/top?board=season&kind=players&scope=global", className: "players", symbol: "✦" },
  { title: "Season Top Teams", lines: ["SEASON", "TOP", "TEAMS"], href: "/players/top?board=season&kind=teams", className: "teams", symbol: "✦" },
  { title: "Player Challenges", lines: ["PLAYER", "CHALLENGES"], href: "/challenges", className: "challenges", symbol: "✦" },
  { title: "More Awards", lines: ["MORE", "AWARDS"], href: "/awards/catalog", className: "catalog", symbol: "✦" },
];

type ChampionState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "preview" }
  | { status: "ready"; seasonId: string; season: string; names: string[] };

export default function AwardsPage() {
  const [champion, setChampion] = useState<ChampionState>({ status: "loading" });

  useEffect(() => {
    let active = true;
    void supabase.rpc("gb_season_honours", { p_kind: "teams", p_scope: "global", p_limit: 200 })
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          setChampion({ status: "error" });
          return;
        }
        const latest = latestGlobalTeamChampions((data || []) as SeasonHonour[]);
        if (!latest) {
          setChampion({ status: "preview" });
          return;
        }
        setChampion({
          status: "ready",
          ...latest,
        });
      });
    return () => { active = false; };
  }, []);

  const heading = champion.status === "ready" ? `${champion.season} · Season Champion` : "Season Champion";
  const names = champion.status === "ready" ? champion.names.join(" · ")
    : champion.status === "loading" ? "Loading champions..."
      : champion.status === "error" ? "Champion information unavailable"
        : "Example Champions";
  const championHref = champion.status === "ready"
    ? `/champions?${new URLSearchParams({ kind: "teams", season: champion.seasonId })}`
    : "/champions?kind=teams";

  return (
    <main className="awards-hall">
      <header className="hall-heading">
        <p>GAMEBATTLES <span>✦</span> THE LEGACY COLLECTION</p>
        <h1>Awards <em>&amp;</em> Achievements</h1>
        <div>Every victory has a story. Make yours unforgettable.</div>
      </header>

      <section className="hall-room" aria-label="Awards and achievements hall">
        <div className="hall-scene">
          <div className="hall-light" aria-hidden="true" />
          <div className="hall-dust" aria-hidden="true">
            {Array.from({ length: 22 }, (_, index) => <i key={index} style={{
              left: `${24 + ((index * 37) % 52)}%`,
              top: `${8 + ((index * 29) % 58)}%`,
              animationDelay: `${(index % 7) * -0.75}s`,
              animationDuration: `${3 + (index % 4)}s`,
            }} />)}
          </div>
          <div className="hall-flames" aria-hidden="true">
            {["flame-one", "flame-two", "flame-three", "flame-four"].map((flame) =>
              <span className={`hall-flame ${flame}`} key={flame} />)}
          </div>
          <nav className="hall-flags" aria-label="Explore awards and achievements">
            {destinations.map((destination) => <Link key={destination.className}
              href={destination.href} className={`hall-flag hall-flag-${destination.className}`}
              aria-label={destination.title}>
              <span className="hall-flag-symbol" aria-hidden="true">{destination.symbol}</span>
              <span className="hall-flag-text">{destination.lines.map((line) => <span key={line}>{line}</span>)}</span>
            </Link>)}
          </nav>
          <Link className="hall-trophy-link" href={championHref} aria-label="View season team champions">
            <span>VIEW CHAMPIONS →</span>
          </Link>
          <Link className="hall-champion" href={championHref} aria-live="polite" aria-label={`${heading}: ${names}. View season champions`}>
            <span>{heading}</span>
            <strong title={names}>{names}</strong>
            {champion.status === "preview" && <small>PREVIEW · NO CHAMPION YET</small>}
            {champion.status === "error" && <small>PLEASE TRY AGAIN LATER</small>}
          </Link>
        </div>
      </section>

      <Link className="hall-mobile-champion" href={championHref}>
        <span>{heading}</span>
        <strong>{names}</strong>
        {champion.status === "preview" && <small>Preview · no champion yet</small>}
      </Link>
      <nav className="hall-mobile-nav" aria-label="Explore awards and achievements">
        {destinations.map((destination) => <Link href={destination.href} key={destination.className}>
          <span aria-hidden="true">{destination.symbol}</span><b>{destination.title}</b><span aria-hidden="true">→</span>
        </Link>)}
      </nav>

      <div className="hall-bottom">
        <div><span className="hall-bottom-mark">✦</span><p><strong>A LEGACY WORTH REMEMBERING</strong><br />Season honours are earned from finalized results.</p></div>
        <Link href="/champions">Explore the Hall of Fame <span aria-hidden="true">→</span></Link>
      </div>
      {champion.status === "error" && <p className="hall-error" role="alert">Season champion information could not be loaded. Please try again later.</p>}
    </main>
  );
}
