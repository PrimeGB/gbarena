"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useUser } from "../../../lib/useUser";
import { supabase } from "../../../lib/supabase";
import AwardArt, { AWARD_CSS, awardAccent } from "../../awards/AwardArt";
import AwardDetailsDialog, { type EarnedAwardDetails } from "../../components/AwardDetailsDialog";

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

type ReferralProgress = {
  referral_code: string;
  qualified_referrals: number;
  pending_referrals: number;
};

function PlayerAwardsContent() {
  const { user, loading } = useUser();
  const searchParams = useSearchParams();
  const requestedUserId = searchParams.get("userId") || "";
  const viewedUserId = requestedUserId || user?.id || "";
  const [username, setUsername] = useState("");
  const [awards, setAwards] = useState<PlayerAward[]>([]);
  const [selectedAward, setSelectedAward] = useState<{ playerId: string; award: EarnedAwardDetails } | null>(null);
  const [referralProgress, setReferralProgress] = useState<ReferralProgress | null>(null);
  const [referralCopied, setReferralCopied] = useState(false);
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
      else setAwards(((data || []) as PlayerAward[]).filter((award) => !award.revoked_at));
      setReady(true);
    }

    void loadAwards();
    return () => {
      cancelled = true;
    };
  }, [loading, viewedUserId]);

  useEffect(() => {
    if (loading || !user || viewedUserId !== user.id) return;
    let cancelled = false;

    async function loadReferralProgress() {
      const { data, error: referralError } = await supabase.rpc("gb_referral_progress");
      if (cancelled) return;
      if (referralError) {
        setError(`Referral progress could not be loaded: ${referralError.message}`);
        return;
      }
      setReferralProgress(((data || []) as ReferralProgress[])[0] || null);
    }

    void loadReferralProgress();
    return () => {
      cancelled = true;
    };
  }, [loading, user, viewedUserId]);

  async function copyReferralLink() {
    if (!referralProgress) return;
    const referralUrl = `${window.location.origin}/join?ref=${encodeURIComponent(referralProgress.referral_code)}`;
    try {
      await navigator.clipboard.writeText(referralUrl);
      setReferralCopied(true);
    } catch (copyError) {
      setError(`Referral link could not be copied: ${copyError instanceof Error ? copyError.message : "Clipboard access was denied."}`);
    }
  }

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
        .pa-card-button{position:absolute;inset:0;z-index:1;width:100%;border:0;background:transparent;cursor:pointer}
        .pa-card-button:focus-visible{outline:2px solid #80c8ff;outline-offset:-3px}
        .pa-name{color:#fff;font-size:14px}
        .pa-group{margin:4px 0 6px;color:#f2c14e;font-size:11px;font-weight:800;letter-spacing:1.4px;text-transform:uppercase}
        .pa-meta{margin:6px 0 0;color:#a9c3db;font-size:11px}
        .pa-error{padding:12px;border:1px solid #a83e3e;color:#ffd5d5}
        .pa-invite{margin-top:20px;padding:16px;border:1px solid #315f88;background:linear-gradient(145deg,#10263a,#07111b)}
        .pa-invite h2{margin:0 0 8px;color:#f2c14e;font-size:15px;text-transform:uppercase}
        .pa-invite p{color:#c3d6e8;font-size:12px;line-height:1.6}
        .pa-link-row{display:flex;gap:8px;align-items:center;margin-top:12px;flex-wrap:wrap}
        .pa-link{flex:1;min-width:220px;padding:10px;border:1px solid #315b7d;background:#02070c;color:#fff;font:inherit}
        .pa-copy{padding:10px 14px;border:1px solid #e8c46a;background:linear-gradient(to bottom,#d6a943,#7b560e);color:#07111b;font-weight:900;cursor:pointer}
        .pa-progress{color:#8fe8bf!important}
        .pa-rules{margin:10px 0;padding-left:18px;color:#c3d6e8;font-size:12px;line-height:1.7}
        .pa-rules strong{color:#f2c14e}
        .pa-invite a{color:#8ac6f5}
        .pa-link{min-width:0;width:100%}
      `}</style>
      <div className="pa-shell">
        <Link className="pa-back" href={backHref}>← Back to profile</Link>
        <h1 className="pa-title">{ready ? `${username}'s Awards` : "Player Awards"}</h1>
        <p className="pa-sub">Awards earned on GameBattles.</p>
        <Link className="pa-catalog" href="/awards">Browse the award catalog →</Link>
        {(!requestedUserId || (user && viewedUserId === user.id)) && (
          <section className="pa-invite" id="invite-rewards">
            <h2>Invite players. Earn community awards.</h2>
            <p>
              Share your personal invite link with friends. When they join using it,
              their eligible signup counts toward your community recruitment awards.
            </p>
            <ul className="pa-rules">
              <li>Friends must use your link when creating a new account. You cannot refer yourself.</li>
              <li>Each friend must verify their email and link a gaming account not already claimed by another account before their invite qualifies.</li>
              <li><strong>1 qualified invite:</strong> Recruitment Recruit; <strong>3:</strong> Community Recruiter; <strong>5:</strong> Recruitment Captain; <strong>10:</strong> Recruitment Legend.</li>
            </ul>
            {loading ? <p>Loading your referral link...</p> : !user ? (
              <p><Link href="/login">Sign in</Link> to see and share your personal invite link.</p>
            ) : referralProgress ? (
              <>
                <p className="pa-progress">
                  {referralProgress.qualified_referrals} qualified · {referralProgress.pending_referrals} awaiting email verification or a linked gaming account
                </p>
                <div className="pa-link-row">
                  <input
                    className="pa-link"
                    aria-label="Your referral link"
                    readOnly
                    value={`/join?ref=${referralProgress.referral_code}`}
                  />
                  <button className="pa-copy" type="button" onClick={() => void copyReferralLink()}>
                    {referralCopied ? "Copied" : "Copy invite link"}
                  </button>
                </div>
              </>
            ) : (
              <p>{error ? "Referral link is unavailable." : "Loading your referral link..."}</p>
            )}
          </section>
        )}
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
              <button className="pa-card-button" type="button" aria-label={`View ${award.name} details`} aria-haspopup="dialog" onClick={() => setSelectedAward({ playerId: viewedUserId, award })} />
            </article>
          ))}
        </section>
        <AwardDetailsDialog award={selectedAward?.playerId === viewedUserId ? selectedAward.award : null} playerName={username} onClose={() => setSelectedAward(null)} />
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
