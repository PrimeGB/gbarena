"use client";

import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "../../lib/supabase";

type ReviewStatus = {
  eligible: boolean;
  status: string | null;
  reason: string | null;
  review_note: string | null;
  decision_reason: string;
  posting_score: number;
  accepting_score: number;
};

export default function DecisionReviewRequest({ matchId, teamId, teamName, preview = false }: { matchId: string; teamId: string; teamName: string; preview?: boolean }) {
  const [status, setStatus] = useState<ReviewStatus | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    if (preview) {
      void Promise.resolve().then(() => {
        if (active) setStatus({ eligible: true, status: null, reason: null, review_note: null, decision_reason: "The submitted evidence supports the reported score.", posting_score: 2, accepting_score: 1 });
      });
      return () => { active = false; };
    }
    void supabase.rpc("match_decision_review_status", { p_match_id: matchId, p_team_id: teamId })
      .then(({ data, error: loadError }) => {
        if (!active) return;
        if (loadError) setError(`Review request status could not be loaded: ${loadError.message}`);
        else setStatus(data as ReviewStatus);
      });
    return () => { active = false; };
  }, [matchId, teamId, preview]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    if (preview) {
      setStatus((current) => current && { ...current, status: "pending", reason: reason.trim() });
      setReason("");
      setSaving(false);
      return;
    }
    const { error: submitError } = await supabase.rpc("request_match_decision_review", {
      p_match_id: matchId,
      p_team_id: teamId,
      p_reason: reason.trim(),
    });
    if (submitError) {
      setError(`Review request could not be submitted: ${submitError.message}`);
    } else {
      setStatus((current) => current && { ...current, status: "pending", reason: reason.trim() });
      setReason("");
    }
    setSaving(false);
  }

  if (!error && (!status || !status.eligible)) return null;
  return (
    <section style={{ marginTop: 12, padding: 14, border: "1px solid #315f88", background: "#0a1622" }}>
      <h3 style={{ margin: "0 0 8px", color: "#f2c14e" }}>Staff decision review — {teamName}</h3>
      {preview && <p>Example preview only — nothing will be submitted.</p>}
      {error && <p role="alert">{error}</p>}
      {status?.eligible && (
        <>
          <p>Official score: {status.posting_score} - {status.accepting_score}</p>
          <p>Staff reason: {status.decision_reason}</p>
          {status.status ? (
            <p role="status">Your team&apos;s review request: {status.status}. {status.review_note}</p>
          ) : (
            <form onSubmit={submit}>
              <p>If you believe the staff decision is wrong, explain why. Administrators and Owners can review it, but cannot currently change the result here. One request per team.</p>
              <label>
                Reason for review
                <textarea value={reason} onChange={(event) => setReason(event.target.value)} minLength={10} maxLength={2000} required style={{ display: "block", width: "100%", minHeight: 80 }} />
              </label>
              <button className="blue-btn" type="submit" disabled={saving}>{saving ? "Submitting..." : "Request review"}</button>
            </form>
          )}
        </>
      )}
    </section>
  );
}
