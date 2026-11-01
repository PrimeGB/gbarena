"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function StaffCreditsPage() {
  const [username, setUsername] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    const value = Math.trunc(Number(amount));
    if (!username.trim() || !Number.isFinite(value) || value === 0) {
      setError("Enter a username and a non-zero amount (negative removes credits).");
      return;
    }
    setBusy(true);
    const { data, error: rpcError } = await supabase.rpc("staff_adjust_credits", {
      target_username: username.trim(),
      credit_amount: value,
      credit_reason: reason.trim(),
    });
    setBusy(false);
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    setMessage(`Done. ${username.trim()} now has ${Number(data).toLocaleString()} credits.`);
    setAmount("");
    setReason("");
  }

  const input = { width: "100%", padding: 8, margin: "4px 0 12px", background: "#07111c", color: "#fff", border: "1px solid #1d4f7a" } as const;

  return (
    <main style={{ background: "#07111c", minHeight: "100vh", padding: 24, color: "#d7e2ee", fontFamily: "Arial, sans-serif" }}>
      <form onSubmit={submit} style={{ maxWidth: 460, margin: "0 auto", background: "#0d1d2e", border: "1px solid #16324a", padding: 20 }}>
        <Link href="/staff/dashboard" style={{ color: "#f2c14e", fontSize: 12 }}>← Staff Dashboard</Link>
        <h1 style={{ margin: "10px 0 16px", color: "#fff" }}>Award / Remove Credits</h1>
        <label>Username<input style={input} value={username} onChange={(e) => setUsername(e.target.value)} /></label>
        <label>Amount (negative removes)<input style={input} value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="numeric" /></label>
        <label>Reason (logged)<input style={input} value={reason} onChange={(e) => setReason(e.target.value)} /></label>
        <button disabled={busy} style={{ padding: "10px 18px", background: "#f2c14e", border: 0, fontWeight: "bold", cursor: "pointer" }}>
          {busy ? "Saving..." : "Apply"}
        </button>
        {message && <p style={{ color: "#7affc8", marginTop: 12 }}>{message}</p>}
        {error && <p style={{ color: "#ff8a8a", marginTop: 12 }}>{error}</p>}
      </form>
    </main>
  );
}
