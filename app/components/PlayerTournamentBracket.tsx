"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useUser } from "../../lib/useUser";

type Tournament = { id: string; title: string; status: string; starts_at: string | null; min_players: number | null; target_score: number };
type Match = {
  id: string; round: number; slot: number; player_a: string | null; player_b: string | null;
  winner_id: string | null; status: string; reported_by: string | null; score_a: number | null; score_b: number | null;
};
type Dispute = { match_id: string; explanation: string; resolution: string | null };
type Profile = { id: string; username: string | null };

function roundName(round: number, total: number) {
  if (round === total) return "Final";
  if (round === total - 1) return "Semifinals";
  if (round === total - 2) return "Quarterfinals";
  return `Round ${round}`;
}

export default function PlayerTournamentBracket({ id, backHref }: { id: string; backHref: string }) {
  const { user } = useUser();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [disputes, setDisputes] = useState<Record<string, Dispute>>({});
  const [access, setAccess] = useState<{ userId: string; manage: boolean; review: boolean; entered: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [accessError, setAccessError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState("");
  const [scores, setScores] = useState<Record<string, { a: string; b: string }>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [resolutions, setResolutions] = useState<Record<string, string>>({});
  const loadSequence = useRef(0);

  const load = useCallback(async () => {
    const sequence = ++loadSequence.current;
    const [eventResult, matchResult] = await Promise.all([
      supabase.from("tournaments").select("id,title,status,starts_at,min_players,target_score").eq("id", id).maybeSingle(),
      supabase.from("tournament_player_matches").select("*").eq("tournament_id", id).order("round").order("slot"),
    ]);
    if (sequence !== loadSequence.current) return;
    if (eventResult.error || matchResult.error || !eventResult.data) {
      setLoadError(`Could not load the bracket: ${eventResult.error?.message || matchResult.error?.message || "Tournament not found."}`);
      setLoading(false);
      return;
    }
    const rows = (matchResult.data || []) as Match[];
    const ids = Array.from(new Set(rows.flatMap((m) => [m.player_a, m.player_b]).filter((value): value is string => !!value)));
    const profileResult = ids.length ? await supabase.from("profiles").select("id,username").in("id", ids) : { data: [], error: null };
    if (sequence !== loadSequence.current) return;
    if (profileResult.error) {
      setLoadError(`Could not load player names: ${profileResult.error.message}`);
      setLoading(false);
      return;
    }
    const disputedIds = rows.filter((m) => m.status === "disputed").map((m) => m.id);
    if (user && disputedIds.length) {
      const { data, error: disputeError } = await supabase.from("tournament_player_disputes")
        .select("match_id,explanation,resolution").in("match_id", disputedIds);
      if (sequence !== loadSequence.current) return;
      if (disputeError) {
        setLoadError(`Could not load disputes: ${disputeError.message}`);
        setLoading(false);
        return;
      }
      setDisputes(Object.fromEntries(((data || []) as Dispute[]).map((d) => [d.match_id, d])));
    } else {
      setDisputes({});
    }
    setTournament(eventResult.data as Tournament);
    setMatches(rows);
    setProfiles(Object.fromEntries(((profileResult.data || []) as Profile[]).map((p) => [p.id, p.username || "Player"])));
    setLoadError("");
    setLoading(false);
  }, [id, user]);

  useEffect(() => {
    queueMicrotask(() => { void load(); });
    const timer = window.setInterval(() => { if (!document.hidden) void load(); }, 15000);
    return () => { window.clearInterval(timer); loadSequence.current += 1; };
  }, [load]);

  useEffect(() => {
    let active = true;
    if (!user) return;
    Promise.all([
      supabase.rpc("has_staff_permission", { permission_key: "staff_access" }),
      supabase.rpc("has_staff_permission", { permission_key: "match_review" }),
      supabase.from("tournament_player_registrations").select("player_id").eq("tournament_id", id).eq("player_id", user.id).maybeSingle(),
    ]).then(([manage, review, registration]) => {
      if (!active) return;
      if (manage.error || review.error || registration.error) {
        setAccessError(`Could not check tournament access: ${manage.error?.message || review.error?.message || registration.error?.message}`);
        return;
      }
      setAccessError("");
      setAccess({ userId: user.id, manage: manage.data === true, review: manage.data === true || review.data === true, entered: !!registration.data });
    });
    return () => { active = false; };
  }, [id, user]);

  const canManage = !!user && access?.userId === user.id && access.manage && !access.entered;
  const canReview = !!user && access?.userId === user.id && access.review && !access.entered;

  async function run(key: string, fn: string, args: Record<string, unknown>, success: string) {
    if (busy) return;
    setBusy(key);
    setError("");
    setNotice("");
    const { error: rpcError } = await supabase.rpc(fn, args);
    if (rpcError) setError(rpcError.message);
    else setNotice(success);
    await load();
    if (rpcError) setError(rpcError.message);
    setBusy("");
  }

  const totalRounds = matches.reduce((max, match) => Math.max(max, match.round), 0);
  const name = (playerId: string | null, round: number) => playerId ? profiles[playerId] || "Player" : round === 1 ? "BYE" : "TBD";

  function playerRow(match: Match, playerId: string | null, score: number | null, side: "a" | "b") {
    const won = !!playerId && match.winner_id === playerId;
    const formerPlayer = !playerId && match.status !== "pending" && !(match.status === "bye" && side === "b");
    return <div className={`pb-player ${won ? "won" : ""}`}>
      {playerId ? <Link href={`/profile?userId=${encodeURIComponent(playerId)}`}>{name(playerId, match.round)}</Link> : <span className="pb-muted">{formerPlayer ? "Former player" : name(null, match.round)}</span>}
      <span>{score !== null ? score : ""} {won ? "✓" : ""}</span>
    </div>;
  }

  function matchControls(match: Match) {
    const participant = !!user && (user.id === match.player_a || user.id === match.player_b);
    if (match.status === "pending" && participant && match.player_a && match.player_b) {
      const score = scores[match.id] || { a: "", b: "" };
      return <div className="pb-controls">
        <p>Report final score (first to {tournament?.target_score}).</p>
        <div className="pb-score-inputs">
          <label>{name(match.player_a, match.round)}<input type="number" min={0} max={tournament?.target_score} value={score.a}
            onChange={(e) => setScores((current) => ({ ...current, [match.id]: { ...score, a: e.target.value } }))} /></label>
          <label>{name(match.player_b, match.round)}<input type="number" min={0} max={tournament?.target_score} value={score.b}
            onChange={(e) => setScores((current) => ({ ...current, [match.id]: { ...score, b: e.target.value } }))} /></label>
        </div>
        <button disabled={!!busy || score.a === "" || score.b === ""} onClick={() => run(match.id, "report_player_tournament_match",
          { p_match: match.id, p_score_a: Number(score.a), p_score_b: Number(score.b) }, "Score reported. Waiting for your opponent to confirm.")}>Report Score</button>
      </div>;
    }
    if (match.status === "reported") {
      return <div className="pb-controls">
        <p>{participant && user?.id !== match.reported_by ? "Confirm this score or explain your dispute." : "Waiting for opponent confirmation."}</p>
        {participant && user?.id !== match.reported_by && <>
          <button disabled={!!busy} onClick={() => run(match.id, "confirm_player_tournament_match", { p_match: match.id }, "Result confirmed.")}>Confirm Result</button>
          <label>Dispute explanation<textarea value={notes[match.id] || ""} maxLength={2000}
            onChange={(e) => setNotes((current) => ({ ...current, [match.id]: e.target.value }))} /></label>
          <button className="secondary" disabled={!!busy || (notes[match.id] || "").trim().length < 10}
            onClick={() => run(match.id, "dispute_player_tournament_match", { p_match: match.id, p_explanation: notes[match.id] }, "Dispute sent to tournament staff.")}>Send Dispute</button>
        </>}
      </div>;
    }
    if (match.status === "disputed") {
      const score = scores[match.id] || { a: String(match.score_a ?? ""), b: String(match.score_b ?? "") };
      return <div className="pb-controls">
        <p>Disputed · awaiting staff review</p>
        {disputes[match.id] && <p>Dispute: {disputes[match.id].explanation}</p>}
        {canReview && disputes[match.id] && <>
          <div className="pb-score-inputs">
            <label>{name(match.player_a, match.round)} official score<input type="number" min={0} max={tournament?.target_score} value={score.a}
              onChange={(e) => setScores((current) => ({ ...current, [match.id]: { ...score, a: e.target.value } }))} /></label>
            <label>{name(match.player_b, match.round)} official score<input type="number" min={0} max={tournament?.target_score} value={score.b}
              onChange={(e) => setScores((current) => ({ ...current, [match.id]: { ...score, b: e.target.value } }))} /></label>
          </div>
          <label>Staff decision<textarea value={resolutions[match.id] || ""} maxLength={2000}
            onChange={(e) => setResolutions((current) => ({ ...current, [match.id]: e.target.value }))} /></label>
          <button disabled={!!busy || !score.a || !score.b || (resolutions[match.id] || "").trim().length < 10}
            onClick={() => run(match.id, "resolve_player_tournament_dispute",
              { p_match: match.id, p_score_a: Number(score.a), p_score_b: Number(score.b), p_resolution: resolutions[match.id] }, "Dispute resolved.")}>Finalize Result</button>
        </>}
      </div>;
    }
    return null;
  }

  return <>
    <style>{`
      .pb-page{min-height:100vh;padding:28px 16px;background:radial-gradient(circle at top,#16334c80,transparent 42%),#05090d;color:#d9e6ef;font-family:Tahoma,Verdana,Arial,sans-serif}
      .pb-head,.pb-tools,.pb-message,.pb-preview,.pb-scroll{max-width:1200px;margin:0 auto 18px}.pb-head a{color:#f2c14e;font-size:12px;text-decoration:none}.pb-head h1{color:#fff;font-size:26px;margin:12px 0 6px}.pb-head p{font-size:13px;color:#a8bed0;line-height:1.6}
      .pb-tools{display:flex;gap:12px;align-items:center;flex-wrap:wrap}.pb-page button{border:1px solid #d6a53c;background:linear-gradient(#f2c14e,#b98722);color:#14100a;font:bold 11px Tahoma;padding:9px 12px;cursor:pointer}.pb-page button:disabled{opacity:.5;cursor:not-allowed}.pb-page button.secondary{background:#173449;color:#fff;border-color:#48708d}
      .pb-message{padding:10px 12px;background:#31201a;border:1px solid #a35441;color:#ffd2c9;font-size:12px}.pb-message.ok{background:#123128;border-color:#32825d;color:#b1f1cc}.pb-scroll{overflow-x:auto;padding-bottom:18px}.pb-grid{display:flex;gap:28px;min-width:max-content;align-items:stretch}.pb-round{display:flex;flex-direction:column;justify-content:space-around;gap:16px;width:255px}.pb-round h2{text-align:center;color:#e8c768;font-size:12px;text-transform:uppercase;letter-spacing:.08em}.pb-match{border:1px solid #35516b;background:linear-gradient(#11283b,#091722);border-radius:8px;overflow:hidden}.pb-player{display:flex;justify-content:space-between;gap:8px;padding:12px;font-size:13px}.pb-player+.pb-player{border-top:1px solid #273d50}.pb-player.won{background:#16412f;color:#a8edbd}.pb-player a{color:#fff;text-decoration:none;font-weight:bold}.pb-muted{color:#879aaa}.pb-controls{border-top:1px solid #354d60;padding:10px;display:grid;gap:8px;font-size:11px;line-height:1.5}.pb-controls p{margin:0}.pb-controls label{display:grid;gap:4px;color:#b8cddd}.pb-controls input,.pb-controls textarea{width:100%;padding:7px;background:#07131e;color:#fff;border:1px solid #476781;font:12px Tahoma}.pb-controls textarea{min-height:65px;resize:vertical}.pb-score-inputs{display:grid;grid-template-columns:1fr 1fr;gap:8px}.pb-preview{color:#b9cddd;font-size:13px;line-height:1.6}.pb-preview strong{color:#f2c14e}.pb-empty{padding:18px 0}.pb-example{display:flex;gap:24px;overflow-x:auto;padding:12px 0}.pb-example .pb-round{min-width:220px}.pb-example .pb-match{padding:12px;line-height:1.8}
      @media(max-width:600px){.pb-page{padding:20px 12px}.pb-head h1{font-size:21px}}
    `}</style>
    <main className="pb-page">
      <header className="pb-head">
        <Link href={backHref}>← All Tournaments</Link>
        <h1>{tournament?.title || (loading ? "Loading tournament..." : "Tournament unavailable")}</h1>
        {tournament && <p>Single elimination · First to {tournament.target_score} · {tournament.starts_at ? new Date(tournament.starts_at).toLocaleString() : "Date and time TBD"} · {tournament.status}</p>}
      </header>
      {canManage && tournament?.status === "upcoming" && <div className="pb-tools">
        <button disabled={!!busy} onClick={() => run("generate", "generate_player_tournament_bracket", { p_tournament_id: id }, "Random bracket generated.")}>Generate Random Bracket</button>
        <span>Requires the start time and at least {tournament.min_players || 2} registered players.</span>
      </div>}
      {error && <div className="pb-message" role="alert">{error}</div>}
      {loadError && <div className="pb-message" role="alert">{loadError}</div>}
      {accessError && <div className="pb-message" role="alert">{accessError}</div>}
      {notice && <div className="pb-message ok" role="status">{notice}</div>}
      {!loading && tournament && matches.length === 0 && <section className="pb-preview">
        <p className="pb-empty">The real bracket will appear once the tournament starts. Players will be placed randomly; byes advance automatically.</p>
        <strong>Example bracket · sample players, not actual entries</strong>
        <div className="pb-example">
          <div className="pb-round"><h2>Semifinals</h2><div className="pb-match">Player A ✓<br />Player B</div><div className="pb-match">Player C ✓<br />Player D</div></div>
          <div className="pb-round"><h2>Final</h2><div className="pb-match">Player A<br />Player C</div></div>
        </div>
      </section>}
      {matches.length > 0 && <div className="pb-scroll"><div className="pb-grid">
        {Array.from({ length: totalRounds }, (_, i) => i + 1).map((round) => <section className="pb-round" key={round}>
          <h2>{roundName(round, totalRounds)}</h2>
          {matches.filter((m) => m.round === round).map((match) => <div className="pb-match" id={`match-${match.id}`} key={match.id}>
            {playerRow(match, match.player_a, match.score_a, "a")}
            {playerRow(match, match.player_b, match.score_b, "b")}
            {matchControls(match)}
          </div>)}
        </section>)}
      </div></div>}
    </main>
  </>;
}
