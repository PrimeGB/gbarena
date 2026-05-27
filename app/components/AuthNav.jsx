"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useUser } from "../../lib/useUser";

export default function AuthNav() {
  const { user, loading } = useUser();
  const [username, setUsername] = useState("");
  const [profileMissing, setProfileMissing] = useState(false);

  useEffect(() => {
    if (!user) {
      setUsername("");
      setProfileMissing(false);
      return;
    }

    const metadataUsername =
      user.user_metadata?.display_name || user.user_metadata?.username;
    if (metadataUsername) {
      setUsername(metadataUsername);
      setProfileMissing(false);
      return;
    }

    supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .single()
      .then(async ({ data, error }) => {
        if (data?.username) {
          setUsername(data.username);
          setProfileMissing(false);
          return;
        }

        if (error || !data) {
          setUsername("");
          setProfileMissing(true);
          return;
        }
      });
  }, [user]);

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  return (
    <div className="top-right-group">
      {loading ? (
        <span className="top-btn">Loading...</span>
      ) : user ? (
        <>
          <a className="top-btn" href="/profile">
            {profileMissing ? "Complete profile" : `Hi, ${username || "Profile"}`}
          </a>
          <span className="top-sep">|</span>
          <button
            type="button"
            className="top-btn"
            onClick={handleLogout}
            style={{ background: "none", border: "none", padding: 0 }}
          >
            Logout
          </button>
        </>
      ) : (
        <>
          <a className="top-btn" href="/login">
            Login
          </a>
          <span className="top-sep">|</span>
          <a className="top-btn" href="/join">
            Join
          </a>
        </>
      )}
    </div>
  );
}
