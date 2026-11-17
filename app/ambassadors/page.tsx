"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Ambassador = {
  user_id: string;
  username: string | null;
  tier: "affiliate" | "ambassador" | "icon";
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
  recruits: number;
  qualified: number;
  since: string;
};

const TIER_LABEL = { affiliate: "Affiliate", ambassador: "Ambassador", icon: "Icon" } as const;
const TIER = {
  affiliate: { c: "#9fc2e2", ring: "conic-gradient(#e8f4ff,#9fc2e2,#37536e,#e8f4ff)" },
  ambassador: { c: "#f2c14e", ring: "conic-gradient(#ffe9ab,#f2c14e,#7a4a08,#ffe9ab)" },
  icon: { c: "#ff7a3c", ring: "conic-gradient(#ffd9a0,#ff7a3c,#73380f,#ffd9a0)" },
} as const;

function socialLinks(a: Ambassador) {
  return [
    { label: "Twitch", short: "TW", url: a.twitch },
    { label: "YouTube", short: "YT", url: a.youtube },
    { label: "TikTok", short: "TT", url: a.tiktok },
    { label: "Kick", short: "KC", url: a.kick },
    { label: "Instagram", short: "IG", url: a.instagram },
    { label: "Discord", short: "DC", url: a.discord },
  ].filter((s) => s.url);
}

