"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { useUser } from "../../../lib/useUser";
import { getGameRules } from "../../../lib/matchRules";
import { gamingCategoryLabel, gamingGameLabel } from "../../../lib/gamingAccounts";

type MatchRow = {
  id: string;
  match_post_id?: string | null;
  posting_team_id?: string | null;
  accepting_team_id?: string | null;
  platform?: string | null;
  category?: string | null;
  game?: string | null;
  ladder?: string | null;
  game_mode?: string | null;
  players?: string | null;
  match_time?: string | null;
  best_of?: string | null;
  preset?: string | null;
  crossplay?: string | null;
  perks?: string | null;
  launchers?: string | null;
  killstreaks?: string | null;
  field_upgrades?: string | null;
  hardcore?: string | null;
  friendly_fire?: string | null;
  radar?: string | null;
  spectating?: string | null;
  third_person?: string | null;
  round_length?: string | null;
  score_limit?: string | null;
  health?: string | null;
  respawn_delay?: string | null;
  bomb_timer?: string | null;
  plant_time?: string | null;
  defuse_time?: string | null;
  attachments?: string | null;
  status?: string | null;
  winning_team_id?: string | null;
  losing_team_id?: string | null;
  created_at?: string | null;
  accepted_at?: string | null;
  started_at?: string | null;
  completed_at?: string | null;

  posting_team_score?: number | null;
  accepting_team_score?: number | null;
  reporting_status?: string | null;

  reported_by_team_id?: string | null;
  reported_winner_team_id?: string | null;
  reported_loser_team_id?: string | null;
  confirmation_team_id?: string | null;

  score_reported_at?: string | null;
  score_confirmed_at?: string | null;
  score_verified?: boolean | null;
  score_verified_at?: string | null;

  disputed_at?: string | null;
  dispute_reason?: string | null;

  finalized?: boolean | null;
  finalized_at?: string | null;
  finalized_by?: string | null;

  rankings_applied?: boolean | null;
  result_processed?: boolean | null;
  ranking_change_applied_at?: string | null;

  locked_posting_roster?: string[] | null;
  locked_accepting_roster?: string[] | null;
  winning_user_ids?: string[] | null;
  losing_user_ids?: string[] | null;
};

type TeamRow = {
  id: string;
  name: string | null;
  tag: string | null;
  logo_url: string | null;
  avatar_url: string | null;
  wins: number | null;
  losses: number | null;
  streak: string | null;
  xp: number | null;
  rating_points?: number | null;
  owner_id?: string | null;
};

type AppUser = {
  id: string;
  email?: string | null;
};

type TeamMemberRow = {
  team_id: string;
  user_id?: string | null;
  role: string | null;
};

type MatchCommentRow = {
  id: string;
  match_id: string;
  user_id: string | null;
  team_id: string | null;
  comment: string | null;
  created_at: string | null;
  profiles?: { username?: string | null } | null;
  username?: string | null;
};

type MatchParticipant = {
  id: string;
  team_id: string;
  team_name_at_match: string;
  username_at_match: string;
  account_id_at_match: string;
};

function clean(value: string | null | undefined, fallback = "TBD") {
  if (!value) return fallback;
  return value;
}

function prettyText(value: string | null | undefined) {
  if (!value) return "Unknown";
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

function ladderName(value: string | null | undefined) {
  if (value === "singles") return "Solos Ladder";
  if (value === "duos") return "Duos Ladder";
  return "Team Ladder";
}

function prettyStatus(status: string | null | undefined) {
  if (!status) return "Upcoming";
  if (status === "awaiting_confirmation") return "Awaiting Confirmation";
  return status.charAt(0).toUpperCase() + status.slice(1).replaceAll("_", " ");
}

function statusClass(status: string | null | undefined) {
  const value = String(status || "upcoming").toLowerCase();
  if (value === "completed") return "completed";
  if (value === "awaiting_confirmation") return "awaiting";
  if (value === "playing") return "playing";
  if (value === "disputed") return "disputed";
  return "upcoming";
}

function staffMatchId(id: string) {
  if (!id) return "00000000";

  const cleanId = id.replace(/-/g, "").toLowerCase();
  const partOne = cleanId.slice(0, 3);
  const partTwo = cleanId.slice(8, 11);
  const partThree = cleanId.slice(20, 22);

  return `${partOne}${partTwo}${partThree}`.slice(0, 8);
}

function formatMatchTime(value: string | null | undefined) {
  if (!value) return "TBD";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

function getBestOfNumber(bestOf: string | null | undefined) {
  const found = String(bestOf || "").match(/\d+/);
  if (!found) return 3;
  return Number(found[0]) || 3;
}

function validateSeriesScore(bestOf: number, scoreA: number, scoreB: number) {
  const requiredWins = bestOf === 7 ? 4 : bestOf === 5 ? 3 : 2;
  const winnerScore = Math.max(scoreA, scoreB);
  const loserScore = Math.min(scoreA, scoreB);

  if (scoreA === scoreB) return "Scores cannot be tied.";
  if (winnerScore !== requiredWins) {
    return `Best Of ${bestOf} requires the winner to reach ${requiredWins}.`;
  }
  if (loserScore >= requiredWins) return "Invalid series result.";

  return "";
}

function matchTimeHasPassed(matchTime: string | null | undefined) {
  if (!matchTime) return false;

  const now = new Date();
  const rawTime = String(matchTime).trim();

  const dateAttempt = new Date(rawTime);
  if (!Number.isNaN(dateAttempt.getTime())) {
    return now.getTime() >= dateAttempt.getTime();
  }

  const match = rawTime.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)?$/i);
  if (!match) return false;

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const period = match[3]?.toUpperCase();

  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;

  const scheduled = new Date();
  scheduled.setHours(hours, minutes, 0, 0);

  return now.getTime() >= scheduled.getTime();
}

