"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabase";
import SeasonAwardArt from "../components/SeasonAwardArt";
import {
  groupSeasonChampions, rareSeasonAchievements, seasonBoardHref, seasonPreviewHonours,
  type CompetitionKind, type CompetitionSeason, type SeasonHonour, type SeasonScope,
} from "../../lib/seasonCompetition";
import "../components/season-honours.css";
import "./hall-of-fame.css";

type Competitors = CompetitionKind | "all";
const competitorHref = (row: SeasonHonour) =>
  row.kind === "teams" ? `/teams/${row.entity_id}` : `/profile/${row.entity_id}`;

export default function ChampionsPage() {
  return <Suspense fallback={<p>Loading Hall of Fame...</p>}><HallOfFameRoute /></Suspense>;
}

function HallOfFameRoute() {
  const searchParams = useSearchParams();
  return <HallOfFame key={searchParams.toString()} />;
}

function HallOfFame() {
  const searchParams = useSearchParams();
  const requestedKind = searchParams.get("kind");
  const requestedSeason = searchParams.get("season") || "";
  const entity = searchParams.get("entity") || "";
  const [kind, setKind] = useState<Competitors>(requestedKind === "players" || requestedKind === "teams" ? requestedKind : "all");
  const [seasons, setSeasons] = useState<CompetitionSeason[]>([]);
  const [seasonId, setSeasonId] = useState("");
  const [scope, setScope] = useState("all");
  const [categories, setCategories] = useState<SeasonScope[]>([]);
  const [rows, setRows] = useState<SeasonHonour[]>([]);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function loadSeasons() {
      const current = await supabase.rpc("gb_current_season");
      if (!active) return;
      if (current.error) { setError(current.error.message); setLoading(false); return; }
      const [list, players, teams] = await Promise.all([
        supabase.from("seasons").select("id,number,name,starts_at,ends_at")
          .lte("ends_at", new Date().toISOString()).order("starts_at", { ascending: false }),
        supabase.rpc("gb_season_honours", { p_kind: "players", p_entity: entity || null, p_limit: 1 }),
        supabase.rpc("gb_season_honours", { p_kind: "teams", p_entity: entity || null, p_limit: 1 }),
      ]);
      if (!active) return;
      const failure = list.error || players.error || teams.error;
      if (failure) { setError(`Season history could not be loaded: ${failure.message}`); setLoading(false); return; }
      const available = (list.data || []) as CompetitionSeason[];
      const latest = [
        ...(requestedKind !== "teams" ? (players.data || []) as SeasonHonour[] : []),
        ...(requestedKind !== "players" ? (teams.data || []) as SeasonHonour[] : []),
      ];
      setSeasons(available);
      setSeasonId(available.find((season) => season.id === requestedSeason)?.id
        || available.find((season) => latest.some((honour) => honour.season_id === season.id))?.id
        || available[0]?.id || "");
      setReady(true);
    }
    void loadSeasons();
    return () => { active = false; };
  }, [entity, requestedKind, requestedSeason]);

  useEffect(() => {
    if (!ready) return;
    let active = true;
    void Promise.resolve().then(async () => {
      if (!active) return;
      setLoading(true); setError(""); setRows([]);
      if (!seasonId) { setCategories([]); setLoading(false); return; }
      const parameters = { p_season: seasonId, p_entity: entity || null, p_limit: 200, p_scope: scope === "all" ? null : scope };
      const [players, teams, scopes] = await Promise.all([
        supabase.rpc("gb_season_honours", { ...parameters, p_kind: "players" }),
        supabase.rpc("gb_season_honours", { ...parameters, p_kind: "teams" }),
        supabase.rpc("gb_season_scopes", { p_season: seasonId }),
      ]);
      if (!active) return;
      const failure = players.error || teams.error || scopes.error;
      if (failure) setError(`Hall of Fame could not be loaded: ${failure.message}`);
      else {
        setRows([...(players.data || []) as SeasonHonour[], ...(teams.data || []) as SeasonHonour[]]);
        setCategories((scopes.data || []) as SeasonScope[]);
      }
      setLoading(false);
    });
    return () => { active = false; };
  }, [ready, seasonId, scope, entity]);

  const selected = seasons.find((season) => season.id === seasonId);
  const visible = rows.filter((row) => kind === "all" || row.kind === kind);
  const preview = !loading && !error && !visible.length;
  const examples = [
    ...seasonPreviewHonours("Example Season", "players"),
    ...seasonPreviewHonours("Example Season", "teams"),
  ].filter((row) => kind === "all" || row.kind === kind);
  const displayed = preview ? examples : visible;
  const champions = groupSeasonChampions(displayed);
  const top10 = displayed.filter((row) => row.honour === "top10").sort((a, b) => a.place - b.place || a.kind.localeCompare(b.kind));
  const boardKind = kind === "teams" ? "teams" : "players";
  const boardScope = scope === "all" ? "global" : scope;
  return (
    <main className="hof-page"><div className="hof-shell">
      <header className="hof-header">
        <div><p className="hof-eyebrow">GAMEBATTLES / THE LEGACY COLLECTION</p>
          <h1>Hall of <span>Fame</span><span className="hof-title-star" aria-hidden="true">✦</span></h1>
          <p>Earn your place. Leave a legacy.</p>
        </div>
        <nav aria-label="Hall of Fame links"><Link href="/home">Dashboard</Link>
          <Link href={selected ? seasonBoardHref(selected.id, boardKind, boardScope) : "/players/top?board=season"}>Full standings <span aria-hidden="true">↗</span></Link>
          <Link href="/awards">All awards</Link></nav>
      </header>

      <div className="hof-toolbar">
        <label>SEASON<select aria-label="Finished season" value={seasonId} disabled={!seasons.length || loading}
          onChange={(event) => { setSeasonId(event.target.value); setScope("all"); }}>
          {!seasons.length && <option value="">No finished seasons</option>}
          {seasons.map((season) => <option key={season.id} value={season.id}>{season.name}</option>)}
        </select></label>
        <div className="hof-switch" role="group" aria-label="Competitors">
          {(["all", "players", "teams"] as const).map((value) => <button key={value} type="button" aria-pressed={kind === value}
            onClick={() => setKind(value)}>{value === "all" ? "Everyone" : value === "players" ? "Players" : "Teams"}</button>)}
        </div>
        <label className="hof-category-label">CATEGORY<select aria-label="Category" value={scope} disabled={loading}
          onChange={(event) => setScope(event.target.value)}>
          <option value="all">All titles</option>
          {categories.map((category) => <option key={category.scope} value={category.scope}>{category.label}</option>)}
        </select></label>
      </div>
      <div className="hof-content" aria-busy={loading}>
        {entity && <p className="hof-notice">One competitor&apos;s honours. <Link href="/champions">Show everyone</Link></p>}
        {error && <p className="hof-error" role="alert">{error}</p>}
        {loading ? <div className="hof-loading" role="status">Opening the trophy room...</div> : !error && <>
          {preview && <p className="hof-notice hof-preview"><strong>DESIGN PREVIEW</strong> No honours match this selection. Fictional competitors below show how recognition will look. No awards granted.</p>}
          <div className="hof-main-grid">
            <section className="hof-champions" aria-labelledby="hof-champions-heading">
              <div className="hof-section-heading"><h2 id="hof-champions-heading">The champions</h2><span>{preview ? "Example season" : selected?.name}</span></div>
              <div className="hof-podium" role="region" aria-label="Season champions" tabIndex={0}>
                {champions.map(({ honour, categories: titles }) => <article className={`hof-champion hof-champion-${honour.kind}`} key={`${honour.kind}:${honour.entity_id}`}>
                  <div className="hof-champion-title">{honour.kind === "teams" ? "TEAM" : "PLAYER"} CHAMPION</div>
                  <div className="hof-trophy-stage"><span className="hof-stage-orbit" /><SeasonAwardArt honour="champion" /></div>
                  <div className="hof-champion-info">
                    <h3>{preview ? honour.name : <Link href={competitorHref(honour)}>{honour.name}</Link>}</h3>
                    <p className="hof-record"><strong>{honour.wins}<span>W</span></strong><i />{honour.losses}<span>L</span><small>#{honour.place} eligible</small></p>
                    <div className="hof-title-list">{titles.map((title) => <span key={title.scope}>{title.scope === "global" ? "Global champion" : title.label}</span>)}</div>
                  </div>
                </article>)}
                {!champions.length && <p className="hof-panel-empty">No champion in this category. Other earned honours appear alongside.</p>}
              </div>
            </section>
            <section className="hof-contenders" aria-labelledby="hof-top10-heading">
              <div className="hof-section-heading"><h2 id="hof-top10-heading">The elite ten</h2><span>GLOBAL RECOGNITION</span></div>
              <div className="hof-elite-intro"><SeasonAwardArt honour="top10" place={10} /><div><strong>Not just a number.</strong><p>A place among the season&apos;s best.</p></div></div>
              <div className="hof-top10-list" role="region" aria-label="Season Top 10 honours" tabIndex={0}>
                {top10.map((honour) => <div className="hof-top10-row" key={honour.id}>
                  <span className="hof-place">{String(honour.place).padStart(2, "0")}</span>
                  <div>{preview ? <strong>{honour.name}</strong> : <Link href={competitorHref(honour)}>{honour.name}</Link>}
                    <small>{honour.kind === "teams" ? "Team" : "Player"}</small></div>
                  <span className="hof-top10-record">{honour.wins}W <span>{honour.losses}L</span></span>
                </div>)}
                {!top10.length && <p className="hof-panel-empty">{scope !== "all" && scope !== "global" ? "Top 10 honours belong to the global board. Category champions are shown alongside." : "No eligible Top 10 finishers for this selection."}</p>}
              </div>
              <p className="hof-top10-foot">Shared records, shared places. Every tied Top 10 finisher counts.</p>
            </section>
          </div>

          <section className="hof-collection" aria-labelledby="hof-rare-heading">
            <div className="hof-section-heading"><h2 id="hof-rare-heading">Beyond the ordinary</h2><span>RARE COLLECTION / EARNED, NEVER BOUGHT</span></div>
            <div className="hof-rare-grid">{rareSeasonAchievements.map((achievement) => {
              const earned = visible.filter((row) => row.honour === achievement.honour);
              return <article className={`hof-relic hof-relic-${achievement.honour}`} key={achievement.honour}>
                <SeasonAwardArt honour={achievement.honour} />
                <div className="hof-relic-info"><span className="hof-relic-class">{achievement.honour === "dynasty" ? "LEGENDARY" : achievement.honour === "undefeated" ? "FLAWLESS" : "FORGED IN COMPETITION"}</span>
                  <h3>{achievement.name}</h3>
                  <p>{achievement.honour === "undefeated" ? "10+ wins. Zero losses." : achievement.honour === "iron_competitor" ? "50 matches. At least one win." : "Three global season titles."}</p>
                  {earned.length ? <div className="hof-relic-recipients">{earned.map((honour) =>
                    <Link key={honour.id} href={competitorHref(honour)}>{honour.name}<span className="hof-recipient-kind"> · {honour.kind === "teams" ? "Team" : "Player"}</span></Link>)}</div>
                    : <small>Collection preview · not earned this selection</small>}
                </div>
              </article>;
            })}</div>
          </section>
        </>}
        <footer className="hof-footer">
          <p>MONTHLY SEASONS <span>·</span> 5 finalized matches + 1 win to qualify <span>·</span> Wins first, then fewest losses</p>
          <details><summary>How honours work</summary><p>UTC calendar months. Global Top 10 and global, game and game/ladder champions earn season-edition honours.
            Equal records share places. Rare achievements are awarded after a season ends.
            Official corrections reconcile archives and awards, normally within a minute. Overall records never reset.
            The trophy room opens on the most recent season with recognition; every finished season is available above.</p></details>
          <Link href="/tournaments">Tournaments <span aria-hidden="true">↗</span></Link>
        </footer>
        {rows.filter((row) => row.kind === "players").length === 200 || rows.filter((row) => row.kind === "teams").length === 200
          ? <p className="hof-notice">Up to 200 honours per competitor type. Choose a category or open a profile to narrow results.</p> : null}
      </div>
    </div></main>
  );
}
