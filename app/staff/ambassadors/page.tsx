"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";
import { CREATOR_THEMES, isCreatorTheme, type CreatorTheme } from "@/lib/creatorProfileStyles";
import StylePreview from "@/app/profile/creator-style/StylePreview";
import CreatorConceptGallery from "@/app/profile/creator-style/CreatorConceptGallery";
import StaffPlayerPicker from "../dashboard/StaffPlayerPicker";
import "./creator-management.css";

type Tier = "affiliate" | "ambassador";
type Creator = {
  user_id: string; username: string | null; tier: Tier; slug: string;
  tagline: string; blurb: string; twitch: string; youtube: string; tiktok: string;
  kick: string; instagram: string; discord: string; featured: boolean; active: boolean;
  recruits: number; qualified: number;
};
type Application = {
  id: number; user_id: string; username: string | null; channel: string; games: string;
  audience: string; pitch: string; status: "pending" | "approved" | "declined"; created_at: string;
};
type Idea = { tier: Tier; notes: string };
type StyleRequest = { id: number; user_id: string; username: string; tier: Tier; idea: string; status: "new" | "reviewed"; created_at: string };
const labels: Record<Tier, string> = { affiliate: "Affiliate", ambassador: "Ambassador" };
const errorMessage = (message: string) => message.startsWith("permission denied for function")
  ? "Your session cannot access this tool. Sign in again with your Founder account."
  : message;

export default function StaffAmbassadorsPage() {
  const { user, loading } = useUser();
  if (loading || !user) return <main className="creator-admin"><div className="creator-shell">
    <Link href="/staff/dashboard" className="creator-back">← Staff dashboard</Link>
    <header className="creator-heading"><h1>Affiliate &amp; Ambassador management</h1></header>
    {loading ? <p>Checking your account...</p> : <p>Please <Link href="/login">sign in</Link> with your Founder account to manage the creator program.</p>}
  </div></main>;
  return <CreatorManagement />;
}

