"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { useUser } from "../../../lib/useUser";

type Request = { id: string; team_id: string; old_name: string; requested_name: string; reason: string; status: "pending" | "approved"; created_at: string; requester: string };

export default function StaffTeamNamesPage() {
  const { user, loading } = useUser();
  const [requests, setRequests] = useState<Request[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = useCallback(async (isCurrent: () => boolean = () => true) => {
    const { data, error: loadError } = await supabase.rpc("staff_team_name_requests");
    if (!isCurrent()) return;
    if (loadError) { setError(loadError.message); setReady(false); return; }
    setRequests((data || []) as Request[]);
    setReady(true);
  }, []);

  useEffect(() => {
    let active = true;
    if (!loading && user) queueMicrotask(() => { if (active) void load(() => active); });
    return () => { active = false; };
  }, [loading, user, load]);

  async function act(request: Request, action: "approved" | "rejected" | "apply") {
    setBusy(request.id); setError(""); setNotice("");
    const result = action === "apply"
      ? await supabase.rpc("staff_apply_team_name_request", { p_request_id: request.id })
      : await supabase.rpc("staff_review_team_name_request", { p_request_id: request.id, p_decision: action, p_note: notes[request.id] || "" });
    if (result.error) setError(result.error.message);
    else { setNotice(action === "apply" ? "Team name changed." : action === "approved" ? "Request approved. A staff member must now apply the change." : "Request declined."); await load(); }
    setBusy(null);
  }

  return (
    <main className="staff-names">
      <div className="shell">
        <Link href="/staff/dashboard">← Staff dashboard</Link>
        <h1>Team name requests</h1>
        <p>Review each request, then apply approved changes when ready.</p>
        {loading ? <p>Checking staff access…</p> : !user ? <p>Please <Link href="/login">sign in</Link> with a staff account.</p> : null}
        {error && <p className="error" role="alert">{error}</p>}
        {notice && <p className="notice" role="status">{notice}</p>}
        {ready && requests.length === 0 && <p>No open team name requests.</p>}
        {ready && requests.map((request) => (
          <article key={request.id}>
            <div className="heading"><h2>{request.old_name} → {request.requested_name}</h2><span>{request.status === "approved" ? "Approved · awaiting change" : "Awaiting review"}</span></div>
            <p>Requested by {request.requester} · {new Date(request.created_at).toLocaleString()}</p>
            <p><strong>Reason:</strong> {request.reason}</p>
            <Link href={`/teams/${request.team_id}`}>View team</Link>
            <label>Staff note (optional)<textarea value={notes[request.id] || ""} onChange={(event) => setNotes({ ...notes, [request.id]: event.target.value })} maxLength={1000} rows={2} /></label>
            <div className="actions">
              {request.status === "pending" ? <button disabled={busy !== null} onClick={() => act(request, "approved")}>Approve request</button> : <button disabled={busy !== null} onClick={() => act(request, "apply")}>Apply name change</button>}
              <button className="reject" disabled={busy !== null} onClick={() => act(request, "rejected")}>Decline request</button>
            </div>
          </article>
        ))}
      </div>
      <style jsx>{`
        .staff-names{min-height:100vh;padding:32px 16px;background:#07121d;color:#eef6fc;font-family:Arial,sans-serif}
        .shell{max-width:900px;margin:auto} a{color:#9ed2f4} h1{margin:24px 0 8px;font-size:28px} p{color:#b4cad9;line-height:1.5;font-size:14px}
        article{padding:20px;margin-top:16px;border:1px solid #29465d;border-radius:8px;background:#0d1d2b}
        .heading{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap} h2{margin:0;font-size:18px;overflow-wrap:anywhere}
        .heading span{color:#e8c16c;font-size:12px;font-weight:700} label{display:grid;gap:8px;margin-top:18px;color:#d9e8f2;font-size:12px;font-weight:700}
        textarea{width:100%;padding:10px;border:1px solid #3a5b71;border-radius:5px;background:#07121d;color:white;font:16px Arial}
        .actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:14px} button{min-height:44px;padding:0 15px;border:0;border-radius:5px;background:#e8c16c;color:#101a22;font-weight:800;cursor:pointer}
        button.reject{background:#233b4d;color:#e5f1f8} button:disabled{opacity:.6} .error,.notice{padding:12px;border-radius:5px;background:#253846}.error{color:#ffaaaa;background:#321b21}
      `}</style>
    </main>
  );
}
