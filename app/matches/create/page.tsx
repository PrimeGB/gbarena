"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  if (value === "battlefield-6") return "Battlefield 6";
  if (value === "battlefield-2042") return "Battlefield 2042";
  if (value === "battlefield-v") return "Battlefield V";
  if (value === "battlefield-1") return "Battlefield 1";
  if (value === "redsec") return "RedSec";

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
  if (game === "battlefield-6") return "https://drop-assets.ea.com/images/2I7VhVjwdzBgmbpeldmM8t/4f2dcad2d115abd786aa2bb9ff38d89f/battlefield-6-standard-edition-16x9.jpg?im=AspectCrop%3D%2816%2C9%29%2CxPosition%3D0.5%2CyPosition%3D0.5356481481481481";
  if (game === "battlefield-2042") return "https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/1517290/header.jpg";
  if (game === "battlefield-v") return "https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/1238810/header.jpg";
  if (game === "battlefield-1") return "https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/1238840/header.jpg";
  return "https://drop-assets.ea.com/images/2I7VhVjwdzBgmbpeldmM8t/4f2dcad2d115abd786aa2bb9ff38d89f/battlefield-6-standard-edition-16x9.jpg?im=AspectCrop%3D%2816%2C9%29%2CxPosition%3D0.5%2CyPosition%3D0.5356481481481481";
}

function getLadderName(ladder: string | null) {
  if (ladder === "singles") return "Solos Ladder";
  if (ladder === "duos") return "Duos Ladder";
  return "Team Ladder";
}

function getPlayerOptions(ladder: string | null, isRedSec: boolean) {
  if (isRedSec) return ["2v2", "3v3", "4v4"];
  if (ladder === "singles") return ["1v1"];
  if (ladder === "duos") return ["2v2"];
  return ["3v3", "4v4", "5v5", "6v6", "7v7", "8v8"];
}

function getRequiredRosterSize(ladder: string | null, players: string) {
  const normalized = String(players || "").toLowerCase();

  if (ladder === "singles" || normalized === "1v1") return 1;
  if (ladder === "duos" || normalized.startsWith("2v")) return 2;

  const match = normalized.match(/(\d+)v/);
  if (match) return Number(match[1]);

  return 1;
}

function toLocalDateTimeValue(date: Date) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
}

function getNextQuarterHour(date: Date) {
  const quarterHourMs = 15 * 60 * 1000;
  return new Date((Math.floor(date.getTime() / quarterHourMs) + 1) * quarterHourMs);
}

function getScheduledTimeMs(matchTime: string, createdAt: string | null) {
  const directTime = new Date(matchTime).getTime();
  if (!Number.isNaN(directTime)) return directTime;

  const legacyTime = matchTime.trim().match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);
  if (!legacyTime || !createdAt) return 0;

  const scheduled = new Date(createdAt);
  if (Number.isNaN(scheduled.getTime())) return 0;

  let hours = Number(legacyTime[1]);
  const minutes = Number(legacyTime[2]);
  const period = legacyTime[3].toUpperCase();
  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  scheduled.setHours(hours, minutes, 0, 0);

  return scheduled.getTime();
}

type RulesType = "GB Variant" | "CDL" | "Custom";
type CrossPlayType = "Off" | "On";

export default function CreateMatchPage() {
  return (
    <Suspense fallback={<div style={{ color: "white", padding: 40 }}>Loading Create Match...</div>}>
      <CreateMatchContent />
    </Suspense>
  );
}

function CreateMatchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser() as any;

  const teamId = searchParams.get("teamId") || "";
  const platform = searchParams.get("platform") || "xbox";
  const category = searchParams.get("category") || "call-of-duty";
  const game = searchParams.get("game") || "modern-warfare-4";
  const ladder = searchParams.get("ladder") || "team";

  const isRedSec = game === "redsec" || ladder === "redsec";

  const platformName = prettyText(platform);
  const gameName = isRedSec ? "RedSec" : prettyText(game);
  const ladderName = getLadderName(ladder);
  const gameImage = getGameImage(game);
  const viewTeamUrl = teamId ? `/teams/${teamId}` : "/profile/teams";

  const playerOptions = useMemo(
    () => getPlayerOptions(ladder, isRedSec),
    [ladder, isRedSec]
  );

  const [gameMode, setGameMode] = useState(isRedSec ? "RedSec" : "Search and Destroy");
  const [rulesType, setRulesType] = useState<RulesType>("GB Variant");
  const [crossplay, setCrossplay] = useState<CrossPlayType>("Off");
  const [players, setPlayers] = useState(playerOptions[0]);
  const [teamRoster, setTeamRoster] = useState<{ id: string; username: string }[]>([]);
  const [selectedRosterPlayers, setSelectedRosterPlayers] = useState<string[]>([]);
  const [matchDateTime, setMatchDateTime] = useState(() =>
    toLocalDateTimeValue(getNextQuarterHour(new Date()))
  );
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const [bestOf, setBestOf] = useState(isRedSec ? "Best of 1" : "Best of 3");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [viewPresetOpen, setViewPresetOpen] = useState<RulesType | null>(null);
  const [redSecRulesOpen, setRedSecRulesOpen] = useState(false);
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
    setSelectedRosterPlayers([]);
  }, [playerOptions]);

  useEffect(() => {
    setSelectedRosterPlayers([]);
  }, [players, teamId]);

  useEffect(() => {
    if (!teamId) {
      setTeamRoster([]);
      setSelectedRosterPlayers([]);
      return;
    }

    async function loadTeamRoster() {
      const { data: memberRows, error: memberError } = await supabase
        .from("team_members")
        .select("user_id")
        .eq("team_id", teamId);

      if (memberError || !memberRows || memberRows.length === 0) {
        setTeamRoster([]);
        setSelectedRosterPlayers([]);
        return;
      }

      const memberIds = memberRows
        .map((member: any) => member.user_id)
        .filter(Boolean) as string[];

      if (memberIds.length === 0) {
        setTeamRoster([]);
        setSelectedRosterPlayers([]);
        return;
      }

      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, username")
        .in("id", memberIds);

      if (profileError) {
        setTeamRoster([]);
        setSelectedRosterPlayers([]);
        return;
      }

      const roster = (profiles || []).map((profile: any) => ({
        id: profile.id,
        username: profile.username || "Player",
      }));

      setTeamRoster(roster);
      setSelectedRosterPlayers((current) => current.filter((id) => roster.some((player) => player.id === id)));
    }

    loadTeamRoster();
  }, [teamId]);

  useEffect(() => {
    if (isRedSec) {
      setGameMode("RedSec");
      setRulesType("GB Variant");
      setBestOf((current) => (current === "Best of 1" || current === "Best of 2" ? current : "Best of 1"));
    }
  }, [isRedSec]);

  const bestOfOptions = isRedSec ? ["Best of 1", "Best of 2"] : ["Best of 1", "Best of 3", "Best of 5", "Best of 7"];
  const rosterLimit = getRequiredRosterSize(ladder, players);

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const presetText = isRedSec
    ? "RedSec settings are controlled by the GameBattles RedSec ruleset."
    : rulesType === "Custom"
      ? `Custom · Players ${players} · Cross Play ${crossplay} · Perks ${perks} · Launchers ${launchers} · Killstreaks ${killstreaks}`
      : `${rulesType} locked preset · Players ${players} · Cross Play ${crossplay} · Preset settings cannot be edited`;

  function toggleRosterPlayer(playerId: string) {
    setSelectedRosterPlayers((current) => {
      const isSelected = current.includes(playerId);

      if (isSelected) {
        return current.filter((id) => id !== playerId);
      }

      if (current.length >= rosterLimit) {
        return current;
      }

      return [...current, playerId];
    });
  }

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

    const scheduledTime = new Date(matchDateTime);
    if (Number.isNaN(scheduledTime.getTime()) || scheduledTime.getTime() <= Date.now()) {
      setPostError("Choose a match date and time in the future.");
      return;
    }

    if (rosterLimit > 1) {
      if (teamRoster.length < rosterLimit) {
        setPostError(`This ${ladderName} match requires at least ${rosterLimit} rostered players on the team before posting.`);
        return;
      }

      if (selectedRosterPlayers.length !== rosterLimit) {
        setPostError(`Select exactly ${rosterLimit} rostered players for this ${ladderName} match before posting.`);
        return;
      }
    }

    setPosting(true);
    const scheduledIso = scheduledTime.toISOString();
    const { data: existingPosts, error: existingPostError } = await supabase
      .from("match_posts")
      .select("match_time, created_at")
      .eq("platform", platform)
      .eq("category", category)
      .eq("game", game)
      .eq("ladder", ladder)
      .eq("status", "open");

    if (existingPostError) {
      setPosting(false);
      setPostError("Could not check whether this ladder time is already booked: " + existingPostError.message);
      return;
    }

    if (
      existingPosts?.some(
        (post) => getScheduledTimeMs(String(post.match_time || ""), post.created_at) === scheduledTime.getTime()
      )
    ) {
      setPosting(false);
      setPostError("That time already has an open match post for this ladder. Choose another time.");
      return;
    }

    const { error } = await supabase.from("match_posts").insert({
      team_id: teamId,
      platform,
      category,
      game,
      ladder,
      game_mode: gameMode,
      players,
      match_time: scheduledIso,
      best_of: bestOf,
      preset: rulesType,
      crossplay,
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
      setPostError(
        error.code === "23505"
          ? "That time was just booked by another team. Choose another time."
          : "Match could not be posted: " + error.message
      );
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

        .disabled-settings{opacity:.42;filter:grayscale(.35);}
        .disabled-settings .settings-button{cursor:not-allowed;}

        .rules-box{border:1px solid #315b7d;background:#02070c;padding:13px;color:#cfe2f2;font-size:12px;line-height:22px;}
        .crossplay-box{border:1px solid #315b7d;background:#02070c;padding:13px;max-width:410px;}
        .small-note{color:#8aa7c0;font-size:11px;line-height:18px;margin-top:8px;}
        .error-note{color:#ff9d9d;}
        .roster-picker{display:flex;flex-wrap:wrap;gap:8px;padding-top:10px;}
        .roster-pill{padding:8px 12px;border:1px solid #315f88;background:#0b1c2d;color:#dfeaf7;font-weight:bold;text-transform:uppercase;cursor:pointer;transition:all .15s ease;}
        .roster-pill:hover{border-color:#f2c14e;color:#f2c14e;}
        .roster-pill.active{background:linear-gradient(to bottom,#1d496e,#0a1724);border-color:#f2c14e;color:#f2c14e;box-shadow:0 0 12px rgba(242,193,78,.25);}

        .rules-link{display:inline-flex;align-items:center;justify-content:center;min-width:170px;height:38px;border:1px solid #4b95d8;background:linear-gradient(to bottom,#1c4b72,#0a1724);color:#fff;font-size:11px;font-weight:900;text-transform:uppercase;cursor:pointer;}
        .rules-link:hover{color:#d7ad4a;border-color:#d7ad4a;}

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
        .success-modal{width:420px;max-width:96vw;border:1px solid #35a852;background:#050b12;box-shadow:0 0 30px rgba(53,168,82,.3);}
        .modal-title{min-height:38px;background:linear-gradient(to bottom,#18344f,#091521);border-bottom:1px solid #244b70;color:#d7ad4a;display:flex;align-items:center;justify-content:space-between;padding:8px 12px;font-size:13px;font-weight:900;text-transform:uppercase;}
        .modal-close{width:24px;height:24px;border:1px solid #315f88;background:#000;color:#fff;font-weight:900;cursor:pointer;}
        .modal-body{padding:15px;}
        .settings-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
        .setting-row{display:grid;grid-template-columns:145px 1fr;gap:10px;align-items:center;border:1px solid #1f3d5a;background:#07111b;padding:10px;}
        .preset-list{border:1px solid #1f3d5a;background:#07111b;padding:16px;color:#cfe2f2;font-size:12px;line-height:22px;}
        .preset-list div{border-bottom:1px solid rgba(255,255,255,.06);padding:7px 0;}
        .preset-list div:last-child{border-bottom:none;}
        .redsec-rules{color:#cfe2f2;font-size:13px;line-height:22px;}
        .redsec-rules h2{color:#d7ad4a;font-size:18px;margin-bottom:12px;text-transform:uppercase;}
        .redsec-rules h3{color:#fff;font-size:14px;margin-top:22px;margin-bottom:8px;text-transform:uppercase;border-bottom:1px solid #244b70;padding-bottom:6px;}
        .redsec-rules p{margin-bottom:12px;}
        .redsec-rules ul,.redsec-rules ol{margin:8px 0 14px 22px;}
        .redsec-rules li{margin-bottom:7px;}
        .redsec-rules .disclaimer{border:1px solid #315b7d;background:#081522;padding:13px;margin-bottom:18px;}
        .redsec-rules .example{border-left:3px solid #d7ad4a;background:#081522;padding:10px 13px;margin:10px 0 14px;}
        .redsec-rules strong{color:#fff;}
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
            <a href={`/ladders/${platform}/${category}/${game}/${ladder}/rankings`}>Ladder</a>
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
                    <div className="step-line"><span className="step-arrow">►</span>Review Map Notice</div>
                    <div className="step-line"><span className="step-arrow">►</span>Select Cross Play</div>
                    <div className="step-line"><span className="step-arrow">►</span>Select Rules</div>
                    <div className="step-line"><span className="step-arrow">►</span>Pick Match Time</div>
                    <div className="step-line"><span className="step-arrow">►</span>Post Match</div>
                  </div>

                  <div className="match-info">
                    <div>Platform: {platformName}</div>
                    <div>Game: {gameName}</div>
                    <div>Ladder: {ladderName}</div>
                    <div>Rules: {isRedSec ? "RedSec Rules" : rulesType}</div>
                    <div>Cross Play: {crossplay}</div>
                    <div>Players: {players}</div>
                    <div>Team ID: {teamId ? "Loaded" : "Missing"}</div>
                    <div>Status: Match Draft</div>
                  </div>
                </div>
              </aside>

              <section className="main-panel">
                <div className="panel-header">Match Post Form</div>

                <div className="main-body">
                  {postError && <div className="error-box">{postError}</div>}

                  <div className="form-section">
                    <div className="form-title">Match Details</div>

                    <div className="form-body">
                      <div className="row">
                        <label>Game Mode</label>

                        {isRedSec ? (
                          <div className="locked-player-box">RedSec</div>
                        ) : (
                          <select
                            className="mode-select"
                            value={gameMode}
                            onChange={(e) => setGameMode(e.target.value)}
                          >
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
                        )}
                      </div>

                      <div className="row">
                        <label>Maps</label>

                        {isRedSec ? (
                          <div className="rules-box">
                            <strong>Lyndon Oil Works</strong>
                          </div>
                        ) : (
                          <div className="rules-box">
                            Maps will be generated once this match is accepted.
                            <br />
                            The map pool will be based on the selected game, ladder, mode, ruleset, and Best Of.
                          </div>
                        )}
                      </div>

                      <div className="row">
                        <label>Cross Play</label>
                        <div className="crossplay-box">
                          <select
                            className="small-select"
                            value={crossplay}
                            onChange={(e) => setCrossplay(e.target.value as CrossPlayType)}
                          >
                            <option>Off</option>
                            <option>On</option>
                          </select>

                          <div className="small-note">
                            {crossplay === "Off"
                              ? `Cross Play Disabled: only ${platformName} teams on this exact game and ladder can accept.`
                              : "Cross Play Enabled: teams from other platforms can accept as long as they are on this same game and ladder."}
                          </div>
                        </div>
                      </div>

                      <div className="row">
                        <label>Rules</label>

                        {isRedSec ? (
                          <div>
                            <button
                              className="rules-link"
                              type="button"
                              onClick={() => setRedSecRulesOpen(true)}
                            >
                              Read RedSec Rules
                            </button>

                            <div className="small-note">
                              GameBattles RedSec rules must be followed for this match.
                            </div>
                          </div>
                        ) : (
                          <div>
                            <select
                              className="rules-select"
                              value={rulesType}
                              onChange={(e) => setRulesType(e.target.value as RulesType)}
                            >
                              <option>GB Variant</option>
                              <option>CDL</option>
                              <option>Custom</option>
                            </select>

                            <div className="small-note">
                              GB Variant and CDL are locked presets. Custom allows manual rule editing.
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="row">
                        <label>Settings</label>

                        {isRedSec ? (
                          <div className="settings-summary disabled-settings">
                            <div className="settings-title">Match Settings</div>
                            <div className="settings-copy">
                              RedSec settings are controlled by the GameBattles RedSec ruleset.
                              These settings cannot be changed when posting a RedSec match.
                            </div>

                            <div className="settings-buttons">
                              <button
                                className="settings-button locked"
                                type="button"
                                disabled
                              >
                                View Settings
                              </button>

                              <button
                                className="settings-button locked"
                                type="button"
                                disabled
                              >
                                Edit Settings
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="settings-summary">
                            <div className="settings-title">Match Settings</div>
                            <div className="settings-copy">{presetText}</div>

                            <div className="settings-buttons">
                              <button
                                className="settings-button"
                                type="button"
                                onClick={() => setViewPresetOpen("GB Variant")}
                              >
                                View GB Preset Settings
                              </button>

                              <button
                                className="settings-button"
                                type="button"
                                onClick={() => setViewPresetOpen("CDL")}
                              >
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
                        )}
                      </div>

                      <div className="row">
                        <label>Players</label>

                        {isRedSec ? (
                          <select
                            className="small-select"
                            value={players}
                            onChange={(e) => setPlayers(e.target.value)}
                          >
                            <option>2v2</option>
                            <option>3v3</option>
                            <option>4v4</option>
                          </select>
                        ) : playerOptions.length === 1 ? (
                          <div>
                            <div className="locked-player-box">{playerOptions[0]}</div>
                            <div className="small-note">
                              Player count is locked because this is a {ladderName}.
                            </div>
                          </div>
                        ) : (
                          <select
                            className="small-select"
                            value={players}
                            onChange={(e) => setPlayers(e.target.value)}
                          >
                            {playerOptions.map((option) => (
                              <option key={option}>{option}</option>
                            ))}
                          </select>
                        )}
                      </div>

                      {rosterLimit > 1 && teamRoster.length > 0 && (
                        <div className="row">
                          <label>Match Roster</label>
                          <div>
                            <div className="small-note">
                              Select exactly {rosterLimit} rostered players from your team for this matchup.
                            </div>
                            <div className="roster-picker">
                              {teamRoster.map((player) => {
                                const isSelected = selectedRosterPlayers.includes(player.id);

                                return (
                                  <button
                                    key={player.id}
                                    type="button"
                                    className={isSelected ? "roster-pill active" : "roster-pill"}
                                    onClick={() => toggleRosterPlayer(player.id)}
                                  >
                                    {player.username}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}

                      {rosterLimit > 1 && teamRoster.length === 0 && (
                        <div className="row">
                          <label>Match Roster</label>
                          <div className="small-note error-note">
                            This team does not have enough rostered players to post a {ladderName} match yet.
                          </div>
                        </div>
                      )}

                      <div className="row">
                        <label>Date / Time</label>
                        <div>
                          <div className="date-time-box">
                            <input
                              className="time-select"
                              type="datetime-local"
                              value={matchDateTime}
                              min={toLocalDateTimeValue(getNextQuarterHour(new Date(currentTime)))}
                              step={900}
                              onChange={(e) => setMatchDateTime(e.target.value)}
                              required
                            />
                          </div>

                          <div className="small-note">
                            Choose a future date and time. Match times are available in 15-minute increments.
                          </div>
                        </div>
                      </div>

                      <div className="row">
                        <label>Best Of</label>

                        <div className="best-of-scroll">
                          {bestOfOptions.map((option) => (
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
                      {isRedSec ? (
                        <div className="rules-box">
                          <strong>REDSEC MATCH RULES</strong>
                          <br />
                          <br />
                          • This match is being created for the <strong>RedSec</strong> ladder.
                          <br />
                          • Map: <strong>Lyndon Oil Works</strong>.
                          <br />
                          • Cross Play: <strong>{crossplay}</strong>.
                          <br />
                          • Players: <strong>{players}</strong>.
                          <br />
                          • RedSec match settings are controlled by the GameBattles RedSec ruleset.
                          <br />
                          • Match settings cannot be changed by the match poster.
                          <br />
                          • The rules must be followed by all players participating in the match.
                          <br />
                          • Results must be reported after the match.
                          <br />
                          • Screenshots or proof may be needed for disputes.
                          <br />
                          <br />
                          <button
                            className="rules-link"
                            type="button"
                            onClick={() => setRedSecRulesOpen(true)}
                          >
                            Read Full RedSec Rules
                          </button>
                        </div>
                      ) : (
                        <div className="rules-box">
                          • This match is being created for the <strong>{ladderName}</strong>.
                          <br />
                          • Selected ruleset: <strong>{rulesType}</strong>.
                          <br />
                          • Cross Play: <strong>{crossplay}</strong>.
                          <br />
                          • Player count is locked to <strong>{players}</strong> for this ladder.
                          <br />
                          • Maps will generate once the match is accepted.
                          <br />
                          • Results must be reported after the match.
                          <br />
                          • Screenshots or proof may be needed for disputes.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="actions">
                    <button
                      className="action-btn gold"
                      type="button"
                      disabled={posting}
                      onClick={handlePostMatch}
                    >
                      {posting ? "Posting..." : "Post Match"}
                    </button>

                    <a
                      className="action-btn"
                      href={`/matches/finder?teamId=${teamId}&platform=${platform}&category=${category}&game=${game}&ladder=${ladder}`}
                    >
                      Match Finder
                    </a>

                    <button
                      className="action-btn red"
                      type="button"
                      onClick={() => history.back()}
                    >
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

      {postSuccess && (
        <div className="modal-backdrop">
          <section
            className="success-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="match-post-success-title"
          >
            <div className="modal-title" id="match-post-success-title">
              Match Successfully Posted
            </div>
            <div className="modal-body">
              <div className="modal-actions">
                <button
                  className="action-btn"
                  type="button"
                  onClick={() => router.push(viewTeamUrl)}
                  autoFocus
                >
                  Close
                </button>
              </div>
            </div>
          </section>
        </div>
      )}

      {redSecRulesOpen && (
        <div className="modal-backdrop">
          <div className="settings-modal">
            <div className="modal-title">
              REDSEC — KILL RACE RULES
              <button
                className="modal-close"
                type="button"
                onClick={() => setRedSecRulesOpen(false)}
              >
                X
              </button>
            </div>

            <div className="modal-body">
              <div className="redsec-rules">
                <h2>REDSEC — KILL RACE RULES</h2>

                <div className="disclaimer">
                  <strong>Early Production Disclaimer</strong>
                  <br />
                  <br />
                  This website is still very early in production. This ladder may not function
                  exactly as it will when finished, and rules, settings, and match procedures
                  may be tweaked as development continues.
                  <br />
                  <br />
                  With that being said — <strong>THANK YOU for playing GameBattles!</strong> Any
                  and all feedback is welcome. Expect tweaks, changes, and improvements as we
                  continue building the ladder.
                </div>

                <h3>The Kill Race</h3>

                <p>
                  The RedSec ladder is essentially a <strong>Kill Race</strong>.
                </p>

                <p>
                  Because the available game settings cannot be changed very much, the rules
                  are intentionally simple.
                </p>

                <h3>How a Match Works</h3>

                <p><strong>2v2</strong></p>

                <ol>
                  <li>Both teams join the same game with their two opponents.</li>
                  <li>The website determines which team hosts the first game.</li>
                  <li>The <strong>hosting team plays first.</strong></li>
                  <li>
                    When the game begins, the two non-host players will launch from the
                    helicopter and eliminate themselves as quickly as possible.
                  </li>
                  <li>
                    They will respawn and repeat this until they are no longer able to respawn
                    and enter spectator mode.
                  </li>
                  <li>
                    The hosting team then plays out the game, attempting to earn as many kills
                    as possible.
                  </li>
                  <li><strong>Every kill is worth 1 point.</strong></li>
                  <li>
                    <div className="example">
                      <strong>Example:</strong>
                      <br />
                      Player A: 3 kills
                      <br />
                      Player B: 2 kills
                      <br />
                      Team Total: <strong>5 points</strong>
                    </div>
                  </li>
                  <li>
                    The team continues playing until they can no longer respawn.
                  </li>
                  <li>
                    Winning the individual game does <strong>not</strong> determine the match
                    winner. The only thing that matters is the total number of kills.
                  </li>
                  <li>
                    Once the first game is complete, the teams <strong>switch hosts and run it back.</strong>
                  </li>
                  <li>
                    The team with the most total points after both games wins the match.
                  </li>
                </ol>

                <h3>3v3</h3>

                <p>The same rules apply.</p>

                <p>
                  The only difference is that <strong>only one player from the opposing team
                  needs to enter spectator mode</strong> while the hosting team plays.
                </p>

                <h3>4v4</h3>

                <p>The same Kill Race rules apply.</p>

                <p>
                  However, <strong>at least one player on the hosting team MUST be streaming
                  their gameplay</strong> and have the stream verified with the opposing team
                  before the game begins.
                </p>

                <p>
                  The scoreboard must be shown <strong>clearly at the end of the game</strong> so
                  the opposing team can verify the final kill count.
                </p>

                <p>
                  <strong>
                    Backing out of the game early, ending the stream before the game is
                    complete, or closing the stream before the final scoreboard can be clearly
                    seen may result in a loss.
                  </strong>
                </p>

                <h3>Proof</h3>

                <p>
                  Players should capture <strong>video and/or picture proof</strong> of their
                  games in case there is a dispute or an issue with the reported score.
                </p>

                <p>
                  Proof may be requested when a match result is disputed.
                </p>

                <h3>Keep It Simple</h3>

                <p>
                  That's really all there is to it.
                </p>

                <p>
                  The Kill Race is designed to be straightforward:
                  <strong> play your game, get your kills, record the score, switch hosts,
                  and run it back.</strong>
                </p>

                <p>
                  These rules apply to all RedSec matches, with the only differences being the
                  spectator requirements for <strong>3v3</strong> and the streaming/scoreboard
                  requirements for <strong>4v4</strong>.
                </p>

                <p>
                  As the ladder develops, rules may be <strong>tweaked, added, removed, or
                  changed</strong> when necessary.
                </p>
              </div>

              <div className="modal-actions">
                <button
                  className="action-btn"
                  type="button"
                  onClick={() => setRedSecRulesOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewPresetOpen && !isRedSec && (
        <div className="modal-backdrop">
          <div className="settings-modal">
            <div className="modal-title">
              {viewPresetOpen} Settings
              <button
                className="modal-close"
                type="button"
                onClick={() => setViewPresetOpen(null)}
              >
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
                  <div>Cross Play: Host selected</div>
                  <div>Maps: Generated once accepted</div>
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
                  <div>Cross Play: Host selected</div>
                  <div>Maps: Generated once accepted</div>
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
                <button
                  className="action-btn"
                  type="button"
                  onClick={() => setViewPresetOpen(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {settingsOpen && !isRedSec && (
        <div className="modal-backdrop">
          <div className="settings-modal">
            <div className="modal-title">
              Custom Match Settings
              <button
                className="modal-close"
                type="button"
                onClick={() => setSettingsOpen(false)}
              >
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
                <button
                  className="action-btn"
                  type="button"
                  onClick={() => setSettingsOpen(false)}
                >
                  Save Settings
                </button>

                <button
                  className="action-btn red"
                  type="button"
                  onClick={() => setSettingsOpen(false)}
                >
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