function CreatorManagement() {
  const [rows, setRows] = useState<Creator[] | null>(null);
  const [apps, setApps] = useState<Application[] | null>(null);
  const [ideas, setIdeas] = useState<Record<Tier, string>>({ affiliate: "", ambassador: "" });
  const [ideasLoaded, setIdeasLoaded] = useState(false);
  const [requests, setRequests] = useState<StyleRequest[] | null>(null);
  const [styleUsername, setStyleUsername] = useState("");
  const [styleTheme, setStyleTheme] = useState<CreatorTheme>("gold");
  const [styleName, setStyleName] = useState(true);
  const [styleLogo, setStyleLogo] = useState(true);
  const [username, setUsername] = useState("");
  const [tier, setTier] = useState<Tier>("affiliate");
  const [editing, setEditing] = useState<Creator | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    const [membersResult, appsResult, requestsResult] = await Promise.all([
      supabase.rpc("staff_ambassador_list"),
      supabase.rpc("staff_ambassador_applications"),
      supabase.rpc("staff_creator_profile_requests"),
    ]);
    const errors = [membersResult.error, appsResult.error, requestsResult.error].filter(Boolean);
    if (errors.length) setError(errors.map((item) => errorMessage(item!.message)).join(" · "));
    if (!membersResult.error) setRows((membersResult.data || []) as Creator[]);
    if (!appsResult.error) setApps((appsResult.data || []) as Application[]);
    if (!requestsResult.error) setRequests((requestsResult.data || []) as StyleRequest[]);
  }, []);

  useEffect(() => {
    void Promise.resolve().then(load);
    void supabase.rpc("staff_creator_ideas").then(({ data, error: ideasError }) => {
      if (ideasError) { setError(errorMessage(ideasError.message)); return; }
      const saved = (data || []) as Idea[];
      setIdeas({
        affiliate: saved.find((item) => item.tier === "affiliate")?.notes || "",
        ambassador: saved.find((item) => item.tier === "ambassador")?.notes || "",
      });
      setIdeasLoaded(true);
    });
  }, [load]);

  async function assign(event: FormEvent) {
    event.preventDefault();
    if (!username.trim()) { setError("Enter a player's username."); return; }
    setBusy(true); setError(""); setNotice("");
    const { error: rpcError } = await supabase.rpc("staff_set_creator_tier", {
      p_username: username.trim(), p_tier: tier,
    });
    if (rpcError) setError(errorMessage(rpcError.message));
    else {
      setNotice(`${username.trim()} is now an active ${labels[tier]}.`);
      setUsername("");
      await load();
    }
    setBusy(false);
  }

  async function saveDetails(event: FormEvent) {
    event.preventDefault();
    if (!editing) return;
    setBusy(true); setError(""); setNotice("");
    const { error: rpcError } = await supabase.rpc("staff_ambassador_upsert", {
      p_username: editing.username, p_tier: editing.tier, p_slug: editing.slug.trim().toLowerCase(),
      p_tagline: editing.tagline, p_blurb: editing.blurb, p_twitch: editing.twitch,
      p_youtube: editing.youtube, p_tiktok: editing.tiktok, p_kick: editing.kick,
      p_instagram: editing.instagram, p_discord: editing.discord,
      p_featured: editing.featured, p_active: editing.active,
    });
    if (rpcError) setError(errorMessage(rpcError.message));
    else { setNotice(`${editing.username}'s details were saved.`); setEditing(null); await load(); }
    setBusy(false);
  }

  async function remove(row: Creator) {
    if (!window.confirm(`Remove ${row.username} from the program? Their listing and link will stop working; earned awards stay.`)) return;
    setBusy(true); setError(""); setNotice("");
    const { error: rpcError } = await supabase.rpc("staff_ambassador_remove", { p_user: row.user_id });
    if (rpcError) setError(errorMessage(rpcError.message));
    else { setNotice(`${row.username} was removed from the program.`); setEditing(null); await load(); }
    setBusy(false);
  }

  async function review(app: Application, status: "approved" | "declined") {
    let note = "";
    if (status === "declined") {
      const response = window.prompt(`Optional note to ${app.username}:`, "");
      if (response === null) return;
      note = response;
    }
    setBusy(true); setError(""); setNotice("");
    const { error: rpcError } = await supabase.rpc("staff_ambassador_application_review", {
      p_id: app.id, p_status: status, p_note: note,
    });
    if (rpcError) setError(errorMessage(rpcError.message));
    else {
      if (status === "approved") {
        setUsername(app.username || "");
        setTier("affiliate");
        setNotice(`${app.username} was approved. Choose a tier below and apply it to finish setting up their membership.`);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else setNotice(`${app.username}'s application was declined.`);
      await load();
    }
    setBusy(false);
  }

  async function saveIdea(ideaTier: Tier) {
    setBusy(true); setError(""); setNotice("");
    const { error: rpcError } = await supabase.rpc("staff_save_creator_idea", {
      p_tier: ideaTier, p_notes: ideas[ideaTier],
    });
    if (rpcError) setError(errorMessage(rpcError.message));
    else setNotice(`${labels[ideaTier]} ideas saved.`);
    setBusy(false);
  }

  const active = rows?.filter((row) => row.active) || [];
  const selectedStyleMember = active.find((row) => row.username?.toLowerCase() === styleUsername.trim().toLowerCase());
  async function assignStyle(event: FormEvent) {
    event.preventDefault();
    if (!selectedStyleMember) { setError("Choose an active Affiliate or Ambassador."); return; }
    setBusy(true); setError(""); setNotice("");
    const { error: rpcError } = await supabase.rpc("gb_save_creator_profile_style", {
      p_user: selectedStyleMember.user_id, p_theme: styleTheme, p_show_name: styleName, p_show_logo: styleLogo,
    });
    if (rpcError) setError(errorMessage(rpcError.message));
    else setNotice(`${selectedStyleMember.username}'s profile style was saved.`);
    setBusy(false);
  }
  async function reviewRequest(request: StyleRequest) {
    setBusy(true); setError(""); setNotice("");
    const next = request.status === "new" ? "reviewed" : "new";
    const { error: rpcError } = await supabase.rpc("staff_review_creator_profile_request", { p_id: request.id, p_status: next });
    if (rpcError) setError(errorMessage(rpcError.message));
    else { setNotice("Design request updated."); await load(); }
    setBusy(false);
  }
  const pending = apps?.filter((app) => app.status === "pending") || [];
  const selected = rows?.find((row) => row.username?.toLowerCase() === username.trim().toLowerCase());
  const updateEditing = (patch: Partial<Creator>) => setEditing((current) => current ? { ...current, ...patch } : null);

  return (
    <main className="creator-admin">
      <div className="creator-shell">
        <Link href="/staff/dashboard" className="creator-back">← Staff dashboard</Link>
        <header className="creator-heading">
          <p>CREATOR PROGRAM · FOUNDER</p>
          <h1>Affiliate &amp; Ambassador management</h1>
          <span>Find a player, choose their tier, and manage your creator community.</span>
        </header>
        {error && <p className="creator-error" role="alert">{error}</p>}
        {notice && <p className="creator-notice" role="status">{notice}</p>}

        <section className="creator-stats" aria-label="Program overview">
          {(["affiliate", "ambassador"] as Tier[]).map((group) => {
            const members = active.filter((row) => row.tier === group);
            return <div key={group} className="creator-stat">
              <h2>{labels[group]}s</h2>
              <div><span><b>{rows ? members.length : "—"}</b> Active</span>
                <span><b>{rows ? members.reduce((sum, row) => sum + row.recruits, 0) : "—"}</b> Recruits</span>
                <span><b>{rows ? members.reduce((sum, row) => sum + row.qualified, 0) : "—"}</b> Qualified</span></div>
            </div>;
          })}
          <p>Counts include all tracked referrals for currently active members, grouped by their current tier. Qualified players have verified their email and linked a gaming account.</p>
        </section>

        <div className="creator-columns">
          <section className="creator-section" id="assign">
            <h2>Assign or change a tier</h2>
            <p>Choose either tier at any time, even before a player earns it. New members get a referral link automatically.</p>
            <form onSubmit={assign} className="creator-form">
              <div><label>Find a player</label><StaffPlayerPicker value={username} onChange={setUsername} />
                {selected && <small>Current tier: {labels[selected.tier]}{!selected.active && " · inactive"}</small>}</div>
              <label>Choose a tier
                <select value={tier} onChange={(event) => setTier(event.target.value as Tier)}>
                  <option value="affiliate">Affiliate</option><option value="ambassador">Ambassador</option>
                </select>
              </label>
              <p className="creator-hint">Affiliates normally become Ambassadors at 65 qualified recruits. If you set an already-qualified player back to Affiliate, your choice stays in place.</p>
              <button className="creator-primary" disabled={busy}>{busy ? "Saving..." : "Apply tier"}</button>
            </form>
          </section>
          <section className="creator-section">
            <h2>Creator design ideas</h2>
            <p>Private Founder notes for future designs. Saving an idea does not change anyone&apos;s profile.</p>
            {(["affiliate", "ambassador"] as Tier[]).map((group) => <div className="creator-idea" key={group}>
              <label htmlFor={`idea-${group}`}>{group === "affiliate" ? "Affiliate · custom banners" : "Ambassador · full custom profiles"}</label>
              <textarea id={`idea-${group}`} rows={4} maxLength={10000} disabled={!ideasLoaded}
                value={ideas[group]} placeholder={group === "affiliate" ? "Save banner ideas here..." : "Save custom profile ideas here..."}
                onChange={(event) => setIdeas((current) => ({ ...current, [group]: event.target.value }))} />
              <button type="button" className="creator-secondary" disabled={busy || !ideasLoaded} onClick={() => void saveIdea(group)}>Save {labels[group]} ideas</button>
            </div>)}
          </section>
        </div>

        <section className="creator-section creator-vault">
          <div className="creator-section-head"><div><h2>Creator style vault</h2><p>Preview presets and assign a look. Affiliates receive the top section; Ambassadors receive the full profile styling.</p></div>
            <Link href="/profile/creator-style">Open member vault ↗</Link></div>
          <div className="creator-vault-grid">
            <StylePreview theme={styleTheme} name={selectedStyleMember?.username || "Example Player"} showName={styleName} showLogo={styleLogo} tier={selectedStyleMember?.tier || "ambassador"} />
            <form className="creator-form" onSubmit={assignStyle}>
              <div><label>Find an active creator</label><StaffPlayerPicker value={styleUsername} onChange={setStyleUsername} />
                {selectedStyleMember && <small>{labels[selectedStyleMember.tier]} · existing profile and logo are preserved</small>}</div>
              <label>Preset<select value={styleTheme} onChange={(event) => { if (isCreatorTheme(event.target.value)) setStyleTheme(event.target.value); }}>
                {CREATOR_THEMES.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select></label>
              <div className="creator-checks"><label><input type="checkbox" checked={styleName} onChange={(event) => setStyleName(event.target.checked)} disabled={styleTheme === "classic"} /> Name in background</label>
                <label><input type="checkbox" checked={styleLogo} onChange={(event) => setStyleLogo(event.target.checked)} disabled={styleTheme === "classic"} /> Profile logo in background</label></div>
              <button className="creator-primary" disabled={busy || !rows}>Apply profile style</button>
            </form>
          </div>
          <CreatorConceptGallery onSelect={setStyleTheme} />
          <h3 className="creator-request-title">Custom design requests {requests && `(${requests.filter((request) => request.status === "new").length} new)`}</h3>
          {!requests ? <p>Loading requests...</p> : requests.length === 0 ? <p>No custom design requests yet.</p> : requests.map((request) => <article className="creator-request" key={request.id}>
            <div className="creator-section-head"><div><Link href={`/profile?userId=${request.user_id}`}>{request.username}</Link>
              <small> · {labels[request.tier]} · {request.status === "new" ? "New" : "Reviewed"} · {new Date(request.created_at).toLocaleDateString()}</small></div>
              <button type="button" disabled={busy} onClick={() => void reviewRequest(request)}>{request.status === "new" ? "Mark reviewed" : "Mark new"}</button></div>
            <p>{request.idea}</p>
          </article>)}
        </section>

        <section className="creator-section creator-members">
          <div className="creator-section-head"><div><h2>Program members</h2><p>Change a tier above, or edit a member&apos;s profile details below.</p></div></div>
          {!rows ? <p>Loading members...</p> : rows.length === 0 ? <p>No members yet. Assign a tier above to add the first one.</p> :
            <div className="creator-member-list">{rows.map((row) => <article key={row.user_id} className="creator-member">
              <div className="creator-person"><Link href={`/profile?userId=${row.user_id}`}>{row.username || "Unknown player"}</Link>
                <span>{labels[row.tier]}{!row.active && " · Inactive"}{row.featured && " · Featured"}</span></div>
              <div className="creator-member-count"><b>{row.recruits}</b> recruits <b>{row.qualified}</b> qualified</div>
              <div className="creator-actions"><button type="button" onClick={() => { setUsername(row.username || ""); setTier(row.tier); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Change tier</button>
                <button type="button" onClick={() => setEditing(row)}>Edit details</button>
                <button type="button" className="creator-remove" disabled={busy} onClick={() => void remove(row)}>Remove</button></div>
            </article>)}</div>}
          {editing && <form className="creator-details creator-form" onSubmit={saveDetails}>
            <div className="creator-section-head"><h3>Details for {editing.username}</h3><button type="button" onClick={() => setEditing(null)}>Close</button></div>
            <div className="creator-details-grid">
              <label>Link name<input required value={editing.slug} onChange={(event) => updateEditing({ slug: event.target.value })} /></label>
              <label>Tagline<input maxLength={80} value={editing.tagline} onChange={(event) => updateEditing({ tagline: event.target.value })} /></label>
              <label className="creator-wide">About<textarea maxLength={500} rows={2} value={editing.blurb} onChange={(event) => updateEditing({ blurb: event.target.value })} /></label>
              {(["twitch", "youtube", "tiktok", "kick", "instagram", "discord"] as const).map((field) => <label key={field}>{field}
                <input maxLength={200} value={editing[field]} onChange={(event) => updateEditing({ [field]: event.target.value })} /></label>)}
            </div>
            <div className="creator-checks"><label><input type="checkbox" checked={editing.featured} onChange={(event) => updateEditing({ featured: event.target.checked })} /> Featured</label>
              <label><input type="checkbox" checked={editing.active} onChange={(event) => updateEditing({ active: event.target.checked })} /> Active</label></div>
            <button className="creator-primary" disabled={busy}>Save details</button>
          </form>}
        </section>

        <section className="creator-section creator-applications">
          <h2>Applications {apps && `(${pending.length} waiting)`}</h2>
          {!apps ? <p>Loading applications...</p> : pending.length === 0 ? <p>No applications waiting.</p> : pending.map((app) => <article className="creator-application" key={app.id}>
            <div className="creator-section-head"><Link href={`/profile?userId=${app.user_id}`}>{app.username}</Link>
              <small>{new Date(app.created_at).toLocaleDateString()}</small></div>
            <p><a href={app.channel} target="_blank" rel="noopener noreferrer">{app.channel}</a> · {app.games}{app.audience && ` · Audience: ${app.audience}`}</p>
            <p className="creator-pitch">{app.pitch}</p>
            <div className="creator-actions"><button type="button" disabled={busy} onClick={() => void review(app, "approved")}>Approve &amp; choose tier</button>
              <button type="button" className="creator-remove" disabled={busy} onClick={() => void review(app, "declined")}>Decline</button></div>
          </article>)}
        </section>
      </div>
    </main>
  );
}
