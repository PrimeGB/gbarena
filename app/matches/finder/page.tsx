"use client";

import Link from "next/link";
import Image from "next/image";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "../../../lib/useUser";
import { supabase } from "../../../lib/supabase";
import { gamingCategoryLabel, gamingGameLabel, resolveGamingAccountId } from "../../../lib/gamingAccounts";
import { ladderGameImage } from "../../../lib/ladderCatalog";
import { ladderPlatforms } from "../../../lib/ladderStandings";
import { AdditionalMatchRules, postedRuleSettings } from "../../../lib/postedMatchRules";
import { getGameRules } from "../../../lib/matchRules";
import { initialAcceptanceRoster, toggleAcceptancePlayer } from "../../../lib/matchAcceptanceRoster";
import { rapidRoyalDisplayName, rapidRoyalRules } from "../../../lib/rapidRoyal";

type TeamRole = "leader" | "co-leader" | "captain" | "member";

type MatchPost = {
  id: string;
  team_id: string;
  platform: string;
  crossplay: boolean;
  category: string;
  game: string;
  ladder: string;
  game_mode: string;
  players: string;
  match_time: string;
  best_of: string;
  preset: string | null;
  perks: string | null;
  launchers: string | null;
  killstreaks: string | null;
  field_upgrades: string | null;
  hardcore: string | null;
  friendly_fire: string | null;
  radar: string | null;
  spectating: string | null;
  third_person: string | null;
  round_length: string | null;
  score_limit: string | null;
  health: string | null;
  respawn_delay: string | null;
  bomb_timer: string | null;
  plant_time: string | null;
  defuse_time: string | null;
  attachments: string | null;
  additional_rules: AdditionalMatchRules | null;
  status: string;
  created_at: string;
};

type EligibleMatchPlayer = {
  id: string;
  username: string;
  gamingId: string;
};

function prettyText(value: string | null) {
  if (!value) return "";

  if (value === "mw2") return "Call of Duty: Modern Warfare 2 (2009)";
  if (value === "modern-warfare-ii") return "Call of Duty: Modern Warfare II (2022)";
  if (value === "modern-warfare-4") return "Call of Duty: Modern Warfare (2019)";
  if (value === "modern-warfare-iii") return "Call of Duty: Modern Warfare III (2023)";
  if (value === "black-ops-6") return "Call of Duty: Black Ops 6";
  if (value === "black-ops-cold-war") return "Call of Duty: Black Ops Cold War";
  if (value === "vanguard") return "Call of Duty: Vanguard";
  if (value === "battlefield-6") return "Battlefield 6";
  if (value === "battlefield-2042") return "Battlefield 2042";
  if (value === "battlefield-v") return "Battlefield V";
  if (value === "battlefield-1") return "Battlefield 1";

  return value
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getGameImage(game: string | null, category?: string) {
  return category ? ladderGameImage(category, game || "") || "" : "";
}

function GameCover({ image, name }: { image: string; name: string }) {
  return <Image loading="lazy" decoding="async" src={image} alt={name} width={126} height={78} unoptimized={image.startsWith("https://")} />;
}

function getLadderName(ladder: string | null) {
  if (ladder === "singles") return "Solos Ladder";
  if (ladder === "duos") return "Duos Ladder";
  if (ladder === "rapid-royal-duos") return "Rapid Royal Ladder";
  return "Team Ladder";
}

function getRosterText(ladder: string) {
  if (ladder === "singles") return "1 Player";
  if (ladder === "duos") return "2 Players";
  if (ladder === "rapid-royal-duos") return "3 Players";
  return "8 Players";
}

function normalizeRole(value: string | null | undefined): TeamRole {
  const clean = String(value || "").toLowerCase();

  if (clean === "leader") return "leader";
  if (clean === "co-leader") return "co-leader";
  if (clean === "captain") return "captain";

  return "member";
}

function canManageMatches(role: TeamRole) {
  return role === "leader" || role === "co-leader" || role === "captain";
}

function parseDateMs(value: string | null | undefined) {
  if (!value) return 0;
  const direct = new Date(value).getTime();
  if (!Number.isNaN(direct)) return direct;
  return 0;
}

function getScheduledTime(post: MatchPost) {
  const directTime = parseDateMs(post.match_time);
  if (directTime) return directTime;

  const legacyTime = String(post.match_time || "").trim().match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);
  if (!legacyTime || !post.created_at) return 0;

  const scheduled = new Date(post.created_at);
  if (Number.isNaN(scheduled.getTime())) return 0;

  let hours = Number(legacyTime[1]);
  const minutes = Number(legacyTime[2]);
  const period = legacyTime[3].toUpperCase();
  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  scheduled.setHours(hours, minutes, 0, 0);

  return scheduled.getTime();
}

