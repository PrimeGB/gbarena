"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { useUser } from "../../../lib/useUser";

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

function getMaps(gameMode: string | null | undefined) {
  const mode = String(gameMode || "").toLowerCase();

  if (mode.includes("search")) return ["Bog", "Pipeline", "Vacant", "Crash", "Backlot"];
  if (mode.includes("hardpoint")) return ["Hackney Yard", "Gun Runner", "Ramazza", "Cave", "Shoothouse"];
  if (mode.includes("control")) return ["Raid", "Express", "Checkmate", "Garrison", "Moscow"];
  if (mode.includes("domination")) return ["Strike", "Vacant", "Crash", "Crossfire", "Backlot"];
  if (mode.includes("deathmatch")) return ["Shipment", "Shoot House", "Rust", "Vacant", "Crash"];

  return ["Bog", "Pipeline", "Vacant", "Crash", "Backlot"];
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
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [mapsOpen, setMapsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [postingScore, setPostingScore] = useState("");
  const [acceptingScore, setAcceptingScore] = useState("");
  const [userTeamId, setUserTeamId] = useState("");
  const [canManageMatch, setCanManageMatch] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [comments, setComments] = useState<MatchCommentRow[]>([]);
  const [commentText, setCommentText] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentMessage, setCommentMessage] = useState("");

  useEffect(() => {
    async function loadMatch() {
      setLoading(true);
      setPageError("");
      setUserTeamId("");
      setCanManageMatch(false);

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
        setPageError("Match not found.");
        setLoading(false);
        return;
      }

      const officialMatch = matchData as MatchRow;
      setMatch(officialMatch);

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
    return `${prettyText(match.game)} - ${ladderName(match.ladder)}`;
  }, [match]);

  const bestOfNumber = getBestOfNumber(match?.best_of);
  const maps = getMaps(match?.game_mode).slice(0, bestOfNumber);
  const matchTimePassed = matchTimeHasPassed(match?.match_time);
  const rawStatus = String(match?.status || "upcoming").toLowerCase();
  const displayStatus =
    rawStatus === "upcoming" && matchTimePassed ? "playing" : rawStatus;
  const canReportScore = matchTimePassed || rawStatus === "playing" || rawStatus === "completed";
  const isDisputed = rawStatus === "disputed";
  const isCompleted = rawStatus === "completed";
  const showMapsDropdown = bestOfNumber > 3;
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
    canManageMatch &&
    userIsMatchTeam &&
    !scoreAlreadyReported &&
    !isFinalized &&
    !isDisputed &&
    !isCompleted;
  const canConfirmScore =
    canManageMatch &&
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

  async function updateTeamRecord(teamId: string, didWin: boolean) {
    const { data: teamData } = await supabase
      .from("teams")
      .select("*")
      .eq("id", teamId)
      .maybeSingle();

    if (!teamData) return;

    const currentWins = Number(teamData.wins || 0);
    const currentLosses = Number(teamData.losses || 0);
    const currentXp = Number(teamData.xp || 0);
    const currentRating = Number(teamData.rating_points || 0);

    const updateData: any = {
      wins: didWin ? currentWins + 1 : currentWins,
      losses: didWin ? currentLosses : currentLosses + 1,
      streak: didWin ? Number(teamData.streak || 0) + 1 : -1,
      xp: didWin ? currentXp + 25 : currentXp + 5,
    };

    if ("rating_points" in teamData) {
      updateData.rating_points = didWin
        ? currentRating + 25
        : Math.max(0, currentRating - 10);
    }

    await supabase.from("teams").update(updateData).eq("id", teamId);
  }

  async function updatePlayerRecords(userIds: string[], didWin: boolean) {
    for (const userId of userIds) {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (!profileData) continue;

      const updateData: any = {};

      if ("wins" in profileData) updateData.wins = Number(profileData.wins || 0) + (didWin ? 1 : 0);
      if ("losses" in profileData) updateData.losses = Number(profileData.losses || 0) + (didWin ? 0 : 1);
      if ("xp" in profileData) updateData.xp = Number(profileData.xp || 0) + (didWin ? 25 : 5);
      if ("rank_points" in profileData) updateData.rank_points = Number(profileData.rank_points || 0) + (didWin ? 25 : -10);
      if ("rating_points" in profileData) updateData.rating_points = Math.max(0, Number(profileData.rating_points || 0) + (didWin ? 25 : -10));
      if ("streak" in profileData) updateData.streak = didWin ? "W1" : "L1";

      if (Object.keys(updateData).length > 0) {
        await supabase.from("profiles").update(updateData).eq("id", userId);
      }
    }
  }

  async function finalizeMatchResultAutomatically(updatedMatch: MatchRow) {
    const winningTeamId = updatedMatch.reported_winner_team_id || updatedMatch.winning_team_id;
    const losingTeamId = updatedMatch.reported_loser_team_id || updatedMatch.losing_team_id;

    if (!winningTeamId || !losingTeamId) {
      return "Winner and loser could not be found.";
    }

    const winningUsers = await getTeamMemberUserIds(winningTeamId);
    const losingUsers = await getTeamMemberUserIds(losingTeamId);

    await updateTeamRecord(winningTeamId, true);
    await updateTeamRecord(losingTeamId, false);
    await updatePlayerRecords(winningUsers, true);
    await updatePlayerRecords(losingUsers, false);

    const { error } = await supabase
      .from("matches")
      .update({
        winning_team_id: winningTeamId,
        losing_team_id: losingTeamId,
        status: "completed",
        reporting_status: "completed",
        score_confirmed_at: new Date().toISOString(),
        score_verified: true,
        score_verified_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        finalized: true,
        finalized_at: new Date().toISOString(),
        finalized_by: currentUser?.id || null,
        rankings_applied: true,
        result_processed: true,
        ranking_change_applied_at: new Date().toISOString(),
        winning_user_ids: winningUsers,
        losing_user_ids: losingUsers,
      })
      .eq("id", updatedMatch.id);

    if (error) return error.message;
    return "";
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

        .maps-inline{
          color:#fff;
          font-size:13px;
          font-weight:900;
          line-height:20px;
          display:inline-flex;
          flex-wrap:wrap;
          gap:16px;
          vertical-align:middle;
          max-width:calc(100% - 112px);
        }

        .map-item{
          white-space:nowrap;
        }

        .map-toggle{
          border:0;
          background:transparent;
          color:#fff;
          font-size:14px;
          font-weight:900;
          cursor:pointer;
          padding:0;
        }

        .map-arrow{
          color:#d66f16;
          margin-left:8px;
          font-size:11px;
        }

        .map-list{
          margin-left:108px;
          margin-top:4px;
          padding:7px 9px;
          border:1px solid #252525;
          background:#080808;
          color:#cfcfcf;
          line-height:23px;
          font-size:13px;
        }

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

        .settings-modal{
          width:620px;
          max-width:95vw;
          border:1px solid #383838;
          background:#0b0b0b;
          box-shadow:0 0 35px rgba(0,0,0,.9);
        }

        .modal-title{
          height:38px;
          background:linear-gradient(to bottom,#1c1c1c,#080808);
          border-bottom:1px solid #242424;
          display:flex;
          align-items:center;
          justify-content:space-between;
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

          .map-list{
            margin-left:0;
          }

          .maps-inline{
            max-width:100%;
            margin-top:5px;
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
                    <div className="team-logo">
                      {postingTeam?.logo_url ? (
                        <img src={postingTeam.logo_url} alt="Posting Team Logo" />
                      ) : (
                        postingTeam?.tag || "GB"
                      )}
                    </div>

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
                        GB Rank: <span className="orange">#--</span>
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
                        GB Rank: <span className="orange">#--</span>
                      </div>
                    </div>

                    <div className="team-logo">
                      {acceptingTeam?.logo_url ? (
                        <img src={acceptingTeam.logo_url} alt="Accepting Team Logo" />
                      ) : (
                        acceptingTeam?.tag || "GB"
                      )}
                    </div>
                  </div>
                </div>
              </section>

              <section className="match-info">
                <div className="section-title">Match Info</div>

                <div className="info-grid">
                  <div>
                    <div className="info-line">
                      <span className="info-label">Mode:</span>
                      <span className="info-value">{clean(match.game_mode)}</span>
                    </div>

                    <div className="info-line">
                      <span className="info-label">Players:</span>
                      <span className="info-value">{clean(match.players)}</span>
                    </div>

                    <div className="info-line">
                      <span className="info-label">Scheduled:</span>
                      <span className="info-value">{clean(match.match_time)}</span>
                    </div>

                    <div className="info-line">
                      <span className="info-label">Match ID:</span>
                      <span className="short-id">{staffMatchId(match.id)}</span>
                    </div>
                  </div>

                  <div>
                    <div className="info-line">
                      <span className="info-label">Maps:</span>

                      {showMapsDropdown ? (
                        <>
                          <button
                            className="map-toggle"
                            type="button"
                            onClick={() => setMapsOpen(!mapsOpen)}
                          >
                            Map 1 - {maps[0]}
                            <span className="map-arrow">{mapsOpen ? "▲" : "▼"}</span>
                          </button>

                          {mapsOpen && (
                            <div className="map-list">
                              {maps.map((mapName, index) => (
                                <div key={`${mapName}-${index}`}>
                                  Map {index + 1} - {mapName}
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="maps-inline">
                          {maps.map((mapName, index) => (
                            <span className="map-item" key={`${mapName}-${index}`}>
                              Map {index + 1} - {mapName}
                            </span>
                          ))}
                        </span>
                      )}
                    </div>

                    <div className="info-line">
                      <span className="info-label">Status:</span>
                      <span className={`status-pill ${statusClass(displayStatus)}`}>
                        {prettyStatus(displayStatus)}
                      </span>
                    </div>

                    <div className="info-line settings-line">
                      <span className="info-label">Settings:</span>
                      <button
                        className="details-btn"
                        type="button"
                        onClick={() => setSettingsOpen(true)}
                      >
                        Details
                      </button>
                    </div>
                  </div>
                </div>
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

                  {canReportScore && !canManageMatch && (
                    <div className="score-note">
                      Only team leader, co-leader, captain, or owner can report scores.
                    </div>
                  )}

                  {reportingStatus === "awaiting_confirmation" && !canConfirmScore && (
                    <div className="score-note">
                      Score has been submitted and is awaiting confirmation from {confirmationTeamName}.
                    </div>
                  )}

                  {reportingStatus === "completed" && (
                    <div className="score-note">
                      Result confirmed. Match is complete.
                    </div>
                  )}

                  {reportingStatus === "disputed" && (
                    <div className="score-note">
                      Match is disputed. Staff must resolve this result.
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

      {settingsOpen && match && (
        <div className="modal-backdrop">
          <div className="settings-modal">
            <div className="modal-title">
              Match Settings
              <button
                className="modal-close"
                type="button"
                onClick={() => setSettingsOpen(false)}
              >
                X
              </button>
            </div>

            <div className="modal-body">
              <div className="setting-line">Rules: <span>{clean(match.preset, "GB Variant")}</span></div>
              <div className="setting-line">Best Of: <span>{clean(match.best_of)}</span></div>
              <div className="setting-line">Perks: <span>{clean(match.perks)}</span></div>
              <div className="setting-line">Launchers: <span>{clean(match.launchers)}</span></div>
              <div className="setting-line">Killstreaks: <span>{clean(match.killstreaks)}</span></div>
              <div className="setting-line">Field Upgrades: <span>{clean(match.field_upgrades)}</span></div>
              <div className="setting-line">Hardcore: <span>{clean(match.hardcore)}</span></div>
              <div className="setting-line">Friendly Fire: <span>{clean(match.friendly_fire)}</span></div>
              <div className="setting-line">Radar: <span>{clean(match.radar)}</span></div>
              <div className="setting-line">Spectating: <span>{clean(match.spectating)}</span></div>
              <div className="setting-line">Third Person: <span>{clean(match.third_person)}</span></div>
              <div className="setting-line">Round Length: <span>{clean(match.round_length)}</span></div>
              <div className="setting-line">Score Limit: <span>{clean(match.score_limit)}</span></div>
              <div className="setting-line">Health: <span>{clean(match.health)}</span></div>
              <div className="setting-line">Respawn Delay: <span>{clean(match.respawn_delay)}</span></div>
              <div className="setting-line">Bomb Timer: <span>{clean(match.bomb_timer)}</span></div>
              <div className="setting-line">Plant Time: <span>{clean(match.plant_time)}</span></div>
              <div className="setting-line">Defuse Time: <span>{clean(match.defuse_time)}</span></div>
              <div className="setting-line">Attachments: <span>{clean(match.attachments)}</span></div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}