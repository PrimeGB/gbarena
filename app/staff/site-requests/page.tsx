"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";
import StaffToolShell from "../StaffToolShell";

type Request = { id: number; requested_by: string; description: string; status: string; decision_reason: string | null; created_at: string };

function Requests() {
  const { user } = useUser();
  const [requests, setRequests] = useState<Request[]>([]);
  const [isOwner, setIsOwner] = useState<boolean | null>(null);
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const [entries, profile] = await Promise.all([
      supabase.from("staff_site_change_requests").select("id,requested_by,description,status,decision_reason,created_at").order("created_at", { ascending: false }),
      supabase.from("profiles").select("role").eq("id", user.id).single(),
    ]);
    if (entries.error || profile.error) {
      setMessage(`Requests could not be loaded: ${entries.error?.message || profile.error?.message}`);
      return;
    }
    setRequests((entries.data || []) as Request[]);
    setIsOwner(profile.data?.role === "owner");
  }, [user]);

  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true); setMessage("");
    const { error } = await supabase.rpc("staff_request_site_change", { p_description: description });
    setSaving(false);
    if (error) setMessage(`Request could not be submitted: ${error.message}`);
    else { setDescription(""); await load(); setMessage("Request submitted for Owner review."); }
  }

  async function review(id: number, approve: boolean) {
    const reason = window.prompt(`Why are you ${approve ? "approving" : "rejecting"} this request?`);
    if (reason === null) return;
    if (reason.trim().length < 10) { setMessage("Enter a decision reason of at least 10 characters."); return; }
    setSaving(true); setMessage("");
    const { error } = await supabase.rpc("staff_review_site_change", { p_request_id: id, p_approve: approve, p_reason: reason });
    setSaving(false);
    if (error) setMessage(`Request could not be reviewed: ${error.message}`);
    else { await load(); setMessage("Decision recorded. The site has not been changed."); }
  }

  return (
    <>
      {isOwner !== null && <p>{isOwner ? "Review site changes proposed by staff." : "Propose a change for Owner review."} Approval records a decision only; it does not change the site.</p>}
      {message && <p role="status">{message}</p>}
      {isOwner === false && <form className="staff-mobile-form" onSubmit={submit} style={{ display: "grid", maxWidth: 600 }}>
        <label>Proposed change <textarea required minLength={10} maxLength={2000} value={description} onChange={(e) => setDescription(e.target.value)} /></label>
        <button type="submit" disabled={saving}>Submit request</button>
      </form>}
      <h2>Requests</h2>
      {requests.length === 0 && <p>No requests found.</p>}
      {requests.map((request) => <article className="staff-mobile-card" key={request.id} style={{ marginTop: 12 }}>
        <strong>#{request.id} - {request.status}</strong><p>{request.description}</p>
        <small>{new Date(request.created_at).toLocaleString()}</small>
        {request.decision_reason && <p>Decision: {request.decision_reason}</p>}
        {isOwner && request.status === "pending" && request.requested_by !== user?.id && <div>
          <button type="button" disabled={saving} onClick={() => review(request.id, true)}>Approve</button>{" "}
          <button type="button" disabled={saving} onClick={() => review(request.id, false)}>Reject</button>
        </div>}
      </article>)}
    </>
  );
}

export default function SiteRequestsPage() {
  return <StaffToolShell title="Site change requests" permission="staff_access"><Requests /></StaffToolShell>;
}
