"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "../../../../lib/useUser";
import { supabase } from "../../../../lib/supabase";

type TeamProfile = {
  id: string;
  name: string | null;
  tag: string | null;
  bio: string | null;
  logo_url: string | null;
  avatar_url: string | null;
  owner_id: string | null;
};

function safeFileName(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase() || "png";
  return `${Date.now()}-${crypto.randomUUID()}.${extension}`;
}

export default function EditTeamProfilePage() {
  const params = useParams<{ teamId: string }>();
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const teamId = params.teamId;

  const [team, setTeam] = useState<TeamProfile | null>(null);
  const [teamName, setTeamName] = useState("");
  const [teamTag, setTeamTag] = useState("");
  const [teamBio, setTeamBio] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (userLoading) return;
    let cancelled = false;

    async function loadTeam() {
      setLoading(true);
      setError("");

      if (!user?.id) {
        setError("Sign in as this team's leader to edit its profile.");
        setLoading(false);
        return;
      }

      const { data, error: teamError } = await supabase
        .from("teams")
        .select("id,name,tag,bio,logo_url,avatar_url,owner_id")
        .eq("id", teamId)
        .maybeSingle();

      if (cancelled) return;
      if (teamError) {
        setError(`Team profile could not be loaded: ${teamError.message}`);
        setLoading(false);
        return;
      }
      if (!data) {
        setError("Team not found.");
        setLoading(false);
        return;
      }

      const profile = data as TeamProfile;
      if (profile.owner_id !== user.id) {
        setError("Only the team leader can edit this team profile.");
        setLoading(false);
        return;
      }

      setTeam(profile);
      setTeamName(profile.name || "");
      setTeamTag(profile.tag || "");
      setTeamBio(profile.bio || "");
      setLoading(false);
    }

    loadTeam();
    return () => {
      cancelled = true;
    };
  }, [teamId, user?.id, userLoading]);

  async function uploadImage(file: File, folder: "logos" | "avatars") {
    const path = `${user!.id}/${folder}/${safeFileName(file)}`;
    const { error: uploadError } = await supabase.storage
      .from("team-assets")
      .upload(path, file, { cacheControl: "3600", upsert: false });

    if (uploadError) {
      throw new Error(`${folder === "logos" ? "Logo" : "Avatar"} upload failed: ${uploadError.message}`);
    }

    const { data } = supabase.storage.from("team-assets").getPublicUrl(path);
    return data.publicUrl;
  }

  async function saveTeam(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const cleanName = teamName.trim();
    const cleanTag = teamTag.trim().toUpperCase();
    if (cleanName.length < 4) {
      setError("Team name must be at least 4 characters.");
      return;
    }
    if (cleanTag.length < 1 || cleanTag.length > 5) {
      setError("Clan tag must be 1 to 5 characters.");
      return;
    }
    if (!user?.id || team?.owner_id !== user.id) {
      setError("Only the team leader can edit this team profile.");
      return;
    }

    setSaving(true);
    try {
      const logoUrl = logoFile ? await uploadImage(logoFile, "logos") : team.logo_url;
      const avatarUrl = avatarFile ? await uploadImage(avatarFile, "avatars") : team.avatar_url;

      const { error: updateError } = await supabase
        .from("teams")
        .update({
          name: cleanName,
          tag: cleanTag,
          bio: teamBio.trim(),
          logo_url: logoUrl,
          avatar_url: avatarUrl,
        })
        .eq("id", team.id)
        .eq("owner_id", user.id);

      if (updateError) {
        throw new Error(`Team profile could not be saved: ${updateError.message}`);
      }

      router.push(`/teams/${team.id}`);
      router.refresh();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Team profile could not be saved."
      );
      setSaving(false);
    }
  }

  return (
    <main className="page">
      <section className="panel">
        <header>
          <Link href={`/teams/${teamId}`}>Back to team profile</Link>
          <p>Team Controls</p>
          <h1>Edit Team Profile</h1>
        </header>

        {loading ? (
          <p className="state">Loading team profile…</p>
        ) : error && !team ? (
          <div className="state error">
            <p>{error}</p>
            <Link href={`/teams/${teamId}`}>Return to team profile</Link>
          </div>
        ) : team ? (
          <form onSubmit={saveTeam}>
            <label>
              Team name
              <input
                value={teamName}
                onChange={(event) => setTeamName(event.target.value)}
                maxLength={60}
                required
              />
            </label>

            <label>
              Clan tag
              <input
                value={teamTag}
                onChange={(event) =>
                  setTeamTag(event.target.value.slice(0, 5).toUpperCase())
                }
                maxLength={5}
                required
              />
            </label>

            <label>
              Team bio
              <textarea
                value={teamBio}
                onChange={(event) => setTeamBio(event.target.value)}
                maxLength={1000}
                rows={5}
              />
            </label>

            <div className="uploads">
              <label>
                Team logo
                {team.logo_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="preview" src={team.logo_url} alt="Current team logo" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => setLogoFile(event.target.files?.[0] || null)}
                />
              </label>

              <label>
                Team avatar
                {team.avatar_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="preview" src={team.avatar_url} alt="Current team avatar" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => setAvatarFile(event.target.files?.[0] || null)}
                />
              </label>
            </div>

            {error && <p className="error message">{error}</p>}
            <div className="actions">
              <Link href={`/teams/${teamId}`}>Cancel</Link>
              <button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save Team Profile"}
              </button>
            </div>
          </form>
        ) : null}
      </section>

      <style jsx>{`
        .page {
          min-height: 100vh;
          padding: 32px 16px;
          background: radial-gradient(circle at top, #173d5f, #02060a 65%);
          color: #eaf6ff;
          font-family: Tahoma, Verdana, Arial, sans-serif;
        }
        .panel {
          max-width: 760px;
          margin: 0 auto;
          border: 1px solid #2d6f9f;
          background: #071522;
          box-shadow: 0 0 34px #000c;
        }
        header {
          padding: 20px 24px;
          border-bottom: 1px solid #2d6f9f;
          background: linear-gradient(#153a57, #071522);
        }
        header a,
        .actions a {
          color: #9bd8ff;
          font-size: 12px;
          font-weight: 700;
          text-decoration: none;
        }
        header p {
          margin: 22px 0 4px;
          color: #b8dfff;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
        }
        h1 {
          margin: 0;
          color: #f2c14e;
          font-size: 26px;
          text-transform: uppercase;
        }
        form {
          display: grid;
          gap: 18px;
          padding: 24px;
        }
        label {
          display: grid;
          gap: 8px;
          color: #cfe2f2;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
        }
        input,
        textarea {
          width: 100%;
          border: 1px solid #315b7d;
          background: #02070c;
          color: #fff;
          padding: 10px;
          font: 14px Tahoma, Verdana, Arial, sans-serif;
        }
        textarea {
          resize: vertical;
        }
        input:focus,
        textarea:focus {
          outline: 1px solid #72b6e2;
          border-color: #72b6e2;
        }
        .uploads {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
        }
        .preview {
          width: 88px;
          height: 88px;
          object-fit: cover;
          border: 1px solid #315b7d;
          background: #02070c;
        }
        .actions {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 18px;
          padding-top: 8px;
        }
        button {
          border: 1px solid #e1b94e;
          background: linear-gradient(#d8af45, #76530c);
          color: #101010;
          padding: 11px 18px;
          font-weight: 900;
          text-transform: uppercase;
          cursor: pointer;
        }
        button:disabled {
          cursor: wait;
          opacity: 0.65;
        }
        .state {
          padding: 30px 24px;
          color: #cfe2f2;
          text-align: center;
        }
        .state a {
          display: inline-block;
          margin-top: 14px;
          color: #9bd8ff;
        }
        .error {
          color: #ff8585;
        }
        .message {
          margin: 0;
        }
        @media (max-width: 560px) {
          .uploads {
            grid-template-columns: 1fr;
          }
          .actions {
            align-items: stretch;
            flex-direction: column-reverse;
          }
          .actions a {
            text-align: center;
          }
        }
      `}</style>
    </main>
  );
}
