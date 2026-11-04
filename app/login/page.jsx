"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [forgotPassword, setForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetEmailSent, setResetEmailSent] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [mfaFactorId, setMfaFactorId] = useState("");
  const [mfaCode, setMfaCode] = useState("");

  async function handlePasswordReset() {
    setLoading(true);
    setError("");
    setResetEmailSent(false);

    try {
      const email = resetEmail.trim().toLowerCase();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: `${window.location.origin}/login/reset-password`,
        }
      );

      if (resetError) {
        setError(resetError.message || "Unable to send a password reset email.");
        return;
      }

      setResetEmailSent(true);
    } catch (resetError) {
      console.error("Password reset request failed:", resetError);
      setError("Unable to send a password reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin() {
    setLoading(true);
    setError("");
    setSuccess(false);

    const trimmedUsername = username.trim();
    const useEmailLogin = trimmedUsername.includes("@");
    let emailToUse = trimmedUsername;

    if (!useEmailLogin) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("email")
        .ilike("username", trimmedUsername)
        .maybeSingle();

      if (profileError) {
        setError("Unable to look up username. Please try again.");
        setLoading(false);
        return;
      }

      if (!profile) {
        setError(
          "Username not found. If you meant to use your email, enter your full email address instead."
        );
        setLoading(false);
        return;
      }

      emailToUse = profile.email;
    }

    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email: emailToUse,
      password,
    });

    if (loginError) {
      const message = loginError.message || "Invalid login credentials.";
      setError(
        message.includes("Invalid login credentials")
          ? "Invalid login credentials. Make sure your email/password are correct and your email has been confirmed."
          : message
      );
      setLoading(false);
      return;
    }

    if (data?.user?.id) {
      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aal?.nextLevel === "aal2" && aal.currentLevel !== "aal2") {
        const { data: factors } = await supabase.auth.mfa.listFactors();
        const factor = factors?.totp?.find((f) => f.status === "verified");
        if (factor) {
          setMfaFactorId(factor.id);
          setLoading(false);
          return;
        }
      }
    }

    finishLogin(data, emailToUse);
  }

  async function handleMfaVerify() {
    setError("");
    setLoading(true);
    const { data: challenge, error: cErr } = await supabase.auth.mfa.challenge({ factorId: mfaFactorId });
    if (cErr || !challenge) {
      setError(cErr?.message || "Could not start verification.");
      setLoading(false);
      return;
    }
    const { error: vErr } = await supabase.auth.mfa.verify({
      factorId: mfaFactorId,
      challengeId: challenge.id,
      code: mfaCode.trim(),
    });
    if (vErr) {
      setError("That code was not correct.");
      setLoading(false);
      return;
    }
    const { data: sessionData } = await supabase.auth.getSession();
    finishLogin({ user: sessionData.session?.user }, sessionData.session?.user?.email || "");
  }

  async function finishLogin(data, emailToUse) {
    if (data?.user?.id) {
      const metadataUsername =
        data.user.user_metadata?.username ||
        data.user.user_metadata?.display_name ||
        "";

      if (metadataUsername) {
        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", data.user.id)
          .maybeSingle();

        if (!existingProfile) {
          await supabase.from("profiles").insert([
            {
              id: data.user.id,
              username: metadataUsername,
              email: emailToUse,
            },
          ]);
        }
      }
    }

    setSuccess(true);

    setTimeout(() => {
      const nextPath = new URLSearchParams(window.location.search).get("next");
      const isSafeInternalPath =
        nextPath?.startsWith("/") && !nextPath.startsWith("//") && !nextPath.includes("\\");
      router.push(isSafeInternalPath ? nextPath : "/home");
    }, 1200);
  }

  return (
    <div style={styles.page}>
      <div style={styles.box}>
        <h2 style={styles.title}>GameBattles Login</h2>

        {success ? (
          <div style={styles.success}>
            Login successful... redirecting to homepage
          </div>
        ) : forgotPassword ? (
          <form
            autoComplete="off"
            onSubmit={(e) => {
              e.preventDefault();
              handlePasswordReset();
            }}
          >
            <p style={styles.instructions}>
              Enter the email address on your account and we will send you a
              password reset link.
            </p>

            <input
              type="email"
              name="reset-email"
              autoComplete="email"
              placeholder="Email address"
              value={resetEmail}
              onChange={(e) => {
                setResetEmail(e.target.value);
                setResetEmailSent(false);
              }}
              style={styles.input}
              required
            />

            <button type="submit" style={styles.button} disabled={loading}>
              {loading ? "Sending..." : "Send Reset Link"}
            </button>

            {error && <p style={styles.error}>{error}</p>}
            {resetEmailSent && (
              <p style={styles.success}>
                If an account exists for that email, a reset link has been
                sent. Check your inbox and spam folder.
              </p>
            )}

            <button
              type="button"
              style={styles.textButton}
              onClick={() => {
                setForgotPassword(false);
                setError("");
                setResetEmailSent(false);
              }}
            >
              Back to sign in
            </button>
          </form>
        ) : (
          <form
            autoComplete="off"
            onSubmit={(e) => {
              e.preventDefault();
              if (mfaFactorId) handleMfaVerify();
              else handleLogin();
            }}
          >
            {mfaFactorId ? (
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="6-digit authenticator code"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value)}
                style={styles.input}
                autoFocus
              />
            ) : (
              <>
            <input
              type="text"
              name="login-username"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              placeholder="Username or email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={styles.input}
            />

            <input
              type="password"
              name="login-password"
              autoComplete="new-password"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
            />
              </>
            )}

            <button type="submit" style={styles.button} disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>

            {error && <p style={styles.error}>{error}</p>}
            <button
              type="button"
              style={styles.textButton}
              onClick={() => {
                setForgotPassword(true);
                setResetEmail(username.includes("@") ? username.trim() : "");
                setError("");
              }}
            >
              Forgot password?
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#000",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontFamily: "Tahoma",
  },

  box: {
    width: 400,
    background: "#0a1622",
    border: "1px solid #3b7fc2",
    padding: 20,
  },

  title: {
    color: "#7fc0ff",
    marginBottom: 16,
  },

  success: {
    color: "#00ff88",
    marginBottom: 10,
  },

  instructions: {
    color: "#d7e2ee",
    lineHeight: 1.5,
    marginBottom: 12,
  },

  input: {
    width: "100%",
    padding: 10,
    marginBottom: 10,
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

  textButton: {
    display: "block",
    padding: 0,
    marginTop: 14,
    background: "transparent",
    border: "none",
    color: "#7fc0ff",
    cursor: "pointer",
    textDecoration: "underline",
  },

  error: {
    color: "red",
  },
};