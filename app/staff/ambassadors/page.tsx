"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";
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
const labels: Record<Tier, string> = { affiliate: "Affiliate", ambassador: "Ambassador" };

export default function StaffAmbassadorsPage() {
  const [rows, setRows] = useState<Creator[] | null>(null);
  const [apps, setApps] = useState<Application[] | null>(null);
  const [ideas, setIdeas] = useState<Record<Tier, string>>({ affiliate: "", ambassador: "" });
  const [ideasLoaded, setIdeasLoaded] = useState(false);
  const [username, setUsername] = useState("");
  const [tier, setTier] = useState<Tier>("affiliate");
  const [editing, setEditing] = useState<Creator | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    const [membersResult, appsResult] = await Promise.all([
      supabase.rpc("staff_ambassador_list"),
      supabase.rpc("staff_ambassador_applications"),
    ]);
    const errors = [membersResult.error, appsResult.error].filter(Boolean);
    if (errors.length) setError(errors.map((item) => item!.message).join(" · "));
    if (!membersResult.error) setRows((membersResult.data || []) as Creator[]);
    if (!appsResult.error) setApps((appsResult.data || []) as Application[]);
  }, []);

  useEffect(() => {
    void Promise.resolve().then(load);
    void supabase.rpc("staff_creator_ideas").then(({ data, error: ideasError }) => {
      if (ideasError) { setError(ideasError.message); return; }
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
    if (rpcError) setError(rpcError.message);
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
    if (rpcError) setError(rpcError.message);
    else { setNotice(`${editing.username}'s details were saved.`); setEditing(null); await load(); }
    setBusy(false);
  }

  async function remove(row: Creator) {
    if (!window.confirm(`Remove ${row.username} from the program? Their listing and link will stop working; earned awards stay.`)) return;
    setBusy(true); setError(""); setNotice("");
    const { error: rpcError } = await supabase.rpc("staff_ambassador_remove", { p_user: row.user_id });
    if (rpcError) setError(rpcError.message);
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
    if (rpcError) setError(rpcError.message);
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
    if (rpcError) setError(rpcError.message);
    else setNotice(`${labels[ideaTier]} ideas saved.`);
    setBusy(false);
  }

  const active = rows?.filter((row) => row.active) || [];
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
