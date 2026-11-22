"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

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
  recruits: number;
  qualified: number;
  since: string;
};

export default function AmbassadorsPage() {
  const [rows, setRows] = useState<Ambassador[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void supabase.rpc("gb_ambassador_directory").then(({ data, error: rpcError }) => {
      if (!active) return;
      if (rpcError) setError("Unable to load program members. Please try again later.");
      else setRows((data || []) as Ambassador[]);
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const featured = rows.find((r) => r.featured && r.tier === "ambassador");
  const groups = [
    { tier: "ambassador" as const, label: "Ambassadors", credits: 3 },
    { tier: "affiliate" as const, label: "Affiliates", credits: 2 },
  ];

  return (
    <main className="ambp">
      <section className="hero">
        <span className="kicker">Creator Program</span>
        <h1>GB <em>Ambassadors &amp; Affiliates</em></h1>
        <p>
          Help grow GameBattles with your friends and community. Share your link, earn credits for
          qualified recruits, and unlock exclusive recognition as an Affiliate or Ambassador.
        </p>
        <div className="cta-row">
          <Link className="btn-gold" href="/ambassadors/apply">Apply Here</Link>
          <Link className="btn-gold" href="/ambassadors/perks">Perks of being an Ambassador / Affiliate</Link>
        </div>
      </section>

      <div className="shell">
        {error && <p className="error" role="alert">{error}</p>}
        {groups.map((group) => {
          const members = rows.filter((row) => row.tier === group.tier);
          return (
            <section key={group.tier} aria-label={`${group.label} statistics`}>
              <h2 className="sec">{group.label} at a glance</h2>
              <div className="strip">
                <Link className="stat-link" href={`/ambassadors/members/${group.tier}`}><b>{loading ? "..." : error ? "—" : members.length}</b><span>Active {group.label} →</span></Link>
                <div><b>{loading ? "..." : error ? "—" : members.reduce((n, r) => n + r.recruits, 0)}</b><span>Players recruited</span></div>
                <div><b>+{group.credits}</b><span>Credits per qualified recruit</span></div>
                <div><b>★</b><span>Exclusive awards</span></div>
              </div>
            </section>
          );
        })}
        <p className="qualification">Recruits earn their welcome credits after verifying their email and linking a qualifying gaming account. Their Affiliate or Ambassador earns 1 credit per qualified recruit.</p>

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

        <h2 className="sec">How we treat our Ambassadors</h2>
        <div className="perks">
          <div className="perk">
            <span className="perk-ic">🏆</span>
            <b>Tournaments in your name</b>
            <p>We can build and run tournaments named after you, so you can play with your community.</p>
          </div>
          <div className="perk">
            <span className="perk-ic">📅</span>
            <b>Events around your stream</b>
            <p>Community nights, viewer matches and ladder events scheduled around your streaming calendar.</p>
          </div>
          <div className="perk">
            <span className="perk-ic">✨</span>
            <b>Exclusive profile gear</b>
            <p>A glowing gold profile, ambassador-only awards and flair that nobody else on the site can earn.</p>
          </div>
          <div className="perk">
            <span className="perk-ic">📣</span>
            <b>Front-page spotlight</b>
            <p>Opportunities to spotlight your community and stream on GameBattles.</p>
          </div>
          <div className="perk">
            <span className="perk-ic">🎁</span>
            <b>Perks for your people</b>
            <p>Qualified recruits receive 2 credits through an Affiliate link or 3 through an Ambassador link. You earn 1 credit for each qualified recruit.</p>
          </div>
          <div className="perk">
            <span className="perk-ic">🤝</span>
            <b>A direct line to the Founder</b>
            <p>Input on new ladders, events and features before they ship. Ambassadors help shape GameBattles.</p>
          </div>
        </div>

        <h2 className="sec">Program Tiers</h2>
        <div className="tiers">
          <div className="tier t1">
            <h5>Affiliate</h5>
            <div className="req">The first step for active creators</div>
            <ul>
              <li>Personal recruit link, every signup tracked</li>
              <li>Qualified recruits get 2 credits; you earn 1</li>
              <li>GB Affiliate award on your profile</li>
              <li>Listed in the Affiliate directory with your stream links</li>
            </ul>
          </div>
          <div className="tier t2">
            <span className="pop">Gold status</span>
            <h5>Ambassador</h5>
            <div className="req">Auto-promoted at 65 qualified recruits</div>
            <ul>
              <li>Everything in Affiliate</li>
              <li>Qualified recruits get 3 credits; you earn 1</li>
              <li>GB Ambassador award</li>
              <li>Gold ambassador badge on your profile</li>
              <li>Spotlight placement on this page</li>
            </ul>
          </div>
        </div>

        <p className="note">
          Want in? <Link href="/ambassadors/apply">Apply here</Link> with your channel and the games you play.
          The Founder reviews every application.
        </p>
      </div>
      <style>{`
        .ambp{min-height:100vh;background:#05090f;color:#d7e2ee;font-family:Tahoma,Verdana,Arial,sans-serif;padding-bottom:60px}
        .hero{position:relative;padding:30px 24px 32px;text-align:center;background:radial-gradient(ellipse at 50% -20%,#3a2b06 0%,transparent 55%),radial-gradient(ellipse at 15% 110%,#200909 0%,transparent 50%),radial-gradient(ellipse at 85% 110%,#09131f 0%,transparent 55%),linear-gradient(180deg,#0d1726,#070d15)}
        .hero::before{content:"";position:absolute;inset:0;background-image:linear-gradient(#f2c14e11 1px,transparent 1px),linear-gradient(90deg,#f2c14e11 1px,transparent 1px);background-size:44px 44px;mask-image:radial-gradient(ellipse at 50% 0%,#000,transparent 75%);pointer-events:none}
        .kicker{display:inline-flex;align-items:center;gap:10px;color:#f2c14e;font-size:11px;font-weight:900;letter-spacing:.3em;text-transform:uppercase}
        .kicker::before,.kicker::after{content:"";width:34px;height:2px;background:linear-gradient(90deg,transparent,#f2c14e)}
        .kicker::after{transform:scaleX(-1)}
        .hero h1{margin:10px 0 4px;font-size:38px;color:#fff;letter-spacing:.02em;text-transform:uppercase;text-shadow:0 0 34px #f2c14e55}
        .hero h1 em{font-style:normal;background:linear-gradient(180deg,#ffe9ab,#f2c14e 55%,#9a6510);-webkit-background-clip:text;background-clip:text;color:transparent}
        .hero p{max-width:620px;margin:10px auto 0;color:#9fb4c8;font-size:14px;line-height:1.7}
        .cta-row{margin-top:16px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap}
        .btn-gold{padding:13px 26px;border-radius:4px;background:linear-gradient(180deg,#ffdf8e,#e0a020);color:#231600;font-size:12px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;text-decoration:none;box-shadow:0 10px 26px #e0a02044}
        .shell{max-width:1060px;margin:0 auto;padding:0 20px}
        .strip{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
        .qualification{color:#a8bdcd;font-size:12px;line-height:1.6;margin:18px 0}
        .error{color:#ff9aa4;border:1px solid #7a2733;background:#2a0b0f;padding:12px;border-radius:8px}
        .strip div,.strip .stat-link{background:linear-gradient(180deg,#0f1f31,#0a1522);border:1px solid #23415d;border-radius:8px;padding:10px 12px;text-align:center}
        .strip .stat-link{text-decoration:none;transition:border-color .2s,background .2s}.strip .stat-link:hover,.strip .stat-link:focus-visible{border-color:#f2c14e;background:#172b3f}
        .strip b{display:block;color:#f2c14e;font-size:19px}
        .strip span{color:#8fa9c2;font-size:10px;font-weight:bold;letter-spacing:.08em;text-transform:uppercase}
        .sec{display:flex;align-items:center;gap:14px;margin:26px 0 12px;color:#e5c573;font-size:14px;letter-spacing:.14em;text-transform:uppercase}
        .sec::after{content:"";flex:1;height:1px;background:linear-gradient(90deg,#44341033,#f2c14e55,transparent)}
        .muted{color:#7f9ab3;font-size:13px}
        .empty{padding:34px;border-radius:12px;border:1px dashed #37536e;background:#0a1522;text-align:center}
        .empty h3{margin:0 0 8px;color:#f2c14e;font-size:18px}
        .empty p{margin:0 auto;max-width:480px;color:#a8bdcd;font-size:13px;line-height:1.7}
        .empty a,.note a{color:#67bdff}
        .perks{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
        .perk{padding:14px;border-radius:10px;border:1px solid #23415d;background:linear-gradient(180deg,#0e1d2e,#081220);transition:border-color .2s,transform .2s}
        .perk:hover{border-color:#6e5213;transform:translateY(-3px)}
        .perk-ic{display:grid;place-items:center;width:40px;height:40px;margin-bottom:10px;border-radius:10px;background:linear-gradient(145deg,#2c2206,#171103);border:1px solid #6e5213;font-size:18px}
        .perk b{display:block;color:#ffdf8e;font-size:13.5px;margin-bottom:6px}
        .perk p{margin:0;color:#a8bdcd;font-size:12px;line-height:1.65}
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
        .tiers{display:grid;grid-template-columns:repeat(2,1fr);gap:16px}
        .tier{border-radius:12px;padding:22px;border:1px solid #23415d;background:linear-gradient(180deg,#0e1d2e,#081220);position:relative}
        .tier h5{margin:0;font-size:15px;text-transform:uppercase;letter-spacing:.08em}
        .tier .req{color:#8fa9c2;font-size:10.5px;font-weight:bold;margin:3px 0 12px}
        .tier ul{list-style:none;margin:0;padding:0}
        .tier li{position:relative;padding:5px 0 5px 20px;color:#b9cde0;font-size:12px;line-height:1.5}
        .tier li::before{content:"✦";position:absolute;left:2px;color:var(--tc)}
        .t1{--tc:#9fc2e2}.t1 h5{color:#9fc2e2}
        .t2{--tc:#f2c14e}.t2 h5{color:#f2c14e}.t2{border-color:#6e5213;background:linear-gradient(180deg,#171103,#0b0e14)}
        .tier .pop{position:absolute;top:-10px;right:14px;background:#f2c14e;color:#231600;font-size:8.5px;font-weight:900;letter-spacing:.1em;padding:4px 9px;border-radius:999px;text-transform:uppercase}
        .note{margin-top:22px;color:#7f9ab3;font-size:12px;text-align:center}
        @media(max-width:820px){.grid,.tiers{grid-template-columns:1fr 1fr}.strip{grid-template-columns:1fr 1fr}.perks{grid-template-columns:1fr 1fr}}
        @media(max-width:520px){.grid,.tiers,.perks{grid-template-columns:1fr}.hero h1{font-size:34px}}
      `}</style>
    </main>
  );
}
