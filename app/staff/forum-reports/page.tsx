"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";

type Report = {
  id: number;
  target_type: "post" | "reply";
  target_id: number;
  reason: string;
  resolved: boolean;
  created_at: string;
};

export default function ForumReportsPage() {
  const { user, loading: authLoading } = useUser();
  const [allowed, setAllowed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [reports, setReports] = useState<Report[]>([]);
  const [postIds, setPostIds] = useState<Record<string, number>>({});
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const { data: permission, error: permissionError } = await supabase.rpc("has_staff_permission", { permission_key: "basic_moderation" });
    if (permissionError) {
      setError(`Moderation access could not be checked: ${permissionError.message}`);
      setChecking(false);
      return;
    }
    if (permission !== true) {
      setChecking(false);
      return;
    }
    setAllowed(true);
    const { data, error: reportError } = await supabase
      .from("forum_reports")
      .select("*")
      .order("resolved", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(100);
    if (reportError) {
      setError(`Reports could not be loaded: ${reportError.message}`);
      setChecking(false);
      return;
    }
    const rows = (data || []) as Report[];
    setReports(rows);

    const replyIds = rows.filter((r) => r.target_type === "reply").map((r) => r.target_id);
    if (replyIds.length) {
      const { data: replies, error: replyError } = await supabase.from("forum_replies").select("id,post_id").in("id", replyIds);
      if (replyError) {
        setError(`Reported replies could not be loaded: ${replyError.message}`);
        setChecking(false);
        return;
      }
      setPostIds(Object.fromEntries((replies || []).map((r: { id: number; post_id: number }) => [`reply-${r.id}`, r.post_id])));
    }
    setChecking(false);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      queueMicrotask(() => setChecking(false));
      return;
    }
    queueMicrotask(load);
  }, [authLoading, user, load]);

  async function resolve(id: number) {
    setError("");
    const { error: updateError } = await supabase.from("forum_reports").update({ resolved: true }).eq("id", id);
    if (updateError) {
      setError(`Report could not be resolved: ${updateError.message}`);
      return;
    }
    await load();
  }

  if (checking || authLoading) return <div style={{ padding: 24, color: "#d7e2ee", background: "#000", minHeight: "100vh" }}>Loading...</div>;
  if (!allowed) return <div style={{ padding: 24, color: "#d7e2ee", background: "#000", minHeight: "100vh" }}>{error || "Staff access required."}</div>;

  return (
    <div style={{ background: "#000", color: "#d7e2ee", minHeight: "100vh", fontFamily: "Tahoma,Verdana,Arial,sans-serif" }}>
      <div style={{ width: "min(900px,100%)", margin: "0 auto", padding: "24px 18px" }}>
        <h1 style={{ color: "#f2c14e", fontSize: 20, textTransform: "uppercase", marginBottom: 14 }}>Forum Reports</h1>
        {error && <p role="alert" style={{ color: "#ffaaaa" }}>{error}</p>}
        <div style={{ background: "#0a1119", border: "1px solid #263b4d" }}>
          {reports.length === 0 && <div style={{ padding: 18, color: "#9aabba" }}>No reports.</div>}
          {reports.map((r) => {
            const threadId = r.target_type === "post" ? r.target_id : postIds[`reply-${r.target_id}`];
            return (
              <div key={r.id} style={{ padding: "12px 16px", borderTop: "1px solid #13293d", opacity: r.resolved ? 0.5 : 1 }}>
                <div style={{ fontSize: 12, color: "#8193a1" }}>
                  {r.target_type} #{r.target_id} · {new Date(r.created_at).toLocaleString()} {r.resolved ? "· resolved" : ""}
                </div>
                <div style={{ margin: "4px 0", fontSize: 13 }}>{r.reason}</div>
                {threadId && <Link href={`/forums/${threadId}`} style={{ color: "#7fc0ff", fontSize: 12 }}>Open thread</Link>}
                {!r.resolved && (
                  <button type="button" onClick={() => resolve(r.id)} style={{ marginLeft: 12, background: "none", border: "none", color: "#f2c14e", cursor: "pointer", fontSize: 12 }}>
                    Mark resolved
                  </button>
                )}
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 12 }}>
          <Link href="/staff/dashboard" style={{ color: "#cfeefe" }}>Back to staff dashboard</Link>
        </div>
      </div>
    </div>
  );
}
