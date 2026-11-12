"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { supabase } from "../../../lib/supabase";
import { useUser } from "../../../lib/useUser";
import { UnscannedEvidenceLink } from "../../components/UnscannedEvidenceLink";
import StaffToolShell from "../StaffToolShell";

type Submission = {
  team_name: string | null;
  reason: string | null;
  description: string | null;
  evidence_paths: string[];
  evidence_files?: { path: string; url: string | null }[];
};

type ReviewRequest = {
  id: number;
  match_id: string;
  team_name: string;
  submitted_by: string;
  reason: string;
  status: string;
  created_at: string;
  decision_reason: string;
  posting_score: number;
  accepting_score: number;
  decided_by: string;
  review_note: string | null;
  can_review: boolean;
  submissions: Submission[];
};

function ReviewQueue() {
  const { user } = useUser();
  const [requests, setRequests] = useState<ReviewRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [savingId, setSavingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    const { data, error: loadError } = await supabase.rpc("staff_list_match_decision_reviews");
    if (loadError) {
      setError(`Review requests could not be loaded: ${loadError.message}`);
      setLoading(false);
      return;
    }

    const issues: string[] = [];
    const entries = await Promise.all(((data || []) as ReviewRequest[]).map(async (request) => ({
      ...request,
      submissions: await Promise.all(request.submissions.map(async (submission) => {
        const paths = submission.evidence_paths || [];
        if (!paths.length) return { ...submission, evidence_files: [] };
        const { data: files, error: fileError } = await supabase.storage
          .from("dispute-evidence").createSignedUrls(paths, 3600);
        if (fileError) issues.push(`Evidence for ${submission.team_name || "a team"} could not be loaded: ${fileError.message}`);
        return { ...submission, evidence_files: paths.map((path, index) => ({ path, url: files?.[index]?.signedUrl || null })) };
      })),
    })));
    setRequests(entries);
    setError(issues.join(" "));
    setLoading(false);
  }, [user]);

  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  async function recordReview(event: FormEvent<HTMLFormElement>, request: ReviewRequest) {
    event.preventDefault();
    setSavingId(request.id);
    setError("");
    setNotice("");
    const { error: reviewError } = await supabase.rpc("staff_record_match_decision_review", {
      p_request_id: request.id,
      p_note: (notes[request.id] || "").trim(),
    });
    if (reviewError) setError(`Review could not be recorded: ${reviewError.message}`);
    else {
      await load();
      setNotice("Review recorded. The match result has not been changed.");
    }
    setSavingId(null);
  }

  return (
    <>
      <p>Requests from teams about staff match decisions appear here. A review request does not change the result.</p>
      {error && <p role="alert">{error}</p>}
      {notice && <p role="status">{notice}</p>}
      {loading ? <p>Loading review requests...</p> : requests.length === 0 && !error ? (
        <>
          <p>No review requests are waiting.</p>
          <article className="staff-mobile-card" style={{ marginTop: 16, padding: 16, border: "1px solid #315f88" }}>
            <h2>Example review — not live</h2>
            <p><strong>Team&apos;s reason:</strong> We believe our evidence was overlooked.</p>
            <p><strong>Staff decision:</strong> 2 - 1</p>
            <p><strong>Decision reason:</strong> The submitted evidence supports the reported score.</p>
          </article>
        </>
      ) : requests.map((request) => (
        <article className="staff-mobile-card" key={request.id} style={{ marginTop: 16, padding: 16, border: "1px solid #315f88" }}>
          <h2>Review #{request.id} — {request.team_name}</h2>
          <p>Submitted by {request.submitted_by} · {new Date(request.created_at).toLocaleString()}</p>
          <p><strong>Team&apos;s reason:</strong> {request.reason}</p>
          <p><strong>Staff decision:</strong> {request.posting_score} - {request.accepting_score} by {request.decided_by}</p>
          <p><strong>Decision reason:</strong> {request.decision_reason}</p>
          <p><strong>Status:</strong> {request.status}{request.review_note ? ` — ${request.review_note}` : ""}</p>
          <Link href={`/matches/${encodeURIComponent(request.match_id)}`}>Open match details</Link>
          <h3>Original dispute submissions</h3>
          <p>Evidence links and files have not been scanned. Verify the source before opening.</p>
          {request.submissions.length === 0 && <p>No original submissions found.</p>}
          {request.submissions.map((submission, index) => (
            <section key={`${submission.team_name}-${index}`} style={{ marginTop: 12 }}>
              <strong>{submission.team_name || "Team"}: {submission.reason || "No reason supplied"}</strong>
              <p>{submission.description}</p>
              {(submission.evidence_files || []).map((file, fileIndex) => file.url
                ? <p key={file.path}><UnscannedEvidenceLink href={file.url}>View evidence {fileIndex + 1}</UnscannedEvidenceLink></p>
                : <p key={file.path}>Evidence {fileIndex + 1} could not be opened.</p>)}
            </section>
          ))}
          {request.can_review && (
            <form onSubmit={(event) => recordReview(event, request)} style={{ marginTop: 16 }}>
              <label>
                Review note
                <textarea required minLength={10} maxLength={1000} value={notes[request.id] || ""} onChange={(event) => setNotes((current) => ({ ...current, [request.id]: event.target.value }))} style={{ display: "block", width: "100%", minHeight: 80 }} />
              </label>
              <button type="submit" disabled={savingId !== null}>Record review (result unchanged)</button>
            </form>
          )}
          {request.status === "pending" && !request.can_review && <p>Only a Founder can record a review of this decision.</p>}
        </article>
      ))}
    </>
  );
}

export default function MatchDecisionReviewsPage() {
  return <StaffToolShell title="Match decision reviews" permission="staff_access"><ReviewQueue /></StaffToolShell>;
}
