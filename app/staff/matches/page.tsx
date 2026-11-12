"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { supabase } from "../../../lib/supabase";
import { useUser } from "../../../lib/useUser";
import { UnscannedEvidenceLink } from "../../components/UnscannedEvidenceLink";
import "../staff-responsive.css";
import "./matches.css";

type DisputeSubmission = {
  team_id: string;
  team_name: string | null;
  dispute_reason: string;
  dispute_description: string;
  evidence_paths: string[];
  evidence_files?: { path: string; url: string | null }[];
};

type MatchReviewEntry = {
  ticket_id: string | number | null;
  match_id: string;
  game: string | null;
  platform: string | null;
  ladder: string | null;
  best_of: string | null;
  posting_team_name: string | null;
  accepting_team_name: string | null;
  dispute_reason: string;
  dispute_description: string;
  posting_team_score: number | null;
  accepting_team_score: number | null;
  posting_team_reported_score: string | null;
  accepting_team_reported_score: string | null;
  ticket_submissions: DisputeSubmission[];
};

type ReviewDecision = {
  id: string;
  ticket_id: string | null;
  match_id: string;
  posting_team_name: string | null;
  accepting_team_name: string | null;
  official_posting_score: number;
  official_accepting_score: number;
  decision_note: string;
  created_at: string;
};

type ReviewedDecision = {
  id: number;
  ticket_id: string | null;
  match_id: string;
  posting_team_name: string | null;
  accepting_team_name: string | null;
  official_posting_score: number;
  official_accepting_score: number;
  decision_note: string;
  review_note: string;
  reviewed_at: string;
  reviewer: string | null;
};

type DecisionDraft = { postingScore: string; acceptingScore: string; note: string };

const previewQueue: MatchReviewEntry[] = [
  {
    ticket_id: "1042", match_id: "preview-match-1", game: "Call of Duty: Black Ops 6", platform: "Xbox",
    ladder: "Team Ladder", best_of: "3", posting_team_name: "Nova Elite", accepting_team_name: "Ghost Ops",
    dispute_reason: "Conflicting scores", dispute_description: "The teams reported different results.",
    posting_team_score: 2, accepting_team_score: 1, posting_team_reported_score: "2 - 1", accepting_team_reported_score: "1 - 2",
    ticket_submissions: [
      { team_id: "nova", team_name: "Nova Elite", dispute_reason: "Incorrect score", dispute_description: "We won the final map. Our screenshot shows the final scoreboard.", evidence_paths: [], evidence_files: [] },
      { team_id: "ghost", team_name: "Ghost Ops", dispute_reason: "Score disagreement", dispute_description: "We believe the last map should count in our favor.", evidence_paths: [], evidence_files: [] },
    ],
  },
  {
    ticket_id: "1039", match_id: "preview-match-2", game: "Call of Duty: Black Ops 6", platform: "PlayStation",
    ladder: "Doubles Ladder", best_of: "3", posting_team_name: "Iron Wolves", accepting_team_name: "Vanguard",
    dispute_reason: "Match rules", dispute_description: "A team reported a rules issue.",
    posting_team_score: null, accepting_team_score: null, posting_team_reported_score: null, accepting_team_reported_score: null,
    ticket_submissions: [
      { team_id: "wolves", team_name: "Iron Wolves", dispute_reason: "Match rules", dispute_description: "We believe the other team used a restricted item.", evidence_paths: [], evidence_files: [] },
    ],
  },
];

const previewHistory: ReviewDecision[] = [{
  id: "preview-decision", ticket_id: "1028", match_id: "preview-match-3",
  posting_team_name: "Storm", accepting_team_name: "Blackout",
  official_posting_score: 2, official_accepting_score: 0,
  decision_note: "The evidence confirmed the reported score.", created_at: "2026-11-12T18:00:00Z",
}];

const previewReviews: ReviewedDecision[] = [{
  id: 1, ticket_id: "1028", match_id: "preview-match-3",
  posting_team_name: "Storm", accepting_team_name: "Blackout",
  official_posting_score: 2, official_accepting_score: 0,
  decision_note: "The evidence confirmed the reported score.",
  review_note: "The second team's evidence may have been overlooked. Please check the final map before deciding future cases.",
  reviewed_at: "2026-11-12T19:00:00Z", reviewer: "Senior Admin",
}];

const subscribePreview = () => () => {};
const getPreview = () => process.env.NODE_ENV === "development" && new URLSearchParams(window.location.search).get("preview") === "1";
const getServerPreview = () => false;

