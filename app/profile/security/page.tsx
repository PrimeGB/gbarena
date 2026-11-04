"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function SecurityPage() {
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [factorId, setFactorId] = useState("");
  const [verifiedFactor, setVerifiedFactor] = useState("");
  const [qr, setQr] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");

  const refresh = useCallback(async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    setLoggedIn(!!sessionData.session);
    const { data } = await supabase.auth.mfa.listFactors();
    setVerifiedFactor(data?.totp?.find((f) => f.status === "verified")?.id || "");
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function startEnroll() {
    setMessage("");
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" });
    if (error || !data) {
      setMessage(error?.message || "Could not start two-factor setup. It may not be enabled for this site yet.");
      return;
    }
    setFactorId(data.id);
    setQr(data.totp.qr_code);
  }

  async function confirmEnroll(e: React.FormEvent) {
    e.preventDefault();
    const { data: challenge, error: cErr } = await supabase.auth.mfa.challenge({ factorId });
    if (cErr || !challenge) {
      setMessage(cErr?.message || "Challenge failed.");
      return;
    }
    const { error } = await supabase.auth.mfa.verify({ factorId, challengeId: challenge.id, code: code.trim() });
    if (error) {
      setMessage("That code was not correct.");
      return;
    }
    setQr("");
    setCode("");
    setFactorId("");
    setMessage("Two-factor authentication is on.");
    refresh();
  }

  async function disable() {
    if (!window.confirm("Turn off two-factor authentication?")) return;
    const { error } = await supabase.auth.mfa.unenroll({ factorId: verifiedFactor });
    setMessage(error ? error.message : "Two-factor authentication is off.");
    refresh();
  }

  async function signOutOthers() {
    const { error } = await supabase.auth.signOut({ scope: "others" });
    setMessage(error ? error.message : "Signed out of all other devices.");
  }

  async function exportData() {
    const { data, error } = await supabase.rpc("export_my_data");
    if (error) {
      setMessage(error.message);
      return;
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "gamebattles-data.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function deleteAccount() {
    if (!window.confirm("Permanently delete your account? This cannot be undone.")) return;
    const typed = window.prompt('Type DELETE to confirm.');
    if (typed !== "DELETE") return;
    const { error } = await supabase.rpc("delete_my_account");
    if (error) {
      setMessage(error.message);
      return;
    }
    await supabase.auth.signOut();
    router.push("/home");
  }

  const box = { background: "#0a1119", border: "1px solid #263b4d", padding: 18, marginBottom: 16 } as const;
  const btn = { border: "1px solid #3b7fc2", background: "#10263a", color: "#e6eefc", padding: "8px 14px", cursor: "pointer", fontSize: 12 } as const;

  if (loggedIn === false) {
    return (
      <div style={{ background: "#000", color: "#d7e2ee", minHeight: "100vh", padding: 24 }}>
        <Link href="/login" style={{ color: "#7fc0ff" }}>Log in</Link> to manage your account security.
      </div>
    );
  }

  return (
    <div style={{ background: "#000", color: "#d7e2ee", minHeight: "100vh", fontFamily: "Tahoma,Verdana,Arial,sans-serif" }}>
      <div style={{ width: "min(720px,100%)", margin: "0 auto", padding: "24px 18px" }}>
        <h1 style={{ color: "#f2c14e", fontSize: 20, textTransform: "uppercase", marginBottom: 16 }}>Account Security</h1>
        {message && <div style={{ ...box, color: "#f2c14e" }}>{message}</div>}

        <div style={box}>
          <h3 style={{ color: "#7fc0ff", marginBottom: 8 }}>Two-factor authentication</h3>
          {verifiedFactor ? (
            <>
              <p style={{ fontSize: 13, marginBottom: 10 }}>Enabled. You will be asked for a code from your authenticator app when you log in.</p>
              <button type="button" style={btn} onClick={disable}>Turn off</button>
            </>
          ) : qr ? (
            <form onSubmit={confirmEnroll}>
              <p style={{ fontSize: 13, marginBottom: 10 }}>Scan this with an authenticator app (Google Authenticator, Authy, 1Password), then enter the 6-digit code.</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr} alt="Two-factor QR code" width={180} height={180} style={{ background: "#fff", padding: 6, marginBottom: 10 }} />
              <div>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="123456"
                  style={{ padding: 8, background: "#07111b", border: "1px solid #263b4d", color: "#e6eefc", marginRight: 8 }}
                />
                <button type="submit" style={btn}>Verify</button>
              </div>
            </form>
          ) : (
            <button type="button" style={btn} onClick={startEnroll}>Set up two-factor</button>
          )}
        </div>

        <div style={box}>
          <h3 style={{ color: "#7fc0ff", marginBottom: 8 }}>Sessions</h3>
          <button type="button" style={btn} onClick={signOutOthers}>Sign out of other devices</button>
        </div>

        <div style={box}>
          <h3 style={{ color: "#7fc0ff", marginBottom: 8 }}>Your data</h3>
          <button type="button" style={btn} onClick={exportData}>Download my data</button>
        </div>

        <div style={{ ...box, borderColor: "#7a1f1f" }}>
          <h3 style={{ color: "#ff6b6b", marginBottom: 8 }}>Delete account</h3>
          <p style={{ fontSize: 13, marginBottom: 10 }}>Permanently removes your account. Teams you own must be transferred or deleted first.</p>
          <button type="button" style={{ ...btn, borderColor: "#c40000", background: "#3a0a0a" }} onClick={deleteAccount}>Delete my account</button>
        </div>

        <Link href="/profile/edit" style={{ color: "#cfeefe" }}>Back to Edit Profile</Link>
      </div>
    </div>
  );
}
