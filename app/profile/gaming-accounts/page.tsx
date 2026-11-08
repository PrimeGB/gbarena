"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  GamingAccount,
  gamingCategoryLabel,
  gamingGameLabel,
  gamingPlatformLabel,
} from "../../../lib/gamingAccounts";
import { ladderPlatformLabel } from "../../../lib/ladderCatalog";
import { supabase } from "../../../lib/supabase";
import { useUser } from "../../../lib/useUser";

type ProfileAccounts = {
  username: string | null;
  gt_xbox: string | null;
  xbox_gt: string | null;
  gt_playstation: string | null;
  psn_gt: string | null;
  gt_nintendo: string | null;
  nintendo_gt: string | null;
  gt_pc: string | null;
  pc_gt: string | null;
};

type AccountResult =
  | { userId: string; error: string; profile: null; accounts: GamingAccount[] }
  | { userId: string; error: ""; profile: ProfileAccounts; accounts: GamingAccount[] };

function GamingAccountsContent() {
  const { user, loading } = useUser();
  const searchParams = useSearchParams();
  const requestedUserId = searchParams.get("userId") || "";
  const viewedUserId = requestedUserId || user?.id || "";
  const [result, setResult] = useState<AccountResult | null>(null);

  useEffect(() => {
    if ((!requestedUserId && loading) || !viewedUserId) return;
    let active = true;

    async function loadAccounts() {
      const [profileResult, accountsResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("username,gt_xbox,xbox_gt,gt_playstation,psn_gt,gt_nintendo,nintendo_gt,gt_pc,pc_gt")
          .eq("id", viewedUserId)
          .maybeSingle(),
        supabase
          .from("gaming_accounts")
          .select("id,user_id,platform,category,game,account_id")
          .eq("user_id", viewedUserId)
          .order("platform")
          .order("category")
          .order("game"),
      ]);
      if (!active) return;

      if (profileResult.error || accountsResult.error) {
        const message = profileResult.error?.message || accountsResult.error?.message;
        setResult({ userId: viewedUserId, error: `Gaming accounts could not be loaded: ${message}`, profile: null, accounts: [] });
      } else if (!profileResult.data) {
        setResult({ userId: viewedUserId, error: "Player profile not found.", profile: null, accounts: [] });
      } else {
        setResult({
          userId: viewedUserId,
          error: "",
          profile: profileResult.data as ProfileAccounts,
          accounts: (accountsResult.data || []) as GamingAccount[],
        });
      }
    }

    void loadAccounts();
    return () => { active = false; };
  }, [loading, requestedUserId, viewedUserId]);

  const current = result?.userId === viewedUserId ? result : null;
  const profile = current?.profile;
  const generalIds = profile ? [
    { platform: "xbox", id: profile.gt_xbox || profile.xbox_gt },
    { platform: "playstation", id: profile.gt_playstation || profile.psn_gt },
    { platform: "nintendo", id: profile.gt_nintendo || profile.nintendo_gt },
    { platform: "pc", id: profile.gt_pc || profile.pc_gt },
  ].filter((entry) => entry.id) : [];
  const platformGroups = Array.from(new Set(current?.accounts.map((account) => account.platform) || []));
  const backHref = requestedUserId ? `/profile?userId=${encodeURIComponent(requestedUserId)}` : "/profile";

  return (
    <main className="ga-page">
      <style>{`
        .ga-page{min-height:100vh;padding:28px 16px 60px;background:radial-gradient(circle at top,#123654,#02060a 55%);color:#d7e2ee;font-family:Tahoma,Verdana,Arial,sans-serif}
        .ga-shell{max-width:1000px;margin:0 auto}
        .ga-back{color:#8ac6f5;text-decoration:none;font-size:13px}
        .ga-header{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;margin:18px 0}
        .ga-title{margin:0;color:#fff;font-size:27px}
        .ga-sub{margin:7px 0 0;color:#a9c3db;font-size:13px;line-height:1.5}
        .ga-section{margin-top:14px;border:1px solid #315f88;background:#07111b}
        .ga-section h2{margin:0;padding:10px 14px;background:linear-gradient(to bottom,#1f4c73,#0b2438);color:#f2c14e;font-size:13px;text-transform:uppercase}
        .ga-body{padding:14px}
        .ga-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr));gap:10px}
        .ga-card{min-width:0;padding:13px;border:1px solid #244b70;background:#050b12}
        .ga-card strong{display:block;color:#fff;font-size:15px;overflow-wrap:anywhere}
        .ga-label{margin-bottom:6px;color:#8fb4d2;font-size:11px;font-weight:bold;text-transform:uppercase}
        .ga-game{margin-top:7px;color:#c0d5e7;font-size:12px;line-height:1.5;overflow-wrap:anywhere}
        .ga-note{margin:0 0 12px;color:#a9c3db;font-size:12px;line-height:1.5}
        .ga-empty{color:#a9c3db;font-size:13px;line-height:1.6}
        .ga-error{padding:12px;border:1px solid #a83e3e;color:#ffd5d5}
      `}</style>
      <div className="ga-shell">
        <Link className="ga-back" href={backHref}>Back to profile</Link>
        <div className="ga-header">
          <div>
            <h1 className="ga-title">{profile?.username ? `${profile.username}'s Gaming Accounts` : "Gaming Accounts"}</h1>
            <p className="ga-sub">Gaming IDs linked to this profile, organized by system and game.</p>
          </div>
        </div>

        {(!requestedUserId && loading) || (viewedUserId && !current) ? (
          <p className="ga-empty" role="status">Loading gaming accounts...</p>
        ) : !viewedUserId ? (
          <p className="ga-empty">Sign in to view your gaming accounts. <Link className="ga-back" href="/login">Sign in</Link></p>
        ) : current?.error ? (
          <p className="ga-error" role="alert">{current.error}</p>
        ) : (
          <>
            {generalIds.length > 0 && (
              <section className="ga-section">
                <h2>Profile System IDs</h2>
                <div className="ga-body">
                  <p className="ga-note">General IDs saved on the profile. Game-specific accounts are listed separately below.</p>
                  <div className="ga-grid">
                    {generalIds.map((entry) => (
                      <div className="ga-card" key={entry.platform}>
                        <div className="ga-label">{ladderPlatformLabel(entry.platform) || entry.platform}</div>
                        <strong>{entry.id}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}
            {platformGroups.map((platform) => (
              <section className="ga-section" key={platform}>
                <h2>{ladderPlatformLabel(platform) || (platform === "ea" ? "EA" : gamingPlatformLabel(platform))}</h2>
                <div className="ga-body ga-grid">
                  {current?.accounts.filter((account) => account.platform === platform).map((account) => (
                    <div className="ga-card" key={account.id}>
                      <div className="ga-label">{gamingPlatformLabel(account.platform)}</div>
                      <strong>{account.account_id}</strong>
                      <div className="ga-game">{gamingCategoryLabel(account.category)} · {gamingGameLabel(account.category, account.game)}</div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
            {generalIds.length === 0 && platformGroups.length === 0 && (
              <section className="ga-section">
                <h2>Gaming Accounts</h2>
                <div className="ga-body ga-empty">
                  No gaming accounts linked yet.
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}

export default function GamingAccountsPage() {
  return <Suspense fallback={<div>Loading gaming accounts...</div>}><GamingAccountsContent /></Suspense>;
}
