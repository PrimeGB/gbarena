"use client";

import { useEffect, useState } from "react";
import { useUser } from "../../lib/useUser";
import { supabase } from "../../lib/supabase";

type Profile = {
  username: string;
  email: string | null;
};

type CurrentUser = {
  id: string;
  email?: string | null;
};

export default function ProfilePage() {
  const { user, loading } = useUser();

  const currentUser = user as CurrentUser | null;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [usernameInput, setUsernameInput] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!currentUser) return;

    supabase
      .from("profiles")
      .select("username,email")
      .eq("id", currentUser.id)
      .single()
      .then(({ data }) => {
        setProfile(data || null);

        if (!data && currentUser.email) {
          setUsernameInput(currentUser.email.split("@")[0]);
        }
      });
  }, [currentUser]);

  async function handleSave() {
    if (!currentUser) return;

    setSaving(true);

    await supabase.from("profiles").insert([
      {
        id: currentUser.id,
        username: usernameInput,
        email: currentUser.email,
      },
    ]);

    setProfile({
      username: usernameInput,
      email: currentUser.email || null,
    });

    setSaving(false);
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!currentUser) {
    return <div>You must be logged in.</div>;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#000",
        color: "#fff",
        padding: "40px",
        fontFamily: "Tahoma",
      }}
    >
      {!profile ? (
        <div>
          <h1>Create Profile</h1>

          <input
            value={usernameInput}
            onChange={(e) => setUsernameInput(e.target.value)}
            placeholder="Username"
            style={{
              padding: "10px",
              width: "300px",
              marginTop: "20px",
            }}
          />

          <br />

          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              marginTop: "20px",
              padding: "10px 20px",
            }}
          >
            {saving ? "Saving..." : "Create Profile"}
          </button>
        </div>
      ) : (
        <div>
          <h1>{profile.username}</h1>
          <p>{profile.email}</p>
        </div>
      )}
    </div>
  );
}