"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { supabase } from "../../../lib/supabase";
import { useUser } from "../../../lib/useUser";
import "../staff-responsive.css";

type MatchReviewEntry = {
  ticket_id: string | number | null;
  match_id: string;
  game: string | null;
  platform: string | null;
  ladder: string | null;
  best_of: string | null;
  posting_team_id: string;
  accepting_team_id: string;
  posting_team_name: string | null;
  accepting_team_name: string | null;
  dispute_reason: string;
  dispute_description: string;
  ticket_status: string;
  posting_team_score: number | null;
  accepting_team_score: number | null;
  posting_team_reported_score: string | null;
  accepting_team_reported_score: string | null;
  ticket_submissions: DisputeSubmission[];
};

type DisputeSubmission = {
  team_id: string;
  team_name: string | null;
  dispute_reason: string;
  dispute_description: string;
  evidence_paths: string[];
  evidence_files?: { path: string; url: string | null }[];
};

type ReviewDecision = {
  id: string;
  match_id: string;
  official_posting_score: number;
  official_accepting_score: number;
  decision_note: string;
  created_at: string;
};

type DecisionDraft = {
  postingScore: string;
  acceptingScore: string;
  note: string;
};

export default function StaffMatchReviewPage() {
  const { user, loading: authLoading } = useUser();
  const [queue, setQueue] = useState<MatchReviewEntry[]>([]);
  const [history, setHistory] = useState<ReviewDecision[]>([]);
  const [decisions, setDecisions] = useState<Record<string, DecisionDraft>>({});
  const [loading, setLoading] = useState(true);
  const [loadedUserId, setLoadedUserId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [savingMatchId, setSavingMatchId] = useState("");
  const [hasPermission, setHasPermission] = useState(false);

  const loadQueue = useCallback(async (userId: string) => {
    const { data: permission, error: permissionError } = await supabase.rpc(
      "has_staff_permission",
      { permission_key: "match_review" }
    );

    if (permissionError) {
      setError(`Match-review access could not be checked: ${permissionError.message}`);
      setHasPermission(false);
      setLoadedUserId(userId);
      setLoading(false);
      return;
    }

    if (!permission) {
      setHasPermission(false);
      setQueue([]);
      setHistory([]);
      setError("");
      setLoadedUserId(userId);
      setLoading(false);
      return;
    }

    const [
      { data, error: queueError },
      { data: decisionRows, error: historyError },
    ] = await Promise.all([
      supabase.rpc("staff_get_match_review_queue"),
      supabase
        .from("staff_match_review_decisions")
        .select(
          "id,match_id,official_posting_score,official_accepting_score,decision_note,created_at"
        )
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    if (queueError || historyError) {
      setError(
        `Match-review data could not be loaded: ${
          queueError?.message || historyError?.message
        }`
      );
      setHasPermission(false);
      setLoadedUserId(userId);
      setLoading(false);
      return;
    }

    const evidenceIssues: string[] = [];
    const entries = await Promise.all(
      ((data || []) as MatchReviewEntry[]).map(async (entry) => {
        const submissions = await Promise.all(
          (entry.ticket_submissions || []).map(async (submission) => {
            const paths = Array.isArray(submission.evidence_paths)
              ? submission.evidence_paths
              : [];
            if (paths.length === 0) {
              evidenceIssues.push(
                `${submission.team_name || "A team"} submitted no evidence files.`
              );
              return { ...submission, evidence_files: [] };
            }

            const { data: signedFiles, error: evidenceError } = await supabase.storage
              .from("dispute-evidence")
              .createSignedUrls(paths, 60 * 60);

            if (evidenceError) {
              evidenceIssues.push(
                `Evidence for ${submission.team_name || "a team"} could not be loaded: ${evidenceError.message}`
              );
            }

            return {
              ...submission,
              evidence_files: paths.map((path, index) => ({
                path,
                url: signedFiles?.[index]?.signedUrl || null,
              })),
            };
          })
        );

        return { ...entry, ticket_submissions: submissions };
      })
    );
    setQueue(entries);
    setHistory((decisionRows || []) as ReviewDecision[]);
    setDecisions((current) => {
      const next = { ...current };
      for (const entry of entries) {
        next[entry.match_id] = next[entry.match_id] || {
          postingScore:
            entry.posting_team_score === null
              ? ""
              : String(entry.posting_team_score),
          acceptingScore:
            entry.accepting_team_score === null
              ? ""
              : String(entry.accepting_team_score),
          note: "",
        };
      }
      return next;
    });
    setHasPermission(true);
    setError(evidenceIssues.join(" "));
    setLoadedUserId(userId);
    setLoading(false);
  }, []);

  const userId = user?.id;
  useEffect(() => {
    if (authLoading || !userId) return;

    void Promise.resolve().then(() => loadQueue(userId));
  }, [authLoading, loadQueue, userId]);

  function updateDraft(
    matchId: string,
    key: keyof DecisionDraft,
    value: string
  ) {
    setDecisions((current) => ({
      ...current,
      [matchId]: {
        postingScore: current[matchId]?.postingScore || "",
        acceptingScore: current[matchId]?.acceptingScore || "",
        note: current[matchId]?.note || "",
        [key]: value,
      },
    }));
  }

  async function finalizeMatch(
    event: FormEvent<HTMLFormElement>,
    match: MatchReviewEntry
  ) {
    event.preventDefault();
    setError("");
    setNotice("");

    const draft = decisions[match.match_id];
    const postingScore = Number(draft?.postingScore);
    const acceptingScore = Number(draft?.acceptingScore);
    const note = draft?.note.trim() || "";

    if (
      !Number.isInteger(postingScore) ||
      !Number.isInteger(acceptingScore) ||
      postingScore < 0 ||
      acceptingScore < 0
    ) {
      setError("Enter non-negative whole-number scores for both teams.");
      return;
    }

    if (note.length < 10) {
      setError("Enter a decision reason of at least 10 characters.");
      return;
    }

    if (
      !window.confirm(
        "Finalize this official score? The match will be completed, team and player records will update, and the decision will be recorded."
      )
    ) {
      return;
    }

    setSavingMatchId(match.match_id);
    const { error: finalizeError } = await supabase.rpc(
      "staff_finalize_disputed_match",
      {
        match_uuid: match.match_id,
        posting_score: postingScore,
        accepting_score: acceptingScore,
        decision_note: note,
      }
    );
    setSavingMatchId("");

    if (finalizeError) {
      setError(`Match result could not be finalized: ${finalizeError.message}`);
      return;
    }

    setNotice("Official score finalized and recorded.");
    if (user) {
      setLoading(true);
      await loadQueue(user.id);
    }
  }

  return (
    <main className="staff-mobile-page staff-match-review-page" style={styles.page}>
      <section className="staff-mobile-shell" style={styles.shell}>
        <nav className="staff-mobile-nav" style={styles.nav}>
          <Link href="/staff/dashboard">Staff Dashboard</Link>
          <Link href="/home">Home</Link>
        </nav>
        <header className="staff-mobile-header" style={styles.header}>
          <p style={styles.eyebrow}>STAFF WORK AREA</p>
          <h1 style={styles.title}>Disputed Match Tickets</h1>
          <p style={styles.subtitle}>
            Review disputed matches, enter the official series score, and provide
            a written reason. Finalization updates standings once and records the
            decision for staff review.
          </p>
        </header>

        {authLoading || (user && (loading || loadedUserId !== user.id)) ? (
          <p style={styles.message}>Checking your match-review access...</p>
        ) : !user ? (
          <div style={styles.message}>
            <p>Sign in with your GameBattles account to continue.</p>
            <Link href="/login?next=%2Fstaff%2Fmatches" style={styles.button}>
              Staff Login
            </Link>
          </div>
        ) : error ? (
          <p style={styles.error} role="alert">{error}</p>
        ) : !hasPermission ? (
          <p style={styles.message}>
            Your account has not been granted match-review access.
          </p>
        ) : queue.length === 0 ? (
          <>
            {notice && <p style={styles.notice} role="status">{notice}</p>}
            <p style={styles.message}>
              No open disputed matches are available. A case involving your own
              team or match roster is excluded from your queue.
            </p>
          </>
        ) : (
          <>
            {error && <p style={styles.error} role="alert">{error}</p>}
            {notice && <p style={styles.notice} role="status">{notice}</p>}
            <section className="staff-mobile-section staff-mobile-list" style={styles.queue} aria-label="Open disputed matches">
              {queue.map((ticket) => (
              <article key={ticket.match_id} className="staff-mobile-card" style={styles.card}>
                <div className="staff-mobile-card-header" style={styles.cardHeader}>
                  <h2 style={styles.cardTitle}>
                    {ticket.game || "Match dispute"} · {ticket.platform || "Unknown platform"}
                  </h2>
                  <span style={styles.status}>{ticket.ticket_status}</span>
                </div>
                <dl className="staff-mobile-details" style={styles.details}>
                  <div>
                    <dt>Ticket</dt>
                    <dd>{ticket.ticket_id ?? "Match dispute"}</dd>
                  </div>
                  <div>
                    <dt>Ladder</dt>
                    <dd>{ticket.ladder || "Not specified"}</dd>
                  </div>
                  <div>
                    <dt>Series</dt>
                    <dd>{ticket.best_of || "Best of 3"}</dd>
                  </div>
                  <div>
                    <dt>Posting team report</dt>
                    <dd>{ticket.posting_team_reported_score || "Pending"}</dd>
                  </div>
                  <div>
                    <dt>Accepting team report</dt>
                    <dd>{ticket.accepting_team_reported_score || "Pending"}</dd>
                  </div>
                </dl>
                <p style={styles.teamNames}>
                  {ticket.posting_team_name || "Posting team"} vs{" "}
                  {ticket.accepting_team_name || "Accepting team"}
                </p>
                <h3 style={styles.reasonTitle}>
                  {ticket.dispute_reason || "Dispute reason not supplied"}
                </h3>
                <p style={styles.description}>{ticket.dispute_description}</p>
                <section aria-label="Team dispute submissions">
                  <h3 style={styles.reasonTitle}>Both team statements and proof</h3>
                  {(ticket.ticket_submissions || []).map((submission) => (
                    <div key={submission.team_id} style={styles.submission}>
                      <h4 style={styles.submissionTitle}>
                        {submission.team_name || "Team"}:{" "}
                        {submission.dispute_reason || "Dispute reason not supplied"}
                      </h4>
                      <p style={styles.description}>
                        {submission.dispute_description || "No statement supplied."}
                      </p>
                      <div style={styles.evidenceList}>
                        {(submission.evidence_files || []).map((file, index) =>
                          file.url ? (
                            <a
                              key={file.path}
                              href={file.url}
                              target="_blank"
                              rel="noreferrer"
                              style={styles.matchLink}
                            >
                              View {submission.team_name || "team"} evidence {index + 1}
                            </a>
                          ) : (
                            <span key={file.path} style={styles.evidenceUnavailable}>
                              Evidence {index + 1} could not be opened
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  ))}
                </section>
                <Link
                  href={`/matches/${encodeURIComponent(ticket.match_id)}`}
                  style={styles.matchLink}
                >
                  Open match details
                </Link>
                <form
                  onSubmit={(event) => finalizeMatch(event, ticket)}
                  className="staff-mobile-form"
                  style={styles.decisionForm}
                >
                  <h3 style={styles.reasonTitle}>Official result</h3>
                  <div className="staff-mobile-grid" style={styles.scoreInputs}>
                    <label style={styles.label}>
                      {ticket.posting_team_name || "Posting team"} official score
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={decisions[ticket.match_id]?.postingScore || ""}
                        onChange={(event) =>
                          updateDraft(ticket.match_id, "postingScore", event.target.value)
                        }
                        style={styles.input}
                        required
                      />
                    </label>
                    <label style={styles.label}>
                      {ticket.accepting_team_name || "Accepting team"} official score
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={decisions[ticket.match_id]?.acceptingScore || ""}
                        onChange={(event) =>
                          updateDraft(ticket.match_id, "acceptingScore", event.target.value)
                        }
                        style={styles.input}
                        required
                      />
                    </label>
                  </div>
                  <label style={styles.label}>
                    Decision reason (required and saved to the review log)
                    <textarea
                      maxLength={1000}
                      minLength={10}
                      value={decisions[ticket.match_id]?.note || ""}
                      onChange={(event) =>
                        updateDraft(ticket.match_id, "note", event.target.value)
                      }
                      style={styles.input}
                      rows={3}
                      required
                    />
                  </label>
                  <button
                    className="staff-mobile-action"
                    type="submit"
                    disabled={savingMatchId === ticket.match_id}
                    style={styles.button}
                  >
                    {savingMatchId === ticket.match_id
                      ? "Finalizing..."
                      : "Finalize official result"}
                  </button>
                </form>
              </article>
              ))}
            </section>
          </>
        )}

        {user && hasPermission && !loading && (
          <section className="staff-mobile-section" style={styles.history} aria-label="Recent staff match decisions">
            <h2 style={styles.historyTitle}>Recent final decisions</h2>
            {history.length === 0 ? (
              <p style={styles.description}>No staff decisions have been recorded.</p>
            ) : (
              <div className="staff-mobile-list" style={styles.historyList}>
                {history.map((decision) => (
                  <article key={decision.id} style={styles.historyCard}>
                    <div className="staff-mobile-history-header" style={styles.historyHeader}>
                      <Link href={`/matches/${encodeURIComponent(decision.match_id)}`}>
                        Match {decision.match_id.slice(0, 8)}
                      </Link>
                      <time dateTime={decision.created_at}>
                        {new Date(decision.created_at).toLocaleString()}
                      </time>
                    </div>
                    <p style={styles.description}>
                      Official score: {decision.official_posting_score} -{" "}
                      {decision.official_accepting_score}
                    </p>
                    <p style={styles.description}>{decision.decision_note}</p>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    padding: "16px 18px",
    background: "radial-gradient(circle at top, #102a40, #02060a 55%)",
    color: "#d7e2ee",
    fontFamily: "Tahoma, Verdana, Arial, sans-serif",
  },
  shell: {
    maxWidth: 1050,
    margin: "0 auto",
    border: "1px solid #315f88",
    background: "#07111b",
    boxShadow: "0 0 28px rgba(0,80,140,.25)",
  },
  nav: {
    display: "flex",
    justifyContent: "space-between",
    padding: "12px 18px",
    borderBottom: "1px solid #244b70",
    background: "#0b1823",
  },
  header: {
    padding: "26px 22px",
    borderBottom: "1px solid #244b70",
    background: "linear-gradient(to bottom, #173956, #07111b)",
  },
  eyebrow: { margin: 0, color: "#f2c14e", fontSize: 11, fontWeight: 900, letterSpacing: 1 },
  title: { margin: "8px 0", color: "#fff", fontSize: 26 },
  subtitle: { margin: 0, color: "#b8cede", lineHeight: 1.6 },
  message: { padding: 22, color: "#cfe2f2", lineHeight: 1.6 },
  error: { margin: 18, padding: 12, border: "1px solid #8f2e2e", color: "#ffb0b0" },
  notice: { margin: 18, padding: 12, border: "1px solid #286b47", color: "#98efbd" },
  queue: { display: "grid", gap: 14, padding: 20 },
  card: { padding: 16, border: "1px solid #244b70", background: "#091521" },
  cardHeader: { display: "flex", justifyContent: "space-between", gap: 12 },
  cardTitle: { margin: 0, color: "#fff", fontSize: 16 },
  status: {
    alignSelf: "start",
    padding: "4px 8px",
    border: "1px solid #b99028",
    color: "#f2c14e",
    fontSize: 11,
    textTransform: "uppercase",
  },
  details: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(175px,1fr))",
    gap: 10,
    margin: "16px 0",
  },
  reasonTitle: { margin: "14px 0 6px", color: "#f2c14e", fontSize: 14 },
  teamNames: { margin: "0 0 10px", color: "#fff", fontWeight: 700 },
  description: { margin: 0, color: "#c1d0dc", lineHeight: 1.55, whiteSpace: "pre-wrap" },
  submission: { marginTop: 12, padding: 12, border: "1px solid #315f88", background: "#07111b" },
  submissionTitle: { margin: "0 0 8px", color: "#f2c14e", fontSize: 13 },
  evidenceList: { display: "flex", flexWrap: "wrap", gap: 12, marginTop: 10 },
  evidenceUnavailable: { color: "#ffb0b0", fontSize: 12 },
  decisionForm: { display: "grid", gap: 12, marginTop: 18, paddingTop: 16, borderTop: "1px solid #244b70" },
  scoreInputs: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 },
  label: { display: "grid", gap: 6, color: "#cfe2f2", fontSize: 13 },
  input: { width: "100%", padding: 10, border: "1px solid #315f88", background: "#02080e", color: "#fff", font: "inherit" },
  matchLink: { display: "inline-block", marginTop: 14, color: "#f2c14e", fontWeight: 700 },
  button: {
    display: "inline-flex",
    justifyContent: "center",
    justifySelf: "start",
    padding: "11px 16px",
    border: "1px solid #e34242",
    background: "linear-gradient(#bd1717, #5c0000)",
    color: "#fff",
    fontWeight: 800,
    textDecoration: "none",
  },
  history: { padding: 20, borderTop: "1px solid #244b70" },
  historyTitle: { margin: "0 0 14px", color: "#f2c14e", fontSize: 17 },
  historyList: { display: "grid", gap: 10 },
  historyCard: { padding: 12, border: "1px solid #244b70", background: "#091521" },
  historyHeader: { display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 8 },
};
