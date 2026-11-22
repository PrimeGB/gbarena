"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import StaffPlayerPicker from "../dashboard/StaffPlayerPicker";

type Ambassador = {
  user_id: string;
  username: string | null;
  tier: "affiliate" | "ambassador";
  slug: string;
  tagline: string;
  blurb: string;
  twitch: string;
  youtube: string;
  tiktok: string;
  kick: string;
  instagram: string;
  discord: string;
  featured: boolean;
  active: boolean;
  recruits: number;
  qualified: number;
  since: string;
};

type Application = {
  id: number;
  user_id: string;
  username: string | null;
  channel: string;
  twitch: string;
  youtube: string;
  tiktok: string;
  kick: string;
  instagram: string;
  discord: string;
  games: string;
  audience: string;
  pitch: string;
  status: "pending" | "approved" | "declined";
  created_at: string;
};

type FormState = {
  username: string;
  tier: Ambassador["tier"];
  slug: string;
  tagline: string;
  blurb: string;
  twitch: string;
  youtube: string;
  tiktok: string;
  kick: string;
  instagram: string;
  discord: string;
  featured: boolean;
  active: boolean;
};

const EMPTY: FormState = {
  username: "", tier: "affiliate", slug: "", tagline: "", blurb: "",
  twitch: "", youtube: "", tiktok: "", kick: "", instagram: "", discord: "",
  featured: false, active: true,
};

const TIER_LABEL = { affiliate: "Affiliate", ambassador: "Ambassador" } as const;
const TIER_COLOR = { affiliate: "#9fc2e2", ambassador: "#f2c14e" } as const;

