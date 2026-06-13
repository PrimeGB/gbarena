"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useUser } from "../../../lib/useUser";
import { supabase } from "../../../lib/supabase";

function prettyText(value: string | null) {
  if (!value) return "";
  if (value === "mw2") return "Call of Duty: Modern Warfare 2";
  if (value === "modern-warfare-ii") return "Call of Duty: Modern Warfare II";
  if (value === "modern-warfare-4") return "Call of Duty: Modern Warfare 4";
  if (value === "black-ops-6") return "Call of Duty: Black Ops 6";
  if (value === "modern-warfare-iii") return "Call of Duty: Modern Warfare III";
  if (value === "black-ops-cold-war") return "Call of Duty: Black Ops Cold War";

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

function getPlayerOptions(ladder: string | null) {
  if (ladder === "singles") return ["1v1"];
  if (ladder === "duos") return ["2v2"];
  return ["3v3", "4v4", "5v5", "6v6", "7v7", "8v8"];
}

type RulesType = "GB Variant" | "CDL" | "Custom";

export default function CreateMatchPage() {
  return (
    <Suspense fallback={<div style={{ color: "white", padding: 40 }}>Loading Create Match...</div>}>
      <CreateMatchContent />
    </Suspense>
  );
}

function CreateMatchContent() {
  const searchParams = useSearchParams();
  const { user } = useUser() as any;

  const teamId = searchParams.get("teamId") || "";
  const platform = searchParams.get("platform") || "xbox";
  const category = searchParams.get("category") || "call-of-duty";
  const game = searchParams.get("game") || "modern-warfare-4";
  const ladder = searchParams.get("ladder") || "team";

  const platformName = prettyText(platform);
  const gameName = prettyText(game);
  const ladderName = getLadderName(ladder);
  const gameImage = getGameImage(game);

  const playerOptions = useMemo(() => getPlayerOptions(ladder), [ladder]);

  const [gameMode, setGameMode] = useState("Search and Destroy");
  const [rulesType, setRulesType] = useState<RulesType>("GB Variant");
  const [players, setPlayers] = useState(playerOptions[0]);
  const [matchTime, setMatchTime] = useState("8:00 PM");
  const [bestOf, setBestOf] = useState("Best of 3");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [viewPresetOpen, setViewPresetOpen] = useState<RulesType | null>(null);
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState("");
  const [postSuccess, setPostSuccess] = useState("");

  const [perks, setPerks] = useState("On");
  const [launchers, setLaunchers] = useState("Off");
  const [killstreaks, setKillstreaks] = useState("Off");
  const [fieldUpgrades, setFieldUpgrades] = useState("On");
  const [hardcore, setHardcore] = useState("Off");
  const [friendlyFire, setFriendlyFire] = useState("On");
  const [radar, setRadar] = useState("Normal");
  const [spectating, setSpectating] = useState("Team Only");
  const [thirdPerson, setThirdPerson] = useState("Off");
  const [roundLength, setRoundLength] = useState("1.5 Minutes");
  const [scoreLimit, setScoreLimit] = useState("Default");
  const [timeLimit, setTimeLimit] = useState("Default");
  const [health, setHealth] = useState("Normal");
  const [respawnDelay, setRespawnDelay] = useState("None");
  const [bombTimer, setBombTimer] = useState("45 Seconds");
  const [plantTime, setPlantTime] = useState("5 Seconds");
  const [defuseTime, setDefuseTime] = useState("7.5 Seconds");
  const [attachments, setAttachments] = useState("On");
  const [headshotsOnly, setHeadshotsOnly] = useState("Off");
  const [miniMap, setMiniMap] = useState("Normal");
  const [revengeVoice, setRevengeVoice] = useState("Off");
  const [teamAssignment, setTeamAssignment] = useState("Open");
  const [joinInProgress, setJoinInProgress] = useState("Not Allowed");
  const [spawnCamera, setSpawnCamera] = useState("Off");
  const [forceRespawn, setForceRespawn] = useState("On");
  const [waveSpawnDelay, setWaveSpawnDelay] = useState("None");
  const [lives, setLives] = useState("1 Life");

  useEffect(() => {
    setPlayers(playerOptions[0]);
  }, [playerOptions]);

  const timeSlots = [
    "12:00 AM", "12:15 AM", "12:30 AM", "12:45 AM",
    "1:00 AM", "1:15 AM", "1:30 AM", "1:45 AM",
    "2:00 AM", "2:15 AM", "2:30 AM", "2:45 AM",
    "3:00 AM", "3:15 AM", "3:30 AM", "3:45 AM",
    "4:00 AM", "4:15 AM", "4:30 AM", "4:45 AM",
    "5:00 AM", "5:15 AM", "5:30 AM", "5:45 AM",
    "6:00 AM", "6:15 AM", "6:30 AM", "6:45 AM",
    "7:00 AM", "7:15 AM", "7:30 AM", "7:45 AM",
    "8:00 AM", "8:15 AM", "8:30 AM", "8:45 AM",
    "9:00 AM", "9:15 AM", "9:30 AM", "9:45 AM",
    "10:00 AM", "10:15 AM", "10:30 AM", "10:45 AM",
    "11:00 AM", "11:15 AM", "11:30 AM", "11:45 AM",
    "12:00 PM", "12:15 PM", "12:30 PM", "12:45 PM",
    "1:00 PM", "1:15 PM", "1:30 PM", "1:45 PM",
    "2:00 PM", "2:15 PM", "2:30 PM", "2:45 PM",
    "3:00 PM", "3:15 PM", "3:30 PM", "3:45 PM",
    "4:00 PM", "4:15 PM", "4:30 PM", "4:45 PM",
    "5:00 PM", "5:15 PM", "5:30 PM", "5:45 PM",
    "6:00 PM", "6:15 PM", "6:30 PM", "6:45 PM",
    "7:00 PM", "7:15 PM", "7:30 PM", "7:45 PM",
    "8:00 PM", "8:15 PM", "8:30 PM", "8:45 PM",
    "9:00 PM", "9:15 PM", "9:30 PM", "9:45 PM",
    "10:00 PM", "10:15 PM", "10:30 PM", "10:45 PM",
    "11:00 PM", "11:15 PM", "11:30 PM", "11:45 PM",
  ];

  const presetText =
    rulesType === "Custom"
      ? `Custom · Players ${players} · Perks ${perks} · Launchers ${launchers} · Killstreaks ${killstreaks}`
      : `${rulesType} locked preset · Players ${players} · Preset settings cannot be edited`;

  async function handlePostMatch() {
    setPostError("");
    setPostSuccess("");

    if (!user?.id) {
      setPostError("You must be signed in to post a match.");
      return;
    }

    if (!teamId) {
      setPostError("Missing team ID. Go back to your team page and click Create Match again.");
      return;
    }

    setPosting(true);

    const { error } = await supabase.from("match_posts").insert({
      team_id: teamId,
      platform,
      category,
      game,
      ladder,
      game_mode: gameMode,
      players,
      match_time: matchTime,
      best_of: bestOf,
      preset: rulesType,
      perks,
      launchers,
      killstreaks,
      field_upgrades: fieldUpgrades,
      hardcore,
      friendly_fire: friendlyFire,
      radar,
      spectating,
      third_person: thirdPerson,
      round_length: roundLength,
      score_limit: scoreLimit,
      health,
      respawn_delay: respawnDelay,
      bomb_timer: bombTimer,
      plant_time: plantTime,
      defuse_time: defuseTime,
      attachments,
      status: "open",
    });

    setPosting(false);

    if (error) {
      setPostError("Match could not be posted: " + error.message);
      return;
    }

    setPostSuccess("Your match was successfully posted.");
  }

  return (
    <>
      <style>{`
        *{margin:0;padding:0;box-sizing:border-box;}
        body{background:#000;font-family:Tahoma,Verdana,Arial,sans-serif;color:#d7e2ee;}
        a{text-decoration:none;}

        .page{min-height:100vh;background:radial-gradient(circle at top,rgba(45,100,150,.22),transparent 42%),linear-gradient(to bottom,#02060a,#000);padding:32px 22px;}
        .wrap{max-width:1080px;margin:0 auto;background:#07111b;border:1px solid #315f88;box-shadow:0 0 28px rgba(0,80,140,.35), inset 0 0 22px rgba(0,0,0,.7);}
        .top-strip{height:30px;background:linear-gradient(to bottom,#8b0000,#3b0000);border-bottom:1px solid #b32222;display:flex;align-items:center;justify-content:flex-end;gap:18px;padding:0 14px;}
        .top-strip a{color:#fff;font-size:12px;font-weight:bold;text-transform:uppercase;}

        .header{min-height:104px;background:linear-gradient(to bottom,#173956,#07111b);border-bottom:2px solid #315f88;display:flex;align-items:center;justify-content:space-between;padding:0 24px;}
        .game-header{display:flex;align-items:center;gap:18px;}
        .game-cover{width:126px;height:78px;border:1px solid #315f88;background:#050c14;overflow:hidden;}
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

        .content{padding:22px;}
        .old-grid{display:grid;grid-template-columns:240px 1fr;gap:18px;}
        .side-panel,.main-panel{background:#050b12;border:1px solid #244b70;box-shadow:inset 0 0 18px rgba(0,0,0,.75);}
        .panel-header{min-height:38px;background:linear-gradient(to bottom,#18344f,#091521);border-bottom:1px solid #244b70;display:flex;align-items:center;padding:0 14px;color:#d7ad4a;font-size:13px;font-weight:900;text-transform:uppercase;letter-spacing:1.2px;}

        .side-body{padding:14px;}
        .steps-box{border:1px solid #1f3d5a;background:linear-gradient(to bottom,#091724,#06101a);padding:14px;margin-bottom:14px;}
        .steps-title{color:#d7ad4a;font-size:12px;font-weight:900;text-transform:uppercase;margin-bottom:12px;border-bottom:1px solid rgba(255,255,255,.09);padding-bottom:8px;}
        .step-line{color:#cfe2f2;font-size:12px;line-height:22px;padding:3px 0;border-bottom:1px solid rgba(255,255,255,.04);}
        .step-line:last-child{border-bottom:none;}
        .step-arrow{color:#d7ad4a;font-weight:bold;margin-right:6px;}

        .match-info{border:1px solid #244b70;background:#081522;padding:12px;}
        .match-info div{color:#cfe2f2;font-size:12px;line-height:23px;border-bottom:1px solid rgba(255,255,255,.055);}
        .match-info div:last-child{border-bottom:none;}

        .main-body{padding:18px;}
        .form-section{border:1px solid #244b70;background:#07111b;margin-bottom:15px;box-shadow:inset 0 0 14px rgba(0,0,0,.35);}
        .form-title{height:33px;display:flex;align-items:center;padding:0 12px;background:linear-gradient(to bottom,#112b42,#07111b);border-bottom:1px solid #244b70;color:#d7ad4a;font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:.4px;}
        .form-body{padding:15px;}

        .row{display:grid;grid-template-columns:145px 1fr;gap:12px;align-items:center;margin-bottom:12px;}
        .row:last-child{margin-bottom:0;}

        label{color:#cfe2f2;font-size:12px;font-weight:bold;text-transform:uppercase;}
        input,select,textarea{width:100%;border:1px solid #315b7d;background:#02070c;color:#fff;font-size:13px;font-family:Tahoma,Verdana,Arial,sans-serif;padding:9px 10px;outline:none;}
        input:focus,select:focus,textarea:focus{border-color:#6ba8d6;box-shadow:0 0 8px rgba(103,189,255,.28);}
        select{cursor:pointer;}

        .mode-select{max-width:310px;}
        .rules-select{max-width:230px;}
        .small-select{max-width:160px;}
        .time-select{max-width:170px;}
        .locked-player-box{max-width:160px;border:1px solid #315b7d;background:#02070c;color:#d7ad4a;font-size:13px;font-weight:900;padding:9px 10px;text-transform:uppercase;}

        .date-time-box{border:1px solid #315b7d;background:#02070c;padding:12px;display:grid;grid-template-columns:130px 180px;gap:12px;align-items:center;max-width:340px;}
        .locked-day{height:38px;border:1px solid #244b70;background:#07111b;color:#d7ad4a;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:900;text-transform:uppercase;}

        .best-of-scroll{width:170px;height:78px;overflow-y:auto;border:1px solid #315b7d;background:#02070c;}
        .best-of-option{width:100%;height:26px;border:0;border-bottom:1px solid rgba(255,255,255,.07);background:#02070c;color:#cfe2f2;font-size:12px;font-weight:900;text-transform:uppercase;cursor:pointer;text-align:left;padding-left:10px;}
        .best-of-option:hover,.best-of-option.active{background:#10283d;color:#d7ad4a;}

        .settings-summary{border:1px solid #315b7d;background:#02070c;padding:14px;}
        .settings-title{color:#fff;font-size:14px;font-weight:900;text-transform:uppercase;margin-bottom:5px;}
        .settings-copy{color:#8aa7c0;font-size:12px;line-height:18px;margin-bottom:12px;}
        .settings-buttons{display:flex;flex-wrap:wrap;gap:10px;}
        .settings-button{min-width:165px;height:38px;border:1px solid #4b95d8;background:linear-gradient(to bottom,#1c4b72,#0a1724);color:#fff;font-size:11px;font-weight:900;text-transform:uppercase;cursor:pointer;}
        .settings-button:hover{color:#d7ad4a;border-color:#d7ad4a;}
        .settings-button.locked{opacity:.45;cursor:not-allowed;}
        .settings-button.locked:hover{color:#fff;border-color:#4b95d8;}

        .rules-box{border:1px solid #315b7d;background:#02070c;padding:13px;color:#cfe2f2;font-size:12px;line-height:22px;}
        .small-note{color:#8aa7c0;font-size:11px;line-height:18px;margin-top:8px;}

        .success-box{border:1px solid #35a852;background:#06230d;color:#8cff9d;font-size:13px;font-weight:900;text-transform:uppercase;padding:12px;margin-bottom:14px;}
        .error-box{border:1px solid #923131;background:#210707;color:#ff9c9c;font-size:13px;font-weight:900;text-transform:uppercase;padding:12px;margin-bottom:14px;}

        .actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:16px;}
        .action-btn{min-width:180px;height:44px;border:1px solid #4b95d8;background:linear-gradient(to bottom,#1c4b72,#0a1724);color:#fff;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:900;text-transform:uppercase;letter-spacing:1px;text-shadow:0 1px 2px #000;cursor:pointer;}
        .action-btn.gold{background:linear-gradient(to bottom,#d6a943,#7b560e);border-color:#e8c46a;color:#07111b;text-shadow:none;}
        .action-btn.red{background:linear-gradient(to bottom,#bd1717,#5c0000);border-color:#e34242;}
        .action-btn:hover{filter:brightness(1.13);}
        .action-btn:disabled{opacity:.55;cursor:not-allowed;filter:none;}

        .footer{height:36px;background:#07111b;border-top:1px solid #244b70;display:flex;justify-content:center;align-items:center;color:#a9c3db;font-size:11px;}

        .modal-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.74);z-index:100;display:flex;align-items:center;justify-content:center;padding:20px;}
        .settings-modal{width:820px;max-width:96vw;max-height:90vh;overflow:auto;border:1px solid #315f88;background:#050b12;box-shadow:0 0 30px rgba(0,80,140,.55);}
        .modal-title{height:38px;background:linear-gradient(to bottom,#18344f,#091521);border-bottom:1px solid #244b70;color:#d7ad4a;display:flex;align-items:center;justify-content:space-between;padding:0 12px;font-size:13px;font-weight:900;text-transform:uppercase;}
        .modal-close{width:24px;height:24px;border:1px solid #315f88;background:#000;color:#fff;font-weight:900;cursor:pointer;}
        .modal-body{padding:15px;}
        .settings-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
        .setting-row{display:grid;grid-template-columns:145px 1fr;gap:10px;align-items:center;border:1px solid #1f3d5a;background:#07111b;padding:10px;}
        .preset-list{border:1px solid #1f3d5a;background:#07111b;padding:12px;color:#cfe2f2;font-size:12px;line-height:22px;}
        .preset-list div{border-bottom:1px solid rgba(255,255,255,.06);padding:5px 0;}
        .preset-list div:last-child{border-bottom:none;}
        .modal-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:15px;}

        @media(max-width:850px){
          .old-grid{grid-template-columns:1fr;}
          .row,.settings-grid,.setting-row,.date-time-box{grid-template-columns:1fr;gap:8px;}
          .header{flex-direction:column;justify-content:center;gap:12px;padding:18px;text-align:center;}
          .nav{flex-wrap:wrap;height:auto;padding:10px;gap:14px;}
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
                <img src={gameImage} alt={gameName} />
              </div>

              <div>
                <div className="game-name">{gameName}</div>
                <div className="ladder-name">{ladderName}</div>
              </div>
            </div>

            <div className="header-badge">Create Match</div>
          </header>

          <nav className="nav">
            <a href="/home">Home</a>
            <a href="/profile/teams">My Teams</a>
            <a href="/members">Members</a>
            <a href="/forums">Forums</a>
            <a href="/teams/top">Top Teams</a>
          </nav>

          <section className="title-bar">
            <h1>Create Match</h1>
            <p>{platformName} / {gameName} / {ladderName}</p>
          </section>

          <section className="content">
            <div className="old-grid">
              <aside className="side-panel">
                <div className="panel-header">Match Setup</div>

                <div className="side-body">
                  <div className="steps-box">
                    <div className="steps-title">Create Match Steps</div>
                    <div className="step-line"><span className="step-arrow">►</span>Select Game Mode</div>
                    <div className="step-line"><span className="step-arrow">►</span>Select Rules</div>
                    <div className="step-line"><span className="step-arrow">►</span>Confirm Player Count</div>
                    <div className="step-line"><span className="step-arrow">►</span>Pick Match Time</div>
                    <div className="step-line"><span className="step-arrow">►</span>Post Match</div>
                  </div>

                  <div className="match-info">
                    <div>Platform: {platformName}</div>
                    <div>Game: {gameName}</div>
                    <div>Ladder: {ladderName}</div>
                    <div>Rules: {rulesType}</div>
                    <div>Players: {players}</div>
                    <div>Team ID: {teamId ? "Loaded" : "Missing"}</div>
                    <div>Status: Match Draft</div>
                  </div>
                </div>
              </aside>

              <section className="main-panel">
                <div className="panel-header">Match Post Form</div>

                <div className="main-body">
                  {postSuccess && <div className="success-box">{postSuccess}</div>}
                  {postError && <div className="error-box">{postError}</div>}

                  <div className="form-section">
                    <div className="form-title">Match Details</div>

                    <div className="form-body">
                      <div className="row">
                        <label>Game Mode</label>
                        <select className="mode-select" value={gameMode} onChange={(e) => setGameMode(e.target.value)}>
                          <option>Search and Destroy</option>
                          <option>Hardpoint</option>
                          <option>Control</option>
                          <option>Domination</option>
                          <option>Team Deathmatch</option>
                          <option>Kill Confirmed</option>
                          <option>Headquarters</option>
                          <option>Capture the Flag</option>
                          <option>Gunfight</option>
                        </select>
                      </div>

                      <div className="row">
                        <label>Rules</label>
                        <div>
                          <select className="rules-select" value={rulesType} onChange={(e) => setRulesType(e.target.value as RulesType)}>
                            <option>GB Variant</option>
                            <option>CDL</option>
                            <option>Custom</option>
                          </select>
                          <div className="small-note">
                            GB Variant and CDL are locked presets. Custom allows manual rule editing.
                          </div>
                        </div>
                      </div>

                      <div className="row">
                        <label>Settings</label>
                        <div className="settings-summary">
                          <div className="settings-title">Match Settings</div>
                          <div className="settings-copy">{presetText}</div>

                          <div className="settings-buttons">
                            <button className="settings-button" type="button" onClick={() => setViewPresetOpen("GB Variant")}>
                              View GB Preset Settings
                            </button>

                            <button className="settings-button" type="button" onClick={() => setViewPresetOpen("CDL")}>
                              View CDL Settings
                            </button>

                            <button
                              className={rulesType === "Custom" ? "settings-button" : "settings-button locked"}
                              type="button"
                              disabled={rulesType !== "Custom"}
                              onClick={() => setSettingsOpen(true)}
                            >
                              Edit Custom Settings
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="row">
                        <label>Players</label>
                        {playerOptions.length === 1 ? (
                          <div>
                            <div className="locked-player-box">{playerOptions[0]}</div>
                            <div className="small-note">Player count is locked because this is a {ladderName}.</div>
                          </div>
                        ) : (
                          <select className="small-select" value={players} onChange={(e) => setPlayers(e.target.value)}>
                            {playerOptions.map((option) => (
                              <option key={option}>{option}</option>
                            ))}
                          </select>
                        )}
                      </div>

                      <div className="row">
                        <label>Date / Time</label>
                        <div>
                          <div className="date-time-box">
                            <div className="locked-day">Today</div>
                            <select className="time-select" value={matchTime} onChange={(e) => setMatchTime(e.target.value)}>
                              {timeSlots.map((slot) => (
                                <option key={slot}>{slot}</option>
                              ))}
                            </select>
                          </div>

                          <div className="small-note">Date is locked to today. Time can only be posted in 15 minute slots.</div>
                        </div>
                      </div>

                      <div className="row">
                        <label>Best Of</label>
                        <div className="best-of-scroll">
                          {["Best of 1", "Best of 3", "Best of 5", "Best of 7"].map((option) => (
                            <button
                              key={option}
                              type="button"
                              className={bestOf === option ? "best-of-option active" : "best-of-option"}
                              onClick={() => setBestOf(option)}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="form-section">
                    <div className="form-title">Rules Reminder</div>
                    <div className="form-body">
                      <div className="rules-box">
                        • This match is being created for the <strong>{ladderName}</strong>.
                        <br />
                        • Selected ruleset: <strong>{rulesType}</strong>.
                        <br />
                        • Player count is locked to <strong>{players}</strong> for this ladder.
                        <br />
                        • Posted matches are available for eligible teams on this ladder.
                        <br />
                        • Results must be reported after the match.
                        <br />
                        • Screenshots or proof may be needed for disputes.
                      </div>
                    </div>
                  </div>

                  <div className="actions">
                    <button className="action-btn gold" type="button" disabled={posting} onClick={handlePostMatch}>
                      {posting ? "Posting..." : "Post Match"}
                    </button>

                    <a className="action-btn" href={`/matches/finder?platform=${platform}&category=${category}&game=${game}&ladder=${ladder}`}>
                      Match Finder
                    </a>

                    <button className="action-btn red" type="button" onClick={() => history.back()}>
                      Cancel
                    </button>
                  </div>
                </div>
              </section>
            </div>
          </section>

          <footer className="footer">© 2026 Competitive Gaming Network</footer>
        </div>
      </main>

      {viewPresetOpen && (
        <div className="modal-backdrop">
          <div className="settings-modal">
            <div className="modal-title">
              {viewPresetOpen} Settings
              <button className="modal-close" type="button" onClick={() => setViewPresetOpen(null)}>
                X
              </button>
            </div>

            <div className="modal-body">
              {viewPresetOpen === "GB Variant" && (
                <div className="preset-list">
                  <div>Ruleset: GB Variant site preset</div>
                  <div>Status: Developer controlled preset</div>
                  <div>Game Mode: Host selected</div>
                  <div>Players: Based on ladder</div>
                  <div>Radar: Normal</div>
                  <div>Hardcore: Off</div>
                  <div>Third Person: Off</div>
                  <div>Killstreaks: Off</div>
                  <div>Launchers: Off</div>
                  <div>Perks: On</div>
                  <div>Attachments: On</div>
                  <div>Friendly Fire: On</div>
                  <div>Spectating: Team Only</div>
                  <div>Search and Destroy: 1 life, 45 second bomb timer, 5 second plant, 7.5 second defuse</div>
                </div>
              )}

              {viewPresetOpen === "CDL" && (
                <div className="preset-list">
                  <div>Ruleset: CDL competitive-style preset</div>
                  <div>Modes: Search and Destroy, Hardpoint, Control</div>
                  <div>Players: Competitive team format</div>
                  <div>Radar: Normal</div>
                  <div>Hardcore: Off</div>
                  <div>Third Person: Off</div>
                  <div>Killstreaks: Off</div>
                  <div>Launchers: Restricted/Off</div>
                  <div>Friendly Fire: On</div>
                  <div>Spectating: Team Only</div>
                  <div>Join In Progress: Not Allowed</div>
                  <div>Game rules follow CDL-style competitive restrictions and map/mode settings.</div>
                </div>
              )}

              <div className="modal-actions">
                <button className="action-btn" type="button" onClick={() => setViewPresetOpen(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {settingsOpen && (
        <div className="modal-backdrop">
          <div className="settings-modal">
            <div className="modal-title">
              Custom Match Settings
              <button className="modal-close" type="button" onClick={() => setSettingsOpen(false)}>
                X
              </button>
            </div>

            <div className="modal-body">
              <div className="settings-grid">
                <div className="setting-row"><label>Perks</label><select value={perks} onChange={(e) => setPerks(e.target.value)}><option>On</option><option>Off</option></select></div>
                <div className="setting-row"><label>Launchers</label><select value={launchers} onChange={(e) => setLaunchers(e.target.value)}><option>Off</option><option>On</option></select></div>
                <div className="setting-row"><label>Killstreaks</label><select value={killstreaks} onChange={(e) => setKillstreaks(e.target.value)}><option>Off</option><option>On</option></select></div>
                <div className="setting-row"><label>Field Upgrades</label><select value={fieldUpgrades} onChange={(e) => setFieldUpgrades(e.target.value)}><option>On</option><option>Off</option></select></div>
                <div className="setting-row"><label>Attachments</label><select value={attachments} onChange={(e) => setAttachments(e.target.value)}><option>On</option><option>Off</option></select></div>
                <div className="setting-row"><label>Hardcore</label><select value={hardcore} onChange={(e) => setHardcore(e.target.value)}><option>Off</option><option>On</option></select></div>
                <div className="setting-row"><label>Friendly Fire</label><select value={friendlyFire} onChange={(e) => setFriendlyFire(e.target.value)}><option>On</option><option>Off</option></select></div>
                <div className="setting-row"><label>Radar</label><select value={radar} onChange={(e) => setRadar(e.target.value)}><option>Normal</option><option>Always On</option><option>Off</option></select></div>
                <div className="setting-row"><label>Mini Map</label><select value={miniMap} onChange={(e) => setMiniMap(e.target.value)}><option>Normal</option><option>Constant</option><option>Off</option></select></div>
                <div className="setting-row"><label>Spectating</label><select value={spectating} onChange={(e) => setSpectating(e.target.value)}><option>Team Only</option><option>Disabled</option><option>Free</option></select></div>
                <div className="setting-row"><label>Third Person</label><select value={thirdPerson} onChange={(e) => setThirdPerson(e.target.value)}><option>Off</option><option>On</option></select></div>
                <div className="setting-row"><label>Headshots Only</label><select value={headshotsOnly} onChange={(e) => setHeadshotsOnly(e.target.value)}><option>Off</option><option>On</option></select></div>
                <div className="setting-row"><label>Round Length</label><select value={roundLength} onChange={(e) => setRoundLength(e.target.value)}><option>1 Minute</option><option>1.5 Minutes</option><option>2 Minutes</option><option>2.5 Minutes</option><option>3 Minutes</option></select></div>
                <div className="setting-row"><label>Time Limit</label><select value={timeLimit} onChange={(e) => setTimeLimit(e.target.value)}><option>Default</option><option>2.5 Minutes</option><option>5 Minutes</option><option>10 Minutes</option><option>Unlimited</option></select></div>
                <div className="setting-row"><label>Score Limit</label><select value={scoreLimit} onChange={(e) => setScoreLimit(e.target.value)}><option>Default</option><option>4 Rounds</option><option>6 Rounds</option><option>50 Points</option><option>100 Points</option><option>150 Points</option><option>200 Points</option><option>250 Points</option></select></div>
                <div className="setting-row"><label>Health</label><select value={health} onChange={(e) => setHealth(e.target.value)}><option>Normal</option><option>Reduced</option><option>Double</option></select></div>
                <div className="setting-row"><label>Lives</label><select value={lives} onChange={(e) => setLives(e.target.value)}><option>1 Life</option><option>2 Lives</option><option>Unlimited</option></select></div>
                <div className="setting-row"><label>Respawn Delay</label><select value={respawnDelay} onChange={(e) => setRespawnDelay(e.target.value)}><option>None</option><option>2.5 Seconds</option><option>5 Seconds</option><option>7.5 Seconds</option><option>10 Seconds</option></select></div>
                <div className="setting-row"><label>Wave Spawn Delay</label><select value={waveSpawnDelay} onChange={(e) => setWaveSpawnDelay(e.target.value)}><option>None</option><option>5 Seconds</option><option>10 Seconds</option><option>15 Seconds</option></select></div>
                <div className="setting-row"><label>Force Respawn</label><select value={forceRespawn} onChange={(e) => setForceRespawn(e.target.value)}><option>On</option><option>Off</option></select></div>
                <div className="setting-row"><label>Spawn Camera</label><select value={spawnCamera} onChange={(e) => setSpawnCamera(e.target.value)}><option>Off</option><option>On</option></select></div>
                <div className="setting-row"><label>Bomb Timer</label><select value={bombTimer} onChange={(e) => setBombTimer(e.target.value)}><option>30 Seconds</option><option>45 Seconds</option><option>60 Seconds</option></select></div>
                <div className="setting-row"><label>Plant Time</label><select value={plantTime} onChange={(e) => setPlantTime(e.target.value)}><option>3 Seconds</option><option>5 Seconds</option><option>7.5 Seconds</option></select></div>
                <div className="setting-row"><label>Defuse Time</label><select value={defuseTime} onChange={(e) => setDefuseTime(e.target.value)}><option>5 Seconds</option><option>7.5 Seconds</option><option>10 Seconds</option></select></div>
                <div className="setting-row"><label>Team Assignment</label><select value={teamAssignment} onChange={(e) => setTeamAssignment(e.target.value)}><option>Open</option><option>Auto Assign</option><option>Host Picks</option></select></div>
                <div className="setting-row"><label>Join In Progress</label><select value={joinInProgress} onChange={(e) => setJoinInProgress(e.target.value)}><option>Not Allowed</option><option>Allowed</option></select></div>
                <div className="setting-row"><label>Revenge Voice</label><select value={revengeVoice} onChange={(e) => setRevengeVoice(e.target.value)}><option>Off</option><option>On</option></select></div>
              </div>

              <div className="modal-actions">
                <button className="action-btn" type="button" onClick={() => setSettingsOpen(false)}>
                  Save Settings
                </button>

                <button className="action-btn red" type="button" onClick={() => setSettingsOpen(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}