"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { useUser } from "../../../lib/useUser";
import { getGameRules } from "../../../lib/matchRules";
import { gamingCategoryLabel, gamingGameLabel } from "../../../lib/gamingAccounts";
import { rankedLadderTeams } from "../../../lib/ladderStandings";
import { matchReportingOpensAt } from "../../../lib/matchTiming";
import { AdditionalMatchRules, postedRuleSettings } from "../../../lib/postedMatchRules";

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
  additional_rules?: AdditionalMatchRules | null;
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
  host_team_ids?: string[] | null;
  map_names?: string[] | null;
};

type TeamRow = {
  id: string;
  platform: string | null;
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
  hidden?: boolean;
};

type MatchParticipant = {
  id: string;
  user_id?: string;
  team_id: string;
  team_name_at_match: string;
  username_at_match: string;
  account_id_at_match: string;
  platform?: string | null;
};

type CancellationRequest = {
  requesting_team_id: string;
  status: "pending" | "accepted" | "denied";
};

function getMatchProofPath(proofUrl: string) {
  const marker = "/match-proofs/";
  const markerIndex = proofUrl.indexOf(marker);
  return markerIndex >= 0 ? proofUrl.slice(markerIndex + marker.length) : proofUrl;
}

function clean(value: string | null | undefined, fallback = "TBD") {
  if (!value) return fallback;
  return value;
}