function isPostPastTime(post: MatchPost) {
  const matchTime = getScheduledTime(post);
  return matchTime > 0 && Date.now() >= matchTime;
}

function formatMatchTime(post: MatchPost) {
  const scheduledTime = getScheduledTime(post);
  if (!scheduledTime) return post.match_time;

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(scheduledTime);
}

export default function MatchFinderPage() {
  return (
    <Suspense fallback={<div style={{ color: "white", padding: 40 }}>Loading Match Finder...</div>}>
      <MatchFinderContent />
    </Suspense>
  );
}

function MatchFinderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useUser();

  const platform = searchParams.get("platform") || "xbox";
  const category = searchParams.get("category") || "call-of-duty";
  const game = searchParams.get("game") || "modern-warfare-4";
  const ladder = searchParams.get("ladder") || "team";
  const viewerTeamId = searchParams.get("teamId") || "";

  const platformName = prettyText(platform);
  const gameName = ["rocket-league", "rainbow-six", "apex", "fortnite"].includes(category)
    ? `${gamingCategoryLabel(category)}: ${gamingGameLabel(category, game)}`
    : prettyText(game);
  const gameImage = getGameImage(game, category);
  const ladderName = getLadderName(ladder);
  const rosterText = getRosterText(ladder);
  const createUrl = `/matches/create?teamId=${viewerTeamId}&platform=${platform}&category=${category}&game=${game}&ladder=${ladder}`;
  const viewTeamUrl = viewerTeamId ? `/teams/${viewerTeamId}` : "/profile/teams";
  const ladderUrl = `/ladders/${platform}/${category}/${game}/${ladder}/rankings`;
  const signInUrl = `/login?next=${encodeURIComponent(`/matches/finder?${searchParams.toString()}`)}`;

  const [matches, setMatches] = useState<MatchPost[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [pageError, setPageError] = useState("");
  const [notice, setNotice] = useState("");
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [confirmMatch, setConfirmMatch] = useState<MatchPost | null>(null);
  const [acceptingRoster, setAcceptingRoster] = useState<EligibleMatchPlayer[]>([]);
  const [selectedAcceptingRoster, setSelectedAcceptingRoster] = useState<string[]>([]);
  const [loadingAcceptingRoster, setLoadingAcceptingRoster] = useState(false);
  const [acceptanceError, setAcceptanceError] = useState("");
  const [viewMatch, setViewMatch] = useState<MatchPost | null>(null);
  const [cancelMatch, setCancelMatch] = useState<MatchPost | null>(null);
  const [viewerRole, setViewerRole] = useState<TeamRole>("member");

  const viewerCanManageMatches = canManageMatches(viewerRole);

  const requiredMatchPlayers = (players: string) => {
    const count = String(players || "").toLowerCase().match(/^(\d+)v/);
    return count ? Number(count[1]) : 1;
  };

  function beginMatchAcceptance(match: MatchPost) {
    setNotice("");
    setAcceptingRoster([]);
    setSelectedAcceptingRoster([]);
    setAcceptanceError("");
    setLoadingAcceptingRoster(true);
    setConfirmMatch(match);
  }

  useEffect(() => {
    let cancelled = false;

    async function loadEligibleRoster() {
      setAcceptingRoster([]);
      setSelectedAcceptingRoster([]);
      if (!confirmMatch || !viewerTeamId) return;

      setLoadingAcceptingRoster(true);
      const { data: members, error: membersError } = await supabase
        .from("team_members")
        .select("user_id")
        .eq("team_id", viewerTeamId);

      if (membersError) {
        if (!cancelled) {
          setAcceptanceError("Could not load your team roster: " + membersError.message);
          setLoadingAcceptingRoster(false);
        }
        return;
      }

      const memberIds = (members || []).map((member) => member.user_id);
      if (!memberIds.length) {
        if (!cancelled) setLoadingAcceptingRoster(false);
        return;
      }

      const [{ data: profiles, error: profilesError }, { data: accounts, error: accountsError }] =
        await Promise.all([
          supabase
            .from("profiles")
            .select(
              "id,username,gt_xbox,xbox_gt,gt_playstation,psn_gt,gt_nintendo,nintendo_gt,gt_pc,pc_gt"
            )
            .in("id", memberIds),
          supabase
            .from("gaming_accounts")
            .select("user_id,account_id")
            .in("user_id", memberIds)
            .eq("platform", platform)
            .eq("category", confirmMatch.category)
            .eq("game", confirmMatch.game),
        ]);

      if (profilesError || accountsError) {
        if (!cancelled) {
          setAcceptanceError(
            "Could not load required gaming IDs: " +
              (profilesError?.message || accountsError?.message),
          );
          setLoadingAcceptingRoster(false);
        }
        return;
      }

      const accountByUserId = new Map(
        (accounts || []).map((account) => [account.user_id, account.account_id]),
      );
      const eligible = (profiles || [])
        .map((profile) => ({
          id: profile.id,
          username: profile.username || "Player",
          gamingId:
            resolveGamingAccountId(
              accountByUserId.get(profile.id),
              profile,
              platform,
            ) || "",
        }))
        .filter((player) => player.gamingId);

      if (!cancelled) {
        setAcceptingRoster(eligible);
        setSelectedAcceptingRoster(
          initialAcceptanceRoster(eligible.map((player) => player.id), requiredMatchPlayers(confirmMatch.players)),
        );
        setLoadingAcceptingRoster(false);
      }
    }

    void loadEligibleRoster();
    return () => {
      cancelled = true;
    };
  }, [confirmMatch, viewerTeamId, platform]);

  const loadMatches = useCallback(async () => {
    setPageError("");

    const { error: expiryError } = await supabase.rpc("gb_expire_open_match_posts");
    if (expiryError) {
      setPageError("Could not check for expired match posts: " + expiryError.message);
      setMatches([]);
      setHasLoaded(true);
      return;
    }

    let compatible: string[];
    try {
      compatible = await ladderPlatforms(category, game, platform);
    } catch (reason) {
      setPageError(reason instanceof Error ? reason.message : "Could not load compatible systems.");
      setMatches([]);
      setHasLoaded(true);
      return;
    }
    const { data, error } = await supabase
      .from("match_posts")
      .select("*")
      .in("platform", compatible)
      .eq("category", category)
      .eq("game", game)
      .eq("ladder", ladder)
      .eq("status", "open")
      .order("created_at", { ascending: false });

    if (error) {
      setPageError("Could not load match posts: " + error.message);
      setMatches([]);
      setHasLoaded(true);
      return;
    }

    const allOpenPosts = ((data || []) as MatchPost[]).filter((post) => post.platform === platform || post.crossplay);
    setMatches(allOpenPosts.filter((post) => !isPostPastTime(post)));
    setHasLoaded(true);
  }, [platform, category, game, ladder]);

  // Effect 1: Handles Initial Load & Sets up the Realtime Database Listener
  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) void loadMatches();
    });

    // Setup Realtime pipeline listener for any modifications to 'match_posts'
    const matchChannel = supabase
      .channel("match-finder-realtime")
      .on(
        "postgres_changes",
        {
          event: "*", // Listen for inserts, updates, deletes
          schema: "public",
          table: "match_posts",
        },
        () => { void loadMatches(); }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(matchChannel);
    };
  }, [platform, category, game, ladder, loadMatches]);

  useEffect(() => {
    const nextExpiry = matches
      .map(getScheduledTime)
      .filter((time) => time > Date.now())
      .sort((a, b) => a - b)[0];

    const expiryTimer = nextExpiry
      ? window.setTimeout(() => void loadMatches(), Math.max(0, nextExpiry - Date.now() + 100))
      : undefined;

    function refreshWhenVisible() {
      if (document.visibilityState === "visible") void loadMatches();
    }

    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      if (expiryTimer) window.clearTimeout(expiryTimer);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [matches, loadMatches]);

  // Effect 2: Sets up User Team Access Permission Roles
  useEffect(() => {
    async function loadViewerRole() {
      if (!viewerTeamId || !user?.id) {
        setViewerRole("member");
        return;
      }

      const { data } = await supabase
        .from("team_members")
        .select("role")
        .eq("team_id", viewerTeamId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (data?.role) {
        setViewerRole(normalizeRole(data.role));
      } else {
        setViewerRole("member");
      }
    }

    loadViewerRole();
  }, [viewerTeamId, user?.id]);

  async function acceptConfirmedMatch() {
    if (!confirmMatch) return;
    setAcceptanceError("");
    setNotice("");

    if (!user?.id) {
      setAcceptanceError("You must be signed in to accept this match.");
      return;
    }

    if (!viewerTeamId) {
      setAcceptanceError("Missing your team ID. Go back to your team page and open Match Finder from there.");
      return;
    }

    if (!viewerCanManageMatches) {
      setAcceptanceError("Only team leaders, co-leaders, and captains can accept matches.");
      return;
    }

    if (String(confirmMatch.team_id) === String(viewerTeamId)) {
      setAcceptanceError("You cannot accept your own match post.");
      return;
    }

    const requiredPlayers = requiredMatchPlayers(confirmMatch.players);
    if (selectedAcceptingRoster.length !== requiredPlayers) {
      setAcceptanceError(`Select exactly ${requiredPlayers} rostered players with the required gaming ID.`);
      return;
    }

    const matchPostId = confirmMatch.id;
    setAcceptingId(matchPostId);

    const { error: acceptError } = await supabase.rpc("accept_match_post", {
      post_id: matchPostId,
      accepting_team: viewerTeamId,
      accepting_roster: selectedAcceptingRoster,
    });

    if (acceptError) {
      setAcceptingId(null);
      setAcceptanceError("Could not accept match: " + acceptError.message);
      await loadMatches();
      return;
    }

    setAcceptingId(null);
    setConfirmMatch(null);

    router.push(`/teams/${viewerTeamId}`);
  }

  async function cancelConfirmedPost() {
    if (!cancelMatch) return;

    setNotice("");

    if (!user?.id) {
      setNotice("You must be signed in to cancel this match post.");
      return;
    }

    if (!viewerTeamId) {
      setNotice("Missing your team ID. Go back to your team page and open Match Finder from there.");
      return;
    }

    if (!viewerCanManageMatches) {
      setNotice("Only team leaders, co-leaders, and captains can cancel match posts.");
      setCancelMatch(null);
      return;
    }

    if (String(cancelMatch.team_id) !== String(viewerTeamId)) {
      setNotice("Only the team that posted this match can cancel it.");
      setCancelMatch(null);
      return;
    }

    const matchIdToCancel = cancelMatch.id;
    setCancellingId(matchIdToCancel);

    // Optimistically strip from view array locally
    setMatches((prev) => prev.filter((m) => m.id !== matchIdToCancel));

    const { error } = await supabase
      .from("match_posts")
      .update({ status: "cancelled" })
      .eq("id", matchIdToCancel)
      .eq("status", "open");

    setCancellingId(null);
    setCancelMatch(null);

    if (error) {
      setNotice("Could not cancel match post: " + error.message);
      await loadMatches();
      return;
    }

    setNotice("Match post cancelled.");
  }

  return (
    <>
      <style>{`
        *{margin:0;padding:0;box-sizing:border-box;}
        html{background:#000;}
        body{background:#000;font-family:Tahoma,Verdana,Arial,sans-serif;color:#d7e2ee;}
        a{text-decoration:none;}
        button{font-family:Tahoma,Verdana,Arial,sans-serif;}

        .page{min-height:100vh;background:#02060a;padding:32px 22px;}
        .wrap{max-width:1120px;margin:0 auto;background:#07111b;border:1px solid #315f88;}

        .header{min-height:104px;background:linear-gradient(to bottom,#173956,#07111b);border-bottom:2px solid #315f88;display:flex;align-items:center;justify-content:space-between;padding:0 24px;}
        .game-header{display:flex;align-items:center;gap:18px;}
        .game-cover{width:126px;height:78px;border:1px solid #315f88;background:#050c14;overflow:hidden;}
        .game-cover img{width:100%;height:100%;object-fit:cover;object-position:center;display:block;}
        .game-name{color:#f2c14e;font-size:15px;font-weight:900;letter-spacing:1.3px;text-transform:uppercase;margin-bottom:8px;text-shadow:0 1px 2px #000;}
        .ladder-name{color:#fff;font-size:30px;font-weight:900;text-transform:uppercase;text-shadow:0 2px 4px #000;}
        .header-badge{border:1px solid #6ba8d6;background:linear-gradient(to bottom,#214765,#0b1c2d);color:#f5f8ff;font-size:15px;font-weight:900;text-transform:uppercase;padding:14px 22px;text-shadow:0 2px 4px #000;}
        .header-badge:hover{border-color:#d7ad4a;color:#d7ad4a;}

        .nav{height:36px;background:linear-gradient(to bottom,#10283d,#07111b);border-bottom:1px solid #244b70;display:flex;align-items:center;justify-content:center;gap:28px;}
        .nav a{color:#d7eaff;font-size:12px;font-weight:bold;text-transform:uppercase;}
        .nav a:hover{color:#d7ad4a;}

        .title-bar{background:linear-gradient(to bottom,#1d496e,#0a1724);border-bottom:1px solid #315f88;padding:18px 24px;text-align:center;}
        .title-bar h1{color:#d7ad4a;font-size:30px;text-transform:uppercase;text-shadow:0 1px 2px #000;}
        .title-bar p{color:#cfe2f2;font-size:13px;margin-top:7px;}

        .content{padding:18px;}
        .finder-layout{display:grid;grid-template-columns:232px 1fr;gap:14px;}
        .panel{background:#050b12;border:1px solid #244b70;}
        .panel-header{min-height:36px;background:linear-gradient(to bottom,#18344f,#091521);border-bottom:1px solid #244b70;display:flex;align-items:center;justify-content:center;padding:0 12px;color:#d7ad4a;font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:1px;}

        .side-body{padding:12px;}
        .ladder-card{border:1px solid #1f3d5a;background:#06101a;padding:12px;margin-bottom:12px;}
        .ladder-card .ladder-title{color:#d7ad4a;font-size:12px;font-weight:900;text-transform:uppercase;margin-bottom:9px;padding-bottom:8px;border-bottom:1px solid rgba(255,255,255,.08);}
        .ladder-line{color:#cfe2f2;font-size:12px;line-height:23px;border-bottom:1px solid rgba(255,255,255,.05);}
        .ladder-line:last-child{border-bottom:0;}
        .ladder-line span{color:#8aa7c0;}

        .help-box,.quick-create{height:40px;width:100%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:900;text-transform:uppercase;margin-top:10px;}
        .help-box{border:1px solid #4b95d8;background:linear-gradient(to bottom,#1c4b72,#0a1724);color:#fff;}
        .quick-create{border:1px solid #e8c46a;background:linear-gradient(to bottom,#d6a943,#7b560e);color:#07111b;}
        .disabled-create{opacity:.45;cursor:not-allowed;}

        .main-body{padding:12px;}
        .notice-box{border:1px solid #d7ad4a;background:#201703;color:#ffd76a;font-size:12px;font-weight:900;text-transform:uppercase;padding:11px;margin-bottom:12px;text-align:center;}

        .board{border:1px solid #244b70;background:#02070c;min-height:118px;}
        .board-head,.match-row{display:grid;grid-template-columns:1fr 1.45fr 1fr 1fr 170px;}
        .board-head{background:linear-gradient(to bottom,#112b42,#07111b);border-bottom:1px solid #244b70;}
        .board-head div{color:#d7ad4a;font-size:11px;font-weight:900;text-transform:uppercase;padding:10px;border-right:1px solid rgba(255,255,255,.06);text-align:center;}

        .match-row{min-height:58px;border-bottom:1px solid rgba(255,255,255,.07);background:#050b12;}
        .match-row:nth-child(even){background:#07111b;}
        .match-row:hover{background:#081b2a;}
        .match-cell{padding:10px;border-right:1px solid rgba(255,255,255,.055);display:flex;align-items:center;justify-content:center;color:#cfe2f2;font-size:13px;font-weight:900;text-align:center;}
        .match-cell:last-child{border-right:0;}
        .players{color:#fff;font-size:15px;}
        .mode{color:#7fc7ff;}
        .rules-type{color:#d7ad4a;text-transform:uppercase;}
        .time{color:#cfe2f2;}
        .actions{display:flex;flex-wrap:wrap;gap:6px;align-items:center;justify-content:center;}

        .mini-btn{min-width:66px;height:27px;border:1px solid #4b95d8;background:linear-gradient(to bottom,#1c4b72,#0a1724);color:#fff;font-size:10px;font-weight:900;text-transform:uppercase;cursor:pointer;display:flex;align-items:center;justify-content:center;}
        .mini-btn.gold{border-color:#e8c46a;background:linear-gradient(to bottom,#d6a943,#7b560e);color:#07111b;}
        .mini-btn.red-mini{border-color:#e34242;background:linear-gradient(to bottom,#bd1717,#5c0000);color:#fff;}
        .mini-btn.disabled{opacity:.42;cursor:not-allowed;}
        .mini-btn:hover:not(.disabled){filter:brightness(1.13);}

        .empty-state,.error-state,.loading-state{padding:28px;text-align:center;color:#cfe2f2;font-size:13px;font-weight:900;text-transform:uppercase;}
        .error-state{color:#ff9c9c;}

        .modal-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.76);display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px;}
        .accept-modal{width:520px;max-width:95vw;border:1px solid #6ba8d6;background:#07111b;}
        .accept-title{height:40px;background:linear-gradient(to bottom,#18344f,#091521);border-bottom:1px solid #244b70;color:#d7ad4a;font-size:14px;font-weight:900;text-transform:uppercase;display:flex;align-items:center;padding:0 14px;}
        .accept-body{padding:16px;color:#cfe2f2;font-size:13px;line-height:22px;}
        .accept-summary{border:1px solid #244b70;background:#050c14;padding:12px;margin:12px 0;color:#fff;font-size:12px;line-height:23px;}
        .accept-roster{display:grid;gap:7px;margin:12px 0;}
        .accept-roster-option{display:flex;align-items:center;gap:8px;border:1px solid #244b70;background:#07111b;color:#fff;padding:8px;font-size:12px;text-align:left;cursor:pointer;}
        .accept-roster-option.active{border-color:#58b7ff;background:#102a40;}
        .accept-roster-note{color:#f0c36b;font-size:12px;line-height:18px;}
        .accept-warning{color:#d7ad4a;font-weight:900;text-transform:uppercase;}
        .accept-actions{display:flex;gap:12px;padding:0 16px 16px;}
        .accept-btn{height:40px;min-width:150px;border:1px solid #e8c46a;background:linear-gradient(to bottom,#d6a943,#7b560e);color:#07111b;font-size:12px;font-weight:900;text-transform:uppercase;cursor:pointer;}
        .accept-btn.red{border-color:#e34242;background:linear-gradient(to bottom,#bd1717,#5c0000);color:#fff;}
        .accept-btn:disabled{opacity:.55;cursor:not-allowed;}

        .page{padding:18px 16px;background:radial-gradient(circle at top,rgba(45,100,150,.22),transparent 42%),#02060a;}
        .wrap{max-width:1160px;box-shadow:0 0 28px rgba(0,80,140,.25);}
        .header{min-height:78px;padding:10px 18px;}
        .game-header{gap:14px;}
        .game-cover{width:92px;height:58px;}
        .game-name{font-size:12px;letter-spacing:1px;margin-bottom:4px;}
        .ladder-name{font-size:24px;}
        .header-badge{font-size:12px;padding:10px 15px;}
        .title-bar{padding:10px 18px;}
        .title-bar h1{font-size:23px;}
        .title-bar p{font-size:11px;margin-top:4px;}
        .content{padding:14px;}
        .finder-layout{grid-template-columns:190px minmax(0,1fr);gap:12px;align-items:start;}
        .panel-header{justify-content:flex-start;min-height:32px;font-size:11px;}
        .side-body{padding:10px;}
        .ladder-card{padding:9px;margin-bottom:8px;}
        .ladder-line{font-size:11px;line-height:20px;overflow-wrap:anywhere;}
        .help-box,.quick-create{height:34px;font-size:10px;margin-top:7px;}
        .board-head,.match-row{grid-template-columns:80px minmax(135px,1.3fr) minmax(140px,1fr) minmax(140px,1fr) 155px;}
        .board-head div{padding:8px;font-size:10px;}
        .match-cell{padding:9px 7px;font-size:11px;}
        .players{font-size:13px;}
        .mode{flex-direction:column;gap:4px;}
        .mode-preset{font-size:10px;color:#d7ad4a;text-transform:uppercase;}
        .rules-type{flex-direction:column;gap:4px;}
        .rules-meta{font-size:10px;color:#a9c3db;text-transform:none;font-weight:normal;}
        .mini-btn.red-mini{background:#39161a;border-color:#873d45;}
        .accept-modal{max-height:90vh;overflow-y:auto;}
        .posted-rules{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;margin-top:12px;}
        .posted-rule{padding:7px 9px;border:1px solid #244b70;background:#050c14;overflow-wrap:anywhere;}
        .posted-rule span{display:block;color:#8aa7c0;font-size:10px;text-transform:uppercase;}
        .posted-rule strong{color:#fff;font-size:12px;}
        .view-rules-link{border:0;background:none;color:#80c8ff;text-decoration:underline;cursor:pointer;font:inherit;}

        @media(max-width:980px){
          .finder-layout{grid-template-columns:1fr;}
          .board-head,.match-row{min-width:0;}
          .nav{height:auto;padding:10px;flex-wrap:wrap;gap:14px;}
        }
        @media(max-width:700px){
          .page{padding:8px;}
          .content{padding:8px;}
          .header{gap:12px;}
          .game-header{gap:9px;}
          .game-cover{width:66px;height:46px;flex:none;}
          .ladder-name{font-size:18px;}
          .header-badge{font-size:10px;padding:8px;}
          .title-bar h1{font-size:19px;}
          .board-head{display:none;}
          .match-row{display:grid;grid-template-columns:1fr 1fr;gap:0;padding:8px;}
          .match-cell{border:0;justify-content:flex-start;text-align:left;}
          .match-cell.actions-cell{grid-column:1/-1;}
          .actions{justify-content:flex-start;}
          .posted-rules{grid-template-columns:1fr;}
          .accept-actions{flex-wrap:wrap;}
        }
      `}</style>

      <main className="page">
        <div className="wrap">
          <header className="header">
            <div className="game-header">
              <div className="game-cover">
                {gameImage && (
                  <GameCover image={gameImage} name={gameName} />
                )}
              </div>

              <div>
                <div className="game-name">{gameName}</div>
                <div className="ladder-name">{ladderName}</div>
              </div>
            </div>

            <a className="header-badge" href={viewTeamUrl}>
              View Team
            </a>
          </header>

          <nav className="nav">
            <Link href="/profile/teams">My Teams</Link>
            <Link href="/members">Members</Link>
            <Link href="/forums">Forums</Link>
            <a href={ladderUrl}>Ladder</a>
          </nav>

          <section className="title-bar">
            <h1>Match Finder</h1>
            <p>{platformName} / {gameName} / {ladderName}</p>
          </section>

          <section className="content">
            <div className="finder-layout">
              <aside className="panel">
                <div className="panel-header">Ladder Menu</div>

                <div className="side-body">
                  <div className="ladder-card">
                    <div className="ladder-title">Current Ladder</div>
                    <div className="ladder-line"><span>Platform:</span> {platformName}</div>
                    <div className="ladder-line"><span>Game:</span> {gameName}</div>
                    <div className="ladder-line"><span>Ladder:</span> {ladderName}</div>
                    <div className="ladder-line"><span>Roster:</span> {rosterText}</div>
                  </div>

                  <Link className="help-box" href="/matches/finder/help">How Match Finder Works</Link>
                  {!authLoading && !user ? (
                    <Link className="quick-create" href={signInUrl}>Sign in to create a match</Link>
                  ) : viewerCanManageMatches ? (
                    <a className="quick-create" href={createUrl}>Create Match</a>
                  ) : (
                    <div className="quick-create disabled-create">Create Match Locked</div>
                  )}
                </div>
              </aside>

              <section className="panel">
                <div className="panel-header">Open Match Posts</div>

                <div className="main-body">
                  {notice && <div className="notice-box">{notice}</div>}

                  <div className="board">
                    <div className="board-head">
                      <div>Players</div>
                      <div>Mode</div>
                      <div>Format</div>
                      <div>Time</div>
                      <div>Actions</div>
                    </div>

                    {pageError && <div className="error-state">{pageError}</div>}

                    {!pageError && !hasLoaded && (
                      <div className="loading-state">Loading match posts...</div>
                    )}

                    {!pageError && hasLoaded && matches.length === 0 && (
                      <div className="empty-state">No open matches posted for this ladder yet.</div>
                    )}

                    {!pageError && matches.map((match) => {
                      const isMyPost = viewerTeamId && String(match.team_id) === String(viewerTeamId);

                      return (
                        <div className="match-row" key={match.id}>
                          <div className="match-cell players">{match.players}</div>
                          <div className="match-cell mode">{rapidRoyalDisplayName(match.game_mode)}<span className="mode-preset">{rapidRoyalDisplayName(match.preset || "Rules not specified")}</span></div>
                          <div className="match-cell rules-type">{match.best_of}<span className="rules-meta">{prettyText(match.platform)} · Cross Play {match.crossplay ? "On" : "Off"}</span></div>
                          <div className="match-cell time">{formatMatchTime(match)}</div>
                          <div className="match-cell actions-cell">
                            <div className="actions">
                              <button className="mini-btn" type="button" onClick={() => setViewMatch(match)}>
                                View
                              </button>

                              {!authLoading && !user ? (
                                <Link className="mini-btn gold" href={signInUrl}>Sign in to accept</Link>
                              ) : isMyPost ? (
                                viewerCanManageMatches ? (
                                  <button 
                                    className="mini-btn red-mini" 
                                    type="button" 
                                    disabled={cancellingId === match.id}
                                    onClick={() => setCancelMatch(match)}
                                  >
                                    {cancellingId === match.id ? "..." : "Cancel"}
                                  </button>
                                ) : (
                                  <button className="mini-btn disabled" type="button" disabled>Cancel</button>
                                )
                              ) : user?.id && viewerCanManageMatches ? (
                                <button className="mini-btn gold" type="button" onClick={() => beginMatchAcceptance(match)}>
                                  Accept
                                </button>
                              ) : (
                                <button className="mini-btn disabled" type="button" disabled>Accept</button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            </div>
          </section>
        </div>
      </main>

      {confirmMatch && (
        <div className="modal-backdrop">
          <div className="accept-modal">
            <div className="accept-title">Confirm Match Acceptance</div>
            <div className="accept-body">
              <p className="accept-warning">
                By accepting this match, you agree to all match rules and settings posted by the other team.
              </p>
              <div className="accept-summary">
                Players: {confirmMatch.players}
                <br />
                Mode: {rapidRoyalDisplayName(confirmMatch.game_mode)}
                <br />
                Rules: {rapidRoyalDisplayName(confirmMatch.preset || "Not specified")}
                <br />
                System: {prettyText(confirmMatch.platform)} · Cross Play {confirmMatch.crossplay ? "On" : "Off"}
                <br />
                Time: {formatMatchTime(confirmMatch)}
              </div>
              <button className="view-rules-link" type="button" onClick={() => setViewMatch(confirmMatch)}>View all posted rules before accepting</button>
              {confirmMatch.platform !== platform && (
                <p className="accept-roster-note">Cross-play match: make sure both teams&apos; game versions can play together.</p>
              )}
              <div className="accept-roster-note">
                {requiredMatchPlayers(confirmMatch.players) === 1 && acceptingRoster.length === 1
                  ? "Your eligible player is selected automatically."
                  : `Select ${requiredMatchPlayers(confirmMatch.players)} eligible ${requiredMatchPlayers(confirmMatch.players) === 1 ? "player" : "players"} for your match lineup.`}
              </div>
              {loadingAcceptingRoster ? (
                <div className="accept-roster-note">Loading eligible team roster...</div>
              ) : acceptingRoster.length ? (
                <div className="accept-roster">
                  {acceptingRoster.map((player) => {
                    const selected = selectedAcceptingRoster.includes(player.id);
                    return (
                      <button
                        className={selected ? "accept-roster-option active" : "accept-roster-option"}
                        type="button"
                        key={player.id}
                        aria-pressed={selected}
                        disabled={acceptingRoster.length === 1 && requiredMatchPlayers(confirmMatch.players) === 1}
                        onClick={() =>
                          setSelectedAcceptingRoster((current) =>
                            toggleAcceptancePlayer(current, player.id, requiredMatchPlayers(confirmMatch.players)),
                          )
                        }
                      >
                        {player.username} — {player.gamingId}{selected ? " (selected)" : ""}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="accept-roster-note">
                  No eligible players have an ID linked for {prettyText(platform)}. Add an ID in Profile → Edit Profile.
                </div>
              )}
              {acceptanceError && <p className="accept-roster-note" role="alert">{acceptanceError}</p>}
            </div>
            <div className="accept-actions">
              <button
                className="accept-btn"
                type="button"
                disabled={
                  acceptingId === confirmMatch.id ||
                  loadingAcceptingRoster ||
                  selectedAcceptingRoster.length !== requiredMatchPlayers(confirmMatch.players)
                }
                onClick={acceptConfirmedMatch}
              >
                {acceptingId === confirmMatch.id ? "Accepting..." : "Accept Match"}
              </button>
              <button
                className="accept-btn red"
                type="button"
                disabled={acceptingId === confirmMatch.id}
                onClick={() => setConfirmMatch(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {viewMatch && (
        <div className="modal-backdrop">
          <div className="accept-modal">
            <div className="accept-title">Posted Match Rules</div>
            <div className="accept-body">
              <div className="accept-summary">
                Players: {viewMatch.players}
                <br />
                Mode: {rapidRoyalDisplayName(viewMatch.game_mode)}
                <br />
                Rules: {rapidRoyalDisplayName(viewMatch.preset || "Not specified")}
                <br />
                Format: {viewMatch.best_of}
                <br />
                System: {prettyText(viewMatch.platform)} · Cross Play {viewMatch.crossplay ? "On" : "Off"}
                <br />
                Time: {formatMatchTime(viewMatch)}
              </div>
              <strong>Posted settings</strong>
              {postedRuleSettings(viewMatch).length ? (
                <div className="posted-rules">
                  {postedRuleSettings(viewMatch).map((setting, index) => (
                    <div className="posted-rule" key={`${setting.label}-${index}`}>
                      <span>{setting.label}</span><strong>{setting.value}</strong>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No individual settings were recorded for this post.</p>
              )}
              {viewMatch.preset === "Custom" && !viewMatch.additional_rules && (
                <p className="accept-roster-note">This older post did not record additional custom settings or individual equipment and perk rules.</p>
              )}
              {getGameRules(viewMatch.category, viewMatch.game)?.modes
                .find((mode) => mode.value === viewMatch.game_mode)?.rules.map((rule) => (
                  <p key={rule}>• {rule}</p>
                ))}
              {viewMatch.ladder === "rapid-royal-duos" && (
                <p>{viewMatch.players === "3v3" ? rapidRoyalRules.trios : rapidRoyalRules.duos} {rapidRoyalRules.winning} {rapidRoyalRules.proof}</p>
              )}
              {(viewMatch.game === "redsec" || viewMatch.ladder === "redsec") && (
                <p>RedSec uses Lyndon Oil Works and the locked GameBattles RedSec kill-race rules.</p>
              )}
              <p><Link href={`/ladders/${viewMatch.platform}/${viewMatch.category}/${viewMatch.game}/${viewMatch.ladder}/rules`}>View full ladder rules</Link> · <Link href="/rules">Site rules</Link></p>
            </div>
            <div className="accept-actions">
              <button className="accept-btn red" type="button" onClick={() => setViewMatch(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {cancelMatch && (
        <div className="modal-backdrop">
          <div className="accept-modal">
            <div className="accept-title">Cancel Match Challenge</div>
            <div className="accept-body">
              <p style={{ color: "#ff9c9c", fontWeight: "bold", textTransform: "uppercase" }}>
                Are you sure you want to pull this open challenge post off the board?
              </p>
            </div>
            <div className="accept-actions">
              <button className="accept-btn red" type="button" onClick={cancelConfirmedPost}>
                Yes, Remove It
              </button>
              <button className="accept-btn" type="button" onClick={() => setCancelMatch(null)}>
                Back
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}