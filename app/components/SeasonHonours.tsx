"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import {
  seasonHonourNames, type CompetitionKind, type SeasonHonour,
} from "../../lib/seasonCompetition";
import "./season-honours.css";

export function SeasonBadge({ honour, season, place }: { honour: string; season: string; place?: number }) {
  const rare = ["undefeated", "iron_competitor", "dynasty"].includes(honour);
  return (
    <div className={`season-badge${rare ? " season-badge-rare" : ""}`}>
      <span className="season-badge-edition">GAMEBATTLES / {season}</span>
      <svg viewBox="0 0 120 112" width="100" height="94" role="img" aria-label={`${seasonHonourNames[honour] || honour} badge`}>
        <path d="M60 5 102 23 98 72 60 105 22 72 18 23Z" fill="#102c45" stroke="currentColor" strokeWidth="3" />
        <path d="M60 15 91 29 88 67 60 92 32 67 29 29Z" fill="#081725" stroke="currentColor" opacity=".65" />
        <path d="m41 43 10 8 9-21 9 21 10-8-4 28H45Z" fill="currentColor" />
        <text x="60" y="85" textAnchor="middle" fill="currentColor" fontSize="12" fontWeight="bold">{honour === "top10" ? `TOP ${place || 10}` : rare ? "RARE" : "#1"}</text>
      </svg>
      <strong>{seasonHonourNames[honour] || honour}</strong>
      <span>{rare ? "Rare achievement" : "Exclusive season edition"}</span>
    </div>
  );
}

export function SeasonHonourCard({ honour, preview = false }: { honour: SeasonHonour; preview?: boolean }) {
  return (
    <article className="season-honour-card">
      <SeasonBadge honour={honour.honour} season={honour.season_name} place={honour.place} />
      {preview ? <h3>{honour.name}</h3> : <h3><Link href={honour.kind === "teams" ? `/teams/${honour.entity_id}` : `/profile/${honour.entity_id}`}>{honour.name}</Link></h3>}
      <p>{honour.scope_label}</p>
      <p>#{honour.place} eligible finish · {honour.wins}W / {honour.losses}L</p>
    </article>
  );
}

export default function SeasonHonours({ entityId, kind }: { entityId: string; kind: CompetitionKind }) {
  const [result, setResult] = useState<{ key: string; rows: SeasonHonour[]; error: string } | null>(null);
  const key = `${kind}:${entityId}`;
  useEffect(() => {
    if (!entityId) return;
    let active = true;
    void supabase.rpc("gb_season_honours", { p_kind: kind, p_entity: entityId, p_limit: 100 })
      .then(({ data, error }) => {
        if (active) setResult({ key, rows: (data || []) as SeasonHonour[], error: error?.message || "" });
      });
    return () => { active = false; };
  }, [entityId, kind, key]);
  return (
    <section className="entity-season-honours" aria-label="Season honours">
      <div className="season-section-heading"><h2>Season honours</h2><Link href={`/champions?kind=${kind}&entity=${entityId}`}>Hall of Fame</Link></div>
      {result?.key !== key ? <p>Loading season honours...</p>
        : result.error ? <p role="alert">Season honours could not be loaded: {result.error}</p>
        : result.rows.length ? <div className="season-honour-grid">{result.rows.map((row) => <SeasonHonourCard key={row.id} honour={row} />)}</div>
        : <p>No completed-season honours yet. Earn at least 5 finalized matches and 1 win to qualify for seasonal recognition.</p>}
    </section>
  );
}
