"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  globalBoard,
  gameBoard,
  platformBoard,
  ladderBoard,
  regionalBoard,
  playerBoard,
  rookieBoard,
  improvedBoard,
  streakBoard,
  activeBoard,
  historySeries,
  type LeaderboardResult,
} from "@/lib/leaderboards";
import {
  RANKING_DIMENSIONS,
  RANKING_DIMENSION_LABELS,
  type RankingDimension,
} from "@/lib/competitionConfig";

const FILTERED: RankingDimension[] = ["game", "platform", "ladder", "regional"];

export default function LeaderboardsPage() {
  const [dim, setDim] = useState<RankingDimension>("global");
  const [filter, setFilter] = useState("");
  const [result, setResult] = useState<LeaderboardResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    setResult(null);

    async function load() {
      try {
        let r: LeaderboardResult;
        switch (dim) {
          case "game": r = await gameBoard(filter || "Call of Duty"); break;
          case "platform": r = await platformBoard(filter || "pc"); break;
          case "ladder": {
            const [category = "", game = "", ladder = ""] = filter.split("|");
            r = await ladderBoard(category, game, ladder);
            break;
          }
          case "regional": r = await regionalBoard(filter || "Unspecified"); break;
          case "players": r = await playerBoard(); break;
          case "rookie": r = await rookieBoard(); break;
          case "improved": r = await improvedBoard(); break;
          case "streak": r = await streakBoard(); break;
          case "active": r = await activeBoard(); break;
          case "history": r = await historySeries(); break;
          default: r = await globalBoard();
        }
        if (!cancelled) setResult(r);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Could not load leaderboard.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [dim, filter]);

  const placeholder = useMemo(
    () => (dim === "game" ? "e.g. Call of Duty" : dim === "platform" ? "pc / xbox / playstation" : dim === "regional" ? "e.g. North America" : "category|game|ladder"),
    [dim],
  );

  return (
    <main className="lb-page">
      <div className="lb-shell">
        <Link href="/home" className="lb-back">← Back to Home</Link>
        <header className="lb-hero">
          <span className="lb-kicker">Standings</span>
          <h1>Rankings &amp; Leaderboards</h1>
          <p>Separate global, game, platform, ladder, and regional standings, plus player-based boards.</p>
        </header>

        <nav className="lb-tabs">
          {RANKING_DIMENSIONS.map((d) => (
            <button
              key={d}
              className={d === dim ? "lb-tab active" : "lb-tab"}
              onClick={() => { setDim(d); setFilter(""); }}
            >
              {RANKING_DIMENSION_LABELS[d]}
            </button>
          ))}
        </nav>

        {FILTERED.includes(dim) && (
          <div className="lb-filter">
            <label htmlFor="lb-filter-input">{dim === "ladder" ? "Ladder (category|game|ladder)" : `${RANKING_DIMENSION_LABELS[dim]} filter`}</label>
            <input
              id="lb-filter-input"
              value={filter}
              placeholder={placeholder}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
        )}

        {loading ? (
          <p className="lb-state">Loading standings…</p>
        ) : error ? (
          <p className="lb-state error">{error}</p>
        ) : dim === "history" && result?.series ? (
          <HistoryGraph series={result.series} note={result.note} />
        ) : result && result.rows.length ? (
          <>
            <div className="lb-table-wrap">
              <table className="lb-table">
                <thead>
                  <tr><th>#</th><th>Competitor</th><th>Rating / Score</th><th>Detail</th></tr>
                </thead>
                <tbody>
                  {result.rows.map((row, i) => (
                    <tr key={row.id + i}>
                      <td className="lb-rank">{i + 1}</td>
                      <td>{row.href ? <Link href={row.href}>{row.label}</Link> : row.label}</td>
                      <td className="lb-value">{row.value.toLocaleString()}</td>
                      <td className="lb-sub">{row.sub}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {result.note && <p className="lb-note">{result.note}</p>}
          </>
        ) : (
          <p className="lb-state">{result?.note || "No standings yet."}</p>
        )}
      </div>

      <style>{`
        .lb-page{min-height:100vh;padding:26px 16px 60px;background:radial-gradient(circle at 50% -10%,#16314a 0,#07111c 50%,#03070b 100%);color:#d7e2ee;font-family:Tahoma,Verdana,Arial,sans-serif}
        .lb-shell{max-width:1000px;margin:0 auto}
        .lb-back{color:#f2c14e;font-size:12px;text-decoration:none}
        .lb-hero{margin:14px 0 18px;padding:24px;border:1px solid #1d3e5a;border-radius:14px;background:linear-gradient(135deg,#0f2235,#081420)}
        .lb-kicker{color:#f2c14e;font-size:10px;font-weight:900;letter-spacing:.16em;text-transform:uppercase}
        .lb-hero h1{margin:6px 0 8px;color:#fff;font-size:30px}
        .lb-hero p{margin:0;color:#a8bdcd;font-size:13px;line-height:1.6}
        .lb-tabs{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px}
        .lb-tab{padding:8px 12px;border-radius:8px;border:1px solid #1d3e5a;background:#0b1825;color:#9fb9cf;font-size:12px;font-weight:700;cursor:pointer}
        .lb-tab.active{background:#f2c14e;color:#07111c;border-color:#f2c14e}
        .lb-filter{display:flex;flex-direction:column;gap:6px;margin-bottom:14px;max-width:360px}
        .lb-filter label{font-size:11px;color:#8fa9c0;text-transform:uppercase;letter-spacing:.08em}
        .lb-filter input{padding:9px 11px;border-radius:8px;border:1px solid #1d3e5a;background:#050c13;color:#d7e2ee;font-size:13px}
        .lb-state{padding:30px 20px;color:#cfe2f2;text-align:center}
        .lb-state.error{color:#ff8585}
        .lb-table-wrap{overflow-x:auto;border:1px solid #1d3e5a;border-radius:12px}
        .lb-table{width:100%;border-collapse:collapse;min-width:560px;font-size:13px}
        .lb-table th{padding:11px 12px;background:#7db6d8;color:#061622;text-transform:uppercase;text-align:left;font-size:11px}
        .lb-table td{padding:11px 12px;border-top:1px solid #16314a}
        .lb-table a{color:#9bd8ff;font-weight:700;text-decoration:none}
        .lb-rank{color:#f2c14e;font-weight:900;width:44px}
        .lb-value{font-weight:700;color:#7affc8}
        .lb-sub{color:#8fa9c0;font-size:11px}
        .lb-note{margin-top:14px;color:#7f9ab3;font-size:12px}
        .lb-graph{padding:18px;border:1px solid #1d3e5a;border-radius:12px;background:#050c13}
        .lb-graph svg{width:100%;height:auto}
        .lb-graph .axis{stroke:#1d3e5a}
        .lb-graph .line{fill:none;stroke:#7affc8;stroke-width:2}
        .lb-graph .dot{fill:#f2c14e}
      `}</style>
    </main>
  );
}

function HistoryGraph({ series, note }: { series: { label: string; value: number }[]; note?: string }) {
  const w = 640, h = 220, pad = 30;
  const values = series.map((p) => p.value);
  const max = Math.max(1, ...values);
  const min = Math.min(0, ...values);
  const span = max - min || 1;
  const step = series.length > 1 ? (w - pad * 2) / (series.length - 1) : 0;
  const x = (i: number) => pad + i * step;
  const y = (v: number) => h - pad - ((v - min) / span) * (h - pad * 2);
  const path = series.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");
  return (
    <div className="lb-graph">
      <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Ranking history">
        <line className="axis" x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} />
        <line className="axis" x1={pad} y1={pad} x2={pad} y2={h - pad} />
        {path && <path className="line" d={path} />}
        {series.map((p, i) => <circle key={i} className="dot" cx={x(i)} cy={y(p.value)} r={3}><title>{p.label}: {p.value}</title></circle>)}
      </svg>
      {note && <p className="lb-note">{note}</p>}
    </div>
  );
}