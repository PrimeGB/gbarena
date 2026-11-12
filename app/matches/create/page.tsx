"use client";

import Link from "next/link";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "../../../lib/useUser";
import { supabase } from "../../../lib/supabase";
import {
  GamingAccount,
  gamingCategoryLabel,
  gamingGameLabel,
  isMatchEligibleGamingId,
  resolveGamingAccountId,
} from "../../../lib/gamingAccounts";
import { getGameRules } from "../../../lib/matchRules";
import { ladderGameImage } from "../../../lib/ladderCatalog";
import { ladderPlatforms } from "../../../lib/ladderStandings";
import { AdditionalMatchRules } from "../../../lib/postedMatchRules";
import { rapidRoyalRules } from "../../../lib/rapidRoyal";
import RapidRoyalRules from "../../components/RapidRoyalRules";
import { getPlayerOptions, getRequiredRosterSize } from "../../../lib/matchCreationRoster";

function prettyText(value: string | null) {
  if (!value) return "";
  if (value === "mw2") return "Call of Duty: Modern Warfare 2 (2009)";
  if (value === "modern-warfare-ii") return "Call of Duty: Modern Warfare II (2022)";
  if (value === "modern-warfare-4") return "Call of Duty: Modern Warfare (2019)";
  if (value === "black-ops-6") return "Call of Duty: Black Ops 6";
  if (value === "modern-warfare-iii") return "Call of Duty: Modern Warfare III (2023)";
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

function getGameImage(game: string | null, category?: string) {
  return category ? ladderGameImage(category, game || "") || "" : "";
}

function getLadderName(ladder: string | null) {
  if (ladder === "singles") return "Solos Ladder";
  if (ladder === "duos") return "Duos Ladder";
  if (ladder === "rapid-royal-duos") return "Rapid Royal Ladder";
  return "Team Ladder";
}

function toLocalDateTimeValue(date: Date) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
}

function getNextQuarterHour(date: Date) {
  const quarterHourMs = 15 * 60 * 1000;
  return new Date((Math.floor(date.getTime() / quarterHourMs) + 1) * quarterHourMs);
}