export default function AmbassadorsPage() {
  const [rows, setRows] = useState<Ambassador[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState("");

  useEffect(() => {
    let active = true;
    void supabase.rpc("gb_ambassador_directory").then(({ data }) => {
      if (!active) return;
      setRows((data || []) as Ambassador[]);
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const featured = rows.find((r) => r.featured);
  const totalRecruits = rows.reduce((n, r) => n + r.recruits, 0);

  async function copyLink(a: Ambassador) {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/amb/${a.slug}`);
      setCopied(a.slug);
      window.setTimeout(() => setCopied(""), 1800);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <main className="ambp">
      <section className="hero">
        <span className="kicker">Creator Program</span>
        <h1>GB <em>Ambassadors</em></h1>
        <p>
          The streamers and creators building the GameBattles community. Ambassadors get their own tracked
          recruit link, exclusive awards, a gold profile and events hosted in their name.
        </p>
        <div className="cta-row">
          <Link className="btn-gold" href="/support">Apply to become an Ambassador</Link>
          <Link className="btn-ghost" href="/home">Back to Home</Link>
        </div>
      </section>

      <div className="shell">
        <div className="strip">
          <div><b>{rows.length}</b><span>Active Ambassadors</span></div>
          <div><b>{totalRecruits}</b><span>Players recruited</span></div>
          <div><b>3</b><span>Program tiers</span></div>
          <div><b>★</b><span>Exclusive awards</span></div>
        </div>

        {featured && (
          <>
            <h2 className="sec">Ambassador Spotlight</h2>
            <div className="spotlight">
              <div className="spot-avatar"><span className="spot-crown">👑</span><div className="ph">{(featured.username || "GB").slice(0, 2).toUpperCase()}</div></div>
              <div className="spot-info">
                <span className="amb-chip">★ Featured Ambassador</span>
                <h3><Link href={`/profile?userId=${featured.user_id}`}>{featured.username}</Link></h3>
                {featured.tagline && <div className="sub">{featured.tagline}</div>}
                {featured.blurb && <p>{featured.blurb}</p>}
              </div>
              <div className="spot-side">
                <div className="big">{featured.recruits}</div>
                <div className="lbl">Players recruited</div>
                {featured.twitch && <a className="live" href={featured.twitch} target="_blank" rel="noopener noreferrer"><i /> WATCH ON TWITCH</a>}
              </div>
            </div>
          </>
        )}

        <h2 className="sec">Our Ambassadors</h2>
        {loading ? (
          <p className="muted">Loading ambassadors...</p>
        ) : rows.length === 0 ? (
          <div className="empty">
            <h3>The first class is being selected</h3>
            <p>
              We&apos;re hand-picking the streamers and creators who will represent GameBattles.
              Think that&apos;s you? Reach out through <Link href="/support">Support</Link> with your channel
              and the games you play.
            </p>
          </div>
        ) : (
          <div className="grid">
            {rows.map((a) => {
              const t = TIER[a.tier];
              return (
                <article key={a.user_id} className="card" style={{ ["--tier" as string]: t.c, ["--ring" as string]: t.ring }}>
                  <div className="av"><div className="ph">{(a.username || "GB").slice(0, 2).toUpperCase()}</div></div>
                  <span className="tier-tag">{TIER_LABEL[a.tier]}</span>
                  <h4><Link href={`/profile?userId=${a.user_id}`}>{a.username}</Link></h4>
                  {a.tagline && <div className="game">{a.tagline}</div>}
                  <div className="stats">
                    <div><b>{a.recruits}</b><span>Recruits</span></div>
                    <div><b>{a.qualified}</b><span>Qualified</span></div>
                  </div>
                  {socialLinks(a).length > 0 && (
                    <div className="socials">
                      {socialLinks(a).map((s) => (
                        <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer" title={s.label}>{s.short}</a>
                      ))}
                    </div>
                  )}
                  <button className="code" onClick={() => void copyLink(a)} title="Copy their recruit link">
                    {copied === a.slug ? "Link copied!" : <>Recruit link: <b>/amb/{a.slug}</b></>}
                  </button>
                </article>
              );
            })}
          </div>
        )}

        <h2 className="sec">Program Tiers</h2>
        <div className="tiers">
          <div className="tier t1">
            <h5>Affiliate</h5>
            <div className="req">The first step for active creators</div>
            <ul>
              <li>Personal recruit link, every signup tracked</li>
              <li>GB Affiliate award on your profile</li>
              <li>Listed on this page with your stream links</li>
            </ul>
          </div>
          <div className="tier t2">
            <span className="pop">Gold status</span>
            <h5>Ambassador</h5>
            <div className="req">Proven recruiters and consistent creators</div>
            <ul>
              <li>Everything in Affiliate</li>
              <li>GB Ambassador award</li>
              <li>Gold ambassador badge on your profile</li>
              <li>Spotlight placement on this page</li>
            </ul>
          </div>
          <div className="tier t3">
            <h5>Icon</h5>
            <div className="req">The faces of GameBattles</div>
            <ul>
              <li>Everything in Ambassador</li>
              <li>Exclusive GB Icon award</li>
              <li>Events hosted in your name</li>
              <li>Featured spotlight with your stream</li>
            </ul>
          </div>
        </div>

        <p className="note">
          Want in? Send us your channel and the games you play through <Link href="/support">Support</Link>.
          The Founder reviews every application.
        </p>
      </div>
      <style>{`
        .ambp{min-height:100vh;background:#05090f;color:#d7e2ee;font-family:Tahoma,Verdana,Arial,sans-serif;padding-bottom:60px}
        .hero{position:relative;padding:54px 24px 56px;text-align:center;background:radial-gradient(ellipse at 50% -20%,#3a2b06 0%,transparent 55%),radial-gradient(ellipse at 15% 110%,#200909 0%,transparent 50%),radial-gradient(ellipse at 85% 110%,#09131f 0%,transparent 55%),linear-gradient(180deg,#0d1726,#070d15)}
        .hero::before{content:"";position:absolute;inset:0;background-image:linear-gradient(#f2c14e11 1px,transparent 1px),linear-gradient(90deg,#f2c14e11 1px,transparent 1px);background-size:44px 44px;mask-image:radial-gradient(ellipse at 50% 0%,#000,transparent 75%);pointer-events:none}
        .kicker{display:inline-flex;align-items:center;gap:10px;color:#f2c14e;font-size:11px;font-weight:900;letter-spacing:.3em;text-transform:uppercase}
        .kicker::before,.kicker::after{content:"";width:34px;height:2px;background:linear-gradient(90deg,transparent,#f2c14e)}
        .kicker::after{transform:scaleX(-1)}
        .hero h1{margin:14px 0 6px;font-size:46px;color:#fff;letter-spacing:.02em;text-transform:uppercase;text-shadow:0 0 34px #f2c14e55}
        .hero h1 em{font-style:normal;background:linear-gradient(180deg,#ffe9ab,#f2c14e 55%,#9a6510);-webkit-background-clip:text;background-clip:text;color:transparent}
        .hero p{max-width:620px;margin:10px auto 0;color:#9fb4c8;font-size:14px;line-height:1.7}
        .cta-row{margin-top:24px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
        .btn-gold{padding:13px 26px;border-radius:4px;background:linear-gradient(180deg,#ffdf8e,#e0a020);color:#231600;font-size:12px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;text-decoration:none;box-shadow:0 10px 26px #e0a02044}
        .btn-ghost{padding:13px 26px;border-radius:4px;border:1px solid #37536e;color:#cfe0f0;font-size:12px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;text-decoration:none}
        .shell{max-width:1060px;margin:0 auto;padding:0 20px}
        .strip{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:-28px;position:relative;z-index:2}
        .strip div{background:linear-gradient(180deg,#0f1f31,#0a1522);border:1px solid #23415d;border-radius:10px;padding:16px 18px;text-align:center}
        .strip b{display:block;color:#f2c14e;font-size:22px}
        .strip span{color:#8fa9c2;font-size:10px;font-weight:bold;letter-spacing:.08em;text-transform:uppercase}
        .sec{display:flex;align-items:center;gap:14px;margin:48px 0 18px;color:#e5c573;font-size:14px;letter-spacing:.14em;text-transform:uppercase}
        .sec::after{content:"";flex:1;height:1px;background:linear-gradient(90deg,#44341033,#f2c14e55,transparent)}
        .muted{color:#7f9ab3;font-size:13px}
        .empty{padding:34px;border-radius:12px;border:1px dashed #37536e;background:#0a1522;text-align:center}
        .empty h3{margin:0 0 8px;color:#f2c14e;font-size:18px}
        .empty p{margin:0 auto;max-width:480px;color:#a8bdcd;font-size:13px;line-height:1.7}
        .empty a,.note a{color:#67bdff}
        .spotlight{position:relative;display:flex;gap:26px;align-items:center;flex-wrap:wrap;border-radius:14px;padding:26px 30px;overflow:hidden;background:linear-gradient(115deg,#1d1303 0%,#120d04 45%,#0a1320 100%);border:1px solid #6e5213}
        .spotlight::before{content:"";position:absolute;inset:0;background:radial-gradient(ellipse at 85% 20%,#f2c14e22,transparent 55%)}
        .spot-avatar{position:relative;width:110px;height:110px;flex:none;border-radius:50%;padding:4px;background:conic-gradient(#ffe9ab,#f2c14e,#8a5a00,#ffe9ab);box-shadow:0 0 34px #f2c14e66}
        .spot-avatar .ph{width:100%;height:100%;border-radius:50%;background:#15253a;display:grid;place-items:center;font-size:30px;font-weight:900;color:#f2c14e;border:3px solid #05090f}
        .spot-crown{position:absolute;top:-14px;left:50%;transform:translateX(-50%);font-size:22px;filter:drop-shadow(0 2px 4px #000)}
        .spot-info{flex:1;min-width:240px;position:relative}
        .amb-chip{display:inline-flex;align-items:center;gap:6px;padding:4px 11px;border-radius:999px;background:#f2c14e;color:#231600;font-size:9px;font-weight:900;letter-spacing:.14em;text-transform:uppercase}
        .spot-info h3{margin:9px 0 3px;font-size:24px}
        .spot-info h3 a{color:#fff;text-decoration:none}
        .spot-info .sub{color:#b99c54;font-size:11px;font-weight:bold;letter-spacing:.06em;text-transform:uppercase}
        .spot-info p{margin:10px 0 0;color:#a8bdcd;font-size:12.5px;line-height:1.6;max-width:460px}
        .spot-side{position:relative;text-align:right;flex:none}
        .spot-side .big{color:#f2c14e;font-size:30px;font-weight:900}
        .spot-side .lbl{color:#8fa9c2;font-size:9.5px;font-weight:bold;letter-spacing:.1em;text-transform:uppercase}
        .spot-side .live{display:inline-flex;align-items:center;gap:7px;margin-top:12px;padding:8px 14px;border-radius:4px;background:#e91916;color:#fff;font-size:10.5px;font-weight:900;letter-spacing:.06em;text-decoration:none}
        .spot-side .live i{width:7px;height:7px;border-radius:50%;background:#fff;animation:ambpulse 1.4s infinite}
        @keyframes ambpulse{50%{opacity:.3}}
        .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
        .card{position:relative;border-radius:12px;background:linear-gradient(180deg,#0e1d2e,#081220);border:1px solid #23415d;padding:22px 18px 16px;text-align:center;transition:.2s;overflow:hidden}
        .card::before{content:"";position:absolute;inset:0 0 auto 0;height:3px;background:var(--tier)}
        .card:hover{transform:translateY(-4px);border-color:var(--tier);box-shadow:0 14px 30px #0009}
        .card .av{width:74px;height:74px;margin:0 auto;border-radius:50%;padding:3px;background:var(--ring)}
        .card .av .ph{width:100%;height:100%;border-radius:50%;background:#14243a;display:grid;place-items:center;color:#cfe0f0;font-weight:900;font-size:22px;border:2px solid #05090f}
        .tier-tag{display:inline-block;margin-top:10px;padding:3px 10px;border-radius:999px;font-size:8.5px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:#05090f;background:var(--tier)}
        .card h4{margin:7px 0 2px;font-size:16px}
        .card h4 a{color:#fff;text-decoration:none}
        .card h4 a:hover{color:var(--tier)}
        .card .game{color:#8fa9c2;font-size:10.5px;font-weight:bold;text-transform:uppercase;letter-spacing:.05em}
        .card .stats{display:flex;justify-content:center;gap:22px;margin:12px 0}
        .card .stats b{display:block;color:var(--tier);font-size:16px}
        .card .stats span{color:#7f9ab3;font-size:9px;font-weight:bold;letter-spacing:.07em;text-transform:uppercase}
        .socials{display:flex;justify-content:center;gap:8px;flex-wrap:wrap}
        .socials a{display:grid;place-items:center;width:30px;height:30px;border-radius:7px;border:1px solid #2b4a68;color:#9fc2e2;font-size:11px;text-decoration:none;font-weight:900}
        .socials a:hover{border-color:var(--tier);color:var(--tier)}
        .card .code{display:block;width:100%;margin-top:12px;padding:8px;border-radius:6px;background:#050c13;border:1px dashed #2b4a68;color:#8fa9c2;font-size:10.5px;cursor:pointer;font-family:inherit}
        .card .code b{color:#f2c14e;letter-spacing:.04em}
        .card .code:hover{border-color:#f2c14e}
        .tiers{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
        .tier{border-radius:12px;padding:22px;border:1px solid #23415d;background:linear-gradient(180deg,#0e1d2e,#081220);position:relative}
        .tier h5{margin:0;font-size:15px;text-transform:uppercase;letter-spacing:.08em}
        .tier .req{color:#8fa9c2;font-size:10.5px;font-weight:bold;margin:3px 0 12px}
        .tier ul{list-style:none;margin:0;padding:0}
        .tier li{position:relative;padding:5px 0 5px 20px;color:#b9cde0;font-size:12px;line-height:1.5}
        .tier li::before{content:"✦";position:absolute;left:2px;color:var(--tc)}
        .t1{--tc:#9fc2e2}.t1 h5{color:#9fc2e2}
        .t2{--tc:#f2c14e}.t2 h5{color:#f2c14e}.t2{border-color:#6e5213;background:linear-gradient(180deg,#171103,#0b0e14)}
        .t3{--tc:#ff7a3c}.t3 h5{color:#ff7a3c}.t3{border-color:#73380f}
        .tier .pop{position:absolute;top:-10px;right:14px;background:#f2c14e;color:#231600;font-size:8.5px;font-weight:900;letter-spacing:.1em;padding:4px 9px;border-radius:999px;text-transform:uppercase}
        .note{margin-top:22px;color:#7f9ab3;font-size:12px;text-align:center}
        @media(max-width:820px){.grid,.tiers{grid-template-columns:1fr 1fr}.strip{grid-template-columns:1fr 1fr}}
        @media(max-width:520px){.grid,.tiers{grid-template-columns:1fr}.hero h1{font-size:34px}}
      `}</style>
    </main>
  );
}