function prettyText(value: string | null | undefined) {
  if (!value) return "Unknown";
  if (value === "mw2") return "Call of Duty: Modern Warfare 2 (2009)";
  if (value === "modern-warfare-ii") return "Call of Duty: Modern Warfare II (2022)";
  if (value === "modern-warfare-4") return "Call of Duty: Modern Warfare (2019)";
  if (value === "black-ops-6") return "Call of Duty: Black Ops 6";
  if (value === "modern-warfare-iii") return "Call of Duty: Modern Warfare III (2023)";
  if (value === "black-ops-cold-war") return "Call of Duty: Black Ops Cold War";

  return value
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function ladderName(value: string | null | undefined) {
  if (value === "singles") return "Solos Ladder";
  if (value === "duos") return "Duos Ladder";
  if (value === "rapid-royal-duos") return "Rapid Royal Duos Ladder";
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
  const requiredWins = bestOf === 7 ? 4 : bestOf === 5 ? 3 : bestOf === 1 ? 1 : 2;
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
  const [rulesOpen, setRulesOpen] = useState(false);
  const scoreDialogRef = useRef<HTMLDialogElement>(null);
  const [postingScore, setPostingScore] = useState("");
  const [acceptingScore, setAcceptingScore] = useState("");
  const [userTeamId, setUserTeamId] = useState("");
  const [viewerCanManageMatch, setCanManageMatch] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [cancellation, setCancellation] = useState<CancellationRequest | null>(null);
  const [cancellationError, setCancellationError] = useState("");
  const [cancellationBusy, setCancellationBusy] = useState(false);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeDetails, setDisputeDetails] = useState("");
  const [comments, setComments] = useState<MatchCommentRow[]>([]);
  const [participants, setParticipants] = useState<MatchParticipant[]>([]);
  const [commentText, setCommentText] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentMessage, setCommentMessage] = useState("");
  const [commentAccess, setCommentAccess] = useState<{ team_id: string | null; staff: boolean; has_comment: boolean } | null>(null);
  const [clock, setClock] = useState(() => Date.now());
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofError, setProofError] = useState("");
  const [h2h, setH2h] = useState<{ a_wins: number; b_wins: number; total: number } | null>(null);
  const [proofs, setProofs] = useState<{ id: string; proof_url: string; team_id: string }[]>([]);
  const [proofRefreshKey, setProofRefreshKey] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setClock(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!matchId || matchId === "preview") return;
    let active = true;
    async function refreshCancellation() {
      const [requestResult, matchResult] = await Promise.all([
        supabase.from("match_cancellation_requests").select("requesting_team_id,status").eq("match_id", matchId).maybeSingle(),
        supabase.from("matches").select("*").eq("id", matchId).maybeSingle(),
      ]);
      if (!active) return;
      if (requestResult.error || matchResult.error) {
        setCancellationError("Cancellation status could not be loaded: " + (requestResult.error?.message || matchResult.error?.message));
        return;
      }
      setCancellationError("");
      setCancellation(requestResult.data as CancellationRequest | null);
      if (matchResult.data) {
        setMatch((current) => current && current.id === matchId ? matchResult.data as MatchRow : current);
      }
    }
    void refreshCancellation();
    const timer = setInterval(refreshCancellation, 15000);
    return () => { active = false; clearInterval(timer); };
  }, [matchId]);

  useEffect(() => {
    if (!match?.posting_team_id || !match?.accepting_team_id || match.id === "preview") return;
    supabase
      .rpc("gb_head_to_head", { p_team_a: match.posting_team_id, p_team_b: match.accepting_team_id })
      .then(({ data }) => setH2h((data as any) || null));
    let cancelled = false;
    void supabase
      .from("match_proofs")
      .select("id,proof_url,team_id")
      .eq("match_id", match.id)
      .then(async ({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setProofError(`Match proof could not be loaded: ${error.message}`);
          return;
        }
        const rows = data || [];
        const signedProofs = await Promise.all(
          rows.map(async (proof) => {
            const { data: signed, error: signingError } = await supabase.storage
              .from("match-proofs")
              .createSignedUrl(getMatchProofPath(proof.proof_url), 3600);
            if (signingError || !signed?.signedUrl) {
              return { error: signingError?.message || "No signed URL was returned" };
            }
            return { proof: { ...proof, proof_url: signed.signedUrl } };
          })
        );
        if (cancelled) return;
        const failed = signedProofs.find((result) => "error" in result);
        if (failed && "error" in failed) {
          setProofError(`Match proof link could not be created: ${failed.error}`);
          return;
        }
        setProofError("");
        const successfulProofs: { id: string; proof_url: string; team_id: string }[] = [];
        for (const result of signedProofs) {
          if ("proof" in result && result.proof) successfulProofs.push(result.proof);
        }
        setProofs(successfulProofs);
      });
    return () => {
      cancelled = true;
    };
  }, [match?.id, match?.posting_team_id, match?.accepting_team_id, match?.status, proofRefreshKey]);
  useEffect(() => {
    async function loadMatch() {
      setLoading(true);
      setPageError("");
      setUserTeamId("");
      setCanManageMatch(false);

      if (process.env.NODE_ENV === "development" && matchId === "preview") {
        const previewStart = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        const awaiting = new URLSearchParams(window.location.search).get("state") === "awaiting";
        setMatch({
          id: "preview",
          posting_team_id: "t1",
          accepting_team_id: "t2",
          platform: "xbox",
          game: "black-ops-6",
          game_mode: "search-and-destroy",
          ladder: "teams",
          players: "4v4",
          match_time: previewStart,
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
          status: awaiting ? "awaiting_confirmation" : "upcoming",
          reporting_status: awaiting ? "awaiting_confirmation" : "none",
          confirmation_team_id: awaiting ? "t2" : null,
          posting_team_score: awaiting ? 2 : null,
          accepting_team_score: awaiting ? 1 : null,
          accepted_at: new Date().toISOString(),
          host_team_ids: ["t1", "t2", "t1"],
          map_names: ["Hacienda", "Protocol", "Red Card"],
        });
        setPostingTeam({ id: "t1", platform: "xbox", name: "Nova Elite", tag: "NOVA", logo_url: null, avatar_url: null, wins: 57, losses: 12, streak: "8W", xp: 5180 });
        setAcceptingTeam({ id: "t2", platform: "xbox", name: "Ghost Ops", tag: "GHST", logo_url: null, avatar_url: null, wins: 54, losses: 15, streak: "5W", xp: 5035 });
        setParticipants(
          ["Viper", "Hex", "Rook", "Blaze"].map((u, i) => ({ id: `a${i}`, team_id: "t1", team_name_at_match: "Nova Elite", username_at_match: u, account_id_at_match: `${u}#10${i}` }))
            .concat(["Ghost", "Raven", "Echo", "Drift"].map((u, i) => ({ id: `b${i}`, team_id: "t2", team_name_at_match: "Ghost Ops", username_at_match: u, account_id_at_match: `${u}#20${i}` })))
        );
        setTeamRanks({ t1: 2, t2: 3 });
        setUserTeamId(awaiting ? "t2" : "t1");
        setCanManageMatch(true);
        setLoading(false);
        return;
      }
      const { data: matchData, error: matchError } = await supabase
        .from("matches")
        .select("*")
        .eq("id", matchId)
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
        .select("id,user_id,team_id,team_name_at_match,username_at_match,account_id_at_match,platform")
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
          .select("id,platform,name,tag,logo_url,avatar_url,wins,losses,streak,xp,rating_points,owner_id")
          .in("id", teamIds);

        if (teamsError) {
          setPageError(teamsError.message);
          setLoading(false);
          return;
        }

        teams = (teamsData || []) as TeamRow[];

        if (teams.some((team) => !team.platform)) {
          setPageError("A match team's system is missing; ladder rankings could not be loaded.");
          setLoading(false);
          return;
        }
        const teamPlatforms = [...new Set(teams.map((team) => team.platform).filter((platform): platform is string => !!platform))];
        let rankingsBySystem;
        try {
          rankingsBySystem = await Promise.all(teamPlatforms.map((platform) =>
            rankedLadderTeams(officialMatch.category || "", officialMatch.game || "", officialMatch.ladder || "", platform)
          ));
        } catch (reason) {
          setPageError(reason instanceof Error ? reason.message : "Could not load ladder rankings.");
          setLoading(false);
          return;
        }

        const ranks: Record<string, number> = {};
        rankingsBySystem.forEach((rankedTeams) => rankedTeams.forEach((row, index) => {
          ranks[row.id] = index + 1;
        }));
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
    if (matchId && !(process.env.NODE_ENV === "development" && matchId === "preview")) loadComments();
  }, [matchId, currentUser?.id]);

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
  const allSettings = match
    ? [
        { label: "Cross Play", value: match.crossplay, featured: true },
        ...postedRuleSettings(match).map((setting, index) => ({
          ...setting,
          featured: modeDef
            ? index < 3
            : ["Score Limit", "Round Length", ...(isBombMode ? ["Bomb Timer"] : [])].includes(setting.label),
        })),
      ].filter((setting) => !!setting.value?.trim() && setting.value !== "TBD")
    : [];
  const featuredSettings = allSettings.filter((setting) => "featured" in setting);
  const detailRows = match
    ? [
        { label: "Match ID", value: staffMatchId(match.id) },
        { label: "Date & Time", value: formatMatchTime(match.match_time) },
        { label: "Game", value: gameTitle },
        { label: "Platform", value: prettyText(match.platform) },
        { label: "Match Type", value: ladderName(match.ladder) },
        { label: isSolo ? "Format" : "Players", value: match.players?.trim() || "" },
        { label: "Games (Best of...)", value: String(bestOfNumber) },
        { label: "Game Mode", value: match.game_mode ? prettyText(match.game_mode) : "" },
        { label: "Gameplay", value: match.preset?.trim() || "" },
        ...featuredSettings.map((setting) => ({ label: setting.label, value: setting.value || "" })),
      ].filter((row) => row.value)
    : [];
  const requiredWins = bestOfNumber === 7 ? 4 : bestOfNumber === 5 ? 3 : bestOfNumber === 1 ? 1 : 2;
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
            "Every player must use the account and system shown in the roster.",
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
            ...(match.host_team_ids?.length ? ["The higher-ranked team hosts first; teams alternate hosts. Ties and matches between two unranked teams start with the posting team. Rankings are compared within each team's own system ladder at acceptance."] : []),
            ...(match.map_names?.length ? ["Play the assigned maps in the order shown on the match page."] : []),
            isBombMode
              ? "Round-based bomb mode: a game is won by reaching the score limit. Plant, defuse and bomb timers must match the settings below."
              : "A game ends when the score limit or time limit in the settings below is reached.",
            ...(modeDef ? modeDef.rules : []),
            "Teams must be ready to play at the scheduled time. If the opponent has not shown up 15 minutes after the scheduled time, they forfeit and the present team can report the win.",
          ],
        },
        {
          title: "Reporting Results",
          items: [
            "Starting at the scheduled match time, a team leader, co-leader or captain can report the series score.",
            "The opposing team confirms the score, or disputes it. If a result is disputed because of a no-show, choose \"No-show\" as the reason.",
            "Both teams have 2 hours from match time to submit a ticket with an explanation and proof. Staff only see the case once both teams have submitted, or once the 2 hours have ended.",
          ],
        },
      ]
    : [];
  const matchTimePassed = matchTimeHasPassed(match?.match_time);
  const rawStatus = String(match?.status || "upcoming").toLowerCase();
  const displayStatus =
    rawStatus === "upcoming" && matchTimePassed ? "playing" : rawStatus;
  const reportOpensAt = matchReportingOpensAt(match?.match_time);
  const canReportScore = reportOpensAt !== null && clock >= reportOpensAt;
  const isDisputed = rawStatus === "disputed";
  const isCompleted = rawStatus === "completed";
  const isCancelled = rawStatus === "cancelled";
  const reportingStatus = String(match?.reporting_status || "none").toLowerCase();
  const isFinalized = !!match?.finalized;
  const scoreAlreadyReported = reportingStatus !== "none" && reportingStatus !== "";
  const userIsPostingTeam = userTeamId && userTeamId === match?.posting_team_id;
  const userIsAcceptingTeam = userTeamId && userTeamId === match?.accepting_team_id;
  const userIsMatchTeam = !!userIsPostingTeam || !!userIsAcceptingTeam;
  const disputeTicketHref = match
    ? `/support/dispute-ticket?matchId=${encodeURIComponent(match.id)}${
        process.env.NODE_ENV === "development" && match.id === "preview" ? `&team=${encodeURIComponent(userTeamId)}` : ""
      }`
    : "";
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
    !isCancelled &&
    !isCompleted;
  const canConfirmScore =
    viewerCanManageMatch &&
    userMustConfirm &&
    !isFinalized &&
    !isCancelled &&
    reportingStatus === "awaiting_confirmation";
  const canDisputeScore = canConfirmScore && canReportScore;
  const confirmationTeamName =
    match?.confirmation_team_id === postingTeam?.id
      ? postingTeam?.name || "Posting Team"
      : match?.confirmation_team_id === acceptingTeam?.id
      ? acceptingTeam?.name || "Accepting Team"
      : "Opponent";
  const userAlreadyCommented = !!commentAccess?.has_comment && !commentAccess.staff;

  async function reloadMatch() {
    if (!matchId) return;

    const { data } = await supabase
      .from("matches")
      .select("*")
      .eq("id", matchId)
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

  async function handleCancellation(action: "request" | "accept" | "deny") {
    if (!match || !userTeamId || cancellationBusy) return;
    if (process.env.NODE_ENV === "development" && match.id === "preview") {
      setCancellation({ requesting_team_id: "t1", status: action === "request" ? "pending" : action === "accept" ? "accepted" : "denied" });
      if (action === "accept") setMatch({ ...match, status: "cancelled" });
      return;
    }
    setCancellationBusy(true);
    setCancellationError("");
    const { error } = await supabase.rpc("gb_manage_match_cancellation", {
      p_match_id: match.id, p_team_id: userTeamId, p_action: action,
    });
    if (error) {
      setCancellationError(error.message);
    } else {
      const { data, error: loadError } = await supabase.from("match_cancellation_requests")
        .select("requesting_team_id,status").eq("match_id", match.id).maybeSingle();
      if (loadError) setCancellationError("Cancellation status could not be loaded: " + loadError.message);
      else setCancellation(data as CancellationRequest | null);
      if (action === "accept") await reloadMatch();
    }
    setCancellationBusy(false);
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

    if (!currentUser?.id) {
      setCommentAccess(null);
      return;
    }
    const { data: access, error: accessError } = await supabase.rpc("get_match_comment_access", {
      match_uuid: matchId,
    });
    if (accessError) {
      setCommentAccess(null);
      setCommentMessage("Comment permissions could not be checked: " + accessError.message);
      return;
    }
    setCommentAccess(access as { team_id: string | null; staff: boolean; has_comment: boolean });
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
    if (!match || commentLoading) return;

    const text = commentText.trim();
    if (!text) return;

    if (!currentUser?.id || !commentAccess || (!commentAccess.staff && !commentAccess.team_id)) {
      setCommentMessage("Only players from this match can post a comment.");
      return;
    }

    const alreadyPosted = userAlreadyCommented;
    if (alreadyPosted) {
      setCommentMessage("You already posted your one match comment.");
      return;
    }

    setCommentLoading(true);
    setCommentMessage("");

    const { data, error } = await supabase.rpc("post_match_comment", {
      match_uuid: match.id,
      poster_user_uuid: currentUser.id,
      poster_team_uuid: commentAccess.team_id,
      body_text: text,
    });

    setCommentLoading(false);

    if (error) {
      setCommentMessage("Comment could not be posted: " + error.message);
      return;
    }

    const result = data as { ok?: boolean; message?: string } | null;
    if (result && result.ok === false) {
      setCommentMessage(result.message || "Comment could not be posted.");
      await loadComments();
      return;
    }

    setCommentText("");
    setCommentMessage("Comment posted.");
    await loadComments();
  }

  async function moderateComment(commentId: string, action: "hide" | "unhide" | "remove") {
    setCommentLoading(true);
    const { data, error } = await supabase.rpc("moderate_match_comment", {
      comment_uuid: commentId,
      moderation_action: action,
    });
    setCommentLoading(false);
    if (error || data?.ok !== true) {
      setCommentMessage("Comment moderation failed: " + (error?.message || data?.message || "Unknown error"));
      return;
    }
    setCommentMessage(action === "remove" ? "Comment removed." : `Comment ${action === "hide" ? "hidden" : "restored"}.`);
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

    if (process.env.NODE_ENV === "development" && match.id === "preview") {
      setActionMessage("This is a sample preview; no score was submitted.");
      return;
    }

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

    const confirmText =
      "Submit this score for confirmation? The opposing team must confirm it before the match is completed.";

    if (!window.confirm(confirmText)) return;

    setActionLoading(true);

    const { data, error } = await supabase.rpc("report_match_score", {
      match_uuid: match.id,
      reporting_team_uuid: verifiedUserTeamId,
      posting_score: postScore,
      accepting_score: acceptScore,
    });

    setActionLoading(false);

    const result = data as { ok?: boolean; message?: string } | null;
    if (error || result?.ok !== true) {
      setActionMessage(result?.message || "Score could not be submitted. It may have already been reported.");
      return;
    }

    setActionMessage("Score submitted. Awaiting opponent confirmation.");

    if (proofFile) {
      const ext = (proofFile.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "");
      const path = `${match.id}/${currentUser?.id}/${match.id}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("match-proofs").upload(path, proofFile);
      if (uploadError) {
        setActionMessage("Score submitted, but the proof image could not be uploaded.");
      } else {
        const { error: proofInsertError } = await supabase.from("match_proofs").insert([
          { match_id: match.id, team_id: verifiedUserTeamId, user_id: currentUser?.id, proof_url: path, proof_note: "Score report proof" },
        ]);
        if (proofInsertError) {
          setActionMessage(`Score submitted, but its proof could not be saved: ${proofInsertError.message}`);
        } else {
          setProofRefreshKey((key) => key + 1);
        }
      }
      setProofFile(null);
    }

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

    const result = data as { ok?: boolean; message?: string } | null;
    if (result && result.ok === false) {
      setActionMessage(result.message || "Result could not be confirmed.");
      return;
    }

    setActionMessage(result?.message || "Result confirmed.");
    await reloadMatch();
    await loadComments();
  }

  async function handleDisputeScore() {
    if (!match || !canDisputeScore || actionLoading) return;

    const reason =
      disputeReason === "No-show"
        ? "No-show / forfeit (15 minute rule)." + (disputeDetails.trim() ? ` ${disputeDetails.trim()}` : "")
        : disputeReason
        ? `${disputeReason}${disputeDetails.trim() ? `: ${disputeDetails.trim()}` : ""}`
        : "";
    if (!reason) {
      setActionMessage("Choose a dispute reason.");
      return;
    }

    if (process.env.NODE_ENV === "development" && match.id === "preview") {
      setMatch({ ...match, status: "disputed", reporting_status: "disputed" });
      setDisputeOpen(false);
      setActionMessage("Sample dispute opened. Submit a ticket with your proof.");
      return;
    }

    setActionLoading(true);
    setActionMessage("");

    const { data, error } = await supabase.rpc("dispute_match_score", {
      match_uuid: match.id,
      dispute_reason_text: reason.trim(),
    });

    setActionLoading(false);

    const result = data as { ok?: boolean; message?: string } | null;
    if (error || result?.ok !== true) {
      setActionMessage(result?.message || "Dispute could not be created.");
      return;
    }

    setDisputeOpen(false);
    setActionMessage("Dispute opened. Submit your ticket and proof for staff review.");
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
          grid-template-columns:minmax(0,1fr) 82px;
          gap:10px;
          margin-top:12px;
        }

        .comment-input{
          min-width:0;
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

        .match-shell{border-color:#244b70;background:#08121c;}
        .top-bar,.section-title,.dark-title{background:linear-gradient(to bottom,#18344f,#091521);border-color:#244b70;color:#f2c14e;}
        .top-title{color:#f2c14e;}
        .top-right{color:#9db5c9;}
        .team-grid{grid-template-columns:minmax(0,1fr) 44px minmax(0,1fr);background:#091521;border-color:#244b70;}
        .team-card{min-height:120px;padding:14px;background:#0b1a28;min-width:0;}
        .vs-box{min-height:120px;border-color:#244b70;background:#0a1724;color:#f2c14e;font-size:16px;}
        .team-main{gap:12px;min-width:0;}
        .team-logo{width:68px;height:68px;border-color:#315f88;background:#07111b;color:#f2c14e;font-size:18px;}
        .team-logo-link:hover .team-logo{border-color:#e4bd5c;box-shadow:none;}
        .team-copy{min-height:68px;min-width:0;justify-content:center;}
        .team-name-block,.team-record{transform:none;}
        .team-name{font-size:17px;color:#f2c14e;overflow-wrap:anywhere;}
        .team-tag{color:#9bb4c9;font-size:10px;margin-top:3px;}
        .team-record{margin-top:7px;color:#b8cbdc;font-size:12px;line-height:18px;}
        .orange{color:#f2c14e;}
        .match-info{border-color:#244b70;background:#0a1724;}
        .participants-grid{gap:10px;padding:10px 12px;border-color:#244b70;background:#0a1724;}
        .participants-team{min-width:0;border-color:#244b70;background:#081521;padding:10px;}
        .roster-title{color:#a9c5db;font-size:12px;font-weight:bold;margin-bottom:8px;}
        .roster-title::after{background:#244b70;}
        .roster-player{gap:8px;margin-bottom:6px;}
        .roster-player:last-child{margin-bottom:0;}
        .roster-avatar{width:30px;height:30px;background:#193952;color:#d7eaff;font-size:10px;}
        .roster-name{min-width:0;font-size:12px;overflow-wrap:anywhere;}
        .roster-name small{color:#9cb4c8;overflow-wrap:anywhere;}
        .match-status-bar{padding:8px 12px;background:#102b40;border-bottom:1px solid #244b70;color:#c7dceb;text-align:center;font-size:12px;font-weight:bold;}
        .match-status-bar .status-pill{margin-left:6px;}
        .detail-layout{grid-template-columns:minmax(0,1fr) 220px;gap:16px;padding:12px;align-items:start;}
        .detail-row{grid-template-columns:125px minmax(0,1fr);gap:10px;min-height:25px;font-size:12px;}
        .detail-label{color:#a9c0d3;}
        .detail-value{color:#edf6ff;overflow-wrap:anywhere;}
        .detail-actions{gap:8px;}
        .blue-btn{padding:10px;border:1px solid #397ab0;background:linear-gradient(to bottom,#1c527e,#10304a);font-size:12px;cursor:pointer;}
        .blue-btn:hover{background:#215d8a;}
        .match-preview-notice{padding:8px 12px;background:#e4bd5c;color:#101820;font-size:12px;font-weight:bold;text-align:center;}

        @media (max-width:700px){
          .detail-layout{grid-template-columns:1fr;gap:10px;}
          .detail-actions{grid-template-columns:1fr 1fr;}
          .detail-row{grid-template-columns:105px minmax(0,1fr);}
        }
        @media (max-width:420px){
          .detail-actions{grid-template-columns:1fr;}
          .participants-grid{gap:6px;padding:8px;}
          .participants-team{padding:8px;}
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
          .page{padding:12px 10px 24px;}
          .top-bar{height:auto;min-height:42px;gap:8px;padding:8px 10px;}
          .top-title{min-width:0;overflow-wrap:anywhere;}
          .top-right{flex-shrink:0;font-size:10px;}
          .team-grid{grid-template-columns:minmax(0,1fr) 28px minmax(0,1fr);}
          .team-card{min-height:0;padding:10px 7px;}
          .vs-box{min-height:0;font-size:12px;}
          .team-main,.right-card .team-main{flex-direction:column;justify-content:center;text-align:center;gap:6px;}
          .right-card .team-main{flex-direction:column-reverse;}
          .team-logo{width:48px;height:48px;font-size:13px;}
          .team-copy{min-height:0;}
          .team-name{font-size:13px;}
          .team-record{font-size:11px;margin-top:4px;}

          .info-grid{
            grid-template-columns:1fr;
          }

          .score-row,.dispute-row{
            align-items:flex-start;
            flex-direction:column;
          }

        }

        .page{padding:18px 14px 28px;}
        .match-shell{max-width:1120px;}
        .top-bar{min-height:38px;height:auto;padding:8px 14px;}
        .team-card,.vs-box{min-height:88px;}
        .team-card{padding:10px 14px;}
        .team-logo{width:54px;height:54px;font-size:15px;}
        .team-copy{min-height:54px;}
        .team-record{margin-top:4px;line-height:16px;}
        .participants-grid{padding:8px 12px;gap:8px;}
        .participants-team{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px 10px;padding:8px 10px;}
        .roster-title{grid-column:1 / -1;margin:0;}
        .roster-player{min-width:0;margin:0;}
        .participant-line{grid-column:1 / -1;}
        .section-title{min-height:34px;height:auto;gap:8px;padding:7px 14px;}
        .details-heading{justify-content:space-between;}
        .match-status-bar{padding:0;background:none;border:0;text-align:right;white-space:nowrap;}
        .detail-layout{grid-template-columns:minmax(0,1fr) 205px;gap:12px;padding:10px 12px;}
        .detail-rows{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 16px;min-width:0;}
        .detail-row{grid-template-columns:105px minmax(0,1fr);align-items:start;gap:8px;padding:5px 0;min-height:0;line-height:1.35;}
        .detail-label{text-align:left;}
        .detail-actions{gap:7px;}
        .blue-btn{padding:9px 10px;}
        .detail-actions .score-note,.score-note{color:#a7bac9;font-weight:600;line-height:1.45;text-transform:none;}
        .match-map-details{padding:0 12px 10px;}
        .match-map-details .detail-row{grid-template-columns:95px minmax(0,1fr);}
        .score-section,.comments{background:#0a1724;border-color:#244b70;}
        .score-dialog{width:min(560px,calc(100% - 24px));max-height:85vh;margin:auto;padding:0;border:1px solid #39709b;background:#0a1724;color:#edf6ff;box-shadow:0 12px 40px rgba(0,0,0,.8);}
        .score-dialog::backdrop{background:rgba(0,0,0,.78);}
        .score-dialog .score-section{border:0;}
        .score-dialog-title{display:flex;justify-content:space-between;}
        .score-dialog-title .modal-close{flex-shrink:0;}
        .score-dialog .score-row{align-items:flex-end;}
        .score-field{display:flex;flex:1 1 140px;flex-direction:column;gap:6px;min-width:0;}
        .score-field .score-team{overflow-wrap:anywhere;}
        .score-field .score-input{width:100%;max-width:180px;}
        .score-dialog .score-note input,.score-dialog .score-note select{max-width:100%;}
        .score-row{padding:12px;gap:8px 10px;}
        .dispute-row{padding:0 12px 10px;}
        .comment-body{padding:10px 12px;}
        .comment-box{min-height:0;padding:10px;border-color:#244b70;background:#081521;}
        .comment-locked{padding:8px 0 0;text-align:left;text-transform:none;font-weight:400;}
        .comments{padding-bottom:2px;}
        @media(max-width:760px){
          .page{padding:10px 8px 20px;}
          .team-card{padding:8px 6px;}
          .team-logo{width:42px;height:42px;}
          .team-copy{min-height:0;}
          .participants-team{grid-template-columns:1fr;gap:6px;padding:8px;}
          .detail-layout{grid-template-columns:1fr;}
          .detail-actions{grid-template-columns:repeat(2,minmax(0,1fr));}
          .detail-actions .score-note{grid-column:1 / -1;}
          .detail-rows{gap:0 10px;}
          .detail-row{grid-template-columns:1fr;gap:2px;padding:5px 0;}
          .match-map-details .detail-row{grid-template-columns:1fr;}
          .score-row,.dispute-row{flex-direction:row;align-items:center;}
        }
        @media(max-width:420px){
          .top-right{display:none;}
          .team-grid{grid-template-columns:minmax(0,1fr) 26px minmax(0,1fr);}
          .participants-grid{gap:6px;padding:6px;}
          .detail-actions{grid-template-columns:1fr 1fr;}
          .blue-btn{font-size:11px;}
        }
      `}</style>

      <main className="page">
        <div className="match-shell">
          {process.env.NODE_ENV === "development" && matchId === "preview" && (
            <div className="match-preview-notice">Sample preview — this is not a real match.</div>
          )}
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
                      <Link className="team-logo-link" href={`/teams/${postingTeam.id}`}>
                        <div className="team-logo">
                          {postingTeam?.logo_url ? (
                            <img loading="lazy" decoding="async" src={postingTeam.logo_url} alt="Posting Team Logo" />
                          ) : (
                            postingTeam?.tag || "GB"
                          )}
                        </div>
                      </Link>
                    ) : (
                      <div className="team-logo">
                        {postingTeam?.logo_url ? (
                          <img loading="lazy" decoding="async" src={postingTeam.logo_url} alt="Posting Team Logo" />
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
                      <Link className="team-logo-link" href={`/teams/${acceptingTeam.id}`}>
                        <div className="team-logo">
                          {acceptingTeam?.logo_url ? (
                            <img loading="lazy" decoding="async" src={acceptingTeam.logo_url} alt="Accepting Team Logo" />
                          ) : (
                            acceptingTeam?.tag || "GB"
                          )}
                        </div>
                      </Link>
                    ) : (
                      <div className="team-logo">
                        {acceptingTeam?.logo_url ? (
                          <img loading="lazy" decoding="async" src={acceptingTeam.logo_url} alt="Accepting Team Logo" />
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
                              <small>{participant.account_id_at_match}{participant.platform ? ` · ${prettyText(participant.platform)}` : ""}</small>
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
                <div className="section-title dark-title details-heading">
                  <span>Match Details</span>
                  <span className="match-status-bar">
                    Status:
                    <span className={`status-pill ${statusClass(displayStatus)}`}>{prettyStatus(displayStatus)}</span>
                  </span>
                </div>

                <div className="detail-layout">
                  <div className="detail-rows">
                    {detailRows.map((row) => (
                      <div className="detail-row" key={row.label}>
                        <span className="detail-label">{row.label}:</span>
                        <span className="detail-value">{row.value}</span>
                      </div>
                    ))}
                  </div>

                  <div className="detail-actions">
                    <button className="blue-btn" type="button" onClick={() => setRulesOpen(true)}>
                      Match Rules
                    </button>
                    <button className="blue-btn" type="button" onClick={() => scoreDialogRef.current?.showModal()}>
                      Report Score
                    </button>
                    {isCancelled ? (
                      <div className="score-note">This match has been cancelled.</div>
                    ) : viewerCanManageMatch && userIsMatchTeam && !scoreAlreadyReported && !isFinalized && !isDisputed && !isCompleted && (
                      cancellation?.status === "pending" ? (
                        cancellation.requesting_team_id === userTeamId ? (
                          <div className="score-note">Cancellation requested. Waiting for the other team.</div>
                        ) : (
                          <>
                            <div className="score-note">The other team requested to cancel this match.</div>
                            <button className="blue-btn" type="button" disabled={cancellationBusy} onClick={() => void handleCancellation("accept")}>Accept Cancellation</button>
                            <button className="blue-btn" type="button" disabled={cancellationBusy} onClick={() => void handleCancellation("deny")}>Deny Cancellation</button>
                          </>
                        )
                      ) : (
                        <>
                          {cancellation?.status === "denied" && <div className="score-note">The last cancellation request was denied. The match remains scheduled.</div>}
                          <button className="blue-btn" type="button" disabled={cancellationBusy} onClick={() => void handleCancellation("request")}>Request Cancellation</button>
                        </>
                      )
                    )}
                    {cancellationError && <div className="score-note" role="alert">{cancellationError}</div>}
                    {reportingStatus === "awaiting_confirmation" && (
                      <div className="score-note">Score reported. {canConfirmScore ? "Open Report Score to confirm or dispute it." : `Awaiting confirmation from ${confirmationTeamName}.`}</div>
                    )}
                    {canReportScore && isDisputed && userIsMatchTeam ? (
                      <Link
                        className="blue-btn"
                        href={disputeTicketHref}
                      >
                        Submit Dispute Ticket
                      </Link>
                    ) : !isDisputed && (
                      <div className="score-note">
                        {!canReportScore
                          ? reportOpensAt === null
                            ? "A complete scheduled match date and time is required for reporting and tickets. Contact staff."
                            : "Reporting opens at match time. Dispute tickets are available after a score is disputed."
                          : "A dispute ticket can be submitted after a score is disputed."}
                      </div>
                    )}
                  </div>
                </div>

                <div className="detail-rows match-map-details">
                  <div className="detail-row">
                    <span className="detail-label">Maps:</span>
                    <span className="detail-value">
                      {match.map_names?.length
                        ? match.map_names.map((name, index) => `Game ${index + 1}: ${name}`).join(" · ")
                        : ["uno", "clash-of-clans", "clash-royale"].includes(match.category || "")
                          ? "No fixed map assignment is required for this game."
                          : "No automatic map pool is available for this game and mode yet; follow the match rules."}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Lobby organizers:</span>
                    <span className="detail-value">
                      {match.host_team_ids?.length
                        ? match.host_team_ids.map((teamId, index) =>
                            `Game ${index + 1}: ${teamId === postingTeam?.id ? postingTeam.name : teamId === acceptingTeam?.id ? acceptingTeam.name : "Unknown team"}`
                          ).join(" · ")
                        : "Not assigned for this older match."}
                    </span>
                  </div>
                </div>
              </section>

              <dialog className="score-dialog" ref={scoreDialogRef} aria-labelledby="score-dialog-title">
              <section className="score-section">
                <div className="section-title score-dialog-title">
                  <span id="score-dialog-title">Report Score</span>
                  <button className="modal-close" type="button" aria-label="Close score reporting" onClick={() => scoreDialogRef.current?.close()}>X</button>
                </div>

                <div className="score-row">
                  {process.env.NODE_ENV === "development" && matchId === "preview" && (
                    <div className="score-note">Sample preview only. Scores cannot be submitted for this match.</div>
                  )}
                  <label className="score-field">
                    <span className="score-team">
                      {postingTeam?.name || "Posting Team"}:
                    </span>
                    <input
                      className="score-input"
                      type="text"
                      value={scoreAlreadyReported ? String(match.posting_team_score ?? "") : postingScore}
                      onChange={(e) => setPostingScore(e.target.value)}
                      disabled={!canSubmitScore}
                    />
                  </label>

                  <label className="score-field">
                    <span className="score-team">
                      {acceptingTeam?.name || "Accepting Team"}:
                    </span>
                    <input
                      className="score-input"
                      type="text"
                      value={scoreAlreadyReported ? String(match.accepting_team_score ?? "") : acceptingScore}
                      onChange={(e) => setAcceptingScore(e.target.value)}
                      disabled={!canSubmitScore}
                    />
                  </label>

                  <button
                    className="submit-btn"
                    type="button"
                    disabled={!canSubmitScore || actionLoading}
                    onClick={handleSubmitScore}
                  >
                    Submit
                  </button>

                  {canSubmitScore && (
                    <label className="score-note" style={{ display: "block" }}>
                      Proof screenshot (optional):{" "}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                      />
                    </label>
                  )}

                  {proofError && <div className="score-note" role="alert">{proofError}</div>}
                  {proofs.length > 0 && (
                    <div className="score-note">
                      Proof:{" "}
                      {proofs.map((p, i) => (
                        <a key={p.id} href={p.proof_url} target="_blank" rel="noreferrer" style={{ marginRight: 8 }}>
                          Screenshot {i + 1}
                        </a>
                      ))}
                    </div>
                  )}

                  {h2h && h2h.total > 0 && (
                    <div className="score-note">
                      Head-to-head: {postingTeam?.name || "Team"} {h2h.a_wins} - {h2h.b_wins} {acceptingTeam?.name || "Team"} ({h2h.total} match{h2h.total === 1 ? "" : "es"})
                    </div>
                  )}

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
                        onClick={() => setDisputeOpen((open) => !open)}
                      >
                        Dispute Result
                      </button>
                      {disputeOpen && (
                        <div className="score-note">
                          <select
                            value={disputeReason}
                            onChange={(e) => setDisputeReason(e.target.value)}
                          >
                            <option value="">Select a reason...</option>
                            <option value="No-show">No-show</option>
                            <option value="Wrong score">Wrong score</option>
                            <option value="Cheating">Cheating</option>
                            <option value="Other">Other</option>
                          </select>{" "}
                          <input
                            type="text"
                            value={disputeDetails}
                            onChange={(e) => setDisputeDetails(e.target.value)}
                            placeholder="Optional details"
                          />{" "}
                          <div>Upload your screenshots or videos on the ticket form after opening the dispute.</div>
                          <button
                            className="dispute-btn"
                            type="button"
                            disabled={actionLoading || !disputeReason}
                            onClick={handleDisputeScore}
                          >
                            Submit Dispute
                          </button>
                        </div>
                      )}
                    </>
                  )}

                  {!canReportScore && !isCancelled && (
                    <div className="score-note">
                      {reportOpensAt === null
                        ? "A complete scheduled match date and time is required for reporting. Contact staff."
                        : "Reporting and disputes unlock at the scheduled match time."}
                    </div>
                  )}

                  {isCancelled && <div className="score-note">This match has been cancelled.</div>}

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
                      {userIsMatchTeam && canReportScore && (
                        <>
                          {" "}
                          <Link
                            className="dispute-ticket-link"
                            href={disputeTicketHref}
                          >
                            Submit Dispute Ticket
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
              </dialog>

              <section className="comments">
                <div className="section-title">Match Comments</div>

                <div className="comment-body">
                  <div className="comment-box">
                        {comments.length > 0 ? (
                          comments.map((item) => (
                            <div className="comment" key={item.id}>
                              <span className="comment-time">
                                {item.created_at ? new Date(item.created_at).toLocaleString() : "After Match"}
                              </span>
                              <strong>{item.username || "Player"}</strong> {item.comment}
                              {item.hidden && <span> (Hidden)</span>}
                              {commentAccess?.staff && (
                                <span>
                                  {" "}<button type="button" disabled={commentLoading} onClick={() => moderateComment(item.id, item.hidden ? "unhide" : "hide")}>
                                    {item.hidden ? "Restore" : "Hide"}
                                  </button>
                                  {" "}<button type="button" disabled={commentLoading} onClick={() => moderateComment(item.id, "remove")}>Remove</button>
                                </span>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="comment">
                            <span className="comment-time">Match</span>
                            <strong>GameBattles</strong> No comments yet.
                          </div>
                        )}

                        {currentUser && commentAccess && (commentAccess.staff || commentAccess.team_id) ? <div className="comment-form">
                          <input
                            className="comment-input"
                            type="text"
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            placeholder={userAlreadyCommented ? "You already posted your one match comment" : commentAccess.staff ? "Post a staff comment..." : "Leave your one match comment..."}
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
                        </div> : <div className="comment-locked">
                          {currentUser ? "Only match players and staff can post comments." : "Sign in to post if you are a match player or staff member."}
                        </div>}
                        {commentMessage && <div className="action-message">{commentMessage}</div>}
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
              {(allSettings.length > 0 || !!match.preset?.trim()) && (
                <div className="rules-section">
                  <h3>Required Match Settings</h3>
                  <p className="rules-note">Both teams must play with exactly these settings.</p>
                  <div className="rules-settings">
                    {[{ label: "Gameplay", value: match.preset }, ...allSettings]
                      .filter((setting) => !!setting.value?.trim())
                      .map((setting) => (
                        <div className="setting-line" key={`${setting.label}:${setting.value}`}>
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