export default function MatchDetailsPage() {
  const params = useParams();
  const matchId = String(params?.matchId || "");
  const { user } = useUser() as any;
  const currentUser = user as AppUser | null;

  const [match, setMatch] = useState<MatchRow | null>(null);
  const [postingTeam, setPostingTeam] = useState<TeamRow | null>(null);
  const [acceptingTeam, setAcceptingTeam] = useState<TeamRow | null>(null);
  const [teamRanks, setTeamRanks] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [postingScore, setPostingScore] = useState("");
  const [acceptingScore, setAcceptingScore] = useState("");
  const [userTeamId, setUserTeamId] = useState("");
  const [viewerCanManageMatch, setCanManageMatch] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [comments, setComments] = useState<MatchCommentRow[]>([]);
  const [participants, setParticipants] = useState<MatchParticipant[]>([]);
  const [commentText, setCommentText] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentMessage, setCommentMessage] = useState("");

  useEffect(() => {
    async function loadMatch() {
      setLoading(true);
      setPageError("");
      setUserTeamId("");
      setCanManageMatch(false);

      if (process.env.NODE_ENV === "development" && matchId === "preview") {
        const soon = new Date(Date.now() + 2 * 3600 * 1000).toISOString();
        setMatch({
          id: "preview",
          posting_team_id: "t1",
          accepting_team_id: "t2",
          platform: "xbox",
          game: "black-ops-6",
          game_mode: "search-and-destroy",
          ladder: "teams",
          players: "4v4",
          match_time: soon,
          best_of: "Best of 3",
          preset: "GameBattles Standard",
          crossplay: "Off",
          perks: "Standard",
          killstreaks: "Off",
          hardcore: "No",
          friendly_fire: "Off",
          round_length: "2:00",
          score_limit: "6",
          bomb_timer: "45s",
          status: "upcoming",
          reporting_status: "none",
          accepted_at: new Date().toISOString(),
        });
        setPostingTeam({ id: "t1", name: "Nova Elite", tag: "NOVA", logo_url: null, avatar_url: null, wins: 57, losses: 12, streak: "8W", xp: 5180 });
        setAcceptingTeam({ id: "t2", name: "Ghost Ops", tag: "GHST", logo_url: null, avatar_url: null, wins: 54, losses: 15, streak: "5W", xp: 5035 });
        setParticipants(
          ["Viper", "Hex", "Rook", "Blaze"].map((u, i) => ({ id: `a${i}`, team_id: "t1", team_name_at_match: "Nova Elite", username_at_match: u, account_id_at_match: `${u}#10${i}` }))
            .concat(["Ghost", "Raven", "Echo", "Drift"].map((u, i) => ({ id: `b${i}`, team_id: "t2", team_name_at_match: "Ghost Ops", username_at_match: u, account_id_at_match: `${u}#20${i}` })))
        );
        setTeamRanks({ t1: 2, t2: 3 });
        setLoading(false);
        return;
      }
      const { data: matchData, error: matchError } = await supabase
        .from("matches")
        .select("*")
        .eq("id", matchId)
        .neq("status", "cancelled")
        .maybeSingle();

      if (matchError) {
        setPageError(matchError.message);
        setLoading(false);
        return;
      }

      if (!matchData) {
        setPageError("Match not found or has been cancelled.");
        setLoading(false);
        return;
      }

      const officialMatch = matchData as MatchRow;
      setMatch(officialMatch);

      const { data: participantRows, error: participantError } = await supabase
        .from("match_participants")
        .select("id,team_id,team_name_at_match,username_at_match,account_id_at_match")
        .eq("match_id", officialMatch.id)
        .order("username_at_match");

      if (participantError) {
        setPageError("Match participation history could not be loaded: " + participantError.message);
        setLoading(false);
        return;
      }
      setParticipants((participantRows || []) as MatchParticipant[]);

      const teamIds = [
        officialMatch.posting_team_id,
        officialMatch.accepting_team_id,
      ].filter(Boolean) as string[];

      let teams: TeamRow[] = [];

      if (teamIds.length > 0) {
        const { data: teamsData, error: teamsError } = await supabase
          .from("teams")
          .select("id,name,tag,logo_url,avatar_url,wins,losses,streak,xp,rating_points,owner_id")
          .in("id", teamIds);

        if (teamsError) {
          setPageError(teamsError.message);
          setLoading(false);
          return;
        }

        teams = (teamsData || []) as TeamRow[];

        // Same ordering the team page uses to calculate a team's ladder place
        const { data: rankedTeams } = await supabase
          .from("teams")
          .select("id")
          .eq("platform", officialMatch.platform || "")
          .eq("category", officialMatch.category || "")
          .eq("game", officialMatch.game || "")
          .eq("ladder", officialMatch.ladder || "")
          .or("wins.gt.0,losses.gt.0")
          .order("rating_points", { ascending: false })
          .order("wins", { ascending: false })
          .order("losses", { ascending: true })
          .order("created_at", { ascending: true });

        const ranks: Record<string, number> = {};
        (rankedTeams || []).forEach((row: { id: string }, index: number) => {
          ranks[String(row.id)] = index + 1;
        });
        setTeamRanks(ranks);

        setPostingTeam(
          teams.find((team) => team.id === officialMatch.posting_team_id) ||
            null
        );

        setAcceptingTeam(
          teams.find((team) => team.id === officialMatch.accepting_team_id) ||
            null
        );
      } else {
        setPostingTeam(null);
        setAcceptingTeam(null);
      }

      setPostingScore(
        officialMatch.posting_team_score === null || officialMatch.posting_team_score === undefined
          ? ""
          : String(officialMatch.posting_team_score)
      );

      setAcceptingScore(
        officialMatch.accepting_team_score === null || officialMatch.accepting_team_score === undefined
          ? ""
          : String(officialMatch.accepting_team_score)
      );

      if (currentUser?.id && teamIds.length > 0) {
        const ownedTeam = teams.find(
          (team) =>
            team.owner_id === currentUser.id &&
            (team.id === officialMatch.posting_team_id ||
              team.id === officialMatch.accepting_team_id)
        );

        if (ownedTeam) {
          setUserTeamId(ownedTeam.id);
          setCanManageMatch(true);
        } else {
          const { data: memberRows, error: memberError } = await supabase
            .from("team_members")
            .select("team_id, role")
            .eq("user_id", currentUser.id)
            .in("team_id", teamIds);

          if (memberError) {
            setUserTeamId("");
            setCanManageMatch(false);
          } else {
            const allowedRoles = ["leader", "co-leader", "coleader", "captain", "owner"];
            const allowedMember = ((memberRows || []) as TeamMemberRow[]).find((member) =>
              allowedRoles.includes(String(member.role || "").toLowerCase())
            );

            if (allowedMember?.team_id) {
              setUserTeamId(allowedMember.team_id);
              setCanManageMatch(true);
            } else {
              setUserTeamId("");
              setCanManageMatch(false);
            }
          }
        }
      } else {
        setUserTeamId("");
        setCanManageMatch(false);
      }

      setLoading(false);
    }

    if (matchId) loadMatch();
  }, [matchId, currentUser?.id]);

  useEffect(() => {
    if (matchId) loadComments();
  }, [matchId]);

  const pageTitle = useMemo(() => {
    if (!match) return "Match Details";
    return `${prettyText(match.game)} - ${prettyText(match.game_mode)} - ${ladderName(match.ladder)}`;
  }, [match]);

  const bestOfNumber = getBestOfNumber(match?.best_of);
  const modeText = String(match?.game_mode || "").toLowerCase();
  const isBombMode = /search|demolition|bomb|defus|s-?n-?d/.test(modeText);
  const isSolo = match?.ladder === "singles";
  const gameRuleSet = match ? getGameRules(match.category || "", match.game || "") : null;
  const modeDef = gameRuleSet?.modes.find((mode) => mode.value === match?.game_mode) || null;
  const gameTitle = match
    ? gameRuleSet
      ? `${gamingCategoryLabel(match.category || "")}: ${gamingGameLabel(match.category || "", match.game || "")}`
      : prettyText(match.game)
    : "";
  const allSettings = match && modeDef
    ? [
        { label: "Cross Play", value: match.crossplay, featured: true },
        ...modeDef.fields.map((item, index) => ({
          label: item.label,
          value: (match as Record<string, any>)[item.slot] as string | null | undefined,
          ...(index < 3 ? { featured: true } : {}),
        })),
      ].filter((setting) => !!setting.value?.trim() && setting.value !== "TBD")
    : match
    ? [
        { label: "Cross Play", value: match.crossplay, featured: true },
        { label: "Score Limit", value: match.score_limit, featured: true },
        { label: "Round Length", value: match.round_length, featured: true },
        { label: "Bomb Timer", value: match.bomb_timer, featured: true, bomb: true },
        { label: "Plant Time", value: match.plant_time, bomb: true },
        { label: "Defuse Time", value: match.defuse_time, bomb: true },
        { label: "Perks", value: match.perks },
        { label: "Launchers", value: match.launchers },
        { label: "Killstreaks", value: match.killstreaks },
        { label: "Field Upgrades", value: match.field_upgrades },
        { label: "Hardcore", value: match.hardcore },
        { label: "Friendly Fire", value: match.friendly_fire },
        { label: "Radar", value: match.radar },
        { label: "Spectating", value: match.spectating },
        { label: "Third Person", value: match.third_person },
        { label: "Health", value: match.health },
        { label: "Respawn Delay", value: match.respawn_delay },
        { label: "Attachments", value: match.attachments },
      ].filter(
        (setting) =>
          !!setting.value?.trim() &&
          setting.value !== "TBD" &&
          (!("bomb" in setting) || isBombMode)
      )
    : [];
  const featuredSettings = allSettings.filter((setting) => "featured" in setting);
  const matchSettings = allSettings.filter((setting) => !("featured" in setting));
  const detailRows = match
    ? [
        { label: "Match ID", value: staffMatchId(match.id) },
        { label: "Date & Time", value: formatMatchTime(match.match_time) },
        { label: "Status", value: "", status: true },
        { label: "Game", value: gameTitle },
        { label: "Platform", value: prettyText(match.platform) },
        { label: "Match Type", value: ladderName(match.ladder) },
        { label: isSolo ? "Format" : "Players", value: match.players?.trim() || "" },
        { label: "Games (Best of...)", value: String(bestOfNumber) },
        { label: "Game Mode", value: match.game_mode ? prettyText(match.game_mode) : "" },
        { label: "Gameplay", value: match.preset?.trim() || "" },
        ...featuredSettings.map((setting) => ({ label: setting.label, value: setting.value || "" })),
      ].filter((row) => ("status" in row && row.status) || row.value)
    : [];
  const requiredWins = bestOfNumber === 7 ? 4 : bestOfNumber === 5 ? 3 : 2;
  const ladderRules = match
    ? [
        {
          title: `${ladderName(match.ladder)} Format`,
          items: [
            match.ladder === "singles"
              ? "This is a solo match. Only the one player on each side may compete."
              : match.ladder === "duos"
              ? "This is a duos match. Each side must play with its locked duo roster."
              : "Teams may play with 3, 4, 5 or 6 players. Players are not locked to a set team size.",
            "Only players listed in the Match Roster may play.",
            `Every player must use the account shown in the roster${match.platform ? ` on ${prettyText(match.platform)}` : ""}.`,
            match.crossplay && match.crossplay.toLowerCase() !== "off"
              ? `Cross-play is ${match.crossplay} for this match.`
              : "Cross-play is not allowed for this match.",
          ],
        },
        {
          title: "Series Rules",
          items: [
            `Best of ${bestOfNumber}: the first team to win ${requiredWins} games wins the match.`,
            match.game_mode
              ? `Each game is played on ${prettyText(match.game_mode)}.`
              : "Game mode is agreed in the match lobby.",
            isBombMode
              ? "Round-based bomb mode: a game is won by reaching the score limit. Plant, defuse and bomb timers must match the settings below."
              : "A game ends when the score limit or time limit in the settings below is reached.",
            ...(modeDef ? modeDef.rules : []),
            "Teams must be ready to play at the scheduled time.",
          ],
        },
        {
          title: "Reporting Results",
          items: [
            "After the scheduled time, a team leader, co-leader or captain reports the series score.",
            "The opposing team confirms the score, or disputes it.",
            "Both teams have 2 hours from match time to submit a ticket with an explanation and proof. Staff only see the case once both teams have submitted, or once the 2 hours have ended.",
          ],
        },
      ]
    : [];
  const matchTimePassed = matchTimeHasPassed(match?.match_time);
  const rawStatus = String(match?.status || "upcoming").toLowerCase();
  const displayStatus =
    rawStatus === "upcoming" && matchTimePassed ? "playing" : rawStatus;
  const canReportScore = matchTimePassed || rawStatus === "playing" || rawStatus === "completed";
  const isDisputed = rawStatus === "disputed";
  const isCompleted = rawStatus === "completed";
  const reportingStatus = String(match?.reporting_status || "none").toLowerCase();
  const isFinalized = !!match?.finalized;
  const scoreAlreadyReported = reportingStatus !== "none" && reportingStatus !== "";
  const userIsPostingTeam = userTeamId && userTeamId === match?.posting_team_id;
  const userIsAcceptingTeam = userTeamId && userTeamId === match?.accepting_team_id;
  const userIsMatchTeam = !!userIsPostingTeam || !!userIsAcceptingTeam;
  const userMustConfirm =
    reportingStatus === "awaiting_confirmation" &&
    !!match?.confirmation_team_id &&
    userTeamId === match.confirmation_team_id;
  const canSubmitScore =
    canReportScore &&
    viewerCanManageMatch &&
    userIsMatchTeam &&
    !scoreAlreadyReported &&
    !isFinalized &&
    !isDisputed &&
    !isCompleted;
  const canConfirmScore =
    viewerCanManageMatch &&
    userMustConfirm &&
    !isFinalized &&
    reportingStatus === "awaiting_confirmation";
  const canDisputeScore = canConfirmScore;
  const confirmationTeamName =
    match?.confirmation_team_id === postingTeam?.id
      ? postingTeam?.name || "Posting Team"
      : match?.confirmation_team_id === acceptingTeam?.id
      ? acceptingTeam?.name || "Accepting Team"
      : "Opponent";
  const commentsUnlocked = isCompleted || isFinalized || reportingStatus === "completed";
  const userAlreadyCommented = !!currentUser?.id && comments.some((item) => item.user_id === currentUser.id);

  async function reloadMatch() {
    if (!matchId) return;

    const { data } = await supabase
      .from("matches")
      .select("*")
      .eq("id", matchId)
      .neq("status", "cancelled")
      .maybeSingle();

    if (data) {
      const updatedMatch = data as MatchRow;
      setMatch(updatedMatch);
      setPostingScore(
        updatedMatch.posting_team_score === null || updatedMatch.posting_team_score === undefined
          ? ""
          : String(updatedMatch.posting_team_score)
      );
      setAcceptingScore(
        updatedMatch.accepting_team_score === null || updatedMatch.accepting_team_score === undefined
          ? ""
          : String(updatedMatch.accepting_team_score)
      );
    }
  }

  async function loadComments() {
    if (!matchId) return;

    const { data, error } = await supabase.rpc("get_match_comments", {
      match_uuid: matchId,
    });

    if (error) {
      setCommentMessage("Comments could not be loaded: " + error.message);
      return;
    }

    const rows = ((data || []) as MatchCommentRow[])
      .filter((row) => row.comment)
      .map((row) => ({
        ...row,
        username: row.username || "Player",
      }));

    setComments(rows);
  }

  async function getTeamMemberUserIds(teamId: string) {
    const { data } = await supabase
      .from("team_members")
      .select("user_id")
      .eq("team_id", teamId);

    return (data || [])
      .map((member: any) => member.user_id)
      .filter(Boolean) as string[];
  }

  async function handlePostComment() {
    if (!match || !commentsUnlocked || commentLoading) return;

    const text = commentText.trim();
    if (!text) return;

    const verifiedUserTeamId = await verifyCurrentUserMatchTeam();
    if (!verifiedUserTeamId || !currentUser?.id) {
      setCommentMessage("Only players from this match can post a comment.");
      return;
    }

    const alreadyPosted = comments.some((item) => item.user_id === currentUser.id);
    if (alreadyPosted) {
      setCommentMessage("You already posted your one match comment.");
      return;
    }

    setCommentLoading(true);
    setCommentMessage("");

    const { data, error } = await supabase.rpc("post_match_comment", {
      match_uuid: match.id,
      poster_user_uuid: currentUser.id,
      poster_team_uuid: verifiedUserTeamId,
      body_text: text,
    });

    setCommentLoading(false);

    if (error) {
      setCommentMessage("Comment could not be posted: " + error.message);
      return;
    }

    const result = data as any;
    if (result && result.ok === false) {
      setCommentMessage(result.message || "Comment could not be posted.");
      await loadComments();
      return;
    }

    setCommentText("");
    setCommentMessage("Comment posted.");
    await loadComments();
  }

  async function verifyCurrentUserMatchTeam() {
    if (!match || !currentUser?.id) return "";

    const teamIds = [match.posting_team_id, match.accepting_team_id].filter(Boolean) as string[];
    if (teamIds.length === 0) return "";

    if (userTeamId && teamIds.includes(userTeamId)) {
      return userTeamId;
    }

    const ownedTeam = [postingTeam, acceptingTeam].find(
      (team) => team?.owner_id === currentUser.id && teamIds.includes(team.id)
    );

    if (ownedTeam?.id) {
      setUserTeamId(ownedTeam.id);
      setCanManageMatch(true);
      return ownedTeam.id;
    }

    const { data: memberRows } = await supabase
      .from("team_members")
      .select("team_id, role")
      .eq("user_id", currentUser.id)
      .in("team_id", teamIds);

    const allowedRoles = ["leader", "co-leader", "coleader", "captain", "owner"];
    const allowedMember = ((memberRows || []) as TeamMemberRow[]).find((member) =>
      allowedRoles.includes(String(member.role || "").toLowerCase())
    );

    if (allowedMember?.team_id) {
      setUserTeamId(allowedMember.team_id);
      setCanManageMatch(true);
      return allowedMember.team_id;
    }

    setUserTeamId("");
    setCanManageMatch(false);
    return "";
  }

  async function handleSubmitScore() {
    if (!match || actionLoading) return;

    setActionMessage("");

    const verifiedUserTeamId = await verifyCurrentUserMatchTeam();

    if (!canReportScore || !verifiedUserTeamId || scoreAlreadyReported || isFinalized || isDisputed || isCompleted) {
      setActionMessage("Only a verified match team leader, co-leader, captain, or owner can report this score.");
      return;
    }

    const postScore = Number(postingScore);
    const acceptScore = Number(acceptingScore);

    if (!Number.isInteger(postScore) || !Number.isInteger(acceptScore)) {
      setActionMessage("Enter valid whole-number scores.");
      return;
    }

    if (postScore < 0 || acceptScore < 0) {
      setActionMessage("Scores cannot be negative.");
      return;
    }

    const scoreError = validateSeriesScore(bestOfNumber, postScore, acceptScore);
    if (scoreError) {
      setActionMessage(scoreError);
      return;
    }

    const reportedWinnerTeamId =
      postScore > acceptScore ? match.posting_team_id : match.accepting_team_id;
    const reportedLoserTeamId =
      postScore > acceptScore ? match.accepting_team_id : match.posting_team_id;

    if (!reportedWinnerTeamId || !reportedLoserTeamId || !verifiedUserTeamId) {
      setActionMessage("Match teams could not be verified.");
      return;
    }

    const confirmationTeamId =
      verifiedUserTeamId === match.posting_team_id ? match.accepting_team_id : match.posting_team_id;

    if (!confirmationTeamId) {
      setActionMessage("Opponent team could not be verified.");
      return;
    }

    const confirmText =
      "Submit this score for confirmation? The opposing team must confirm it before the match is completed.";

    if (!window.confirm(confirmText)) return;

    setActionLoading(true);

    const { error } = await supabase
      .from("matches")
      .update({
        posting_team_score: postScore,
        accepting_team_score: acceptScore,
        reported_by_team_id: verifiedUserTeamId,
        reported_winner_team_id: reportedWinnerTeamId,
        reported_loser_team_id: reportedLoserTeamId,
        confirmation_team_id: confirmationTeamId,
        reporting_status: "awaiting_confirmation",
        status: "awaiting_confirmation",
        score_reported_at: new Date().toISOString(),
      })
      .eq("id", match.id)
      .eq("finalized", false)
      .or("reporting_status.is.null,reporting_status.eq.none");

    setActionLoading(false);

    if (error) {
      setActionMessage("Score could not be submitted. It may have already been reported.");
      return;
    }

    setActionMessage("Score submitted. Awaiting opponent confirmation.");
    await reloadMatch();
  }

  async function handleConfirmScore() {
    if (!match || !canConfirmScore || actionLoading) return;

    if (!window.confirm("Confirm this result? The match will be completed and rankings will update automatically.")) {
      return;
    }

    setActionLoading(true);
    setActionMessage("");

    const { data, error } = await supabase.rpc("confirm_match_and_apply", {
      match_uuid: match.id,
      confirming_user_uuid: currentUser?.id || null,
    });

    setActionLoading(false);

    if (error) {
      setActionMessage("Result could not be confirmed: " + error.message);
      return;
    }

    const result = data as any;
    if (result && result.ok === false) {
      setActionMessage(result.message || "Result could not be confirmed.");
      return;
    }

    setActionMessage("Result confirmed. Match completed and rankings updated.");
    await reloadMatch();
    await loadComments();
  }

  async function handleDisputeScore() {
    if (!match || !canDisputeScore || actionLoading) return;

    const reason = window.prompt("Enter the reason for this dispute:");
    if (!reason || !reason.trim()) return;

    setActionLoading(true);
    setActionMessage("");

    const { error } = await supabase
      .from("matches")
      .update({
        status: "disputed",
        reporting_status: "disputed",
        disputed_at: new Date().toISOString(),
        dispute_reason: reason.trim(),
      })
      .eq("id", match.id)
      .eq("finalized", false)
      .eq("reporting_status", "awaiting_confirmation")
      .eq("confirmation_team_id", userTeamId);

    setActionLoading(false);

    if (error) {
      setActionMessage("Dispute could not be created.");
      return;
    }

    setActionMessage("Dispute opened. Staff must resolve this match.");
    await reloadMatch();
  }

  return (
    <>
      <style>{`
        *{margin:0;padding:0;box-sizing:border-box;}
        body{background:#000;font-family:Tahoma,Verdana,Arial,sans-serif;color:#cfd6dc;}
        button,input{font-family:Tahoma,Verdana,Arial,sans-serif;}

        .page{
          min-height:100vh;
          background:
            radial-gradient(circle at top,rgba(20,55,85,.25),transparent 38%),
            linear-gradient(to bottom,#020202,#000);
          padding:34px 18px;
        }

        .match-shell{
          max-width:1000px;
          margin:0 auto;
          border:1px solid #292929;
          background:#0b0b0b;
          box-shadow:0 0 30px rgba(0,0,0,.9), inset 0 0 18px rgba(255,255,255,.03);
        }

        .top-bar{
          height:42px;
          background:linear-gradient(to bottom,#1d1d1d,#0a0a0a);
          border-bottom:1px solid #272727;
          display:flex;
          align-items:center;
          justify-content:space-between;
          padding:0 14px;
        }

        .top-title{
          color:#d66f16;
          font-size:13px;
          font-weight:900;
          letter-spacing:.8px;
          text-transform:uppercase;
        }

        .top-right{
          color:#777;
          font-size:12px;
          font-weight:900;
          text-transform:uppercase;
        }

        .team-grid{
          display:grid;
          grid-template-columns:1fr 64px 1fr;
          border-bottom:1px solid #242424;
          align-items:stretch;
          background:#0e0e0e;
        }

        .team-card{
          min-height:215px;
          padding:28px 28px;
          background:#0f0f0f;
          display:flex;
          align-items:center;
        }

        .team-card.left-card{justify-content:flex-start;}
        .team-card.right-card{justify-content:flex-end;}

        .vs-box{
          min-height:215px;
          border-left:1px solid #242424;
          border-right:1px solid #242424;
          display:flex;
          align-items:center;
          justify-content:center;
          color:#d66f16;
          font-size:24px;
          font-weight:900;
          background:linear-gradient(to bottom,#151515,#080808);
        }

        .team-main{
          width:100%;
          display:flex;
          align-items:center;
          gap:22px;
        }

        .left-card .team-main{justify-content:flex-start;}
        .right-card .team-main{
          justify-content:flex-end;
          text-align:right;
        }

        .team-logo{
          width:146px;
          height:116px;
          border:1px solid #383838;
          background:#050505;
          display:flex;
          align-items:center;
          justify-content:center;
          overflow:hidden;
          color:#d66f16;
          font-size:36px;
          font-weight:900;
          flex-shrink:0;
        }

        .team-logo img{
          width:100%;
          height:100%;
          object-fit:contain;
          display:block;
        }

        .team-logo-link{
          text-decoration:none;
          color:inherit;
          display:block;
          flex-shrink:0;
        }

        .team-logo-link:hover .team-logo{
          border-color:#d66f16;
          box-shadow:0 0 10px rgba(214,111,22,.45);
        }

        .team-copy{
          min-height:116px;
          display:flex;
          flex-direction:column;
          justify-content:space-between;
        }

        .team-name-block{
          transform:translateY(-4px);
        }

        .team-name{
          color:#ff7a1a;
          font-size:23px;
          font-weight:900;
          line-height:1.1;
          text-transform:uppercase;
        }

        .team-tag{
          color:#777;
          font-size:12px;
          font-weight:900;
          margin-top:6px;
          text-transform:uppercase;
        }

        .participants-grid{
          display:grid;
          grid-template-columns:1fr 1fr;
          gap:12px;
          padding:14px 16px;
          border-bottom:1px solid #242424;
          background:#0b0b0b;
        }

        .participants-team{
          border:1px solid #252525;
          background:#080808;
          padding:10px;
        }

        .participant-line{
          color:#d7d7d7;
          font-size:12px;
          line-height:21px;
        }

        .participant-line strong{color:#ff9b4c;}

        .team-record{
          color:#aaa;
          font-size:13px;
          line-height:21px;
          margin-top:18px;
          transform:translateY(4px);
        }

        .record-line{
          display:inline-flex;
          align-items:center;
          gap:8px;
        }

        .win-number{color:#27d864;font-weight:900;}
        .loss-number{color:#e13636;font-weight:900;}
        .record-dash{color:#777;font-weight:900;}
        .orange{color:#d66f16;font-weight:900;}

        .section-title{
          height:35px;
          background:linear-gradient(to bottom,#1c1c1c,#080808);
          border-bottom:1px solid #242424;
          display:flex;
          align-items:center;
          padding:0 16px;
          color:#d66f16;
          font-size:15px;
          font-weight:900;
          text-transform:uppercase;
          letter-spacing:.6px;
        }

        .match-info{
          border-bottom:1px solid #242424;
          background:#101010;
        }

        .info-grid{
          display:grid;
          grid-template-columns:1fr 1fr;
          gap:22px;
          padding:18px 18px 20px 18px;
        }

        .info-line{
          min-height:31px;
          color:#bdbdbd;
          font-size:14px;
          line-height:31px;
          border-bottom:1px solid rgba(255,255,255,.045);
          position:relative;
        }

        .info-line.settings-line{
          margin-top:9px;
          padding-top:7px;
          min-height:38px;
          display:flex;
          align-items:center;
        }

        .info-label{
          display:inline-block;
          width:104px;
          color:#777;
          font-weight:900;
          text-transform:uppercase;
          font-size:12px;
          flex-shrink:0;
        }

        .info-value{
          color:#fff;
          font-weight:900;
        }

        .short-id{
          color:#fff;
          font-weight:900;
          letter-spacing:1px;
          text-transform:lowercase;
        }

        .status-pill{
          display:inline-block;
          padding:3px 9px;
          font-size:12px;
          font-weight:900;
          text-transform:uppercase;
          border:1px solid #444;
          background:#111;
          line-height:17px;
        }

        .status-pill.upcoming{color:#d66f16;border-color:#d66f16;}
        .status-pill.playing{color:#ff3737;border-color:#ff3737;}
        .status-pill.completed{color:#42d66d;border-color:#42d66d;}
        .status-pill.awaiting{color:#5fa8ff;border-color:#5fa8ff;}
        .status-pill.disputed{color:#ffd24c;border-color:#ffd24c;}

        .details-btn{
          height:23px;
          padding:0 12px;
          border:1px solid #d66f16;
          background:#171717;
          color:#ff7a1a;
          font-size:11px;
          font-weight:900;
          text-transform:uppercase;
          cursor:pointer;
          line-height:21px;
        }

        .details-btn:hover{background:#261205;}

        .score-section{
          border-bottom:1px solid #242424;
          background:#0d0d0d;
        }

        .score-row{
          padding:16px;
          display:flex;
          align-items:center;
          gap:12px;
          flex-wrap:wrap;
        }

        .score-team{
          color:#cfcfcf;
          font-size:14px;
          font-weight:900;
        }

        .score-input{
          width:70px;
          height:34px;
          border:1px solid #333;
          background:#080808;
          color:#fff;
          padding:0 8px;
          font-size:16px;
        }

        .score-input:disabled{
          opacity:.35;
          cursor:not-allowed;
        }

        .submit-btn{
          height:34px;
          padding:0 24px;
          border:1px solid #d66f16;
          background:#171717;
          color:#ff7a1a;
          font-size:12px;
          font-weight:900;
          text-transform:uppercase;
          cursor:pointer;
        }

        .submit-btn:disabled{
          border-color:#444;
          color:#777;
          background:#111;
          cursor:not-allowed;
        }

        .score-note{
          width:100%;
          color:#777;
          font-size:12px;
          font-weight:900;
          text-transform:uppercase;
        }

        .action-message{
          width:100%;
          color:#5fa8ff;
          font-size:12px;
          font-weight:900;
          text-transform:uppercase;
        }

        .confirm-btn{
          height:34px;
          padding:0 22px;
          border:1px solid #27d864;
          background:#061a0c;
          color:#42d66d;
          font-size:12px;
          font-weight:900;
          text-transform:uppercase;
          cursor:pointer;
        }

        .confirm-btn:disabled{
          border-color:#444;
          color:#777;
          background:#111;
          cursor:not-allowed;
        }

        .dispute-row{
          padding:0 16px 16px 16px;
          display:flex;
          align-items:center;
          gap:12px;
          flex-wrap:wrap;
        }

        .dispute-ticket-link{
          color:#ff9b42;
          font-weight:900;
        }

        .dispute-btn{
          height:36px;
          padding:0 22px;
          border:1px solid #b51d1d;
          background:#180303;
          color:#ff3b3b;
          font-size:12px;
          font-weight:900;
          text-transform:uppercase;
          cursor:pointer;
        }

        .dispute-btn:disabled{
          border-color:#444;
          background:#111;
          color:#777;
          cursor:not-allowed;
        }

        .comments{
          background:#0d0d0d;
          padding:0 0 16px 0;
        }

        .comment-body{padding:16px;}

        .comment-box{
          border:1px solid #252525;
          background:#090909;
          padding:14px;
          min-height:86px;
        }

        .comment{
          color:#cfcfcf;
          font-size:13px;
          line-height:20px;
          margin-bottom:12px;
        }

        .comment strong{color:#ff7a1a;}

        .comment-time{
          float:right;
          color:#666;
          font-size:12px;
        }

        .comment-locked{
          color:#777;
          font-size:13px;
          font-weight:900;
          text-transform:uppercase;
          text-align:center;
          padding:18px;
        }

        .comment-form{
          display:grid;
          grid-template-columns:1fr 82px;
          gap:10px;
          margin-top:12px;
        }

        .comment-input{
          height:38px;
          border:1px solid #252525;
          background:#080808;
          color:#fff;
          padding:0 12px;
          font-size:13px;
        }

        .comment-input:disabled{
          opacity:.4;
          cursor:not-allowed;
        }

        .post-btn{
          border:1px solid #d66f16;
          background:#171717;
          color:#ff7a1a;
          font-size:12px;
          font-weight:900;
          text-transform:uppercase;
          cursor:pointer;
        }

        .post-btn:disabled{
          border-color:#444;
          color:#777;
          background:#111;
          cursor:not-allowed;
        }

        .dark-title{color:#fff;background:linear-gradient(to bottom,#3a3a3a,#111);}

        .detail-layout{
          display:grid;
          grid-template-columns:1fr 280px;
          gap:24px;
          padding:18px;
          align-items:start;
        }
        .detail-row{
          display:grid;
          grid-template-columns:170px 1fr;
          gap:12px;
          align-items:center;
          min-height:30px;
          border-bottom:1px solid rgba(255,255,255,.05);
          font-size:14px;
        }
        .detail-label{color:#888;text-align:right;}
        .detail-value{color:#fff;font-weight:900;}
        .detail-row .status-pill{justify-self:start;}
        .detail-actions{display:grid;gap:12px;}
        .blue-btn{
          display:block;
          padding:14px 12px;
          text-align:center;
          text-decoration:none;
          background:#0a78e0;
          color:#fff;
          font-size:14px;
          font-weight:900;
          border-radius:3px;
        }
        .blue-btn:hover{background:#2a8cf0;}
        .toggle-settings{
          display:block;
          width:calc(100% - 36px);
          margin:0 18px 18px;
          padding:10px;
          background:#0b0b0b;
          border:1px solid #0a78e0;
          color:#3d9bff;
          font-size:14px;
          font-weight:900;
          border-radius:3px;
          cursor:pointer;
        }
        .toggle-settings:hover{background:#0d1a2a;}

        .roster-title{
          display:flex;
          align-items:center;
          gap:10px;
          color:#999;
          font-size:14px;
          margin-bottom:12px;
        }
        .roster-title::after{content:"";flex:1;height:1px;background:#2a2a2a;}
        .roster-player{display:flex;align-items:center;gap:10px;margin-bottom:12px;}
        .roster-avatar{
          width:38px;
          height:38px;
          border-radius:3px;
          background:#555;
          color:#fff;
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:12px;
          font-weight:900;
          flex-shrink:0;
        }
        .roster-name{color:#fff;font-weight:900;font-size:14px;display:flex;flex-direction:column;line-height:1.2;}
        .roster-name small{color:#777;font-weight:400;font-size:11px;}

        @media (max-width:700px){
          .detail-layout{grid-template-columns:1fr;}
        }

        .modal-backdrop{
          position:fixed;
          inset:0;
          background:rgba(0,0,0,.78);
          display:flex;
          align-items:center;
          justify-content:center;
          z-index:9999;
          padding:20px;
        }
        .rules-modal{
          width:720px;
          max-width:95vw;
          max-height:88vh;
          display:flex;
          flex-direction:column;
          border:1px solid #383838;
          background:#0b0b0b;
          box-shadow:0 0 35px rgba(0,0,0,.9);
        }
        .modal-title{
          min-height:40px;
          background:linear-gradient(to bottom,#1c1c1c,#080808);
          border-bottom:1px solid #242424;
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:10px;
          padding:0 12px;
          color:#d66f16;
          font-size:13px;
          font-weight:900;
          text-transform:uppercase;
        }
        .modal-close{
          width:24px;
          height:24px;
          border:1px solid #333;
          background:#050505;
          color:#fff;
          cursor:pointer;
          font-weight:900;
        }
        .rules-body{padding:16px 18px;overflow-y:auto;}
        .rules-intro{color:#ddd;font-size:14px;margin-bottom:14px;}
        .rules-section{margin-bottom:16px;}
        .rules-section h3{color:#ff9b4c;font-size:13px;text-transform:uppercase;margin-bottom:8px;}
        .rules-section ul{padding-left:20px;list-style:disc;color:#bbb;font-size:13px;line-height:1.7;}
        .rules-note{color:#888;font-size:12px;margin-bottom:8px;}
        .rules-note a{color:#3d9bff;}
        .rules-settings{display:grid;grid-template-columns:1fr 1fr;gap:6px 14px;}

        .modal-body{
          padding:14px;
          display:grid;
          grid-template-columns:1fr 1fr;
          gap:8px 14px;
        }

        .setting-line{
          border-bottom:1px solid rgba(255,255,255,.06);
          color:#aaa;
          font-size:13px;
          line-height:26px;
        }

        .setting-line span{
          color:#fff;
          font-weight:900;
        }

        .loading,.error{
          padding:50px;
          text-align:center;
          color:#fff;
          font-size:18px;
          font-weight:900;
        }

        .error{color:#ff7777;}

        @media(max-width:760px){
          .team-grid{
            grid-template-columns:1fr;
          }

          .vs-box{
            min-height:48px;
            border-left:0;
            border-right:0;
            border-top:1px solid #242424;
            border-bottom:1px solid #242424;
          }

          .team-card.left-card,
          .team-card.right-card{
            justify-content:center;
          }

          .team-main,
          .right-card .team-main{
            justify-content:center;
            text-align:center;
            flex-direction:column;
          }

          .info-grid,.modal-body{
            grid-template-columns:1fr;
          }

          .score-row,.dispute-row{
            align-items:flex-start;
            flex-direction:column;
          }

        }
      `}</style>

      <main className="page">
        <div className="match-shell">
          <div className="top-bar">
            <div className="top-title">{pageTitle}</div>
            <div className="top-right">Match Details</div>
          </div>

          {loading && <div className="loading">Loading match...</div>}

          {!loading && pageError && <div className="error">{pageError}</div>}

          {!loading && !pageError && match && (
            <>
              <section className="team-grid">
                <div className="team-card left-card">
                  <div className="team-main">
                    {postingTeam?.id ? (
                      <a className="team-logo-link" href={`/teams/${postingTeam.id}`}>
                        <div className="team-logo">
                          {postingTeam?.logo_url ? (
                            <img src={postingTeam.logo_url} alt="Posting Team Logo" />
                          ) : (
                            postingTeam?.tag || "GB"
                          )}
                        </div>
                      </a>
                    ) : (
                      <div className="team-logo">
                        {postingTeam?.logo_url ? (
                          <img src={postingTeam.logo_url} alt="Posting Team Logo" />
                        ) : (
                          postingTeam?.tag || "GB"
                        )}
                      </div>
                    )}

                    <div className="team-copy">
                      <div className="team-name-block">
                        <div className="team-name">
                          {postingTeam?.name || "Posting Team"}
                        </div>
                        <div className="team-tag">
                          {postingTeam?.tag ? `Clan Tag: ${postingTeam.tag}` : "Clan Tag: TBD"}
                        </div>
                      </div>

                      <div className="team-record">
                        Record:{" "}
                        <span className="record-line">
                          <span className="win-number">{postingTeam?.wins || 0}</span>
                          <span className="record-dash">-</span>
                          <span className="loss-number">{postingTeam?.losses || 0}</span>
                        </span>
                        <br />
                        Team Rank: <span className="orange">{teamRanks[postingTeam?.id || ""] ? `#${teamRanks[postingTeam?.id || ""]}` : "Unranked"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="vs-box">VS</div>

                <div className="team-card right-card">
                  <div className="team-main">
                    <div className="team-copy">
                      <div className="team-name-block">
                        <div className="team-name">
                          {acceptingTeam?.name || "Accepting Team"}
                        </div>
                        <div className="team-tag">
                          {acceptingTeam?.tag ? `Clan Tag: ${acceptingTeam.tag}` : "Clan Tag: TBD"}
                        </div>
                      </div>

                      <div className="team-record">
                        Record:{" "}
                        <span className="record-line">
                          <span className="win-number">{acceptingTeam?.wins || 0}</span>
                          <span className="record-dash">-</span>
                          <span className="loss-number">{acceptingTeam?.losses || 0}</span>
                        </span>
                        <br />
                        Team Rank: <span className="orange">{teamRanks[acceptingTeam?.id || ""] ? `#${teamRanks[acceptingTeam?.id || ""]}` : "Unranked"}</span>
                      </div>
                    </div>

                    {acceptingTeam?.id ? (
                      <a className="team-logo-link" href={`/teams/${acceptingTeam.id}`}>
                        <div className="team-logo">
                          {acceptingTeam?.logo_url ? (
                            <img src={acceptingTeam.logo_url} alt="Accepting Team Logo" />
                          ) : (
                            acceptingTeam?.tag || "GB"
                          )}
                        </div>
                      </a>
                    ) : (
                      <div className="team-logo">
                        {acceptingTeam?.logo_url ? (
                          <img src={acceptingTeam.logo_url} alt="Accepting Team Logo" />
                        ) : (
                          acceptingTeam?.tag || "GB"
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </section>

              <section className="match-info">
                <div className="participants-grid">
                  {[match.posting_team_id, match.accepting_team_id].map((teamId, index) => {
                    const sideParticipants = participants.filter((participant) => participant.team_id === teamId);

                    return (
                      <div className="participants-team" key={teamId || index}>
                        <div className="roster-title"><span>Match Roster</span></div>
                        {sideParticipants.length ? sideParticipants.map((participant) => (
                          <div className="roster-player" key={participant.id}>
                            <span className="roster-avatar">
                              {participant.username_at_match.slice(0, 2).toUpperCase()}
                            </span>
                            <span className="roster-name">
                              {participant.username_at_match}
                              <small>{participant.account_id_at_match}</small>
                            </span>
                          </div>
                        )) : (
                          <div className="participant-line">No participant history is available for this match.</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="match-info">
                <div className="section-title dark-title">Match Details</div>

                <div className="detail-layout">
                  <div className="detail-rows">
                    {detailRows.map((row) => (
                      <div className="detail-row" key={row.label}>
                        <span className="detail-label">{row.label}:</span>
                        {"status" in row && row.status ? (
                          <span className={`status-pill ${statusClass(displayStatus)}`}>
                            {prettyStatus(displayStatus)}
                          </span>
                        ) : (
                          <span className="detail-value">{row.value}</span>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="detail-actions">
                    <button className="blue-btn" type="button" onClick={() => setRulesOpen(true)}>
                      Match Rules
                    </button>
                    <Link
                      className="blue-btn"
                      href={`/support/dispute-ticket?matchId=${encodeURIComponent(match.id)}`}
                    >
                      Submit a ticket for this match
                    </Link>
                  </div>
                </div>

                {matchSettings.length > 0 && (
                  <button
                    className="toggle-settings"
                    type="button"
                    onClick={() => setSettingsOpen((open) => !open)}
                  >
                    {settingsOpen ? "Hide All Settings" : "Show All Settings"}
                  </button>
                )}

                {settingsOpen && matchSettings.length > 0 && (
                  <div className="modal-body">
                    {matchSettings.map((setting) => (
                      <div className="setting-line" key={setting.label}>
                        {setting.label}: <span>{setting.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="score-section">
                <div className="section-title">Report Score</div>

                <div className="score-row">
                  <span className="score-team">
                    {postingTeam?.name || "Posting Team"}:
                  </span>
                  <input
                    className="score-input"
                    type="text"
                    value={postingScore}
                    onChange={(e) => setPostingScore(e.target.value)}
                    disabled={!canSubmitScore}
                  />

                  <span className="score-team">
                    {acceptingTeam?.name || "Accepting Team"}:
                  </span>
                  <input
                    className="score-input"
                    type="text"
                    value={acceptingScore}
                    onChange={(e) => setAcceptingScore(e.target.value)}
                    disabled={!canSubmitScore}
                  />

                  <button
                    className="submit-btn"
                    type="button"
                    disabled={!canSubmitScore || actionLoading}
                    onClick={handleSubmitScore}
                  >
                    Submit
                  </button>

                  {canConfirmScore && (
                    <>
                      <button
                        className="confirm-btn"
                        type="button"
                        disabled={actionLoading}
                        onClick={handleConfirmScore}
                      >
                        Confirm Result
                      </button>

                      <button
                        className="dispute-btn"
                        type="button"
                        disabled={actionLoading}
                        onClick={handleDisputeScore}
                      >
                        Dispute Result
                      </button>
                    </>
                  )}

                  {!canReportScore && (
                    <div className="score-note">
                      Score reporting unlocks after the scheduled match time.
                    </div>
                  )}

                  {canReportScore && !viewerCanManageMatch && (
                    <div className="score-note">
                      Team leaders, co-leaders, and captains can report the match.
                    </div>
                  )}

                  {reportingStatus === "awaiting_confirmation" && !canConfirmScore && (
                    <div className="score-note">
                      Score has been submitted and is awaiting confirmation from {confirmationTeamName}.
                    </div>
                  )}

                  {reportingStatus === "disputed" && (
                    <div className="score-note">
                      Match is disputed. Both teams have 2 hours from match time to submit a
                      ticket with their story and proof. Staff only see the case once both teams
                      submit, or once the 2 hours have ended.
                      {userIsMatchTeam && (
                        <>
                          {" "}
                          <Link
                            className="dispute-ticket-link"
                            href={`/support/dispute-ticket?matchId=${encodeURIComponent(
                              match.id
                            )}`}
                          >
                            Submit your team&apos;s dispute ticket
                          </Link>
                        </>
                      )}
                    </div>
                  )}

                  {actionMessage && <div className="action-message">{actionMessage}</div>}
                </div>

                <div className="dispute-row">
                  <div className="score-note">
                    Disputes are available only after a score has been submitted for confirmation.
                  </div>
                </div>
              </section>

              <section className="comments">
                <div className="section-title">Match Comments</div>

                <div className="comment-body">
                  <div className="comment-box">
                    {commentsUnlocked ? (
                      <>
                        {comments.length > 0 ? (
                          comments.map((item) => (
                            <div className="comment" key={item.id}>
                              <span className="comment-time">
                                {item.created_at ? new Date(item.created_at).toLocaleString() : "After Match"}
                              </span>
                              <strong>{item.username || "Player"}</strong> {item.comment}
                            </div>
                          ))
                        ) : (
                          <div className="comment">
                            <span className="comment-time">After Match</span>
                            <strong>GameBattles</strong> No comments yet.
                          </div>
                        )}

                        <div className="comment-form">
                          <input
                            className="comment-input"
                            type="text"
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            placeholder={userAlreadyCommented ? "You already posted your one match comment" : "Leave your one match comment..."}
                            disabled={commentLoading || userAlreadyCommented}
                          />
                          <button
                            className="post-btn"
                            type="button"
                            disabled={commentLoading || userAlreadyCommented || !commentText.trim()}
                            onClick={handlePostComment}
                          >
                            Post
                          </button>
                        </div>

                        {commentMessage && <div className="action-message">{commentMessage}</div>}
                      </>
                    ) : (
                      <>
                        <div className="comment-locked">
                          Match comments unlock after the match is complete.
                        </div>

                        <div className="comment-form">
                          <input
                            className="comment-input"
                            type="text"
                            placeholder="Comments locked until match completion"
                            disabled
                          />
                          <button className="post-btn" type="button" disabled>
                            Post
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </section>
            </>
          )}
        </div>
      </main>

      {rulesOpen && match && (
        <div className="modal-backdrop" onClick={() => setRulesOpen(false)}>
          <div className="rules-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-title">
              <span>
                {prettyText(match.game)} Â· {ladderName(match.ladder)} Rules
              </span>
              <button className="modal-close" type="button" onClick={() => setRulesOpen(false)}>
                X
              </button>
            </div>
            <div className="rules-body">
              <p className="rules-intro">
                Rules for this match: {prettyText(match.game)}
                {match.game_mode ? ` Â· ${prettyText(match.game_mode)}` : ""} on {prettyText(match.platform)}.
              </p>
              {ladderRules.map((section) => (
                <div className="rules-section" key={section.title}>
                  <h3>{section.title}</h3>
                  <ul>
                    {section.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
              {allSettings.length > 0 && (
                <div className="rules-section">
                  <h3>Required Match Settings</h3>
                  <p className="rules-note">Both teams must play with exactly these settings.</p>
                  <div className="rules-settings">
                    {[{ label: "Gameplay", value: match.preset }, ...allSettings]
                      .filter((setting) => !!setting.value?.trim())
                      .map((setting) => (
                        <div className="setting-line" key={setting.label}>
                          {setting.label}: <span>{setting.value}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
              <div className="rules-section">
                <p className="rules-note">
                  General conduct, cheating and account rules also apply. See the{" "}
                  <Link href="/rules">full site rules</Link>.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
