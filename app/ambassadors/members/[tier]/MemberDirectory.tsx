"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Member = {
  user_id: string;
  username: string | null;
  tier: "affiliate" | "ambassador";
  slug: string;
  tagline: string;
  recruits: number;
  qualified: number;
  twitch: string;
  youtube: string;
  tiktok: string;
  kick: string;
  instagram: string;
  discord: string;
};

export default function MemberDirectory({ tier }: { tier: Member["tier"] }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");
  const label = tier === "affiliate" ? "Affiliates" : "Ambassadors";

  useEffect(() => {
    let active = true;
    void supabase.rpc("gb_ambassador_directory").then(({ data, error: rpcError }) => {
      if (!active) return;
      if (rpcError) setError("Unable to load members. Please try again later.");
      else setMembers(((data || []) as Member[]).filter((member) => member.tier === tier));
      setLoading(false);
    });
    return () => { active = false; };
  }, [tier]);

  async function copyLink(member: Member) {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/amb/${member.slug}`);
      setCopied(member.slug);
      window.setTimeout(() => setCopied(""), 1800);
    } catch {
      setError("Unable to copy the link. Please copy the address shown on the card.");
    }
  }

  return (
    <main className="members">
      <div className="wrap">
        <Link className="back" href="/ambassadors">← Ambassadors &amp; Affiliates</Link>
        <header><span>GameBattles Creator Program</span><h1>Active {label}</h1><p>Meet the people helping grow the GameBattles community.</p></header>
        {error && <p className="error" role="alert">{error}</p>}
        {loading ? <p className="muted">Loading {label.toLowerCase()}...</p> : !error && members.length === 0 ? (
          <div className="empty">
            <h2>Our {label.toLowerCase()} community is growing</h2>
            <p>Want to join? <Link href="/ambassadors/apply">Apply here</Link>.</p>
            <div className="example"><strong>Example member card</strong><span>Player Name · {tier === "affiliate" ? "Affiliate" : "Ambassador"}</span><span>12 recruits · 8 qualified</span></div>
          </div>
        ) : (
          <div className="grid">
            {members.map((member) => {
              const socials = [
                ["Twitch", member.twitch], ["YouTube", member.youtube], ["TikTok", member.tiktok],
                ["Kick", member.kick], ["Instagram", member.instagram], ["Discord", member.discord],
              ].filter(([, url]) => url);
              return <article className="card" key={member.user_id}>
                <div className="avatar">{(member.username || "GB").slice(0, 2).toUpperCase()}</div>
                <span className="badge">{tier === "affiliate" ? "Affiliate" : "Ambassador"}</span>
                <h2><Link href={`/profile?userId=${member.user_id}`}>{member.username || "GameBattles player"}</Link></h2>
                {member.tagline && <p className="tagline">{member.tagline}</p>}
                <p className="numbers"><b>{member.recruits}</b> recruits <span>·</span> <b>{member.qualified}</b> qualified</p>
                {socials.length > 0 && <div className="socials">{socials.map(([name, url]) => <a key={name} href={url} target="_blank" rel="noopener noreferrer">{name}</a>)}</div>}
                <button onClick={() => void copyLink(member)}>{copied === member.slug ? "Link copied!" : `gamebattles.app/amb/${member.slug}`}</button>
              </article>;
            })}
          </div>
        )}
      </div>
      <style>{`
        .members{min-height:100vh;background:radial-gradient(ellipse at 50% 0,#302405,transparent 45%),#05090f;color:#c5d5e4;padding:30px 20px 70px;font-family:Tahoma,Verdana,Arial,sans-serif}
        .wrap{max-width:1000px;margin:auto}.back,.empty a{color:#9fc2e2;text-decoration:none;font-size:12px}
        header{text-align:center;padding:35px 0}header span,.badge{color:#f2c14e;font-size:10px;font-weight:900;letter-spacing:.14em;text-transform:uppercase}
        h1{color:#fff;font-size:34px;margin:10px 0}header p,.muted,.empty p{color:#9fb4c8;font-size:13px}.error{color:#ff9aa4;border:1px solid #7a2733;background:#2a0b0f;padding:12px;border-radius:8px}
        .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}.card{padding:22px;border:1px solid #23415d;border-radius:12px;background:linear-gradient(#102235,#08121e);text-align:center}
        .avatar{display:grid;place-items:center;width:66px;height:66px;margin:auto auto 12px;border:2px solid #f2c14e;border-radius:50%;background:#14243a;color:#fff;font-size:20px;font-weight:bold}
        .card h2{margin:8px 0;font-size:18px}.card h2 a{color:white;text-decoration:none}.tagline{color:#9fc2e2;font-size:12px}.numbers{color:#a8bdcd;font-size:12px}.numbers b{color:#f2c14e}.numbers span{padding:0 6px}
        .socials{display:flex;justify-content:center;gap:8px;flex-wrap:wrap;margin:14px 0}.socials a{color:#9fc2e2;font-size:11px}.card button{width:100%;margin-top:8px;padding:9px;border:1px dashed #37536e;border-radius:5px;background:#050c13;color:#f2c14e;cursor:pointer}
        .empty{text-align:center;padding:30px;border:1px dashed #37536e;border-radius:12px;background:#0a1522}.empty h2{color:#f2c14e;font-size:18px}.example{display:flex;flex-direction:column;gap:7px;max-width:230px;margin:18px auto 0;padding:16px;border:1px solid #37536e;border-radius:8px;font-size:12px}.example strong{color:#f2c14e;font-size:10px;text-transform:uppercase}
        @media(max-width:720px){.grid{grid-template-columns:repeat(2,1fr)}}@media(max-width:480px){.grid{grid-template-columns:1fr}}
      `}</style>
    </main>
  );
}
