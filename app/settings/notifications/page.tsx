"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { enablePush, disablePush, pushSupported } from "@/lib/push";

export default function NotificationSettingsPage() {
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    pushSupported().then(setSupported);
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((reg) =>
        reg.pushManager.getSubscription().then((s) => setEnabled(!!s)),
      );
    }
  }, []);

  async function toggle() {
    setBusy(true);
    setMessage("");
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) { setMessage("Please sign in first."); setBusy(false); return; }
    const result = enabled ? await disablePush(token) : await enablePush(token);
    if (result.ok) {
      setEnabled(!enabled);
      setMessage(enabled ? "Push notifications disabled." : "Push notifications enabled.");
    } else {
      setMessage(result.error || "Something went wrong.");
    }
    setBusy(false);
  }

  return (
    <main className="ns-page">
      <div className="ns-shell">
        <Link href="/home" className="ns-back">← Back to Home</Link>
        <header className="ns-hero">
          <span className="ns-kicker">Settings</span>
          <h1>Notifications</h1>
          <p>Get alerts about matches, tournaments, and results on your device.</p>
        </header>
        <section className="ns-card">
          <div>
            <strong>Push notifications</strong>
            <p>{supported ? "Available on this device." : "Not supported on this device/browser."}</p>
          </div>
          <button className="ns-btn" onClick={toggle} disabled={busy || !supported}>
            {busy ? "Working…" : enabled ? "Disable" : "Enable"}
          </button>
        </section>
        {message && <p className="ns-msg">{message}</p>}
      </div>
      <style>{`
        .ns-page{min-height:100vh;padding:26px 16px 60px;background:radial-gradient(circle at 50% -10%,#16314a 0,#07111c 50%,#03070b 100%);color:#d7e2ee;font-family:Tahoma,Verdana,Arial,sans-serif}
        .ns-shell{max-width:720px;margin:0 auto}
        .ns-back{color:#f2c14e;font-size:12px;text-decoration:none}
        .ns-hero{margin:14px 0 18px;padding:24px;border:1px solid #1d3e5a;border-radius:14px;background:linear-gradient(135deg,#0f2235,#081420)}
        .ns-kicker{color:#f2c14e;font-size:10px;font-weight:900;letter-spacing:.16em;text-transform:uppercase}
        .ns-hero h1{margin:6px 0 8px;color:#fff;font-size:28px}
        .ns-hero p{margin:0;color:#a8bdcd;font-size:13px}
        .ns-card{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:18px;border:1px solid #1d3e5a;border-radius:12px;background:#0b1825}
        .ns-card strong{color:#fff}
        .ns-card p{margin:4px 0 0;color:#8fa9c0;font-size:12px}
        .ns-btn{padding:9px 18px;border-radius:8px;border:none;background:#f2c14e;color:#07111c;font-weight:800;cursor:pointer}
        .ns-btn:disabled{opacity:.5;cursor:not-allowed}
        .ns-msg{margin-top:14px;color:#7affc8;font-size:13px}
      `}</style>
    </main>
  );
}