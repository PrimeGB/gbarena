"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { SeasonBadge, SeasonHonourCard } from "../components/SeasonHonours";
import {
  rareSeasonAchievements, seasonBoardHref, seasonPreviewHonours,
  type CompetitionKind, type CompetitionSeason, type SeasonHonour, type SeasonScope,
} from "../../lib/seasonCompetition";
import "./hall-of-fame.css";

export default function ChampionsPage() {
  return <Suspense fallback={<p>Loading Hall of Fame...</p>}><HallOfFameRoute /></Suspense>;
}

function HallOfFameRoute() {
  const searchParams = useSearchParams();
  return <HallOfFame key={searchParams.toString()} />;
}

function HallOfFame() {
  const searchParams = useSearchParams();
  const [kind, setKind] = useState<CompetitionKind>(searchParams.get("kind") === "teams" ? "teams" : "players");
  const [seasons, setSeasons] = useState<CompetitionSeason[]>([]);
  const [seasonId, setSeasonId] = useState(searchParams.get("season") || "");
  const [rows, setRows] = useState<SeasonHonour[]>([]);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(false);
  const [scope, setScope] = useState("all");
  const [categories, setCategories] = useState<SeasonScope[]>([]);
  const entity = searchParams.get("entity") || "";

  useEffect(() => {
    let active = true;
    void supabase.rpc("gb_current_season").then(async ({ error: currentError }) => {
      if (!active) return;
      if (currentError) { setError(currentError.message); setLoading(false); return; }
      const { data, error: seasonError } = await supabase.from("seasons")
        .select("id,number,name,starts_at,ends_at").lte("ends_at", new Date().toISOString())
        .order("starts_at", { ascending: false });
      if (!active) return;
      if (seasonError) { setError(seasonError.message); setLoading(false); return; }
      const available = (data || []) as CompetitionSeason[];
      setSeasons(available);
      setSeasonId((selected) => available.some((season) => season.id === selected) ? selected : available[0]?.id || "");
      setReady(true);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!ready) return;
    let active = true;
    void Promise.resolve().then(async () => {
      if (!active) return;
      setLoading(true); setError(""); setRows([]);
      if (!seasonId) { setLoading(false); return; }
      const [honours, scopes] = await Promise.all([
        supabase.rpc("gb_season_honours", {
          p_season: seasonId, p_kind: kind, p_entity: entity || null, p_limit: 200,
          p_scope: scope === "all" ? null : scope,
        }),
        supabase.rpc("gb_season_scopes", { p_season: seasonId }),
      ]);
      if (!active) return;
      if (honours.error) setError(`Hall of Fame could not be loaded: ${honours.error.message}`);
      else if (scopes.error) setError(`Season categories could not be loaded: ${scopes.error.message}`);
      else {
        setRows((honours.data || []) as SeasonHonour[]);
        setCategories((scopes.data || []) as SeasonScope[]);
      }
      setLoading(false);
    });
    return () => { active = false; };
  }, [ready, seasonId, kind, entity, scope]);

  const selected = seasons.find((season) => season.id === seasonId);
  const displayed = preview ? seasonPreviewHonours("Example Season", kind) : rows;
  const filtered = displayed.filter((row) => scope === "all" || row.scope === scope);
  const scopes = preview
    ? [...new Map(displayed.map((row) => [row.scope, row.scope_label])).entries()]
    : categories.map((category) => [category.scope, category.label]);
  return (
    <main className="hof-page"><div className="hof-shell">
      <header className="hof-header">
        <p className="hof-eyebrow">GAMEBATTLES / LEGACY & RECOGNITION</p>
        <h1>Hall of Fame</h1>
        <p>Season champions. Top 10 contenders. Rare achievements that tell your competitive story.</p>
        <nav><Link href="/home">Dashboard</Link><Link href="/players/top?board=season">Season leaderboards</Link><Link href="/awards">Awards & achievements</Link><Link href="/tournaments">Tournaments</Link></nav>
      </header>
      <div className="hof-content">
        <div className="hof-rules">
          <strong>A new chapter every month</strong>
          <p>Seasons follow UTC calendar months. Awards require at least 5 finalized matches and 1 win within that board.
            Most wins, then fewest losses; equal records share a place. Global Top 10, global champions,
            game champions and game/ladder champions earn exclusive season-edition badges.</p>
          <p>Honours are confirmed after a season ends and reconcile when official results change.
            Corrected archives and badges update automatically, normally within a minute. Overall records do not reset.</p>
        </div>
        <div className="hof-controls">
          <label>Finished season<select aria-label="Finished season" value={seasonId} onChange={(event) => { setSeasonId(event.target.value); setScope("all"); setPreview(false); }} disabled={!seasons.length}>
            {!seasons.length && <option value="">No completed season available</option>}
            {seasons.map((season) => <option key={season.id} value={season.id}>{season.name}</option>)}
          </select></label>
          <label>Competitors<select value={kind} onChange={(event) => { setKind(event.target.value as CompetitionKind); setScope("all"); setPreview(false); }}>
            <option value="players">Players</option><option value="teams">Teams</option>
          </select></label>
          <label>Category<select value={scope} onChange={(event) => setScope(event.target.value)}>
            <option value="all">All recognition</option>
            {scopes.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select></label>
        </div>
        {entity && <p className="hof-note">Showing honours for one competitor. <Link href="/champions">View everyone</Link></p>}
        <div className="season-section-heading"><h2>{selected?.name || "Season recognition"}</h2>
          {selected && <Link href={seasonBoardHref(selected.id, kind)}>View full season standings</Link>}
        </div>
        {error && <p className="hof-error" role="alert">{error}</p>}
        {loading ? <p role="status">Loading season honours...</p> : !error && <>
          {!rows.length && !preview && <div className="hof-empty"><h3>No qualifying honours yet</h3>
            <p>{selected ? "No honours match this season and selection. We never invent champions or award places just for signing up." : "Finish a monthly season to establish the first champions."}</p>
            <button type="button" onClick={() => setPreview(true)}>Preview example season badges</button>
          </div>}
          {preview && <p className="hof-preview" role="status">EXAMPLE PREVIEW — fictional competitors and badges only. No awards are granted.
            <button type="button" onClick={() => setPreview(false)}>Hide preview</button></p>}
          {filtered.length > 0 && <div className="season-honour-grid">{filtered.map((row) => <SeasonHonourCard key={row.id} honour={row} preview={preview} />)}</div>}
          {rows.length === 200 && <p className="hof-note">Showing the first 200 matching honours. Choose a category or open a competitor&apos;s profile to narrow the results.</p>}
        </>}
        <section className="hof-rare"><h2>Rare achievements</h2><p>Earned from verified results, never purchased. These are seasonal honours, not separate match modes.</p>
          <div className="season-honour-grid">{rareSeasonAchievements.map((achievement) => <article className="season-honour-card" key={achievement.honour}>
            <SeasonBadge honour={achievement.honour} season="Season edition" /><p>{achievement.rule}</p>
          </article>)}</div>
        </section>
        <section className="hof-rules"><h2>Weekly competition</h2>
          <p>Free team Community Cups will appear in the tournament hub when announced, with event rules, dates and rewards.</p>
          <p><strong>Free singles tournaments — Coming soon.</strong> Game, platform and schedule TBD. Registration is not open.</p>
          <Link href="/tournaments">Visit tournament hub</Link>
        </section>
      </div>
    </div></main>
  );
}
