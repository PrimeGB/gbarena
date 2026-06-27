"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "../../../lib/useUser";
import { supabase } from "../../../lib/supabase";

type TeamRole = "leader" | "co-leader" | "captain" | "member";

type MatchPost = {
  id: string;
  team_id: string;
  platform: string;
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
  status: string;
  created_at: string;
};

function prettyText(value: string | null) {
  if (!value) return "";

  if (value === "mw2") return "Call of Duty: Modern Warfare 2";
  if (value === "modern-warfare-ii") return "Call of Duty: Modern Warfare II";
  if (value === "modern-warfare-4") return "Call of Duty: Modern Warfare 4";
  if (value === "modern-warfare-iii") return "Call of Duty: Modern Warfare III";
  if (value === "black-ops-6") return "Call of Duty: Black Ops 6";
  if (value === "black-ops-cold-war") return "Call of Duty: Black Ops Cold War";
  if (value === "vanguard") return "Call of Duty: Vanguard";

  return value
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getGameImage(game: string | null) {
  if (game === "mw2") return "https://cdn.cloudflare.steamstatic.com/steam/apps/10180/header.jpg";
  if (game === "modern-warfare-ii") return "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1938090/header.jpg";
  if (game === "black-ops-6") return "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/2933620/header.jpg";
  if (game === "modern-warfare-iii") return "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/2519060/header.jpg";
  if (game === "vanguard") return "https://cdn.cloudflare.steamstatic.com/steam/apps/1985820/header.jpg";
  if (game === "black-ops-cold-war") return "https://cdn.cloudflare.steamstatic.com/steam/apps/1985810/header.jpg";

  return "/mw4.jpeg";
}

function getLadderName(ladder: string | null) {
  if (ladder === "singles") return "Solos Ladder";
  if (ladder === "duos") return "Duos Ladder";
  return "Team Ladder";
}

function getRosterText(ladder: string) {
  if (ladder === "singles") return "1 Player";
  if (ladder === "duos") return "2 Players";
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

function isPostPastTime(post: MatchPost) {
  const now = Date.now();
  const matchTime = parseDateMs(post.match_time);
  if (matchTime && now >= matchTime) return true;
  return false;
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
  const { user } = useUser() as any;

  const platform = searchParams.get("platform") || "xbox";
  const category = searchParams.get("category") || "call-of-duty";
  const game = searchParams.get("game") || "modern-warfare-4";
  const ladder = searchParams.get("ladder") || "team";
  const viewerTeamId = searchParams.get("teamId") || "";

  const platformName = prettyText(platform);
  const gameName = prettyText(game);
  const gameImage = getGameImage(game);
  const ladderName = getLadderName(ladder);
  const rosterText = getRosterText(ladder);
  const createUrl = `/matches/create?teamId=${viewerTeamId}&platform=${platform}&category=${category}&game=${game}&ladder=${ladder}`;
  const viewTeamUrl = viewerTeamId ? `/teams/${viewerTeamId}` : "/profile/teams";
  const ladderUrl = `/ladders/${platform}/${category}/${game}/${ladder}/rankings`;

  const [matches, setMatches] = useState<MatchPost[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [pageError, setPageError] = useState("");
  const [notice, setNotice] = useState("");
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [confirmMatch, setConfirmMatch] = useState<MatchPost | null>(null);
  const [viewMatch, setViewMatch] = useState<MatchPost | null>(null);
  const [cancelMatch, setCancelMatch] = useState<MatchPost | null>(null);
  const [viewerRole, setViewerRole] = useState<TeamRole>("member");

  const viewerCanManageMatches = canManageMatches(viewerRole);

  async function cleanAndFilterExpiredPosts(posts: MatchPost[]): Promise<MatchPost[]> {
    const expiredIds = posts.filter((post) => isPostPastTime(post)).map((post) => post.id);

    if (expiredIds.length > 0) {
      await supabase
        .from("match_posts")
        .update({ status: "expired" })
        .in("id", expiredIds)
        .eq("status", "open");
    }

    return posts.filter((post) => !isPostPastTime(post));
  }

  async function loadMatches() {
    setPageError("");

    const { data, error } = await supabase
      .from("match_posts")
      .select("*")
      .eq("platform", platform)
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

    const allOpenPosts = (data || []) as MatchPost[];
    const nonExpiredPosts = await cleanAndFilterExpiredPosts(allOpenPosts);

    setMatches(nonExpiredPosts);
    setHasLoaded(true);
  }

  // Effect 1: Handles Initial Load & Sets up the Realtime Database Listener
  useEffect(() => {
    loadMatches();

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
        (payload) => {
          const oldRecord = payload.old as any;
          const newRecord = payload.new as MatchPost;

          // If a post status drops from open to something else (accepted, cancelled, expired), strip it immediately from view
          if (payload.eventType === "UPDATE") {
            if (newRecord.status !== "open") {
              setMatches((prev) => prev.filter((m) => m.id !== newRecord.id));
            } else {
              // Ensure match matches the exact ladder filter configurations before parsing it on screen
              if (
                newRecord.platform === platform &&
                newRecord.category === category &&
                newRecord.game === game &&
                newRecord.ladder === ladder &&
                !isPostPastTime(newRecord)
              ) {
                setMatches((prev) => {
                  const exists = prev.some((m) => m.id === newRecord.id);
                  if (exists) {
                    return prev.map((m) => (m.id === newRecord.id ? newRecord : m));
                  }
                  return [newRecord, ...prev];
                });
              }
            }
          }

          if (payload.eventType === "INSERT") {
            if (
              newRecord.status === "open" &&
              newRecord.platform === platform &&
              newRecord.category === category &&
              newRecord.game === game &&
              newRecord.ladder === ladder &&
              !isPostPastTime(newRecord)
            ) {
              setMatches((prev) => [newRecord, ...prev]);
            }
          }

          if (payload.eventType === "DELETE") {
            setMatches((prev) => prev.filter((m) => m.id !== oldRecord.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(matchChannel);
    };
  }, [platform, category, game, ladder]);

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

    setNotice("");

    if (!user?.id) {
      setNotice("You must be signed in to accept this match.");
      return;
    }

    if (!viewerTeamId) {
      setNotice("Missing your team ID. Go back to your team page and open Match Finder from there.");
      return;
    }

    if (!viewerCanManageMatches) {
      setNotice("Only team leaders, co-leaders, and captains can accept matches.");
      setConfirmMatch(null);
      return;
    }

    if (String(confirmMatch.team_id) === String(viewerTeamId)) {
      setNotice("You cannot accept your own match post.");
      setConfirmMatch(null);
      return;
    }

    if (isPostPastTime(confirmMatch)) {
      await supabase
        .from("match_posts")
        .update({ status: "expired" })
        .eq("id", confirmMatch.id)
        .eq("status", "open");

      setNotice("This match post has passed its scheduled time and expired.");
      setConfirmMatch(null);
      return;
    }

    const matchPostId = confirmMatch.id;
    setAcceptingId(matchPostId);

    // Filter local array instantly so the current client session has crisp layout behavior
    setMatches((prev) => prev.filter((m) => m.id !== matchPostId));

    const { data: updatedRows, error: acceptError } = await supabase
      .from("match_posts")
      .update({ status: "accepted" })
      .eq("id", matchPostId)
      .eq("status", "open")
      .select("*");

    if (acceptError) {
      setAcceptingId(null);
      setNotice("Could not accept match: " + acceptError.message);
      setConfirmMatch(null);
      await loadMatches();
      return;
    }

    if (!updatedRows || updatedRows.length === 0) {
      setAcceptingId(null);
      setNotice("Too late! This match challenge was already accepted by another team.");
      setConfirmMatch(null);
      return;
    }

    const currentPost = updatedRows[0];

    const { data: officialMatch, error: matchError } = await supabase
      .from("matches")
      .insert({
        match_post_id: currentPost.id,
        posting_team_id: currentPost.team_id,
        accepting_team_id: viewerTeamId,
        platform: currentPost.platform,
        category: currentPost.category,
        game: currentPost.game,
        ladder: currentPost.ladder,
        game_mode: currentPost.game_mode,
        players: currentPost.players,
        match_time: currentPost.match_time,
        best_of: currentPost.best_of,
        preset: currentPost.preset,
        perks: currentPost.perks,
        launchers: currentPost.launchers,
        killstreaks: currentPost.killstreaks,
        field_upgrades: currentPost.field_upgrades,
        hardcore: currentPost.hardcore,
        friendly_fire: currentPost.friendly_fire,
        radar: currentPost.radar,
        spectating: currentPost.spectating,
        third_person: currentPost.third_person,
        round_length: currentPost.round_length,
        score_limit: currentPost.score_limit,
        health: currentPost.health,
        respawn_delay: currentPost.respawn_delay,
        bomb_timer: currentPost.bomb_timer,
        plant_time: currentPost.plant_time,
        defuse_time: currentPost.defuse_time,
        attachments: currentPost.attachments,
        status: "upcoming",
        accepted_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    setAcceptingId(null);
    setConfirmMatch(null);

    if (matchError || !officialMatch) {
      setNotice("Match claimed, but schedule roster entry failed to populate.");
      return;
    }

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
        .accept-warning{color:#d7ad4a;font-weight:900;text-transform:uppercase;}
        .accept-actions{display:flex;gap:12px;padding:0 16px 16px;}
        .accept-btn{height:40px;min-width:150px;border:1px solid #e8c46a;background:linear-gradient(to bottom,#d6a943,#7b560e);color:#07111b;font-size:12px;font-weight:900;text-transform:uppercase;cursor:pointer;}
        .accept-btn.red{border-color:#e34242;background:linear-gradient(to bottom,#bd1717,#5c0000);color:#fff;}
        .accept-btn:disabled{opacity:.55;cursor:not-allowed;}

        @media(max-width:980px){
          .finder-layout{grid-template-columns:1fr;}
          .board{overflow-x:auto;}
          .board-head,.match-row{min-width:760px;}
          .header{flex-direction:column;justify-content:center;gap:12px;padding:18px;text-align:center;}
          .nav{height:auto;padding:10px;flex-wrap:wrap;gap:14px;}
        }
      `}</style>

      <main className="page">
        <div className="wrap">
          <header className="header">
            <div className="game-header">
              <div className="game-cover">
                <img src={gameImage} alt={gameName} />
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
            <a href="/home">Home</a>
            <a href="/profile/teams">My Teams</a>
            <a href="/members">Members</a>
            <a href="/forums">Forums</a>
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

                  <a className="help-box" href="/matches/finder/help">How Match Finder Works</a>
                  {viewerCanManageMatches ? (
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
                      <div>Rules</div>
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
                          <div className="match-cell mode">{match.game_mode}</div>
                          <div className="match-cell rules-type">{match.preset || "GB Default"}</div>
                          <div className="match-cell time">{match.match_time}</div>
                          <div className="match-cell">
                            <div className="actions">
                              <button className="mini-btn" type="button" onClick={() => setViewMatch(match)}>
                                View
                              </button>

                              {isMyPost ? (
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
                                  <button className="mini-btn disabled" type="button">Cancel</button>
                                )
                              ) : user?.id && viewerCanManageMatches ? (
                                <button className="mini-btn gold" type="button" onClick={() => setConfirmMatch(match)}>
                                  Accept
                                </button>
                              ) : (
                                <button className="mini-btn disabled" type="button">Accept</button>
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
                Mode: {confirmMatch.game_mode}
                <br />
                Rules: {confirmMatch.preset || "GB Default"}
                <br />
                Time: {confirmMatch.match_time}
              </div>
            </div>
            <div className="accept-actions">
              <button
                className="accept-btn"
                type="button"
                disabled={acceptingId === confirmMatch.id}
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
                Mode: {viewMatch.game_mode}
                <br />
                Rules: {viewMatch.preset || "GB Default"}
                <br />
                Time: {viewMatch.match_time}
              </div>
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