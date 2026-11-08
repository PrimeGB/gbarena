"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "../../../../lib/useUser";
import { supabase } from "../../../../lib/supabase";
import SiteNav from "../../../components/SiteNav";
import TeamTabs from "../../../components/TeamTabs";

type TeamProfile = {
  id: string;
  name: string | null;
  tag: string | null;
  bio: string | null;
  logo_url: string | null;
  avatar_url: string | null;
  owner_id: string | null;
  platform: string | null;
  category: string | null;
  game: string | null;
  ladder: string | null;
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
        .select("id,name,tag,bio,logo_url,avatar_url,owner_id,platform,category,game,ladder")
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

    const cleanTag = teamTag.trim().toUpperCase();
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
    <main className="page team-editor">
      <div className="nav-shell">
        <SiteNav
          ladderHref={`/ladders/${team?.platform || "xbox"}/${team?.category || "call-of-duty"}/${team?.game || "modern-warfare-4"}`}
          tournamentHref={`/tournaments?platform=${team?.platform || "xbox"}&category=${team?.category || "call-of-duty"}&game=${team?.game || "modern-warfare-4"}`}
        />
        <div className="tabs-shell">
          <TeamTabs
            teamId={teamId}
            ladderHref={`/ladders/${team?.platform || "xbox"}/${team?.category || "call-of-duty"}/${team?.game || "modern-warfare-4"}/${team?.ladder || "team"}/rankings`}
            active="edit-profile"
            canEditProfile
            canEditRoster
          />
        </div>
      </div>

      <section className="panel">
        <header>
          <Link className="back-link" href={`/teams/${teamId}`}>← Back to team</Link>
          <div className="header-content">
            <div>
              <p className="eyebrow">TEAM SETTINGS</p>
              <h1>Edit team profile</h1>
              <p className="header-description">Give your team its own identity, on and off the ladder.</p>
            </div>
            {team && <span className="team-badge">{team.name || "Your team"}</span>}
          </div>
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
            <section className="form-section" aria-labelledby="team-details-heading">
              <div className="section-heading">
                <div><h2 id="team-details-heading">Team details</h2><p>The basics players see on your team profile.</p></div>
                <span>01</span>
              </div>
              <div className="details-grid">
                <label className="field">
                  <span>Team name</span>
                  <input value={team.name || ""} readOnly aria-readonly="true" aria-describedby="name-hint" />
                  <small id="name-hint">Name changes require staff approval. <Link href={`/teams/${teamId}/name-change`}>Request a change</Link></small>
                </label>
                <label className="field">
                  <span>Clan tag</span>
                  <input
                    value={teamTag}
                    onChange={(event) => setTeamTag(event.target.value.slice(0, 5).toUpperCase())}
                    maxLength={5}
                    required
                    aria-describedby="tag-hint"
                  />
                  <small id="tag-hint">1–5 characters</small>
                </label>
              </div>
              <label className="field bio-field">
                <span>Team bio <span className="optional">Optional</span></span>
                <textarea
                  value={teamBio}
                  onChange={(event) => setTeamBio(event.target.value)}
                  maxLength={1000}
                  rows={3}
                  placeholder="Tell players a little about your team..."
                  aria-describedby="bio-hint"
                />
                <small id="bio-hint">{teamBio.length} / 1,000 characters</small>
              </label>
            </section>

            <section className="form-section" aria-labelledby="team-images-heading">
              <div className="section-heading">
                <div><h2 id="team-images-heading">Team images</h2><p>Choose the images that represent your team.</p></div>
                <span>02</span>
              </div>
              <div className="uploads">
                <div className="upload-card">
                  <div className="upload-preview">
                    {team.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img loading="lazy" decoding="async" src={team.logo_url} alt="Current team logo" />
                    ) : <span aria-hidden="true">◇</span>}
                  </div>
                  <div className="upload-content">
                    <label htmlFor="team-logo">Team logo</label>
                    <p>{logoFile ? "New image selected" : team.logo_url ? "Current team logo" : "No logo uploaded yet"}</p>
                    <input id="team-logo" type="file" accept="image/*" onChange={(event) => setLogoFile(event.target.files?.[0] || null)} />
                  </div>
                </div>
                <div className="upload-card">
                  <div className="upload-preview avatar">
                    {team.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img loading="lazy" decoding="async" src={team.avatar_url} alt="Current team avatar" />
                    ) : <span aria-hidden="true">◇</span>}
                  </div>
                  <div className="upload-content">
                    <label htmlFor="team-avatar">Team avatar</label>
                    <p>{avatarFile ? "New image selected" : team.avatar_url ? "Current team avatar" : "No avatar uploaded yet"}</p>
                    <input id="team-avatar" type="file" accept="image/*" onChange={(event) => setAvatarFile(event.target.files?.[0] || null)} />
                  </div>
                </div>
              </div>
              <p className="upload-note">Choose a new image only if you want to replace the current one.</p>
            </section>

            {error && <p className="error message" role="alert">{error}</p>}
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
          padding: 12px 16px 10px;
          background: radial-gradient(ellipse at 50% 0, #122b40, #050c14 55%);
          color: #eaf6ff;
          font-family: Arial, Helvetica, sans-serif;
        }
        .nav-shell {
          max-width: 960px;
          margin: 0 auto 10px;
        }
        .tabs-shell {
          padding: 4px 0 0;
        }
        .panel {
          max-width: 960px;
          margin: 0 auto;
          overflow: hidden;
          border: 1px solid #213d54;
          border-radius: 12px;
          background: #0a1724;
          box-shadow: 0 20px 60px #0008;
        }
        header {
          padding: 16px 24px;
          border-bottom: 1px solid #213b50;
          background: linear-gradient(120deg, #142d41, #0b1c2b);
        }
        .back-link {
          color: #a7c7dd;
          font-size: 12px;
          font-weight: 700;
          text-decoration: none;
        }
        .back-link:hover { color: #fff; }
        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 20px;
          margin-top: 12px;
        }
        .eyebrow {
          margin: 0 0 8px;
          color: #e5bf69;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: .14em;
        }
        h1 {
          margin: 0;
          color: #fff;
          font-size: clamp(24px, 3vw, 30px);
          font-weight: 800;
          letter-spacing: -.03em;
        }
        .header-description { margin: 5px 0 0; color: #a9bfd0; font-size: 13px; line-height: 1.5; }
        .team-badge { max-width: 40%; padding: 8px 12px; border: 1px solid #35546b; border-radius: 6px; color: #c9dbe8; font-size: 12px; font-weight: 700; overflow-wrap: anywhere; }
        form {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          column-gap: 28px;
          padding: 0 24px;
        }
        .form-section { min-width: 0; padding: 14px 0; }
        .section-heading { display: flex; justify-content: space-between; gap: 16px; margin-bottom: 16px; }
        .section-heading h2 { margin: 0; color: #edf5fb; font-size: 17px; font-weight: 800; }
        .section-heading p { margin: 6px 0 0; color: #91aabc; font-size: 12px; line-height: 1.5; }
        .section-heading > span { color: #658198; font-size: 11px; font-weight: 700; letter-spacing: .08em; }
        .details-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 18px; }
        .field {
          display: grid;
          gap: 8px;
          min-width: 0;
          color: #d7e6f0;
          font-size: 12px;
          font-weight: 700;
        }
        .bio-field { margin-top: 14px; }
        .optional { color: #7e9aaf; font-size: 11px; font-weight: 400; margin-left: 5px; }
        .field input, .field textarea {
          width: 100%;
          min-width: 0;
          border: 1px solid #304b60;
          border-radius: 6px;
          background: #07121d;
          color: #fff;
          padding: 12px 13px;
          font: 14px Arial, Helvetica, sans-serif;
        }
        .field input[readonly] {
          color: #a0b4c4;
          background: #101f2c;
        }
        .field textarea { resize: vertical; min-height: 78px; line-height: 1.5; }
        .field textarea::placeholder { color: #6f899c; }
        input:focus-visible, textarea:focus-visible, button:focus-visible, a:focus-visible { outline: 2px solid #8ccfff; outline-offset: 2px; }
        .field small { color: #91aabc; font-size: 11px; font-weight: 400; }
        .field small a { color: #8bcaf3; text-decoration: underline; }
        .uploads { display: grid; grid-template-columns: minmax(0, 1fr); gap: 10px; }
        .upload-card { display: flex; align-items: center; gap: 14px; min-width: 0; padding: 15px; border: 1px solid #294256; border-radius: 8px; background: #0c1c2a; }
        .upload-preview { display: flex; align-items: center; justify-content: center; flex: 0 0 68px; width: 68px; height: 68px; overflow: hidden; border: 1px solid #36566e; border-radius: 8px; background: #07131e; color: #7594a9; font-size: 26px; }
        .upload-preview.avatar { border-radius: 50%; }
        .upload-preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .upload-content { min-width: 0; flex: 1; }
        .upload-content label { display: block; color: #e6f0f7; font-size: 13px; font-weight: 700; }
        .upload-content p { margin: 5px 0 8px; color: #91aabc; font-size: 11px; }
        .upload-content input { width: 100%; min-width: 0; color: #a9c1d2; font-size: 11px; }
        .upload-content input::file-selector-button { margin-right: 8px; padding: 7px 10px; border: 1px solid #456780; border-radius: 4px; background: #172f42; color: #e8f4fc; font-size: 11px; font-weight: 700; cursor: pointer; }
        .upload-note { margin: 12px 0 0; color: #91aabc; font-size: 11px; line-height: 1.5; }
        .actions {
          grid-column: 1 / -1;
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 12px;
          padding: 14px 0 18px;
          border-top: 1px solid #203648;
        }
        .actions a, .actions button { display: inline-flex; min-height: 44px; align-items: center; justify-content: center; padding: 0 18px; border-radius: 6px; font-size: 12px; font-weight: 800; text-decoration: none; }
        .actions a { color: #c9dbe8; border: 1px solid #365269; }
        .actions button {
          border: 1px solid #e9c572;
          background: #e8c16c;
          color: #101a22;
          cursor: pointer;
        }
        .actions button:hover:not(:disabled) { background: #f4d28a; }
        .actions button:disabled {
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
          grid-column: 1 / -1;
          margin: 20px 0 0;
          padding: 12px;
          border: 1px solid #713f45;
          border-radius: 6px;
          background: #2a171c;
          font-size: 13px;
        }
        @media (max-width: 700px) {
          .page { padding: 12px 0 32px; }
          .nav-shell { width: 100%; margin-bottom: 12px; }
          .tabs-shell { padding: 0 4px; }
          .panel { border-radius: 8px; }
          header { padding: 22px 18px; }
          .header-content { align-items: flex-start; flex-direction: column; gap: 12px; margin-top: 24px; }
          .team-badge { max-width: 100%; }
          form { grid-template-columns: minmax(0, 1fr); padding: 0 18px; }
          .form-section { padding: 20px 0; border-bottom: 1px solid #203648; }
          .details-grid, .uploads { grid-template-columns: minmax(0, 1fr); }
          .actions { align-items: stretch; flex-direction: column-reverse; }
        }
      `}</style>
    </main>
  );
}
