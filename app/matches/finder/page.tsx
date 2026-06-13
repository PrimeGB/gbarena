"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "../../../lib/useUser";
import { supabase } from "../../../lib/supabase";

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
  return value
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
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
  const ladderName = getLadderName(ladder);
  const rosterText = getRosterText(ladder);

  const [matches, setMatches] = useState<MatchPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [notice, setNotice] = useState("");
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [confirmMatch, setConfirmMatch] = useState<MatchPost | null>(null);

  const createUrl = `/matches/create?teamId=${viewerTeamId}&platform=${platform}&category=${category}&game=${game}&ladder=${ladder}`;

  async function loadMatches() {
    setLoading(true);
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
      setLoading(false);
      return;
    }

    setMatches((data || []) as MatchPost[]);
    setLoading(false);
  }

  useEffect(() => {
    loadMatches();
  }, [platform, category, game, ladder]);

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

    if (String(confirmMatch.team_id) === String(viewerTeamId)) {
      setNotice("You cannot accept your own match post.");
      setConfirmMatch(null);
      return;
    }

    setAcceptingId(confirmMatch.id);

    const { data: acceptedPost, error: acceptError } = await supabase
      .from("match_posts")
      .update({ status: "accepted" })
      .eq("id", confirmMatch.id)
      .eq("status", "open")
      .select("*");

    if (acceptError) {
      setAcceptingId(null);
      setNotice("Could not accept match: " + acceptError.message);
      setConfirmMatch(null);
      return;
    }

    if (!acceptedPost || acceptedPost.length === 0) {
      setAcceptingId(null);
      setNotice("This match is no longer available.");
      setConfirmMatch(null);
      await loadMatches();
      return;
    }

    const post = acceptedPost[0] as MatchPost;

    const { data: officialMatch, error: matchError } = await supabase
      .from("matches")
      .insert({
        match_post_id: post.id,
        posting_team_id: post.team_id,
        accepting_team_id: viewerTeamId,

        platform: post.platform,
        category: post.category,
        game: post.game,
        ladder: post.ladder,

        game_mode: post.game_mode,
        players: post.players,
        match_time: post.match_time,
        best_of: post.best_of,

        preset: post.preset,
        perks: post.perks,
        launchers: post.launchers,
        killstreaks: post.killstreaks,
        field_upgrades: post.field_upgrades,
        hardcore: post.hardcore,
        friendly_fire: post.friendly_fire,
        radar: post.radar,
        spectating: post.spectating,
        third_person: post.third_person,
        round_length: post.round_length,
        score_limit: post.score_limit,
        health: post.health,
        respawn_delay: post.respawn_delay,
        bomb_timer: post.bomb_timer,
        plant_time: post.plant_time,
        defuse_time: post.defuse_time,
        attachments: post.attachments,

        status: "upcoming",
        accepted_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    setAcceptingId(null);

    if (matchError || !officialMatch) {
      setNotice("Match post was accepted, but the official match could not be created.");
      setConfirmMatch(null);
      await loadMatches();
      return;
    }

    router.push(`/matches/${officialMatch.id}`);
  }

  return (
    <>
      <style>{`
        *{margin:0;padding:0;box-sizing:border-box;}
        body{background:#000;font-family:Tahoma,Verdana,Arial,sans-serif;color:#d7e2ee;}
        a{text-decoration:none;}
        button{font-family:Tahoma,Verdana,Arial,sans-serif;}

        .page{min-height:100vh;background:radial-gradient(circle at top,rgba(45,100,150,.28),transparent 42%),linear-gradient(to bottom,#02060a,#000);padding:32px 22px;}
        .wrap{max-width:1120px;margin:0 auto;background:#07111b;border:1px solid #315f88;box-shadow:0 0 28px rgba(0,80,140,.38), inset 0 0 22px rgba(0,0,0,.72);}
        .top-strip{height:30px;background:linear-gradient(to bottom,#8b0000,#3b0000);border-bottom:1px solid #b32222;display:flex;align-items:center;justify-content:flex-end;gap:18px;padding:0 14px;}
        .top-strip a{color:#fff;font-size:12px;font-weight:bold;text-transform:uppercase;}

        .header{min-height:104px;background:linear-gradient(to right,rgba(0,0,0,.55),rgba(0,0,0,.08)),linear-gradient(to bottom,#173956,#07111b);border-bottom:2px solid #315f88;display:flex;align-items:center;justify-content:space-between;padding:0 24px;}
        .game-header{display:flex;align-items:center;gap:18px;}
        .game-cover{width:126px;height:78px;border:1px solid #315f88;background:linear-gradient(135deg,#07111b,#02070c 48%,#142f47);overflow:hidden;box-shadow:0 0 14px rgba(0,0,0,.55);}
        .game-cover img{width:100%;height:100%;object-fit:cover;object-position:center;display:block;}
        .game-name{color:#f2c14e;font-size:15px;font-weight:900;letter-spacing:1.3px;text-transform:uppercase;margin-bottom:8px;text-shadow:0 1px 2px #000;}
        .ladder-name{color:#fff;font-size:30px;font-weight:900;text-transform:uppercase;text-shadow:0 2px 4px #000;}
        .header-badge{border:1px solid #6ba8d6;background:linear-gradient(to bottom,#214765,#0b1c2d);color:#f5f8ff;font-size:15px;font-weight:900;text-transform:uppercase;padding:14px 22px;text-shadow:0 2px 4px #000;}

        .nav{height:36px;background:linear-gradient(to bottom,#10283d,#07111b);border-bottom:1px solid #244b70;display:flex;align-items:center;justify-content:center;gap:28px;}
        .nav a{color:#d7eaff;font-size:12px;font-weight:bold;text-transform:uppercase;}
        .nav a:hover{color:#d7ad4a;}

        .title-bar{background:linear-gradient(to bottom,#1d496e,#0a1724);border-bottom:1px solid #315f88;padding:18px 24px;text-align:center;}
        .title-bar h1{color:#d7ad4a;font-size:30px;text-transform:uppercase;text-shadow:0 1px 2px #000;}
        .title-bar p{color:#cfe2f2;font-size:13px;margin-top:7px;}

        .content{padding:18px;}
        .finder-layout{display:grid;grid-template-columns:232px 1fr;gap:14px;}
        .panel{background:#050b12;border:1px solid #244b70;box-shadow:inset 0 0 18px rgba(0,0,0,.75);}
        .panel-header{min-height:36px;background:linear-gradient(to bottom,#18344f,#091521);border-bottom:1px solid #244b70;display:flex;align-items:center;justify-content:center;padding:0 12px;color:#d7ad4a;font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:1px;}

        .side-body{padding:12px;}
        .ladder-card{border:1px solid #1f3d5a;background:linear-gradient(to bottom,#091724,#06101a);padding:12px;margin-bottom:12px;}
        .ladder-title{color:#d7ad4a;font-size:12px;font-weight:900;text-transform:uppercase;margin-bottom:9px;padding-bottom:8px;border-bottom:1px solid rgba(255,255,255,.08);}
        .ladder-line{color:#cfe2f2;font-size:12px;line-height:23px;border-bottom:1px solid rgba(255,255,255,.05);}
        .ladder-line:last-child{border-bottom:0;}
        .ladder-line span{color:#8aa7c0;}

        .help-box,.quick-create{height:40px;width:100%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:900;text-transform:uppercase;margin-top:10px;}
        .help-box{border:1px solid #4b95d8;background:linear-gradient(to bottom,#1c4b72,#0a1724);color:#fff;}
        .quick-create{border:1px solid #e8c46a;background:linear-gradient(to bottom,#d6a943,#7b560e);color:#07111b;}

        .main-body{padding:12px;}
        .notice-box{border:1px solid #d7ad4a;background:#201703;color:#ffd76a;font-size:12px;font-weight:900;text-transform:uppercase;padding:11px;margin-bottom:12px;text-align:center;}

        .board{border:1px solid #244b70;background:#02070c;}
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
        .mini-btn.disabled{opacity:.42;cursor:not-allowed;}
        .mini-btn:hover:not(.disabled){filter:brightness(1.13);}

        .empty-state,.error-state,.loading-state{padding:28px;text-align:center;color:#cfe2f2;font-size:13px;font-weight:900;text-transform:uppercase;}
        .error-state{color:#ff9c9c;}

        .footer{height:36px;background:#07111b;border-top:1px solid #244b70;display:flex;justify-content:center;align-items:center;color:#a9c3db;font-size:11px;}

        .modal-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.76);display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px;}
        .accept-modal{width:520px;max-width:95vw;border:1px solid #6ba8d6;background:#07111b;box-shadow:0 0 35px rgba(0,100,180,.55);}
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
          <div className="top-strip">
            <a href="/home">Home</a>
            <a href="/profile">My Profile</a>
            <a href="/forums">Forums</a>
          </div>

          <header className="header">
            <div className="game-header">
              <div className="game-cover">
                <img src="/mw4.jpeg" alt="Call of Duty: Modern Warfare 4" />
              </div>

              <div>
                <div className="game-name">{gameName}</div>
                <div className="ladder-name">{ladderName}</div>
              </div>
            </div>

            <div className="header-badge">Match Finder</div>
          </header>

          <nav className="nav">
            <a href="/home">Home</a>
            <a href="/profile/teams">My Teams</a>
            <a href="/members">Members</a>
            <a href="/forums">Forums</a>
            <a href="/teams/top">Top Teams</a>
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
                    <div className="ladder-line"><span>Rules:</span> GB Default</div>
                  </div>

                  <a className="help-box" href="/matches/finder/help">How Match Finder Works</a>
                  <a className="quick-create" href={createUrl}>Create Match</a>
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

                    {loading && <div className="loading-state">Loading match posts...</div>}
                    {pageError && <div className="error-state">{pageError}</div>}

                    {!loading && !pageError && matches.length === 0 && (
                      <div className="empty-state">No open matches posted for this ladder yet.</div>
                    )}

                    {!loading && !pageError && matches.map((match) => {
                      const isMyPost = viewerTeamId && String(match.team_id) === String(viewerTeamId);

                      return (
                        <div className="match-row" key={match.id}>
                          <div className="match-cell players">{match.players}</div>
                          <div className="match-cell mode">{match.game_mode}</div>
                          <div className="match-cell rules-type">{match.preset || "GB Default"}</div>
                          <div className="match-cell time">{match.match_time}</div>

                          <div className="match-cell">
                            <div className="actions">
                              <a className="mini-btn" href={`/matches/${match.id}/rules`}>View</a>

                              {isMyPost ? (
                                <button className="mini-btn disabled" type="button">Own</button>
                              ) : user?.id ? (
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

          <footer className="footer">© 2026 Competitive Gaming Network</footer>
        </div>
      </main>

      {confirmMatch && (
        <div className="modal-backdrop">
          <div className="accept-modal">
            <div className="accept-title">Confirm Match Acceptance</div>

            <div className="accept-body">
              <p className="accept-warning">
                Before accepting, confirm you have read and understood the rules and settings.
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

              <p>
                By accepting this match, you agree to play by these match settings while following all ladder rules.
              </p>
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
    </>
  );
}