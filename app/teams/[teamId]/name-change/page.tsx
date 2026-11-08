"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabase";
import { useUser } from "../../../../lib/useUser";

type Request = { id: string; old_name: string; requested_name: string; reason: string; status: string; review_note: string | null; created_at: string };

export default function TeamNameChangePage() {
  const { teamId } = useParams<{ teamId: string }>();
  const { user, loading } = useUser();
  const [requests, setRequests] = useState<Request[]>([]);
  const [name, setName] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [ready, setReady] = useState(false);

  const load = useCallback(async (isCurrent: () => boolean = () => true) => {
    const { data, error: loadError } = await supabase.rpc("team_name_change_history", { p_team_id: teamId });
    if (!isCurrent()) return;
    if (loadError) { setError(loadError.message); setReady(false); return; }
    setRequests((data || []) as Request[]);
    setReady(true);
  }, [teamId]);

  useEffect(() => {
    let active = true;
    if (!loading && user) queueMicrotask(() => { if (active) void load(() => active); });
    return () => { active = false; };
  }, [load, loading, user]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(""); setNotice(""); setSaving(true);
    const { error: submitError } = await supabase.rpc("request_team_name_change", { p_team_id: teamId, p_name: name, p_reason: reason });
    if (submitError) setError(submitError.message);
    else { setName(""); setReason(""); setNotice("Request submitted. Staff will review it before making any change."); await load(); }
    setSaving(false);
  }

  const open = requests.some((request) => request.status === "pending" || request.status === "approved");
  return (
    <main className="name-request-page">
      <div className="name-request-shell">
        <Link className="back" href={`/teams/${teamId}/edit`}>← Back to team settings</Link>
        <h1>Request a team name change</h1>
        <p>Team names stay locked until staff review and approve your request. A staff member will then make the change.</p>
        {loading ? <p>Checking your account…</p> : !user ? <p>Please <Link href="/login">sign in</Link> as the team leader to continue.</p> : null}
        {error && <p className="error" role="alert">{error}</p>}
        {notice && <p className="notice" role="status">{notice}</p>}
        {ready && (
          <>
            {open ? <p className="notice">This team already has a request awaiting staff review or application.</p> : (
              <form onSubmit={submit}>
                <label>Requested team name<input value={name} onChange={(event) => setName(event.target.value)} minLength={4} maxLength={100} required /></label>
                <label>Reason for the change<textarea value={reason} onChange={(event) => setReason(event.target.value)} maxLength={1000} rows={4} required /></label>
                <button disabled={saving} type="submit">{saving ? "Submitting…" : "Submit request"}</button>
              </form>
            )}
            <section><h2>Request history</h2>
              {requests.length === 0 ? <p>No name change requests yet.</p> : requests.map((request) => (
                <article key={request.id}><strong>{request.old_name} → {request.requested_name}</strong><span className="status">{request.status === "approved" ? "Approved · awaiting staff change" : request.status}</span><p>{request.reason}</p>{request.review_note && <p>Staff note: {request.review_note}</p>}</article>
              ))}
            </section>
          </>
        )}
      </div>
      <style jsx>{`
        .name-request-page{min-height:100vh;padding:32px 16px;background:#07121d;color:#eaf4fc;font-family:Arial,sans-serif}
        .name-request-shell{max-width:760px;margin:auto;padding:28px;border:1px solid #29465d;border-radius:10px;background:#0d1d2b}
        .back{color:#9ed2f4;font-size:13px;text-decoration:none} h1{margin:24px 0 8px;font-size:28px} p{color:#b4cad9;line-height:1.55;font-size:14px}
        form{display:grid;gap:18px;margin:24px 0} label{display:grid;gap:8px;font-size:13px;font-weight:700}
        input,textarea{width:100%;padding:12px;border:1px solid #3a5b71;border-radius:5px;background:#07121d;color:white;font:16px Arial}
        button{justify-self:start;min-height:44px;padding:0 18px;border:0;border-radius:5px;background:#e8c16c;color:#101a22;font-weight:800;cursor:pointer}
        button:disabled{opacity:.6} section{border-top:1px solid #29465d;margin-top:24px;padding-top:16px} h2{font-size:18px}
        article{padding:14px 0;border-bottom:1px solid #29465d} article p{margin:8px 0}.status{display:block;color:#e8c16c;font-size:12px;margin-top:6px;text-transform:capitalize}
        .error,.notice{padding:12px;border-radius:5px;background:#253846}.error{color:#ffaaaa;background:#321b21}
        @media(max-width:600px){.name-request-page{padding:12px}.name-request-shell{padding:20px}h1{font-size:24px}}
      `}</style>
    </main>
  );
}
