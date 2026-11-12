"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { useUser } from "../../../lib/useUser";

type Feedback = {
  id: number;
  kind: "Suggestion" | "Bug Report";
  title: string;
  details: string;
  submitter: string;
  status: string;
  created_at: string;
};

export default function StaffFeedbackPage() {
  const { user, loading: authLoading } = useUser();
  const [entries, setEntries] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [reviewing, setReviewing] = useState<number | null>(null);
  const [canReviewBugs, setCanReviewBugs] = useState(false);

  const loadFeedback = useCallback(async () => {
    setLoading(true);
    setError("");
    const [feedback, awardsPermission] = await Promise.all([
      supabase.rpc("staff_list_community_feedback"),
      supabase.rpc("has_staff_permission", { permission_key: "awards" }),
    ]);
    if (feedback.error || awardsPermission.error) {
      setEntries([]);
      setError(`Feedback could not be loaded: ${feedback.error?.message || awardsPermission.error?.message}`);
    } else {
      setEntries((feedback.data || []) as Feedback[]);
      setCanReviewBugs(awardsPermission.data === true);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      queueMicrotask(() => setLoading(false));
      return;
    }
    queueMicrotask(() => void loadFeedback());
  }, [authLoading, user, loadFeedback]);

  async function markReviewed(id: number) {
    setReviewing(id);
    setError("");
    setNotice("");
    const { error: reviewError } = await supabase.rpc("staff_review_community_suggestion", { p_suggestion_id: id });
    if (reviewError) {
      setError(`Suggestion could not be marked reviewed: ${reviewError.message}`);
    } else {
      setNotice("Suggestion marked reviewed.");
      await loadFeedback();
    }
    setReviewing(null);
  }

  return (
    <main className="staff-feedback">
      <style>{`
        body{margin:0;background:#000;color:#d7e2ee;font-family:Tahoma,Verdana,Arial,sans-serif}
        .staff-feedback{max-width:1000px;margin:0 auto;padding:24px 16px 60px}
        .staff-feedback a{color:#8dcaff}
        .staff-feedback h1{color:#f2c14e;font-size:26px}
        .sf-intro,.sf-empty{color:#b9cddd;font-size:13px;line-height:1.6}
        .sf-list{display:grid;gap:12px;margin-top:18px}
        .sf-card{padding:16px;background:#0a1622;border:1px solid #315f88}
        .sf-card-head{display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px}
        .sf-card h2{margin:0;color:#fff;font-size:16px;overflow-wrap:anywhere}
        .sf-meta{margin:8px 0;color:#9fb9cf;font-size:12px}
        .sf-details{white-space:pre-wrap;overflow-wrap:anywhere;font-size:13px;line-height:1.6}
        .sf-status{color:#f2c14e;font-size:11px;font-weight:bold;text-transform:uppercase}
        .sf-button{padding:8px 12px;border:1px solid #d6a943;background:#8a6218;color:#fff;font-weight:bold;cursor:pointer}
        .sf-button:disabled{opacity:.5}
        .sf-error,.sf-notice{padding:12px;border:1px solid #a34a4a;background:#2a1010;color:#ffd1d1;font-size:13px}
        .sf-notice{border-color:#387854;background:#102e21;color:#b8ebc8}
      `}</style>
      <Link href="/staff/dashboard">← Staff dashboard</Link>
      <h1>Community Feedback</h1>
      <p className="sf-intro">Suggestions and site bug reports, with pending items first. Showing up to 100 entries.</p>
      {error && <p role="alert" className="sf-error">{error}</p>}
      {notice && <p role="status" className="sf-notice">{notice}</p>}
      {(authLoading || loading) ? <p className="sf-empty">Loading feedback...</p> : !user ? (
        <p className="sf-empty"><Link href="/login?next=%2Fstaff%2Ffeedback">Sign in</Link> with a staff account to view feedback.</p>
      ) : !error && entries.length === 0 ? (
        <>
          <p className="sf-empty">No feedback has been submitted yet. Here is an example of how an entry will appear:</p>
          <article className="sf-card">
            <div className="sf-card-head"><h2>Example suggestion</h2><span className="sf-status">Example · Not a submission</span></div>
            <p className="sf-meta">From Example Player</p>
            <p className="sf-details">A player&apos;s idea or bug report will appear here for staff to review.</p>
          </article>
        </>
      ) : (
        <div className="sf-list">
          {entries.map((entry) => (
            <article className="sf-card" key={`${entry.kind}-${entry.id}`}>
              <div className="sf-card-head">
                <h2>{entry.title}</h2>
                <span className="sf-status">{entry.kind} · {entry.status}</span>
              </div>
              <p className="sf-meta">From {entry.submitter} · {new Date(entry.created_at).toLocaleString()}</p>
              <p className="sf-details">{entry.details}</p>
              {entry.kind === "Suggestion" && entry.status === "submitted" && (
                <button className="sf-button" type="button" disabled={reviewing !== null} onClick={() => void markReviewed(entry.id)}>
                  {reviewing === entry.id ? "Saving..." : "Mark reviewed"}
                </button>
              )}
              {entry.kind === "Bug Report" && entry.status === "submitted" && (
                canReviewBugs
                  ? <Link href="/staff/awards">Review in Bug Finder →</Link>
                  : <span className="sf-meta">Bug Finder decisions are handled by award administrators.</span>
              )}
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