type RulesType = "GB Variant" | "CDL" | "Custom";
type CrossPlayType = "Off" | "On";
type RestrictionDraft = {
  category: "Equipment" | "Perk";
  item: string;
  status: "Not specified" | "Allowed" | "Banned";
};

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
  const isRapidRoyal = ladder === "rapid-royal-duos";
  const killRaceName = isRapidRoyal ? "Rapid Royal" : "RedSec";
  const gameRules = useMemo(() => getGameRules(category, game), [category, game]);

  const platformName = prettyText(platform);
  const gameName = isRedSec
    ? "RedSec"
    : gameRules
      ? `${gamingCategoryLabel(category)}: ${gamingGameLabel(category, game)}`
      : prettyText(game);
  const ladderName = getLadderName(ladder);
  const gameImage = getGameImage(game, category);
  const viewTeamUrl = teamId ? `/teams/${teamId}` : "/profile/teams";

  const playerOptions = useMemo(
    () => getPlayerOptions(ladder, isRedSec, gameRules?.teamSizes),
    [ladder, isRedSec, gameRules]
  );

  const [gameMode, setGameMode] = useState(
    isRedSec ? "RedSec" : isRapidRoyal ? "Rapid Royal" : gameRules ? gameRules.modes[0].value : "Search and Destroy"
  );
  const currentMode = gameRules
    ? gameRules.modes.find((mode) => mode.value === gameMode) || gameRules.modes[0]
    : null;
  const [ruleValues, setRuleValues] = useState<Record<string, string>>({});
  const activeRuleValues = useMemo(() => {
    const values: Record<string, string> = {};
    currentMode?.fields.forEach((item) => {
      values[item.slot] = ruleValues[item.slot] && item.options.includes(ruleValues[item.slot])
        ? ruleValues[item.slot]
        : item.default;
    });
    return values;
  }, [currentMode, ruleValues]);
  const [rulesType, setRulesType] = useState<RulesType>("GB Variant");
  const [crossplay, setCrossplay] = useState<CrossPlayType>("Off");
  const [players, setPlayers] = useState(playerOptions[0]);
  const [teamRoster, setTeamRoster] = useState<
    { id: string; username: string; gaming_id: string | null }[]
  >([]);
  const [selectedRosterPlayers, setSelectedRosterPlayers] = useState<string[]>([]);
  const eligibleTeamRoster = useMemo(
    () => teamRoster.filter((player) => isMatchEligibleGamingId(player.gaming_id)),
    [teamRoster],
  );
  const [matchDateTime, setMatchDateTime] = useState(() =>
    toLocalDateTimeValue(getNextQuarterHour(new Date()))
  );
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const [bestOf, setBestOf] = useState(isRedSec || isRapidRoyal ? "Best of 1" : "Best of 3");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [viewPresetOpen, setViewPresetOpen] = useState<RulesType | null>(null);
  const [redSecRulesOpen, setRedSecRulesOpen] = useState(false);
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState("");
  const [crossplaySystems, setCrossplaySystems] = useState<string[] | null>(null);
  const [crossplayError, setCrossplayError] = useState("");
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
  const [restrictions, setRestrictions] = useState<RestrictionDraft[]>(
    category === "call-of-duty" && game === "mw2"
      ? [
          { category: "Equipment", item: "C4", status: "Not specified" },
          { category: "Equipment", item: "Claymore", status: "Not specified" },
        ]
      : [],
  );

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

      if (memberError) {
        setTeamRoster([]);
        setSelectedRosterPlayers([]);
        setPostError("Team roster could not be loaded: " + memberError.message);
        return;
      }

      if (!memberRows || memberRows.length === 0) {
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

      const [{ data: profiles, error: profileError }, { data: accounts, error: accountError }] =
        await Promise.all([
          supabase
            .from("profiles")
            .select(
              "id, username, gt_xbox, xbox_gt, gt_playstation, psn_gt, gt_nintendo, nintendo_gt, gt_pc, pc_gt"
            )
            .in("id", memberIds),
          supabase
            .from("gaming_accounts")
            .select("id,user_id,platform,game,account_id")
            .in("user_id", memberIds)
            .eq("platform", platform)
            .eq("category", category)
            .eq("game", game),
        ]);

      if (profileError || accountError) {
        setTeamRoster([]);
        setSelectedRosterPlayers([]);
        setPostError(
          "Team roster IDs could not be loaded: " +
            (profileError?.message || accountError?.message),
        );
        return;
      }

      const accountsByUserId = new Map(
        ((accounts || []) as GamingAccount[]).map((account) => [
          account.user_id,
          account.account_id,
        ]),
      );
      const roster = (profiles || []).map((profile: any) => ({
        id: profile.id,
        username: profile.username || "Player",
        gaming_id: resolveGamingAccountId(
          accountsByUserId.get(profile.id),
          profile,
          platform,
        ),
      }));

      setTeamRoster(roster);
      setSelectedRosterPlayers((current) =>
        current.filter((id) =>
          roster.some(
            (player) => player.id === id && isMatchEligibleGamingId(player.gaming_id),
          ),
        ),
      );
    }

    loadTeamRoster();
  }, [teamId, platform, category, game]);

  useEffect(() => {
    if (isRedSec || isRapidRoyal) {
      setGameMode(killRaceName);
      setRulesType("GB Variant");
      setBestOf((current) => (current === "Best of 1" || current === "Best of 2" ? current : "Best of 1"));
    }
  }, [isRedSec, isRapidRoyal, killRaceName]);

  const bestOfOptions = isRapidRoyal
    ? ["Best of 1", "Best of 3"]
    : isRedSec
    ? ["Best of 1", "Best of 2"]
    : gameRules?.bestOf || ["Best of 1", "Best of 3", "Best of 5", "Best of 7"];

  useEffect(() => {
    setBestOf((current) => (bestOfOptions.includes(current) ? current : bestOfOptions[0]));
  }, [bestOfOptions]);
  const rosterLimit = getRequiredRosterSize(ladder, players);

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let active = true;
    ladderPlatforms(category, game, platform).then((systems) => {
      if (active) { setCrossplaySystems(systems); setCrossplayError(""); }
    }).catch((reason) => {
      if (active) { setCrossplaySystems(null); setCrossplayError(reason instanceof Error ? reason.message : "Could not load compatible systems."); }
    });
    return () => { active = false; };
  }, [category, game, platform]);

  const presetText = isRedSec || isRapidRoyal
    ? `${killRaceName} settings are controlled by the GameBattles ${killRaceName} ruleset.`
    : gameRules
      ? `${gameRules.presetName} · Players ${players} · Cross Play ${crossplay} · ${currentMode?.fields
          .map((item) => `${item.label} ${activeRuleValues[item.slot]}`)
          .join(" · ")}`
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
    if (crossplay === "On" && (!crossplaySystems || crossplaySystems.length < 2)) {
      setPostError(crossplayError || "Cross-play is not available for this game and system.");
      return;
    }

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

    if (eligibleTeamRoster.length < rosterLimit) {
      setPostError(
        `This ${ladderName} match requires ${rosterLimit} eligible (green) rostered players with a ${platformName} ID.`,
      );
      return;
    }

    if (selectedRosterPlayers.length !== rosterLimit) {
      setPostError(`Select exactly ${rosterLimit} rostered players for this ${ladderName} match before posting.`);
      return;
    }

    if (selectedRosterPlayers.some((id) => !eligibleTeamRoster.some((player) => player.id === id))) {
      setPostError("Only eligible (green) rostered players with a linked platform ID can be selected.");
      return;
    }

    if (rulesType === "Custom" && !gameRules && restrictions.some(
      (item) => item.status !== "Not specified" && !item.item.trim(),
    )) {
      setPostError("Enter a name for each equipment or perk rule before posting.");
      return;
    }
    if (rulesType === "Custom" && !gameRules) {
      const specified = restrictions.filter((item) => item.status !== "Not specified");
      const keys = specified.map((item) => `${item.category}:${item.item.trim().toLowerCase()}`);
      if (new Set(keys).size !== keys.length) {
        setPostError("List each equipment or perk only once.");
        return;
      }
      if (perks === "Off" && specified.some((item) => item.category === "Perk" && item.status === "Allowed")) {
        setPostError("Perks are off. Turn perks on before allowing an individual perk.");
        return;
      }
    }

    setPosting(true);
    const scheduledIso = scheduledTime.toISOString();
    const cod = !gameRules;
    const presetDefaults: Record<string, string> = {
      perks: "On", launchers: "Off", killstreaks: "Off", field_upgrades: "On",
      hardcore: "Off", friendly_fire: "On", radar: "Normal", spectating: "Team Only",
      third_person: "Off", round_length: "1.5 Minutes", score_limit: "Default",
      health: "Normal", respawn_delay: "None", bomb_timer: "45 Seconds",
      plant_time: "5 Seconds", defuse_time: "7.5 Seconds", attachments: "On",
    };
    const slot = (name: string, codValue: string) =>
      cod ? (rulesType === "Custom" || isRedSec || isRapidRoyal ? codValue : presetDefaults[name]) : activeRuleValues[name] ?? null;
    const additionalRules: AdditionalMatchRules | null = cod && rulesType === "Custom" && !isRedSec && !isRapidRoyal
      ? {
          settings: {
            "Mini Map": miniMap, "Headshots Only": headshotsOnly, "Time Limit": timeLimit,
            "Lives": lives, "Wave Spawn Delay": waveSpawnDelay, "Force Respawn": forceRespawn,
            "Spawn Camera": spawnCamera, "Team Assignment": teamAssignment,
            "Join In Progress": joinInProgress, "Revenge Voice": revengeVoice,
          },
          restrictions: restrictions.flatMap((item) =>
            item.status === "Not specified" || !item.item.trim()
              ? []
              : [{ category: item.category, item: item.item.trim(), status: item.status }],
          ),
        }
      : null;

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
      preset: isRedSec || isRapidRoyal ? `${killRaceName} Rules` : gameRules ? gameRules.presetName : rulesType,
      crossplay: crossplay === "On",
      perks: slot("perks", perks),
      launchers: slot("launchers", launchers),
      killstreaks: slot("killstreaks", killstreaks),
      field_upgrades: slot("field_upgrades", fieldUpgrades),
      hardcore: slot("hardcore", hardcore),
      friendly_fire: slot("friendly_fire", friendlyFire),
      radar: slot("radar", radar),
      spectating: slot("spectating", spectating),
      third_person: slot("third_person", thirdPerson),
      round_length: slot("round_length", roundLength),
      score_limit: slot("score_limit", scoreLimit),
      health: slot("health", health),
      respawn_delay: slot("respawn_delay", respawnDelay),
      bomb_timer: slot("bomb_timer", bombTimer),
      plant_time: slot("plant_time", plantTime),
      defuse_time: slot("defuse_time", defuseTime),
      attachments: slot("attachments", attachments),
      additional_rules: additionalRules,
      status: "open",
      posting_roster: selectedRosterPlayers,
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

        .page{min-height:100vh;background:radial-gradient(circle at top,rgba(45,100,150,.22),transparent 42%),linear-gradient(to bottom,#02060a,#000);padding:18px 16px;}
        .wrap{max-width:1160px;margin:0 auto;background:#07111b;border:1px solid #315f88;box-shadow:0 0 28px rgba(0,80,140,.35), inset 0 0 22px rgba(0,0,0,.7);}

        .header{min-height:78px;background:linear-gradient(to bottom,#173956,#07111b);border-bottom:2px solid #315f88;display:flex;align-items:center;justify-content:space-between;padding:10px 18px;}
        .game-header{display:flex;align-items:center;gap:14px;}
        .game-cover{width:92px;height:58px;border:1px solid #315f88;background:#050c14;overflow:hidden;}
        .game-cover img{width:100%;height:100%;object-fit:cover;object-position:center;display:block;}
        .game-name{color:#f2c14e;font-size:12px;font-weight:900;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px;text-shadow:0 1px 2px #000;}
        .ladder-name{color:#fff;font-size:24px;font-weight:900;text-transform:uppercase;text-shadow:0 2px 4px #000;}
        .header-badge{border:1px solid #6ba8d6;background:linear-gradient(to bottom,#214765,#0b1c2d);color:#f5f8ff;font-size:12px;font-weight:900;text-transform:uppercase;padding:10px 15px;text-shadow:0 2px 4px #000;}
        .header-badge:hover{border-color:#d7ad4a;color:#d7ad4a;}

        .nav{height:36px;background:linear-gradient(to bottom,#10283d,#07111b);border-bottom:1px solid #244b70;display:flex;align-items:center;justify-content:center;gap:28px;}
        .nav a{color:#d7eaff;font-size:12px;font-weight:bold;text-transform:uppercase;}
        .nav a:hover{color:#d7ad4a;}

        .title-bar{background:linear-gradient(to bottom,#1d496e,#0a1724);border-bottom:1px solid #315f88;padding:10px 18px;text-align:center;}
        .title-bar h1{color:#d7ad4a;font-size:23px;text-transform:uppercase;text-shadow:0 1px 2px #000;}
        .title-bar p{color:#cfe2f2;font-size:11px;margin-top:4px;}

        .content{padding:14px;}
        .old-grid{display:grid;grid-template-columns:190px minmax(0,1fr);gap:12px;align-items:start;}
        .side-panel,.main-panel{background:#050b12;border:1px solid #244b70;box-shadow:inset 0 0 18px rgba(0,0,0,.75);}
        .panel-header{min-height:32px;background:linear-gradient(to bottom,#18344f,#091521);border-bottom:1px solid #244b70;display:flex;align-items:center;padding:0 11px;color:#d7ad4a;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:1px;}

        .side-body{padding:10px;}
        .match-info{display:grid;grid-template-columns:1fr 1fr;gap:6px;}
        .match-info div{min-width:0;border:1px solid #1f3d5a;background:#081522;padding:7px;color:#cfe2f2;font-size:10px;line-height:14px;}
        .match-info span{display:block;color:#8aa7c0;font-size:9px;font-weight:bold;text-transform:uppercase;letter-spacing:.4px;}
        .match-info strong{display:block;margin-top:2px;color:#f5f8ff;font-size:11px;overflow-wrap:anywhere;}

        .main-body{padding:12px;}
        .form-section{border:1px solid #244b70;background:#07111b;margin-bottom:10px;box-shadow:inset 0 0 14px rgba(0,0,0,.35);}
        .form-title{min-height:30px;display:flex;align-items:center;padding:6px 10px;background:linear-gradient(to bottom,#112b42,#07111b);border-bottom:1px solid #244b70;color:#d7ad4a;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:.4px;}
        .form-body{padding:11px;}
        .match-details .form-body{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px 16px;}

        .row{display:grid;grid-template-columns:94px minmax(0,1fr);gap:8px;align-items:start;margin:0;min-width:0;}
        .row-wide{grid-column:1/-1;}

        label{color:#cfe2f2;font-size:10px;font-weight:bold;text-transform:uppercase;padding-top:8px;}
        input,select,textarea{width:100%;border:1px solid #315b7d;background:#02070c;color:#fff;font-size:12px;font-family:Tahoma,Verdana,Arial,sans-serif;padding:7px 8px;outline:none;}
        input:focus,select:focus,textarea:focus{border-color:#6ba8d6;box-shadow:0 0 8px rgba(103,189,255,.28);}
        select{cursor:pointer;}

        .mode-select{max-width:310px;}
        .rules-select{max-width:230px;}
        .small-select{max-width:160px;}
        .time-select{max-width:170px;}
        .locked-player-box{max-width:160px;border:1px solid #315b7d;background:#02070c;color:#d7ad4a;font-size:13px;font-weight:900;padding:9px 10px;text-transform:uppercase;}

        .date-time-box{border:1px solid #315b7d;background:#02070c;padding:5px;display:grid;grid-template-columns:1fr;gap:0;align-items:center;max-width:220px;}
        .locked-day{height:38px;border:1px solid #244b70;background:#07111b;color:#d7ad4a;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:900;text-transform:uppercase;}

        .best-of-scroll{display:flex;gap:4px;width:max-content;max-width:100%;height:auto;overflow:visible;border:0;background:transparent;}
        .best-of-option{width:auto;min-width:64px;height:32px;border:1px solid #315b7d;background:#02070c;color:#cfe2f2;font-size:10px;font-weight:900;text-transform:uppercase;cursor:pointer;padding:0 9px;}
        .best-of-option:hover,.best-of-option.active{background:#10283d;color:#d7ad4a;}

        .settings-summary{border:1px solid #315b7d;background:#02070c;padding:9px;}
        .settings-title{color:#fff;font-size:11px;font-weight:900;text-transform:uppercase;}
        .settings-copy{color:#8aa7c0;font-size:10px;line-height:15px;margin-top:4px;}
        .settings-buttons{display:flex;flex-wrap:wrap;gap:6px;margin-top:7px;}
        .settings-button{min-width:0;height:30px;border:1px solid #4b95d8;background:linear-gradient(to bottom,#1c4b72,#0a1724);color:#fff;font-size:9px;font-weight:900;text-transform:uppercase;cursor:pointer;padding:0 9px;}
        .settings-button:hover{color:#d7ad4a;border-color:#d7ad4a;}
        .settings-button.locked{opacity:.45;cursor:not-allowed;}
        .settings-button.locked:hover{color:#fff;border-color:#4b95d8;}
        .settings-details summary{display:flex;align-items:center;gap:12px;cursor:pointer;list-style:none;}
        .settings-details summary::-webkit-details-marker,.rules-details summary::-webkit-details-marker{display:none;}
        .settings-details summary .settings-copy{flex:1;margin:0;}
        .settings-toggle{color:#8aa7c0;font-size:9px;font-weight:900;text-transform:uppercase;white-space:nowrap;}
        .settings-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin-top:10px;}
        .setting-field{display:grid;grid-template-columns:minmax(88px,140px) minmax(0,1fr);align-items:center;gap:8px;color:#cfe2f2;font-size:11px;}
        .setting-field .small-select{max-width:100%;}
        .rules-details summary{justify-content:space-between;cursor:pointer;list-style:none;}
        .rules-details .form-body{padding-top:10px;}

        .rules-box{border:1px solid #315b7d;background:#02070c;padding:8px;color:#cfe2f2;font-size:10px;line-height:16px;}
        .crossplay-box{border:1px solid #315b7d;background:#02070c;padding:7px;max-width:410px;}
        .small-note{color:#8aa7c0;font-size:10px;line-height:15px;margin-top:5px;}
        .error-note{color:#ff9d9d;}
        .roster-picker{display:flex;flex-wrap:wrap;gap:6px;padding-top:7px;}
        .roster-pill{padding:6px 9px;border:1px solid #315f88;background:#0b1c2d;color:#dfeaf7;font-size:10px;font-weight:bold;text-transform:uppercase;cursor:pointer;transition:all .15s ease;}
        .roster-pill.eligible{border-color:#36a968;}
        .roster-pill:hover{border-color:#f2c14e;color:#f2c14e;}
        .roster-pill.active{background:linear-gradient(to bottom,#1d496e,#0a1724);border-color:#f2c14e;color:#f2c14e;box-shadow:0 0 12px rgba(242,193,78,.25);}
        .roster-pill:disabled{border-color:#34404b;background:#101820;color:#778694;cursor:not-allowed;opacity:.65;}
        .roster-pill:disabled:hover{border-color:#34404b;color:#778694;}

        .rules-link{display:inline-flex;align-items:center;justify-content:center;min-width:140px;height:32px;border:1px solid #4b95d8;background:linear-gradient(to bottom,#1c4b72,#0a1724);color:#fff;font-size:10px;font-weight:900;text-transform:uppercase;cursor:pointer;padding:0 10px;}
        .rules-link:hover{color:#d7ad4a;border-color:#d7ad4a;}

        .error-box{border:1px solid #923131;background:#210707;color:#ff9c9c;font-size:11px;font-weight:900;text-transform:uppercase;padding:9px;margin-bottom:9px;}

        .actions{position:sticky;bottom:0;z-index:5;display:flex;flex-wrap:wrap;justify-content:flex-end;gap:8px;margin:10px -12px -12px;padding:9px 12px;background:rgba(5,11,18,.96);border-top:1px solid #244b70;backdrop-filter:blur(8px);}
        .action-btn{min-width:130px;height:36px;border:1px solid #4b95d8;background:linear-gradient(to bottom,#1c4b72,#0a1724);color:#fff;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.6px;text-shadow:0 1px 2px #000;cursor:pointer;padding:0 12px;}
        .action-btn.gold{background:linear-gradient(to bottom,#d6a943,#7b560e);border-color:#e8c46a;color:#07111b;text-shadow:none;}
        .action-btn.red{background:linear-gradient(to bottom,#bd1717,#5c0000);border-color:#e34242;}
        .action-btn:hover{filter:brightness(1.13);}
        .action-btn:disabled{opacity:.55;cursor:not-allowed;filter:none;}

        .footer{height:30px;background:#07111b;border-top:1px solid #244b70;display:flex;justify-content:center;align-items:center;color:#a9c3db;font-size:10px;}

        .modal-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.74);z-index:100;display:flex;align-items:center;justify-content:center;padding:20px;}
        .settings-modal{width:820px;max-width:96vw;max-height:90vh;overflow:auto;border:1px solid #315f88;background:#050b12;box-shadow:0 0 30px rgba(0,80,140,.55);}
        .success-modal{width:420px;max-width:96vw;border:1px solid #35a852;background:#050b12;box-shadow:0 0 30px rgba(53,168,82,.3);}
        .modal-title{min-height:38px;background:linear-gradient(to bottom,#18344f,#091521);border-bottom:1px solid #244b70;color:#d7ad4a;display:flex;align-items:center;justify-content:space-between;padding:8px 12px;font-size:13px;font-weight:900;text-transform:uppercase;}
        .modal-close{width:24px;height:24px;border:1px solid #315f88;background:#000;color:#fff;font-weight:900;cursor:pointer;}
        .modal-body{padding:15px;}
        .settings-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
        .setting-row{display:grid;grid-template-columns:145px 1fr;gap:10px;align-items:center;border:1px solid #1f3d5a;background:#07111b;padding:10px;}
        .restriction-list{display:grid;gap:8px;margin-top:12px;}
        .restriction-row{display:grid;grid-template-columns:100px minmax(0,1fr) 135px auto;gap:8px;align-items:center;}
        .restriction-row button,.restriction-add{border:1px solid #315f88;background:#10283d;color:#fff;padding:8px;cursor:pointer;font-size:11px;}
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
          .side-panel .side-body{padding:8px;}
          .match-info{grid-template-columns:repeat(4,minmax(0,1fr));}
          .header{gap:12px;padding:12px 16px;}
          .nav{flex-wrap:wrap;height:auto;padding:10px;gap:14px;}
        }
        @media(max-width:620px){
          .page{padding:8px;}
          .content{padding:8px;}
          .header{align-items:flex-start;}
          .game-cover{width:66px;height:46px;}
          .game-header{gap:9px;}
          .ladder-name{font-size:18px;}
          .header-badge{font-size:10px;padding:8px;}
          .title-bar h1{font-size:19px;}
          .match-info{grid-template-columns:repeat(2,minmax(0,1fr));}
          .match-details .form-body{grid-template-columns:1fr;gap:10px;}
          .row{grid-template-columns:1fr;gap:4px;}
          .row-wide{grid-column:auto;}
          .row label{padding-top:0;}
          .date-time-box{max-width:100%;}
          .settings-grid,.setting-row{grid-template-columns:1fr;gap:8px;}
          .restriction-row{grid-template-columns:1fr 1fr;}
          .actions{margin-left:-8px;margin-right:-8px;margin-bottom:-8px;padding:8px;}
          .actions .action-btn{flex:1;min-width:0;}
        }
      `}</style>

      <main className="page">
        <div className="wrap">
          <header className="header">
            <div className="game-header">
              <div className="game-cover">
                {gameImage && (
                  <img loading="lazy" decoding="async" src={gameImage} alt={gameName} />
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
            <Link href={`/ladders/${platform}/${category}/${game}/${ladder}/rankings`}>Ladder</Link>
          </nav>

          <section className="title-bar">
            <h1>Create Match</h1>
            <p>{platformName} / {gameName} / {ladderName}</p>
          </section>

          <section className="content">
            <div className="old-grid">
              <aside className="side-panel">
                <div className="panel-header">Match Snapshot</div>

                <div className="side-body">
                  <div className="match-info">
                    <div><span>Platform</span><strong>{platformName}</strong></div>
                    <div><span>Players</span><strong>{players}</strong></div>
                    <div><span>Rules</span><strong>{isRedSec || isRapidRoyal ? `${killRaceName} Rules` : rulesType}</strong></div>
                    <div><span>Cross Play</span><strong>{crossplay}</strong></div>
                  </div>
                </div>
              </aside>

              <section className="main-panel">
                <div className="panel-header">Match Post Form</div>

                <div className="main-body">
                  {postError && <div className="error-box">{postError}</div>}

                  <div className="form-section match-details">
                    <div className="form-title">Match Details</div>

                    <div className="form-body">
                      <div className="row">
                        <label>Game Mode</label>

                        {isRedSec || isRapidRoyal ? (
                          <div className="locked-player-box">{killRaceName}</div>
                        ) : gameRules ? (
                          <select
                            className="mode-select"
                            value={currentMode?.value}
                            onChange={(e) => setGameMode(e.target.value)}
                          >
                            {gameRules.modes.map((mode) => (
                              <option key={mode.value}>{mode.value}</option>
                            ))}
                          </select>
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

                        {isRapidRoyal ? (
                          <div className="rules-box">
                            <strong>Rapid Royal</strong> (selected in-game by the host)
                          </div>
                        ) : isRedSec ? (
                          <div className="rules-box">
                            <strong>Lyndon Oil Works</strong>
                          </div>
                        ) : (
                          <div className="rules-box">
                            Where a game and mode has a supported map pool, maps are randomly assigned when the match is accepted.
                            <br />
                            Otherwise, follow the game&apos;s match rules when choosing maps.
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
                            <option disabled={!crossplaySystems || crossplaySystems.length < 2}>On</option>
                          </select>

                          <div className="small-note">
                            {crossplayError && <span role="alert">{crossplayError}<br /></span>}
                            {crossplaySystems?.length === 1 && <span>Cross-play with other systems is not available for this game.<br /></span>}
                            {crossplay === "Off"
                              ? `Cross Play Disabled: only ${platformName} teams on this exact game and ladder can accept.`
                              : "Cross Play Enabled: teams on compatible systems can accept. Confirm your game versions can play together before the match."}
                          </div>
                        </div>
                      </div>

                      <div className="row">
                        <label>Rules</label>

                        {isRedSec || isRapidRoyal ? (
                          <div>
                            <button
                              className="rules-link"
                              type="button"
                              onClick={() => setRedSecRulesOpen(true)}
                            >
                              Read {killRaceName} Rules
                            </button>

                            <div className="small-note">
                              GameBattles {killRaceName} rules must be followed for this match.
                            </div>
                          </div>
                        ) : gameRules ? (
                          <div>
                            <div className="locked-player-box">{gameRules.presetName}</div>
                            <div className="small-note">{gameRules.notes[0]}</div>
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

                      <div className="row row-wide">
                        <label>Settings</label>

                        {isRedSec || isRapidRoyal ? (
                          <div className="settings-summary">
                            <div className="settings-title">{killRaceName} settings are locked</div>
                            <div className="settings-copy">
                              Controlled by the GameBattles {killRaceName} ruleset.
                            </div>
                          </div>
                        ) : gameRules && currentMode ? (
                          <details className="settings-summary settings-details">
                            <summary>
                              <span className="settings-title">{currentMode.value} Settings</span>
                              <span className="settings-copy">Competitive defaults · customize if both teams agree</span>
                              <span className="settings-toggle">Customize</span>
                            </summary>
                            <div className="settings-fields">
                              {currentMode.fields.map((item) => (
                                <div key={item.slot} className="setting-field">
                                  <span>{item.label}</span>
                                  {item.options.length === 1 ? (
                                    <strong>{item.options[0]}</strong>
                                  ) : (
                                    <select
                                      className="small-select"
                                      value={activeRuleValues[item.slot]}
                                      onChange={(e) =>
                                        setRuleValues((current) => ({ ...current, [item.slot]: e.target.value }))
                                      }
                                    >
                                      {item.options.map((option) => (
                                        <option key={option}>{option}</option>
                                      ))}
                                    </select>
                                  )}
                                </div>
                              ))}
                            </div>
                          </details>
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

                              {rulesType === "Custom" && (
                                <button
                                  className="settings-button"
                                  type="button"
                                  onClick={() => setSettingsOpen(true)}
                                >
                                  Edit Custom Settings
                                </button>
                              )}
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

                      {teamRoster.length > 0 && (
                        <div className="row row-wide">
                          <label>Match Roster</label>
                          <div>
                            <div className="small-note">
                              Select exactly {rosterLimit} eligible (green) players. Only team members with a linked {platformName} ID can be selected.
                            </div>
                            <div className="roster-picker">
                              {teamRoster.map((player) => {
                                const isSelected = selectedRosterPlayers.includes(player.id);
                                const isEligible = isMatchEligibleGamingId(player.gaming_id);

                                return (
                                  <button
                                    key={player.id}
                                    type="button"
                                    className={`roster-pill${isEligible ? " eligible" : ""}${isSelected ? " active" : ""}`}
                                    disabled={!isEligible}
                                    onClick={() => toggleRosterPlayer(player.id)}
                                  >
                                    {player.username} — {player.gaming_id || "Not eligible"}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}

                      {teamRoster.length === 0 && (
                        <div className="row row-wide">
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
                            Choose a future date and time. Your team&apos;s matches and open posts must start at least 15 minutes apart.
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

                  <details className="form-section rules-details">
                    <summary className="form-title">
                      <span>Rules Reminder</span>
                      <span className="settings-toggle">View match rules</span>
                    </summary>

                    <div className="form-body">
                      {isRapidRoyal ? (
                        <div className="rules-box">
                          <strong>RAPID ROYAL — KILL RACE RULES</strong>
                          <br />
                          <br />
                          • {rapidRoyalRules.teams}
                          <br />
                          • {bestOf} · {players} · Cross Play {crossplay}.
                          <br />
                          • {players === "3v3" ? rapidRoyalRules.trios : rapidRoyalRules.duos}
                          <br />
                          • {rapidRoyalRules.winning}
                          <br />
                          • {rapidRoyalRules.proof}
                          <br />
                          <br />
                          <button
                            className="rules-link"
                            type="button"
                            onClick={() => setRedSecRulesOpen(true)}
                          >
                            Read Full Rules
                          </button>
                        </div>
                      ) : isRedSec ? (
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
                      ) : gameRules && currentMode ? (
                        <div className="rules-box">
                          <strong>{currentMode.value.toUpperCase()} MATCH RULES</strong>
                          <br />
                          <br />
                          • Created for the <strong>{ladderName}</strong> · {gameName} · {platformName}.
                          <br />
                          • {bestOf} · {players} · Cross Play {crossplay}.
                          {currentMode.rules.map((line) => (
                            <span key={line}>
                              <br />• {line}
                            </span>
                          ))}
                          <br />• Results must be reported after the match; screenshots may be needed for disputes.
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
                  </details>

                  <div className="actions">
                    <button
                      className="action-btn gold"
                      type="button"
                      disabled={posting}
                      onClick={handlePostMatch}
                    >
                      {posting ? "Posting..." : "Post Match"}
                    </button>

                    <Link
                      className="action-btn"
                      href={`/matches/finder?teamId=${teamId}&platform=${platform}&category=${category}&game=${game}&ladder=${ladder}`}
                    >
                      Match Finder
                    </Link>

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
              {isRapidRoyal ? "RAPID ROYAL" : "REDSEC"} — KILL RACE RULES
              <button
                className="modal-close"
                type="button"
                onClick={() => setRedSecRulesOpen(false)}
              >
                X
              </button>
            </div>

            <div className="modal-body">
              {isRapidRoyal ? (
                <RapidRoyalRules />
              ) : (
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
              )}

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
                  <div>Round Length: 1.5 Minutes · Score Limit: Default · Health: Normal</div>
                  <div>Respawn Delay: None · Bomb Timer: 45 Seconds · Plant Time: 5 Seconds · Defuse Time: 7.5 Seconds</div>
                  <div>Field Upgrades: On</div>
                </div>
              )}

              {viewPresetOpen === "CDL" && (
                <div className="preset-list">
                  <div>Ruleset: CDL competitive-style preset</div>
                  <div>Mode and Players: Host selected</div>
                  <div>Cross Play: Host selected</div>
                  <div>Maps: Generated once accepted</div>
                  <div>Radar: Normal</div>
                  <div>Hardcore: Off</div>
                  <div>Third Person: Off</div>
                  <div>Killstreaks: Off</div>
                  <div>Launchers: Off</div>
                  <div>Perks: On · Attachments: On · Field Upgrades: On</div>
                  <div>Friendly Fire: On</div>
                  <div>Spectating: Team Only</div>
                  <div>Round Length: 1.5 Minutes · Score Limit: Default · Health: Normal</div>
                  <div>Respawn Delay: None · Bomb Timer: 45 Seconds · Plant Time: 5 Seconds · Defuse Time: 7.5 Seconds</div>
                  <div>This is a site CDL-style preset, not a live official CDL restricted-item list.</div>
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

              <div className="restriction-list">
                <div className="settings-title">Equipment &amp; perk rules</div>
                <p className="small-note">Choose allowed or banned for individual items available in this game. Items left unspecified have no individual rule.</p>
                {restrictions.map((item, index) => (
                  <div className="restriction-row" key={index}>
                    <select aria-label={`Rule ${index + 1} category`} value={item.category} onChange={(event) => setRestrictions((current) => current.map((row, i) => i === index ? { ...row, category: event.target.value as RestrictionDraft["category"] } : row))}>
                      <option>Equipment</option><option>Perk</option>
                    </select>
                    <input aria-label={`Rule ${index + 1} item`} list={game === "mw2" && category === "call-of-duty" ? `mw2-${item.category.toLowerCase()}-items` : undefined} maxLength={80} placeholder="Item or perk name" value={item.item} onChange={(event) => setRestrictions((current) => current.map((row, i) => i === index ? { ...row, item: event.target.value } : row))} />
                    <select aria-label={`Rule ${index + 1} status`} value={item.status} onChange={(event) => setRestrictions((current) => current.map((row, i) => i === index ? { ...row, status: event.target.value as RestrictionDraft["status"] } : row))}>
                      <option>Not specified</option><option>Allowed</option><option>Banned</option>
                    </select>
                    <button type="button" aria-label={`Remove rule ${index + 1}`} onClick={() => setRestrictions((current) => current.filter((_, i) => i !== index))}>Remove</button>
                  </div>
                ))}
                {game === "mw2" && category === "call-of-duty" && (
                  <>
                    <datalist id="mw2-equipment-items">
                      {["Frag Grenade", "Semtex", "Throwing Knife", "Tactical Insertion", "Blast Shield", "Claymore", "C4"].map((item) => <option key={item} value={item} />)}
                    </datalist>
                    <datalist id="mw2-perk-items">
                      {["Marathon", "Sleight of Hand", "Scavenger", "Bling", "One Man Army", "Stopping Power", "Lightweight", "Hardline", "Cold-Blooded", "Danger Close", "Commando", "Steady Aim", "Scrambler", "Ninja"].map((item) => <option key={item} value={item} />)}
                    </datalist>
                  </>
                )}
                <button className="restriction-add" type="button" disabled={restrictions.length >= 50} onClick={() => setRestrictions((current) => [...current, { category: "Equipment", item: "", status: "Not specified" }])}>Add equipment or perk rule</button>
              </div>

              <div className="modal-actions">
                <button
                  className="action-btn"
                  type="button"
                  onClick={() => setSettingsOpen(false)}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
