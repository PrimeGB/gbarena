"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useUser } from "../../../lib/useUser";
import { supabase } from "../../../lib/supabase";
import AwardArt, { AWARD_CSS, awardAccent } from "../../awards/AwardArt";

type PlayerAward = {
  id: number;
  name: string;
  award_group: string;
  reason: string | null;
  evidence: string | null;
  granted_at: string;
  granted_by: string | null;
  revoked_at: string | null;
  revoke_reason: string | null;
};

function PlayerAwardsContent() {
  const { user, loading } = useUser();
  const searchParams = useSearchParams();
  const requestedUserId = searchParams.get("userId") || "";
  const viewedUserId = requestedUserId || user?.id || "";
  const [username, setUsername] = useState("");
  const [awards, setAwards] = useState<PlayerAward[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (loading || !viewedUserId) return;
    let cancelled = false;

    async function loadAwards() {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", viewedUserId)
        .maybeSingle();
      if (profileError) {
        if (!cancelled) setError(`Profile could not be loaded: ${profileError.message}`);
        return;
      }
      if (!profile?.username) {
        if (!cancelled) {
          setError("Player not found.");
          setReady(true);
        }
        return;
      }

      const { data, error: awardsError } = await supabase.rpc("staff_player_award_history", {
        target_username: profile.username,
      });
      if (cancelled) return;
      setUsername(profile.username);
      if (awardsError) setError(`Awards could not be loaded: ${awardsError.message}`);
      else setAwards((data || []) as PlayerAward[]);
      setReady(true);
    }

    void loadAwards();
    return () => {
      cancelled = true;
    };
  }, [loading, viewedUserId]);

  const backHref = requestedUserId ? `/profile?userId=${encodeURIComponent(requestedUserId)}` : "/profile";

  return (
    <main className="pa-page">
      <style>{`
        ${AWARD_CSS}
        .pa-page{min-height:100vh;padding:28px 16px 60px;background:radial-gradient(circle at top,#123654,#02060a 55%);color:#d7e2ee;font-family:Tahoma,Verdana,Arial,sans-serif}
        .pa-shell{max-width:1000px;margin:0 auto}
        .pa-back,.pa-catalog{color:#7fb8ee;text-decoration:none;font-size:13px}
        .pa-title{margin:12px 0 4px;color:#fff;font-size:27px}
        .pa-sub,.pa-empty{color:#a9c3db;font-size:13px}
        .pa-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px;margin:20px 0}
        .pa-card{padding:12px;border:1px solid #244b70;background:#050b12;text-align:center;line-height:1.55}
        .pa-name{color:#fff;font-size:14px}
        .pa-group{margin:4px 0 6px;color:#f2c14e;font-size:11px;font-weight:800;letter-spacing:1.4px;text-transform:uppercase}
        .pa-meta{margin:6px 0 0;color:#a9c3db;font-size:11px}
        .pa-error{padding:12px;border:1px solid #a83e3e;color:#ffd5d5}
      `}</style>
      <div className="pa-shell">
        <Link className="pa-back" href={backHref}>← Back to profile</Link>
        <h1 className="pa-title">{ready ? `${username}'s Awards` : "Player Awards"}</h1>
        <p className="pa-sub">Awards earned on GameBattles.</p>
        <Link className="pa-catalog" href="/awards">Browse the award catalog →</Link>
        {error && <p className="pa-error" role="alert">{error}</p>}
        {!viewedUserId && !loading && <p className="pa-empty">Sign in to view your awards.</p>}
        {!ready && viewedUserId && <p className="pa-empty">Loading awards...</p>}
        {ready && !error && awards.length === 0 && <p className="pa-empty">No awards earned yet.</p>}
        <section className="pa-grid">
          {awards.map((award) => (
            <article
              className="award-card pa-card"
              key={award.id}
              style={{ ["--accent" as string]: awardAccent(award.name, award.award_group) }}
            >
              <div className="award-stage"><AwardArt name={award.name} group={award.award_group} /></div>
              <strong className="pa-name">{award.name}</strong>
              <p className="pa-group">{award.award_group}</p>
              {award.reason && <p className="pa-meta">{award.reason}</p>}
              <p className="pa-meta">Awarded {new Date(award.granted_at).toLocaleDateString()}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}

export default function PlayerAwardsPage() {
  return (
    <Suspense fallback={<main style={{ padding: 24, color: "#d7e2ee" }}>Loading awards...</main>}>
      <PlayerAwardsContent />
    </Suspense>
  );
}
