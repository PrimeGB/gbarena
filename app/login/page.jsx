"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

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
      const metadataUsername =
        data.user.user_metadata?.username || data.user.user_metadata?.display_name || "";
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

    // SHOW SUCCESS SCREEN FIRST
    setSuccess(true);

    // DELAY REDIRECT (FEELS MORE GAMEBATTLES STYLE)
    setTimeout(() => {
      router.push("/");
    }, 1200);
  }

  return (
    <div style={styles.page}>
      <div style={styles.box}>
        <h2 style={{ color: "#7fc0ff" }}>GameBattles Login</h2>

        {success ? (
          <div style={{ color: "#00ff88", marginBottom: 10 }}>
            Login successful... redirecting
          </div>
        ) : (
          <form
            autoComplete="off"
            onSubmit={(e) => {
              e.preventDefault();
              handleLogin();
            }}
          >
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

            <button type="submit" style={styles.button}>
              {loading ? "Logging in..." : "Login"}
            </button>

            {error && <p style={{ color: "red" }}>{error}</p>}
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
};