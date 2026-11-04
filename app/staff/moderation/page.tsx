"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";

type Sanction = {
  id: string;
  user_id: string;
  kind: "mute" | "suspend";
  reason: string;
  created_at: string;
  expires_at: string | null;
  revoked_at: string | null;
};

type AuditRow = {
  id: string;
  actor_id: string | null;
  action: string;
  target_user: string | null;
  details: Record<string, unknown>;
  created_at: string;
};

export default function StaffModerationPage() {
  const { user, loading: authLoading } = useUser();
  const [allowed, setAllowed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [sanctions, setSanctions] = useState<Sanction[]>([]);
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [username, setUsername] = useState("");
  const [kind, setKind] = useState<"mute" | "suspend">("mute");
  const [hours, setHours] = useState("24");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    if (!user) return;
    const { data: permission } = await supabase.rpc("has_staff_permission", { permission_key: "staff_access" });
    if (permission !== true) {
      setAllowed(false);
      setChecking(false);
      return;
    }
    setAllowed(true);
    const [{ data: s }, { data: a }] = await Promise.all([
      supabase.from("user_sanctions").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("staff_audit_log").select("*").order("created_at", { ascending: false }).limit(100),
    ]);
    const sanctionRows = (s || []) as Sanction[];
    const auditRows = (a || []) as AuditRow[];
    const ids = Array.from(
      new Set(
        [
          ...sanctionRows.map((x) => x.user_id),
          ...auditRows.flatMap((x) => [x.actor_id, x.target_user]),
        ].filter(Boolean)
      )
    ) as string[];
    if (ids.length > 0) {
      const { data: profiles } = await supabase.from("profiles").select("id,username").in("id", ids);
      setNames(Object.fromEntries(((profiles || []) as { id: string; username: string }[]).map((p) => [p.id, p.username])));
    }
    setSanctions(sanctionRows);
    setAudit(auditRows);
    setChecking(false);
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      queueMicrotask(() => setChecking(false));
      return;
    }
    queueMicrotask(load);
  }, [authLoading, user, load]);

  async function issue(e: FormEvent) {
    e.preventDefault();
    setError("");
    setNotice("");
    if (!username.trim() || !reason.trim()) {
      setError("Username and reason are required.");
      return;
    }
    setSaving(true);
    const hoursNumber = Number(hours);
    const { error: rpcError } = await supabase.rpc("staff_issue_sanction", {
      p_username: username.trim(),
      p_kind: kind,
      p_reason: reason.trim(),
      p_hours: Number.isFinite(hoursNumber) && hoursNumber > 0 ? Math.floor(hoursNumber) : null,
    });
    setSaving(false);
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    setNotice(`${kind === "mute" ? "Muted" : "Suspended"} ${username.trim()}.`);
    setUsername("");
    setReason("");
    await load();
  }

  async function revoke(id: string) {
    if (!window.confirm("Lift this sanction?")) return;
    setError("");
    const { error: rpcError } = await supabase.rpc("staff_revoke_sanction", { p_id: id });
    if (rpcError) setError(rpcError.message);
    await load();
  }

  const [now] = useState(() => Date.now());
  const active = sanctions.filter((s) => !s.revoked_at && (!s.expires_at || new Date(s.expires_at).getTime() > now));

  return (
    <>
      <style>{`
        .st-page{max-width:1000px;margin:0 auto;padding:14px 10px 30px;font-family:Tahoma,Verdana,Arial,sans-serif;color:#d7e2ee;}
        .st-panel{background:#0a1622;border:1px solid #3b7fc2;margin-bottom:10px;}
        .st-title{height:26px;background:#0f2a40;border-bottom:1px solid #3b7fc2;display:flex;align-items:center;padding-left:10px;font-size:11px;font-weight:bold;color:#f2c14e;text-transform:uppercase;}
        .st-body{padding:12px;}
        .st-form{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;}
        .st-form label{display:grid;gap:4px;font-size:10px;color:#8fb0cc;text-transform:uppercase;}
        .st-form .wide{grid-column:1/-1;}
        .st-form input,.st-form select,.st-form textarea{background:#07111b;border:1px solid #16324a;color:#eaf5ff;padding:8px;font-size:12px;font-family:inherit;}
        .st-form textarea{min-height:70px;resize:vertical;}
        .st-btn{background:linear-gradient(#1d5f9c,#0f3a63);border:1px solid #4f93d6;color:#fff;font-size:11px;font-weight:bold;text-transform:uppercase;padding:8px 16px;cursor:pointer;}
        .st-btn:disabled{opacity:.6;cursor:not-allowed;}
        .st-row{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;padding:10px 12px;border-bottom:1px solid #16324a;font-size:12px;}
        .st-row b{color:#f2c14e;}
        .st-row small{display:block;color:#8fb0cc;margin-top:3px;}
        .st-tag{display:inline-block;padding:1px 7px;border-radius:999px;font-size:10px;font-weight:bold;text-transform:uppercase;margin-right:6px;background:#5a3a00;color:#ffd27a;}
        .st-tag.suspend{background:#5a0000;color:#ffb3b3;}
        .st-msg{padding:8px 12px;font-size:12px;margin-bottom:10px;border:1px solid;}
        .st-msg.err{background:#3a0a0a;border-color:#c40000;color:#ffb3b3;}
        .st-msg.ok{background:#0d3a1f;border-color:#2fbf62;color:#7dffae;}
        .st-back{display:inline-block;margin-bottom:10px;color:#e3f1ff;font-size:11px;font-weight:bold;text-transform:uppercase;text-decoration:none;}
        @media(max-width:768px){.st-form{grid-template-columns:minmax(0,1fr);}}
      `}</style>

      <div className="st-page">
        <Link className="st-back" href="/staff/dashboard">
          &larr; Staff Dashboard
        </Link>

        {authLoading || checking ? (
          <div className="st-panel"><div className="st-body">Loading...</div></div>
        ) : !user ? (
          <div className="st-panel"><div className="st-body">Please sign in.</div></div>
        ) : !allowed ? (
          <div className="st-panel"><div className="st-body">This account cannot moderate players.</div></div>
        ) : (
          <>
            {error && <div className="st-msg err">{error}</div>}
            {notice && <div className="st-msg ok">{notice}</div>}

            <div className="st-panel">
              <div className="st-title">Mute or Suspend a Player</div>
              <form className="st-body st-form" onSubmit={issue}>
                <label>
                  Username
                  <input value={username} onChange={(e) => setUsername(e.target.value)} maxLength={40} />
                </label>
                <label>
                  Action
                  <select value={kind} onChange={(e) => setKind(e.target.value as "mute" | "suspend")}>
                    <option value="mute">Mute (no comments or messages)</option>
                    <option value="suspend">Suspend (also no matches)</option>
                  </select>
                </label>
                <label>
                  Hours (0 = until lifted)
                  <input type="number" min={0} value={hours} onChange={(e) => setHours(e.target.value)} />
                </label>
                <label className="wide">
                  Reason (sent to the player)
                  <textarea value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} />
                </label>
                <div className="wide">
                  <button className="st-btn" disabled={saving}>{saving ? "Saving..." : "Apply"}</button>
                </div>
              </form>
            </div>

            <div className="st-panel">
              <div className="st-title">Active Sanctions ({active.length})</div>
              {active.length === 0 ? (
                <div className="st-body">No active sanctions.</div>
              ) : (
                active.map((s) => (
                  <div className="st-row" key={s.id}>
                    <div>
                      <span className={`st-tag ${s.kind}`}>{s.kind}</span>
                      <b>{names[s.user_id] || s.user_id.slice(0, 8)}</b>
                      <small>
                        {s.reason} - {s.expires_at ? `until ${new Date(s.expires_at).toLocaleString()}` : "until lifted"}
                      </small>
                    </div>
                    <button className="st-btn" onClick={() => revoke(s.id)}>Lift</button>
                  </div>
                ))
              )}
            </div>

            <div className="st-panel">
              <div className="st-title">Audit Log</div>
              {audit.length === 0 ? (
                <div className="st-body">Nothing logged yet.</div>
              ) : (
                audit.map((row) => (
                  <div className="st-row" key={row.id}>
                    <div>
                      <b>{row.action.replace(/_/g, " ")}</b>
                      <small>
                        by {(row.actor_id && names[row.actor_id]) || "unknown"}
                        {row.target_user ? ` on ${names[row.target_user] || row.target_user.slice(0, 8)}` : ""}
                        {typeof row.details?.reason === "string" ? ` - ${row.details.reason}` : ""}
                      </small>
                    </div>
                    <small>{new Date(row.created_at).toLocaleString()}</small>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
