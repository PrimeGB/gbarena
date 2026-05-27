"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function JoinPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [signedUp, setSignedUp] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [pendingProfile, setPendingProfile] = useState(null);

  async function handleSignup() {
    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim();

    if (!trimmedUsername || !trimmedEmail || !password.trim() || !confirmPassword.trim()) {
      setError("Username, email, and both password fields are required.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    const { data: existingUsername } = await supabase
      .from("profiles")
      .select("id")
      .ilike("username", trimmedUsername)
      .maybeSingle();

    if (existingUsername) {
      setError("This username is already taken.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: {
        data: {
          username: trimmedUsername,
          display_name: trimmedUsername,
        },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    let userId = data?.user?.id ?? data?.session?.user?.id;
    if (!userId) {
      const { data: currentUser } = await supabase.auth.getUser();
      userId = currentUser?.user?.id;
    }

    if (userId) {
      const { error: profileError } = await supabase.from("profiles").insert([
        {
          id: userId,
          username: trimmedUsername,
          email: trimmedEmail,
        },
      ]);

      if (profileError) {
        setError(profileError.message);
        setLoading(false);
        return;
      }
    } else {
      const pending = { username: trimmedUsername, email: trimmedEmail };
      setPendingProfile(pending);
      window.localStorage.setItem("pendingGameBattlesProfile", JSON.stringify(pending));
    }

    setLoading(false);
    setSignedUp(true);
  }

  async function handleConfirmEmail() {
    const trimmedEmail = email.trim();
    const storedProfile =
      typeof window !== "undefined"
        ? window.localStorage.getItem("pendingGameBattlesProfile")
        : null;
    const resolvedPendingProfile =
      pendingProfile || (storedProfile ? JSON.parse(storedProfile) : null);

    setLoading(true);
    setError("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password,
    });

    if (error) {
      setError(error.message || "Please confirm your email before continuing.");
      setLoading(false);
      return;
    }

    let userId = data?.user?.id ?? data?.session?.user?.id;
    if (!userId) {
      const { data: currentUser } = await supabase.auth.getUser();
      userId = currentUser?.user?.id;
    }

    const usernameToUse =
      resolvedPendingProfile?.username ||
      data?.user?.user_metadata?.username ||
      data?.user?.user_metadata?.display_name ||
      "";

    if (userId && usernameToUse) {
      const { data: usernameTaken } = await supabase
        .from("profiles")
        .select("id")
        .ilike("username", usernameToUse)
        .maybeSingle();

      if (usernameTaken && usernameTaken.id !== userId) {
        setError("This username is already taken.");
        setLoading(false);
        return;
      }

      await supabase.auth.updateUser({
        data: {
          username: usernameToUse,
          display_name: usernameToUse,
        },
      });
    }

    if (userId) {
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", userId)
        .single();

      if (!existingProfile && usernameToUse) {
        const { error: profileError } = await supabase.from("profiles").insert([
          {
            id: userId,
            username: usernameToUse,
            email: trimmedEmail,
          },
        ]);

        if (profileError) {
          setError(profileError.message);
          setLoading(false);
          return;
        }
      }
    }

    if (typeof window !== "undefined") {
      window.localStorage.removeItem("pendingGameBattlesProfile");
    }

    setLoading(false);
    setConfirmed(true);

    setTimeout(() => {
      router.push("/");
    }, 1400);
  }

  return (
    <div style={styles.page}>
      <div style={styles.box}>
        <div style={styles.topStrip} />

        <div style={styles.headerBlock}>
          <div style={styles.logoWrap}>
            <img
              src="/logo.svg"
              alt="GameBattles Logo"
              style={styles.logoImage}
            />
          </div>
          <div style={styles.cardTitleBox}>
            <div style={styles.cardTitle}>Create Your GameBattles Account</div>
          </div>
        </div>

        {signedUp ? (
          confirmed ? (
            <div>
              <p style={{ marginBottom: 12 }}>
                Email confirmed! Redirecting to the main page...
              </p>
            </div>
          ) : (
            <div>
              <p style={{ marginBottom: 12 }}>
                Thanks for signing up! Check your email and confirm your
                account. Then click the button below.
              </p>
              <button
                onClick={handleConfirmEmail}
                style={styles.button}
                disabled={loading}
              >
                {loading ? "Checking confirmation..." : "I have confirmed my email"}
              </button>
              {error && <p style={styles.error}>{error}</p>}
            </div>
          )
        ) : (
          <>
            <div style={styles.sectionTitle}>CREATE YOUR ACCOUNT</div>
            <p style={styles.subtitle}>
              Join the competitive gaming community and participate in ladders,
              tournaments, and online matches.
            </p>

            <label style={styles.label}>USERNAME</label>
            <input
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={styles.input}
            />

            <label style={styles.label}>EMAIL ADDRESS</label>
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
            />

            <label style={styles.label}>PASSWORD</label>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
            />

            <label style={styles.label}>CONFIRM PASSWORD</label>
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={styles.input}
            />

            <button onClick={handleSignup} style={styles.button} disabled={loading}>
              {loading ? "Creating account..." : "CREATE ACCOUNT"}
            </button>

            {error && <p style={styles.error}>{error}</p>}
          </>
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
    fontFamily: "Tahoma, Arial, sans-serif",
    color: "#d7e2ee",
    padding: 20,
  },
  box: {
    width: 620,
    background: "#08101a",
    border: "1px solid #3b7fc2",
    padding: 28,
    boxShadow: "0 0 0 1px rgba(255,255,255,0.03), 0 24px 60px rgba(0,0,0,0.45)",
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#f2c14e",
    letterSpacing: 1.4,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 1.5,
    color: "#d7e2ee",
    marginBottom: 20,
  },
  topStrip: {
    height: 16,
    width: "100%",
    background: "linear-gradient(90deg, #c10000, #7e0000)",
    borderRadius: "6px 6px 0 0",
    marginBottom: 16,
  },
  headerBlock: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: 14,
    background: "#081520",
    border: "1px solid rgba(63, 127, 194, 0.85)",
    borderRadius: 14,
    marginBottom: 18,
    boxShadow: "0 14px 40px rgba(0,0,0,0.25)",
  },
  logoWrap: {
    minWidth: 200,
    maxWidth: 200,
    padding: 8,
    background: "#06131e",
    border: "1px solid rgba(127, 191, 255, 0.15)",
    borderRadius: 12,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  logoImage: {
    width: "100%",
    maxWidth: 186,
    height: "auto",
    display: "block",
  },
  cardTitleBox: {
    flex: 1,
    padding: 16,
    background: "rgba(242, 193, 78, 0.08)",
    border: "1px solid #f2c14e",
    borderRadius: 14,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#f2c14e",
    letterSpacing: 1.75,
    textTransform: "uppercase",
    lineHeight: 1.1,
    margin: 0,
  },
  label: {
    display: "block",
    fontSize: 11,
    fontWeight: "bold",
    color: "#7fc0ff",
    letterSpacing: 1,
    marginBottom: 6,
    marginTop: 16,
  },
  input: {
    width: "100%",
    padding: "14px 12px",
    marginBottom: 12,
    background: "#000",
    border: "1px solid #3b7fc2",
    color: "#fff",
    fontSize: 13,
  },
  button: {
    width: "100%",
    padding: 14,
    background: "#4f93d6",
    border: "none",
    color: "#fff",
    fontWeight: "bold",
    letterSpacing: 1.2,
    cursor: "pointer",
    marginTop: 18,
  },
  error: {
    marginTop: 12,
    color: "#ff6b6b",
  },
};