export default function StaffMatchReviewPage() {
  const { user, loading: authLoading } = useUser();
  const preview = useSyncExternalStore(subscribePreview, getPreview, getServerPreview);
  const [queue, setQueue] = useState<MatchReviewEntry[]>([]);
  const [history, setHistory] = useState<ReviewDecision[]>([]);
  const [reviews, setReviews] = useState<ReviewedDecision[]>([]);
  const [drafts, setDrafts] = useState<Record<string, DecisionDraft>>({});
  const [view, setView] = useState<"open" | "history" | "reviews">("open");
  const [selectedMatchId, setSelectedMatchId] = useState("");
  const [selectedDecisionId, setSelectedDecisionId] = useState("");
  const [selectedReviewId, setSelectedReviewId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadedUserId, setLoadedUserId] = useState("");
  const [error, setError] = useState("");
  const [evidenceWarning, setEvidenceWarning] = useState("");
  const [notice, setNotice] = useState("");
  const [savingMatchId, setSavingMatchId] = useState("");
  const [hasPermission, setHasPermission] = useState(false);
  const requestId = useRef(0);

  const loadQueue = useCallback(async (userId: string) => {
    const request = ++requestId.current;
    setLoading(true);
    setError("");
    setEvidenceWarning("");
    const { data: permission, error: permissionError } = await supabase.rpc("has_staff_permission", { permission_key: "match_review" });
    if (request !== requestId.current) return;
    if (permissionError || !permission) {
      setError(permissionError ? `Match-review access could not be checked: ${permissionError.message}` : "");
      setHasPermission(false);
      setQueue([]);
      setHistory([]);
      setReviews([]);
      setLoadedUserId(userId);
      setLoading(false);
      return;
    }

    const [{ data, error: queueError }, { data: decisionRows, error: historyError }, { data: reviewRows, error: reviewError }] = await Promise.all([
      supabase.rpc("staff_get_match_review_queue"),
      supabase.rpc("staff_my_match_decisions"),
      supabase.rpc("staff_my_match_decision_reviews"),
    ]);
    if (request !== requestId.current) return;
    if (queueError || historyError || reviewError) {
      setError(`Tickets could not be loaded: ${queueError?.message || historyError?.message || reviewError?.message}`);
      setHasPermission(false);
      setLoadedUserId(userId);
      setLoading(false);
      return;
    }

    const issues: string[] = [];
    const entries = await Promise.all(((data || []) as MatchReviewEntry[]).map(async (entry) => ({
      ...entry,
      ticket_submissions: await Promise.all((entry.ticket_submissions || []).map(async (submission) => {
        const paths = Array.isArray(submission.evidence_paths) ? submission.evidence_paths : [];
        if (!paths.length) return { ...submission, evidence_files: [] };
        const { data: files, error: fileError } = await supabase.storage.from("dispute-evidence").createSignedUrls(paths, 3600);
        if (fileError) issues.push(`Evidence for ${submission.team_name || "a team"} could not be loaded: ${fileError.message}`);
        return { ...submission, evidence_files: paths.map((path, index) => ({ path, url: files?.[index]?.signedUrl || null })) };
      })),
    })));
    if (request !== requestId.current) return;
    setQueue(entries);
    setHistory((decisionRows || []) as ReviewDecision[]);
    setReviews((reviewRows || []) as ReviewedDecision[]);
    setDrafts((current) => {
      const next = { ...current };
      for (const entry of entries) {
        next[entry.match_id] = next[entry.match_id] || {
          postingScore: entry.posting_team_score === null ? "" : String(entry.posting_team_score),
          acceptingScore: entry.accepting_team_score === null ? "" : String(entry.accepting_team_score),
          note: "",
        };
      }
      return next;
    });
    setEvidenceWarning(issues.join(" "));
    setHasPermission(true);
    setLoadedUserId(userId);
    setLoading(false);
  }, []);

  const userId = user?.id;
  useEffect(() => {
    if (preview || authLoading || !userId) return;
    void Promise.resolve().then(() => loadQueue(userId));
    return () => { requestId.current += 1; };
  }, [authLoading, loadQueue, preview, userId]);

  function updateDraft(matchId: string, key: keyof DecisionDraft, value: string) {
    const ticket = (preview ? previewQueue : queue).find((entry) => entry.match_id === matchId);
    setDrafts((current) => ({
      ...current,
      [matchId]: {
        ...(current[matchId] || {
          postingScore: ticket?.posting_team_score == null ? "" : String(ticket.posting_team_score),
          acceptingScore: ticket?.accepting_team_score == null ? "" : String(ticket.accepting_team_score),
          note: "",
        }),
        [key]: value,
      },
    }));
  }

  async function finalizeMatch(event: FormEvent<HTMLFormElement>, ticket: MatchReviewEntry) {
    event.preventDefault();
    if (preview) return;
    setError("");
    setNotice("");
    const draft = drafts[ticket.match_id];
    const postingScore = Number(draft?.postingScore);
    const acceptingScore = Number(draft?.acceptingScore);
    const note = draft?.note.trim() || "";
    if (!draft?.postingScore.trim() || !draft?.acceptingScore.trim() || !Number.isInteger(postingScore) || !Number.isInteger(acceptingScore) || postingScore < 0 || acceptingScore < 0) {
      setError("Enter non-negative whole-number scores for both teams.");
      return;
    }
    if (note.length < 10) {
      setError("Enter a decision reason of at least 10 characters.");
      return;
    }
    if (!window.confirm("Finalize this official score? The match will be completed, team and player records will update, and the decision will be recorded.")) return;
    setSavingMatchId(ticket.match_id);
    const { error: finalizeError } = await supabase.rpc("staff_finalize_disputed_match", {
      match_uuid: ticket.match_id, posting_score: postingScore, accepting_score: acceptingScore, decision_note: note,
    });
    setSavingMatchId("");
    if (finalizeError) {
      setError(`Match result could not be finalized: ${finalizeError.message}`);
      return;
    }
    setNotice("Official score finalized and recorded in My completed tickets.");
    if (userId) await loadQueue(userId);
  }

  const tickets = preview ? previewQueue : queue;
  const completed = preview ? previewHistory : history;
  const revised = preview ? previewReviews : reviews;
  const selected = tickets.find((ticket) => ticket.match_id === selectedMatchId) || tickets[0];
  const decision = completed.find((item) => item.id === selectedDecisionId) || completed[0];
  const review = revised.find((item) => item.id === selectedReviewId) || revised[0];
  const activeDraft = selected ? drafts[selected.match_id] || {
    postingScore: selected.posting_team_score === null ? "" : String(selected.posting_team_score),
    acceptingScore: selected.accepting_team_score === null ? "" : String(selected.accepting_team_score),
    note: "",
  } : null;
  const ready = preview || (!!user && !loading && loadedUserId === user.id && hasPermission);
  const series = selected?.best_of
    ? (/^best\s+of/i.test(selected.best_of) ? selected.best_of : `Best of ${selected.best_of}`)
    : "Series unavailable";

  return (
    <main className="staff-mobile-page ticket-page">
      <div className="ticket-shell">
        <nav className="ticket-nav"><Link href="/staff/dashboard">← Staff dashboard</Link><Link href="/home">Leave staff area</Link></nav>
        <header className="ticket-header">
          <div><p className="ticket-eyebrow">STAFF COMMAND CENTER</p><h1>Disputed match tickets</h1><p>Choose a ticket, review both teams, and record your decision.</p></div>
          {!preview && ready && <button className="ticket-refresh" onClick={() => userId && void loadQueue(userId)} type="button">Refresh tickets</button>}
        </header>
        {preview && <p className="ticket-preview" role="status"><strong>Example preview</strong> — sample tickets only. No decisions can be submitted.</p>}
        {!preview && (authLoading || (user && (loading || loadedUserId !== user.id))) ? <p className="ticket-message">Loading your tickets...</p>
          : !preview && !user ? <p className="ticket-message">Please <Link href="/login?next=%2Fstaff%2Fmatches">sign in</Link> to view the ticket queue.</p>
          : !preview && !hasPermission ? <p className="ticket-message" role={error ? "alert" : undefined}>{error || "Your account does not have match-review access."}</p>
          : (
            <>
              <div className="ticket-tabs" aria-label="Ticket sections">
                <button type="button" aria-pressed={view === "open"} onClick={() => setView("open")}>Open tickets <span>{tickets.length}</span></button>
                <button type="button" aria-pressed={view === "history"} onClick={() => setView("history")}>My completed tickets <span>{completed.length}</span></button>
                <button type="button" aria-pressed={view === "reviews"} onClick={() => setView("reviews")}>Revised tickets <span>{revised.length}</span></button>
              </div>
              {error && <p className="ticket-alert" role="alert">{error}</p>}
              {evidenceWarning && <p className="ticket-alert" role="alert">{evidenceWarning}</p>}
              {notice && <p className="ticket-notice" role="status">{notice}</p>}
              {view === "open" ? (
                <div className="ticket-workspace">
                  <section className="ticket-list" aria-label="Open tickets">
                    <div className="ticket-section-heading"><h2>Open tickets</h2><p>Select a ticket to review.</p></div>
                    {tickets.length === 0 ? <p className="ticket-empty">No open tickets are available.</p> : tickets.map((ticket) => (
                      <button key={ticket.match_id} type="button" className="ticket-list-item" aria-pressed={selected?.match_id === ticket.match_id} onClick={() => { setSelectedMatchId(ticket.match_id); setError(""); setNotice(""); }}>
                        <span className="ticket-list-top"><strong>Ticket #{ticket.ticket_id ?? "—"}</strong><span>OPEN</span></span>
                        <b>{ticket.posting_team_name || "Posting team"} <em>vs</em> {ticket.accepting_team_name || "Accepting team"}</b>
                        <small>{ticket.game || "Match dispute"} · {ticket.platform || "Platform unavailable"}</small>
                      </button>
                    ))}
                  </section>
                  {selected && activeDraft ? (
                    <article className="ticket-detail" aria-label="Selected ticket">
                      <div className="ticket-detail-heading"><div><p className="ticket-eyebrow">TICKET #{selected.ticket_id ?? "—"} · OPEN</p><h2>{selected.posting_team_name || "Posting team"} <span>vs</span> {selected.accepting_team_name || "Accepting team"}</h2><p>{selected.game || "Match dispute"} · {selected.platform || "Platform unavailable"} · {selected.ladder || "Ladder unavailable"} · {series}</p></div>{!preview && <Link href={`/matches/${encodeURIComponent(selected.match_id)}`}>Match details ↗</Link>}</div>
                      <section className="ticket-detail-section">
                        <h3>Reported scores</h3>
                        <div className="ticket-score-grid">
                          <div><span>{selected.posting_team_name || "Posting team"}</span><strong>{selected.posting_team_reported_score || "Not reported"}</strong></div>
                          <div><span>{selected.accepting_team_name || "Accepting team"}</span><strong>{selected.accepting_team_reported_score || "Not reported"}</strong></div>
                        </div>
                      </section>
                      <section className="ticket-detail-section">
                        <h3>Team statements &amp; evidence</h3>
                        <p className="ticket-help">Evidence has not been scanned. Check the source before opening files or links.</p>
                        {selected.ticket_submissions.length === 0 ? <div className="ticket-statement"><h4>{selected.dispute_reason || "Dispute"}</h4><p>{selected.dispute_description || "No team statements were submitted."}</p></div> : selected.ticket_submissions.map((submission) => (
                          <div className="ticket-statement" key={submission.team_id}>
                            <h4>{submission.team_name || "Team"} <span>{submission.dispute_reason || "Dispute"}</span></h4>
                            <p>{submission.dispute_description || "No statement supplied."}</p>
                            {preview ? <p className="ticket-help">Example evidence attachment</p> : (submission.evidence_files || []).length === 0 ? <p className="ticket-help">No evidence files submitted.</p> : <div className="ticket-evidence">{submission.evidence_files?.map((file, index) => file.url ? <UnscannedEvidenceLink key={file.path} href={file.url}>View evidence {index + 1}</UnscannedEvidenceLink> : <span key={file.path}>Evidence {index + 1} could not be opened.</span>)}</div>}
                          </div>
                        ))}
                      </section>
                      <form className="ticket-decision" onSubmit={(event) => finalizeMatch(event, selected)}>
                        <h3>Record your decision</h3><p className="ticket-help">Enter the official score and explain why. Your decision is recorded.</p>
                        <div className="ticket-form-grid">
                          <label>{selected.posting_team_name || "Posting team"} score<input type="number" min={0} step={1} required value={activeDraft.postingScore} onChange={(event) => updateDraft(selected.match_id, "postingScore", event.target.value)} /></label>
                          <label>{selected.accepting_team_name || "Accepting team"} score<input type="number" min={0} step={1} required value={activeDraft.acceptingScore} onChange={(event) => updateDraft(selected.match_id, "acceptingScore", event.target.value)} /></label>
                        </div>
                        <label>Reason for your decision<textarea required minLength={10} maxLength={1000} rows={3} value={activeDraft.note} onChange={(event) => updateDraft(selected.match_id, "note", event.target.value)} placeholder="Explain what you found and why you made this decision." /></label>
                        <button className="ticket-submit" type="submit" disabled={preview || !!savingMatchId}>{preview ? "Preview only" : savingMatchId === selected.match_id ? "Finalizing..." : "Finalize result"}</button>
                      </form>
                    </article>
                  ) : <div className="ticket-detail ticket-empty-detail"><strong>All caught up</strong><p>Select a ticket when one becomes available.</p></div>}
                </div>
              ) : view === "history" ? (
                <div className="ticket-workspace">
                  <section className="ticket-list" aria-label="My completed tickets">
                    <div className="ticket-section-heading"><h2>My completed tickets</h2><p>Decisions you finalized.</p></div>
                    {completed.length === 0 ? <p className="ticket-empty">You have not finalized any tickets yet.</p> : completed.map((item) => (
                      <button key={item.id} type="button" className="ticket-list-item" aria-pressed={decision?.id === item.id} onClick={() => setSelectedDecisionId(item.id)}>
                        <span className="ticket-list-top"><strong>Ticket #{item.ticket_id || "—"}</strong><span>COMPLETED</span></span>
                        <b>{item.posting_team_name || "Posting team"} <em>vs</em> {item.accepting_team_name || "Accepting team"}</b><small>{new Date(item.created_at).toLocaleString()}</small>
                      </button>
                    ))}
                  </section>
                  {decision ? <article className="ticket-detail"><div className="ticket-detail-heading"><div><p className="ticket-eyebrow">TICKET #{decision.ticket_id || "—"} · COMPLETED</p><h2>{decision.posting_team_name || "Posting team"} <span>vs</span> {decision.accepting_team_name || "Accepting team"}</h2><p>{new Date(decision.created_at).toLocaleString()}</p></div>{!preview && <Link href={`/matches/${encodeURIComponent(decision.match_id)}`}>Match details ↗</Link>}</div><section className="ticket-detail-section"><h3>Official score</h3><p className="ticket-final-score">{decision.official_posting_score} - {decision.official_accepting_score}</p><p className="ticket-help">{decision.posting_team_name || "Posting team"} - {decision.accepting_team_name || "Accepting team"}</p></section><section className="ticket-detail-section"><h3>Your reason</h3><p className="ticket-recorded-note">{decision.decision_note}</p></section></article> : <div className="ticket-detail ticket-empty-detail"><strong>No completed tickets yet</strong><p>Your finalized decisions will appear here.</p></div>}
                </div>
              ) : (
                <div className="ticket-workspace">
                  <section className="ticket-list" aria-label="Revised tickets">
                    <div className="ticket-section-heading"><h2>Revised tickets</h2><p>Higher-up feedback on your decisions.</p></div>
                    {revised.length === 0 ? <p className="ticket-empty">No higher-up reviews yet.</p> : revised.map((item) => (
                      <button key={item.id} type="button" className="ticket-list-item" aria-pressed={review?.id === item.id} onClick={() => setSelectedReviewId(item.id)}>
                        <span className="ticket-list-top"><strong>Ticket #{item.ticket_id || "—"}</strong><span>REVIEWED</span></span>
                        <b>{item.posting_team_name || "Posting team"} <em>vs</em> {item.accepting_team_name || "Accepting team"}</b><small>{new Date(item.reviewed_at).toLocaleString()}</small>
                      </button>
                    ))}
                  </section>
                  {review ? <article className="ticket-detail"><div className="ticket-detail-heading"><div><p className="ticket-eyebrow">TICKET #{review.ticket_id || "—"} · REVIEWED</p><h2>{review.posting_team_name || "Posting team"} <span>vs</span> {review.accepting_team_name || "Accepting team"}</h2><p>Reviewed by {review.reviewer || "staff"} · {new Date(review.reviewed_at).toLocaleString()}</p></div>{!preview && <Link href={`/matches/${encodeURIComponent(review.match_id)}`}>Match details ↗</Link>}</div><section className="ticket-detail-section"><h3>Higher-up comment</h3><p className="ticket-recorded-note">{review.review_note}</p></section><section className="ticket-detail-section"><h3>Your original decision</h3><p className="ticket-final-score">{review.official_posting_score} - {review.official_accepting_score}</p><p className="ticket-help">{review.posting_team_name || "Posting team"} - {review.accepting_team_name || "Accepting team"}. This review did not change the result.</p><p className="ticket-recorded-note">{review.decision_note}</p></section></article> : <div className="ticket-detail ticket-empty-detail"><strong>No revised tickets yet</strong><p>Higher-up feedback on your decisions will appear here.</p></div>}
                </div>
              )}
            </>
          )}
      </div>
    </main>
  );
}