export default function StaffAmbassadorsPage() {
  const [rows, setRows] = useState<Ambassador[]>([]);
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [editing, setEditing] = useState(false);

  const load = useCallback(async () => {
    const [{ data, error: rpcError }, { data: appData }] = await Promise.all([
      supabase.rpc("staff_ambassador_list"),
      supabase.rpc("staff_ambassador_applications"),
    ]);
    if (rpcError) setError(rpcError.message);
    else {
      setError("");
      setRows((data || []) as Ambassador[]);
    }
    setApps((appData || []) as Application[]);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const set = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));

  function startEdit(r: Ambassador) {
    setEditing(true);
    setForm({
      username: r.username || "", tier: r.tier, slug: r.slug, tagline: r.tagline,
      blurb: r.blurb, twitch: r.twitch, youtube: r.youtube, tiktok: r.tiktok,
      kick: r.kick, instagram: r.instagram, discord: r.discord,
      featured: r.featured, active: r.active,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function save() {
    if (!form.username.trim()) { setError("Enter the player's username."); return; }
    if (!form.slug.trim()) { setError("Enter a link name, like sharpz, for gamebattles.app/amb/sharpz."); return; }
    setBusy(true);
    setError("");
    setNotice("");
    const { error: rpcError } = await supabase.rpc("staff_ambassador_upsert", {
      p_username: form.username.trim(),
      p_tier: form.tier,
      p_slug: form.slug.trim().toLowerCase(),
      p_tagline: form.tagline.trim(),
      p_blurb: form.blurb.trim(),
      p_twitch: form.twitch.trim(),
      p_youtube: form.youtube.trim(),
      p_tiktok: form.tiktok.trim(),
      p_kick: form.kick.trim(),
      p_instagram: form.instagram.trim(),
      p_discord: form.discord.trim(),
      p_featured: form.featured,
      p_active: form.active,
    });
    setBusy(false);
    if (rpcError) { setError(rpcError.message); return; }
    setNotice(`${form.username.trim()} saved as ${TIER_LABEL[form.tier]}. Their award and /amb/${form.slug.trim().toLowerCase()} link are live.`);
    setForm(EMPTY);
    setEditing(false);
    await load();
  }

  async function remove(r: Ambassador) {
    if (!window.confirm(`Remove ${r.username} from the Ambassador program? Their listing, flair and link go away (earned awards stay).`)) return;
    setBusy(true);
    const { error: rpcError } = await supabase.rpc("staff_ambassador_remove", { p_user: r.user_id });
    setBusy(false);
    if (rpcError) { setError(rpcError.message); return; }
    setNotice(`${r.username} removed from the program.`);
    await load();
  }

  async function reviewApp(app: Application, status: "approved" | "declined") {
    let note = "";
    if (status === "declined") {
      note = window.prompt(`Optional note to ${app.username} (sent with the decline message):`, "") || "";
    }
    setBusy(true);
    const { error: rpcError } = await supabase.rpc("staff_ambassador_application_review", {
      p_id: app.id,
      p_status: status,
      p_note: note,
    });
    setBusy(false);
    if (rpcError) { setError(rpcError.message); return; }
    if (status === "approved") {
      // Prefill the appoint form from the application so one click finishes the job.
      setEditing(false);
      setForm({
        ...EMPTY,
        username: app.username || "",
        slug: (app.username || "").toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 24),
        tagline: app.games.slice(0, 80),
        twitch: app.twitch, youtube: app.youtube, tiktok: app.tiktok,
        kick: app.kick, instagram: app.instagram, discord: app.discord,
      });
      setNotice(`${app.username} approved and messaged. The appoint form is prefilled - set the tier and hit Appoint ambassador.`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setNotice(`${app.username}'s application declined. They were messaged.`);
    }
    await load();
  }

  const pendingApps = apps.filter((a) => a.status === "pending");

  const activeRows = rows.filter((r) => r.active);
  const inactiveRows = rows.filter((r) => !r.active);

  return (
    <main className="amb-admin">
      <div className="wrap">
        <Link href="/staff/dashboard" className="back">← Staff dashboard</Link>
        <header className="head">
          <div>
            <h1>Ambassador Program</h1>
            <p>Founder only. Appoint creators, set their tier and links - their award, gold profile and tracked referral link apply instantly. Big names can be appointed straight to any tier.</p>
          </div>
          <div className="counts">
            <div><b>{activeRows.length}</b><span>Active</span></div>
            <div><b>{rows.reduce((n, r) => n + r.recruits, 0)}</b><span>Recruits</span></div>
            <div><b>{rows.reduce((n, r) => n + r.qualified, 0)}</b><span>Qualified</span></div>
          </div>
        </header>

        {error && <p className="err" role="alert">{error}</p>}
        {notice && <p className="ok" role="status">{notice}</p>}

        {pendingApps.length > 0 && (
          <section className="panel apps">
            <h2>Applications ({pendingApps.length} waiting)</h2>
            <div className="list">
              {pendingApps.map((a) => (
                <article key={a.id} className="app">
                  <div className="app-head">
                    <h3><Link href={`/profile?userId=${a.user_id}`}>{a.username}</Link></h3>
                    <span className="app-when">{new Date(a.created_at).toLocaleDateString([], { month: "short", day: "numeric" })}</span>
                  </div>
                  <div className="app-meta">
                    <a href={a.channel} target="_blank" rel="noopener noreferrer">{a.channel}</a>
                    <span>{a.games}</span>
                    {a.audience && <span>Audience: {a.audience}</span>}
                  </div>
                  <p className="app-pitch">{a.pitch}</p>
                  <div className="actions">
                    <button className="gold" onClick={() => void reviewApp(a, "approved")} disabled={busy}>Approve &amp; prefill</button>
                    <button className="danger" onClick={() => void reviewApp(a, "declined")} disabled={busy}>Decline</button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        <section className="panel">
          <h2>{editing ? `Editing ${form.username || "ambassador"}` : "Appoint an ambassador"}</h2>
          <div className="grid">
            <label>Username
              {editing ? (
                <input value={form.username} disabled />
              ) : (
                <StaffPlayerPicker value={form.username} onChange={(v) => set({ username: v })} />
              )}
            </label>
            <label>Tier
              <select value={form.tier} onChange={(e) => set({ tier: e.target.value as FormState["tier"] })}>
                <option value="affiliate">Affiliate (entry)</option>
                <option value="ambassador">Ambassador (gold)</option>
              </select>
            </label>
            <label>Link name
              <input value={form.slug} onChange={(e) => set({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })} placeholder="sharpz → /amb/sharpz" />
            </label>
            <label>Tagline
              <input value={form.tagline} onChange={(e) => set({ tagline: e.target.value })} placeholder="Battlefield 6 · PC" maxLength={80} />
            </label>
            <label className="full">About (shows on their card)
              <textarea value={form.blurb} onChange={(e) => set({ blurb: e.target.value })} rows={2} maxLength={500} placeholder="Short intro shown on the Ambassadors page" />
            </label>
            <label>Twitch URL<input value={form.twitch} onChange={(e) => set({ twitch: e.target.value })} placeholder="https://twitch.tv/..." /></label>
            <label>YouTube URL<input value={form.youtube} onChange={(e) => set({ youtube: e.target.value })} placeholder="https://youtube.com/@..." /></label>
            <label>TikTok URL<input value={form.tiktok} onChange={(e) => set({ tiktok: e.target.value })} placeholder="https://tiktok.com/@..." /></label>
            <label>Kick URL<input value={form.kick} onChange={(e) => set({ kick: e.target.value })} placeholder="https://kick.com/..." /></label>
            <label>Instagram URL<input value={form.instagram} onChange={(e) => set({ instagram: e.target.value })} placeholder="https://instagram.com/..." /></label>
            <label>Discord invite<input value={form.discord} onChange={(e) => set({ discord: e.target.value })} placeholder="https://discord.gg/..." /></label>
          </div>
          <div className="row">
            <label className="check"><input type="checkbox" checked={form.featured} onChange={(e) => set({ featured: e.target.checked })} /> Featured (Ambassador of the Month spotlight)</label>
            <label className="check"><input type="checkbox" checked={form.active} onChange={(e) => set({ active: e.target.checked })} /> Active (shown on the public page)</label>
            <span className="spacer" />
            {editing && <button className="ghost" onClick={() => { setForm(EMPTY); setEditing(false); }}>Cancel</button>}
            <button className="gold" onClick={() => void save()} disabled={busy}>{busy ? "Saving..." : editing ? "Save changes" : "Appoint ambassador"}</button>
          </div>
        </section>

        <section className="panel">
          <h2>Current ambassadors</h2>
          {loading ? <p className="muted">Loading...</p> : activeRows.length === 0 ? (
            <p className="muted">No ambassadors yet. Appoint your first above - they get the award, gold profile and tracked link right away.</p>
          ) : (
            <div className="list">
              {activeRows.map((r) => (
                <article key={r.user_id} className="card" style={{ ["--tc" as string]: TIER_COLOR[r.tier] }}>
                  <div className="who">
                    <span className="tier">{TIER_LABEL[r.tier]}</span>
                    {r.featured && <span className="feat">★ Featured</span>}
                    <h3><Link href={`/profile?userId=${r.user_id}`}>{r.username}</Link></h3>
                    <span className="tag">{r.tagline || "No tagline"}</span>
                  </div>
                  <div className="nums">
                    <div><b>{r.recruits}</b><span>Recruits</span></div>
                    <div><b>{r.qualified}</b><span>Qualified</span></div>
                  </div>
                  <div className="linkbox">gamebattles.app/amb/<b>{r.slug}</b></div>
                  <div className="actions">
                    <button className="ghost" onClick={() => startEdit(r)}>Edit</button>
                    <button className="danger" onClick={() => void remove(r)} disabled={busy}>Remove</button>
                  </div>
                </article>
              ))}
            </div>
          )}
          {inactiveRows.length > 0 && (
            <details className="inactive">
              <summary>Inactive ({inactiveRows.length})</summary>
              {inactiveRows.map((r) => (
                <div key={r.user_id} className="inrow">
                  <span>{r.username} · {TIER_LABEL[r.tier]} · /amb/{r.slug}</span>
                  <button className="ghost" onClick={() => startEdit(r)}>Edit</button>
                  <button className="danger" onClick={() => void remove(r)}>Remove</button>
                </div>
              ))}
            </details>
          )}
        </section>
      </div>
      <style>{`
        .amb-admin{min-height:100vh;background:radial-gradient(circle at 50% -10%,#2b2208 0,#0a1420 45%,#05090f 100%);padding:26px 16px 60px;color:#d7e2ee;font-family:Tahoma,Verdana,Arial,sans-serif}
        .wrap{max-width:980px;margin:0 auto}
        .back{color:#f2c14e;font-size:12px;text-decoration:none}
        .head{display:flex;justify-content:space-between;align-items:center;gap:20px;flex-wrap:wrap;margin:12px 0 16px;padding:22px 24px;border:1px solid #6e5213;border-radius:12px;background:linear-gradient(115deg,#171103,#0b111c)}
        .head h1{margin:0 0 6px;color:#f2c14e;font-size:24px}
        .head p{margin:0;color:#a8bdcd;font-size:12.5px;line-height:1.6;max-width:540px}
        .counts{display:flex;gap:10px}
        .counts div{min-width:84px;padding:10px 12px;text-align:center;border-radius:10px;background:#050c13;border:1px solid #23415d}
        .counts b{display:block;color:#f2c14e;font-size:20px}
        .counts span{color:#8fa9c2;font-size:9.5px;font-weight:bold;letter-spacing:.08em;text-transform:uppercase}
        .err{padding:10px 14px;border-radius:8px;background:#2a0b0f;border:1px solid #7a2733;color:#ff9aa4;font-size:12.5px}
        .ok{padding:10px 14px;border-radius:8px;background:#0b2a18;border:1px solid #277a45;color:#7df0b6;font-size:12.5px}
        .panel{margin-top:18px;padding:20px 22px;border-radius:12px;border:1px solid #23415d;background:linear-gradient(180deg,#0e1d2e,#081220)}
        .panel h2{margin:0 0 14px;color:#e5c573;font-size:13px;letter-spacing:.1em;text-transform:uppercase}
        .grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}
        .grid label{display:flex;flex-direction:column;gap:5px;color:#8fa9c2;font-size:10.5px;font-weight:bold;letter-spacing:.05em;text-transform:uppercase}
        .grid label.full{grid-column:1/-1}
        .grid input,.grid select,.grid textarea{padding:9px 11px;border-radius:7px;border:1px solid #2b4a68;background:#050c13;color:#e8f1fa;font-size:13px;font-family:inherit}
        .grid input:focus,.grid select:focus,.grid textarea:focus{outline:none;border-color:#f2c14e}
        .grid input:disabled{opacity:.55}
        .staff-player-picker{position:relative}
        .staff-player-picker input{width:100%;padding:9px 11px;border-radius:7px;border:1px solid #2b4a68;background:#050c13;color:#e8f1fa;font-size:13px;font-family:inherit}
        .staff-player-picker input:focus{outline:none;border-color:#f2c14e}
        .staff-player-picker ul{position:absolute;top:100%;left:0;right:0;z-index:30;margin:4px 0 0;padding:4px;list-style:none;background:#0a1522;border:1px solid #6e5213;border-radius:8px;max-height:230px;overflow:auto;box-shadow:0 14px 30px #000c}
        .staff-player-picker li{padding:9px 11px;border-radius:6px;color:#e8f1fa;font-size:13px;cursor:pointer;text-transform:none;letter-spacing:0;font-weight:normal}
        .staff-player-picker li[aria-selected="true"]{background:#2c2206;color:#ffdf8e}
        .staff-player-status{margin:4px 0 0;color:#8fa9c2;font-size:11px;text-transform:none;letter-spacing:0;font-weight:normal}
        .row{display:flex;align-items:center;gap:16px;flex-wrap:wrap;margin-top:14px}
        .check{display:flex;align-items:center;gap:7px;color:#b9cde0;font-size:12px}
        .spacer{flex:1}
        .gold{padding:11px 20px;border:none;border-radius:6px;background:linear-gradient(180deg,#ffdf8e,#e0a020);color:#231600;font-size:12px;font-weight:900;letter-spacing:.05em;text-transform:uppercase;cursor:pointer}
        .ghost{padding:10px 16px;border-radius:6px;border:1px solid #37536e;background:none;color:#cfe0f0;font-size:11px;font-weight:bold;cursor:pointer}
        .danger{padding:10px 16px;border-radius:6px;border:1px solid #7a2733;background:none;color:#ff9aa4;font-size:11px;font-weight:bold;cursor:pointer}
        .gold:disabled{opacity:.6;cursor:default}
        .muted{color:#7f9ab3;font-size:12.5px}
        .list{display:grid;gap:12px}
        .card{display:flex;align-items:center;gap:18px;flex-wrap:wrap;padding:14px 16px;border-radius:10px;border:1px solid #23415d;border-left:3px solid var(--tc);background:#0a1522}
        .who{flex:1;min-width:200px}
        .tier{display:inline-block;padding:2px 9px;border-radius:999px;background:var(--tc);color:#05090f;font-size:8.5px;font-weight:900;letter-spacing:.12em;text-transform:uppercase}
        .feat{margin-left:7px;color:#f2c14e;font-size:9.5px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}
        .who h3{margin:6px 0 2px;font-size:16px}
        .who h3 a{color:#fff;text-decoration:none}
        .who h3 a:hover{color:#f2c14e}
        .who .tag{color:#8fa9c2;font-size:11px}
        .nums{display:flex;gap:16px}
        .nums b{display:block;color:var(--tc);font-size:17px;text-align:center}
        .nums span{color:#7f9ab3;font-size:9px;font-weight:bold;letter-spacing:.07em;text-transform:uppercase}
        .linkbox{padding:7px 11px;border-radius:6px;background:#050c13;border:1px dashed #2b4a68;color:#8fa9c2;font-size:11px}
        .linkbox b{color:#f2c14e}
        .actions{display:flex;gap:8px}
        .inactive{margin-top:14px;color:#8fa9c2;font-size:12px}
        .inactive summary{cursor:pointer;font-weight:bold}
        .inrow{display:flex;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid #16293c}
        .inrow span{flex:1}
        .apps{border-color:#6e5213}
        .app{padding:14px 16px;border-radius:10px;border:1px solid #6e5213;background:#120e04}
        .app-head{display:flex;align-items:center;justify-content:space-between;gap:12px}
        .app-head h3{margin:0;font-size:15px}
        .app-head h3 a{color:#ffdf8e;text-decoration:none}
        .app-when{color:#8fa9c2;font-size:10.5px}
        .app-meta{display:flex;gap:14px;flex-wrap:wrap;margin:6px 0;color:#b9cde0;font-size:11.5px}
        .app-meta a{color:#67bdff;word-break:break-all}
        .app-pitch{margin:4px 0 10px;color:#cfdbe8;font-size:12.5px;line-height:1.6;white-space:pre-wrap}
        @media(max-width:640px){.grid{grid-template-columns:1fr}.card{flex-direction:column;align-items:flex-start}}
      `}</style>
    </main>
  );
}
