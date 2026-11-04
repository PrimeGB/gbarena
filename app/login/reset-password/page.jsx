"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RECOVERY_FLAG, supabase } from "../../../lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [tokenHash, setTokenHash] = useState("");

  // Email scanners open links and burn one-time tokens, so the token is only
  // verified when the user clicks the button below.
  async function verifyLink() {
    setLoading(true);
    setError("");

    const { error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: "recovery",
    });

    if (verifyError) {
      setError("This reset link is invalid or has expired. Please request a new one.");
    } else {
      setTokenHash("");
      setHasSession(true);
    }

    setLoading(false);
  }

  useEffect(() => {
    window.sessionStorage.removeItem(RECOVERY_FLAG);
    let active = true;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active && session) setHasSession(true);
    });

    supabase.auth
      .getSession()
      .then(({ data, error: sessionError }) => {
        if (!active) return;
        const query = new URLSearchParams(window.location.search);
        const hash = query.get("token_hash");
        if (hash && query.get("type") === "recovery") {
          setTokenHash(hash);
        } else if (sessionError) {
          setError(sessionError.message);
        } else {
          setHasSession(!!data.session);
        }
        setCheckingSession(false);
      })
      .catch((sessionError) => {
        if (!active) return;
        console.error("Could not check password recovery session:", sessionError);
        setError("Unable to verify the reset link. Please request a new one.");
        setCheckingSession(false);
      });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        setError(updateError.message || "Unable to update your password.");
        return;
      }

      await supabase.auth.signOut();
      setSuccess(true);
      setTimeout(() => router.push("/login"), 1800);
    } catch (updateError) {
      console.error("Password update failed:", updateError);
      setError("Unable to update your password. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={styles.page}>
      <section style={styles.box}>
        <h1 style={styles.title}>Reset Password</h1>

        {checkingSession ? (
          <p style={styles.copy}>Verifying your reset link...</p>
        ) : success ? (
          <>
            <p style={styles.success}>
              Your password has been updated. Redirecting you to sign in...
            </p>
            <Link href="/login" style={styles.link}>
              Sign in now
            </Link>
          </>
        ) : tokenHash && !hasSession ? (
          <>
            <p style={styles.copy}>
              Click continue to choose a new password for your account.
            </p>
            {error && <p style={styles.error}>{error}</p>}
            <button
              type="button"
              style={styles.button}
              onClick={verifyLink}
              disabled={loading}
            >
              {loading ? "Verifying..." : "Continue"}
            </button>
          </>
        ) : !hasSession ? (
          <>
            <p style={styles.copy}>
              This reset link is invalid or has expired. Go to sign in, choose
              &quot;Forgot password?&quot;, and request a new link.
            </p>
            {error && <p style={styles.error}>{error}</p>}
            <Link href="/login" style={styles.link}>
              Go to sign in
            </Link>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <label style={styles.label} htmlFor="new-password">
              New password
            </label>
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              style={styles.input}
              required
            />

            <label style={styles.label} htmlFor="confirm-password">
              Confirm new password
            </label>
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              style={styles.input}
              required
            />

            {error && <p style={styles.error}>{error}</p>}
            <button type="submit" style={styles.button} disabled={loading}>
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#000",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    fontFamily: "Tahoma",
  },
  box: {
    width: "100%",
    maxWidth: 400,
    background: "#0a1622",
    border: "1px solid #3b7fc2",
    padding: 20,
  },
  title: {
    color: "#7fc0ff",
    marginTop: 0,
    marginBottom: 16,
  },
  copy: {
    color: "#d7e2ee",
    lineHeight: 1.5,
  },
  label: {
    display: "block",
    color: "#d7e2ee",
    marginBottom: 6,
  },
  input: {
    width: "100%",
    padding: 10,
    marginBottom: 14,
    background: "#000",
    border: "1px solid #3b7fc2",
    color: "#fff",
  },
  button: {
    width: "100%",
    padding: 10,
    background: "#c40000",
    border: "none",
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer",
  },
  error: {
    color: "#ff7777",
  },
  success: {
    color: "#00ff88",
  },
  link: {
    color: "#7fc0ff",
  },
};
