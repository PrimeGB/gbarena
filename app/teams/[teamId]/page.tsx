"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "../../../lib/useUser";
import { supabase } from "../../../lib/supabase";

type TeamRole = "leader" | "co-leader" | "captain" | "member";

type Player = {
  id: number;
  username: string;
  rank: string;
  record: string;
};

type TeamData = {
  id: string;
  name: string | null;
  tag: string | null;
  platform: string | null;
  category: string | null;
  game: string | null;
  ladder: string | null;
  owner_id: string | null;
  logo_url: string | null;
  avatar_url: string | null;
  wins: number | null;
  losses: number | null;
  streak: number | null;
  xp: number | null;
  rating_points: number | null;
};

type TeamMatch = {
  id: string;
  posting_team_id: string | null;
  accepting_team_id: string | null;
  game_mode: string | null;
  players: string | null;
  match_time: string | null;
  best_of: string | null;
  status: string | null;
  winning_team_id?: string | null;
  losing_team_id?: string | null;
  created_at: string | null;
};

type TeamNameMap = {
  [key: string]: string;
};

type RosterMember = {
  user_id: string;
  role: string | null;
  username: string;
  display_gt: string;
  gb_rank_points: number;
  gb_wins: number;
  gb_losses: number;
  gb_place: number | null;
  eligibility: "green" | "yellow" | "red";
};

function prettyText(value: string | null | undefined) {
  if (!value) return "";
  if (value === "mw2") return "Modern Warfare 2";
  if (value === "modern-warfare-4") return "Modern Warfare 4";
  if (value === "modern-warfare-iii") return "Modern Warfare III";
  if (value === "black-ops-6") return "Black Ops 6";

  return value
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function normalizeRole(value: string | null | undefined): TeamRole {
  const clean = String(value || "").toLowerCase();

  if (clean === "leader") return "leader";
  if (clean === "co-leader") return "co-leader";
  if (clean === "captain") return "captain";

  return "member";
}

function getMatchTimeMs(match: TeamMatch) {
  const rawTime = match.match_time || match.created_at;
  if (!rawTime) return 0;

  const parsed = new Date(rawTime).getTime();
  if (Number.isNaN(parsed)) return 0;

  return parsed;
}

function resultText(match: TeamMatch, teamId: string) {
  const status = String(match.status || "").toLowerCase();

  if (status === "completed") {
    if (match.winning_team_id && String(match.winning_team_id) === String(teamId)) return "W";
    if (match.losing_team_id && String(match.losing_team_id) === String(teamId)) return "L";
    return "W/L";
  }

  if (status === "disputed") return "Disputed";

  const matchTime = getMatchTimeMs(match);
  if (matchTime && Date.now() >= matchTime) return "Playing";

  return "Upcoming";
}

function resultClass(match: TeamMatch, teamId: string) {
  const result = resultText(match, teamId);

  if (result === "W") return "result-win";
  if (result === "L") return "result-loss";
  if (result === "Disputed") return "result-dispute";
  if (result === "Playing") return "result-playing";

  return "result-upcoming";
}

function shortDate(value: string | null) {
  if (!value) return "TBD";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function ordinal(value: number | null | undefined) {
  const num = Number(value || 0);
  if (!num) return "Unranked";

  const lastTwo = num % 100;
  if (lastTwo >= 11 && lastTwo <= 13) return `${num}th`;

  const last = num % 10;
  if (last === 1) return `${num}st`;
  if (last === 2) return `${num}nd`;
  if (last === 3) return `${num}rd`;

  return `${num}th`;
}

function stableTeamNumber(teamId: string) {
  let hash = 0;

  for (let i = 0; i < teamId.length; i += 1) {
    hash = (hash * 31 + teamId.charCodeAt(i)) % 900000;
  }

  return String(hash + 100000);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function gameCover(game: string | null | undefined) {
  if (game === "mw2") {
    return "https://upload.wikimedia.org/wikipedia/en/5/52/Call_of_Duty_Modern_Warfare_2_%282009%29_cover.png";
  }

  if (game === "black-ops-6") {
    return "https://upload.wikimedia.org/wikipedia/en/5/51/Call_of_Duty_Black_Ops_6_cover_art.jpg";
  }

  if (game === "modern-warfare-iii") {
    return "https://upload.wikimedia.org/wikipedia/en/7/7e/Call_of_Duty_Modern_Warfare_III_cover_art.jpg";
  }

  if (game === "modern-warfare-4") {
    return "/mw4.jpeg";
  }

  return "/mw4.jpeg";
}

function profileGamertag(profile: any, platform: string | null | undefined) {
  const cleanPlatform = String(platform || "").toLowerCase();
  const username = profile?.username || "Player";

  const fallbackGt =
    String(username).toLowerCase() === "prime" ? "Prime#3139" : username;

  if (cleanPlatform === "xbox") {
    return (
      profile?.xbox_gamertag ||
      profile?.xbox_gt ||
      profile?.xbox ||
      profile?.gamertag ||
      profile?.gt ||
      profile?.user_gt ||
      profile?.platform_gt ||
      profile?.display_gt ||
      fallbackGt
    );
  }

  if (cleanPlatform === "playstation") {
    return (
      profile?.playstation_gamertag ||
      profile?.psn ||
      profile?.psn_id ||
      profile?.gamertag ||
      profile?.gt ||
      profile?.user_gt ||
      profile?.platform_gt ||
      profile?.display_gt ||
      fallbackGt
    );
  }

  if (cleanPlatform === "nintendo") {
    return (
      profile?.nintendo_gamertag ||
      profile?.nintendo_id ||
      profile?.switch_code ||
      profile?.friend_code ||
      profile?.gamertag ||
      profile?.gt ||
      profile?.user_gt ||
      profile?.platform_gt ||
      profile?.display_gt ||
      fallbackGt
    );
  }

  if (cleanPlatform === "pc") {
    return (
      profile?.pc_gamertag ||
      profile?.steam ||
      profile?.steam_id ||
      profile?.battle_net ||
      profile?.battlenet ||
      profile?.gamertag ||
      profile?.gt ||
      profile?.user_gt ||
      profile?.platform_gt ||
      profile?.display_gt ||
      fallbackGt
    );
  }

  return profile?.gamertag || profile?.gt || profile?.display_gt || fallbackGt;
}

function eligibilityStatus(member: any): "green" | "yellow" | "red" {
  const status = String(member?.status || member?.invite_status || "").toLowerCase();

  if (member?.can_play === false || status === "ineligible" || status === "banned" || status === "suspended") {
    return "red";
  }

  if (member?.accepted === false || status === "pending" || status === "invited" || status === "waiting") {
    return "yellow";
  }

  return "green";
}

export default function TeamPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser() as any;
  const teamId = String(params?.teamId || "");

  const [team, setTeam] = useState<TeamData | null>(null);
  const [viewerRole, setViewerRole] = useState<TeamRole>("member");
  const [leaderName, setLeaderName] = useState("Loading...");
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [playerSearch, setPlayerSearch] = useState("");
  const [teamMatches, setTeamMatches] = useState<TeamMatch[]>([]);
  const [teamNames, setTeamNames] = useState<TeamNameMap>({});
  const [teamPlace, setTeamPlace] = useState<number | null>(null);
  const [rosterMembers, setRosterMembers] = useState<RosterMember[]>([]);

  const canEditTeamProfile = viewerRole === "leader";
  const canEditRoster = viewerRole === "leader" || viewerRole === "co-leader";
  const canCreateMatch = viewerRole === "leader" || viewerRole === "co-leader" || viewerRole === "captain";
  const isLeader = viewerRole === "leader";

  const teamName = team?.name || "Team Name";
  const teamTag = team?.tag || "TAG";
  const platformName = prettyText(team?.platform || "xbox");
  const gameName = prettyText(team?.game || "modern-warfare-4");
  const ladderName = prettyText(team?.ladder || "team") + " Ladder";
  const teamPublicId = stableTeamNumber(team?.id || teamId);

  const ladderUrl = `/ladders/${team?.platform || "xbox"}/${team?.category || "call-of-duty"}/${team?.game || "modern-warfare-4"}/${team?.ladder || "team"}/rankings`;
  const rulesUrl = `/ladders/${team?.platform || "xbox"}/${team?.category || "call-of-duty"}/${team?.game || "modern-warfare-4"}/${team?.ladder || "team"}/rules`;

  // FIXED: Removed the filter that was hiding "Upcoming" matches from the team page display
  const visibleMatches = teamMatches.slice(0, 20);

  const teamWins = Number(team?.wins || 0);
  const teamLosses = Number(team?.losses || 0);
  const teamStreak = Number(team?.streak || 0);
  const teamXp = Number(team?.xp ?? 100);
  const teamRatingPoints = Number(team?.rating_points ?? 100);
  const teamLevel = Math.max(1, Math.floor(teamRatingPoints / 100));
  const cleanTeamPlace = ordinal(teamPlace);

  const players: Player[] = [
    { id: 1, username: "Prime", rank: "Free Agent", record: "0-0" },
    { id: 2, username: "ShadowShot", rank: "Free Agent", record: "0-0" },
    { id: 3, username: "ClutchKing", rank: "Free Agent", record: "0-0" },
    { id: 4, username: "RetroSniper", rank: "Free Agent", record: "0-0" },
    { id: 5, username: "GBLegend", rank: "Free Agent", record: "0-0" },
  ];

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const filteredPlayers = useMemo(() => {
    const clean = playerSearch.trim().toLowerCase();
    if (!clean) return players;

    return players.filter((player) => player.username.toLowerCase().includes(clean));
  }, [playerSearch, players]);

  function getOpponentName(match: TeamMatch) {
    const opponentId =
      String(match.posting_team_id) === String(teamId)
        ? match.accepting_team_id
        : match.posting_team_id;

    if (!opponentId) return "Opponent TBD";

    return teamNames[opponentId] || "Opponent";
  }

  useEffect(() => {
    async function loadTeamPage() {
      if (!teamId) return;

      setLoading(true);

      const { data: teamData } = await supabase
        .from("teams")
        .select(
          "id, name, tag, platform, category, game, ladder, owner_id, logo_url, avatar_url, wins, losses, streak, xp, rating_points"
        )
        .eq("id", teamId)
        .single();

      if (teamData) {
        setTeam(teamData as TeamData);
      }

      const { data: rankedTeams } = await supabase
        .from("teams")
        .select("id, wins, losses, rating_points, created_at")
        .eq("platform", teamData?.platform || "xbox")
        .eq("category", teamData?.category || "call-of-duty")
        .eq("game", teamData?.game || "modern-warfare-4")
        .eq("ladder", teamData?.ladder || "team")
        .order("rating_points", { ascending: false })
        .order("wins", { ascending: false })
        .order("losses", { ascending: true })
        .order("created_at", { ascending: true });

      if (rankedTeams) {
        const placeIndex = rankedTeams.findIndex((rankedTeam: any) => String(rankedTeam.id) === String(teamId));
        setTeamPlace(placeIndex >= 0 ? placeIndex + 1 : null);
      }

      const { data: memberRows } = await supabase
        .from("team_members")
        .select("*")
        .eq("team_id", teamId);

      const memberUserIds = (memberRows || [])
        .map((member: any) => member.user_id)
        .filter(Boolean) as string[];

      let profileMap: Record<string, any> = {};
      let rankMap: Record<string, number> = {};

      if (memberUserIds.length > 0) {
        const { data: memberProfiles } = await supabase
          .from("profiles")
          .select("*")
          .in("id", memberUserIds);

        (memberProfiles || []).forEach((profile: any) => {
          profileMap[profile.id] = profile;
        });

        const { data: rankedProfiles } = await supabase
          .from("profiles")
          .select("id, gb_rank_points, gb_wins, gb_losses")
          .order("gb_rank_points", { ascending: false })
          .order("gb_wins", { ascending: false })
          .order("gb_losses", { ascending: true });

        (rankedProfiles || []).forEach((profile: any, index: number) => {
          rankMap[profile.id] = index + 1;
        });
      }

      const loadedRoster = (memberRows || []).map((member: any) => {
        const profile = profileMap[member.user_id] || {};
        const username = profile.username || "Player";
        const displayGt = profileGamertag(profile, teamData?.platform || "xbox");

        return {
          user_id: member.user_id,
          role: member.role || "member",
          username,
          display_gt: displayGt,
          gb_rank_points: Number(profile.gb_rank_points || 0),
          gb_wins: Number(profile.gb_wins || 0),
          gb_losses: Number(profile.gb_losses || 0),
          gb_place: rankMap[member.user_id] || null,
          eligibility: eligibilityStatus(member),
        } as RosterMember;
      });

      setRosterMembers(loadedRoster);

      const { data: matchesData, error: matchesError } = await supabase
        .from("matches")
        .select(
          "id, posting_team_id, accepting_team_id, game_mode, players, match_time, best_of, status, winning_team_id, losing_team_id, created_at"
        )
        .or(`posting_team_id.eq.${teamId},accepting_team_id.eq.${teamId}`)
        .order("created_at", { ascending: false })
        .limit(20);

      if (!matchesError) {
        const loadedMatches = (matchesData || []) as TeamMatch[];
        setTeamMatches(loadedMatches);

        const opponentIds = loadedMatches
          .map((match) =>
            String(match.posting_team_id) === String(teamId)
              ? match.accepting_team_id
              : match.posting_team_id
          )
          .filter(Boolean) as string[];

        if (opponentIds.length > 0) {
          const { data: opponentTeams } = await supabase
            .from("teams")
            .select("id, name")
            .in("id", opponentIds);

          const nameMap: TeamNameMap = {};

          (opponentTeams || []).forEach((opponent: any) => {
            nameMap[opponent.id] = opponent.name || "Opponent";
          });

          setTeamNames(nameMap);
        }
      }

      if ((user as any)?.id) {
        const { data: memberData } = await supabase
          .from("team_members")
          .select("role")
          .eq("team_id", teamId)
          .eq("user_id", user.id)
          .maybeSingle();

        if (memberData?.role) {
          setViewerRole(normalizeRole(memberData.role));
        }

        if (teamData?.owner_id && String(teamData.owner_id) === String(user.id)) {
          setViewerRole("leader");
        }
      }

      const leaderRoster = loadedRoster.find((member) => String(member.user_id) === String(teamData?.owner_id));
      setLeaderName(leaderRoster?.display_gt || leaderRoster?.username || "Leader");

      setLoading(false);
    }

    loadTeamPage();
  }, [teamId, user]);

  async function handleDisband() {
    if (!teamId) return;

    const confirmDelete = confirm("Are you sure you want to disband this team? This cannot be undone.");
    if (!confirmDelete) return;

    setDeleting(true);

    const { error: membersError } = await supabase.from("team_members").delete().eq("team_id", teamId);

    if (membersError) {
      alert("Could not remove team members: " + membersError.message);
      setDeleting(false);
      return;
    }

    const { error: teamError } = await supabase.from("teams").delete().eq("id", teamId);

    if (teamError) {
      alert("Could not disband team: " + teamError.message);
      setDeleting(false);
      return;
    }

    router.push("/profile/teams");
  }

  async function handleLeave() {
    if (!teamId || !user?.id) return;

    if (!confirm("Leave this team?")) return;

    const { error } = await supabase
      .from("team_members")
      .delete()
      .eq("team_id", teamId)
      .eq("user_id", user.id);

    if (error) {
      alert("Could not leave team: " + error.message);
      return;
    }

    router.push("/profile/teams");
  }

  return (
    <>
      <style>{`
        *{margin:0;padding:0;box-sizing:border-box;}
        body{background:#000;font-family:Tahoma,Verdana,Arial,sans-serif;color:#d7e2ee;}
        button{font-family:Tahoma,Verdana,Arial,sans-serif;}

        .page{min-height:100vh;background:linear-gradient(to bottom,#02060a,#000);padding:32px 22px;}
        .wrap{max-width:1080px;margin:0 auto;background:#07111b;border:1px solid #315f88;}

        .header{
          min-height:104px;background:linear-gradient(to bottom,#173956,#07111b);
          border-bottom:2px solid #315f88;display:flex;align-items:center;
          justify-content:space-between;padding:0 24px;
        }

        .game-header{display:flex;align-items:center;gap:18px;}
        .game-cover{
          width:126px;height:78px;border:1px solid #315f88;background:#050c14;
          overflow:hidden;display:flex;align-items:center;justify-content:center;
        }

        .game-cover img{
          width:100%;
          height:100%;
          object-fit:cover;
          object-position:center center;
          display:block;
        }

        .game-name{
          color:#f2c14e;font-size:15px;font-weight:900;letter-spacing:1.3px;
          text-transform:uppercase;margin-bottom:8px;text-shadow:0 1px 2px #000;
        }

        .ladder-name{
          color:#fff;font-size:30px;font-weight:900;text-transform:uppercase;text-shadow:0 2px 4px #000;
        }

        .avatar-row{height:66px;background:#050b12;border-bottom:1px solid #244b70;position:relative;}

        .team-avatar{
          position:absolute;left:24px;top:8px;width:74px;height:74px;border:1px solid #315f88;
          border-radius:4px;background:#000;display:flex;align-items:center;justify-content:center;color:#8aa7c0;
          font-size:20px;font-weight:900;text-transform:uppercase;z-index:5;
          overflow:hidden;
        }

        .team-avatar img{width:100%;height:100%;object-fit:cover;display:block;}

        .nav{
          height:36px;background:linear-gradient(to bottom,#10283d,#07111b);
          border-bottom:1px solid #244b70;display:flex;align-items:center;
          justify-content:center;gap:28px;
        }

        .nav a{
          color:#d7eaff;font-size:12px;font-weight:bold;text-transform:uppercase;text-decoration:none;
        }

        .nav a:hover{color:#d7ad4a;}

        .content{
          padding:8px 18px 18px 18px;display:grid;grid-template-columns:1fr 185px;gap:14px;
        }

        .main{display:flex;flex-direction:column;gap:12px;}
        .panel{border:1px solid #244b70;background:#050b12;}

        .team-head{
          display:grid;grid-template-columns:340px 1fr;gap:12px;
          padding:2px 12px 12px 12px;align-items:stretch;
        }

        .team-logo-box{
          width:340px;min-height:280px;height:280px;margin-left:-6px;border:1px solid #315f88;
          background:#000;display:flex;align-items:center;justify-content:center;color:#8aa7c0;
          font-size:13px;font-weight:bold;text-transform:uppercase;
        }

        .team-logo-box img{ width:100%; height:100%; object-fit:contain; display:block; }

        .team-info{
          min-height:280px;border:1px solid #244b70;background:#0a1724;
          padding:28px 20px 20px 20px;display:flex;flex-direction:column;justify-content:flex-start;
        }

        .team-title-block{
          min-height:90px;
          transform:translateY(-12px);
        }

        .team-name{
          color:#fff;font-size:40px;font-weight:900;text-transform:uppercase;margin-bottom:6px;
          line-height:1;text-shadow:0 2px 4px #000;
        }

        .team-tag{
          color:#d7ad4a;font-size:11px;font-weight:900;text-transform:uppercase;margin-bottom:2px;
          line-height:1.05;letter-spacing:.3px;
        }

        .team-public-id{
          color:#9ed7ff;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.35px;
          margin-top:4px;
        }

        .team-line{color:#cfe2f2;font-size:12px;line-height:23px;}
        .founder-name{color:#d7ad4a;font-weight:bold;}

        .team-match-actions{
          margin-top:16px;display:grid;grid-template-columns:1fr 1fr;gap:12px;
        }

        .team-action-btn{
          height:44px;border:1px solid #4b95d8;background:linear-gradient(to bottom,#1c4b72,#0a1724);
          color:#fff;font-size:12px;font-weight:900;text-transform:uppercase;cursor:pointer;
          text-decoration:none;display:flex;align-items:center;justify-content:center;
        }

        .team-action-btn.secondary{border-color:#4b95d8;background:linear-gradient(to bottom,#1c4b72,#0a1724);color:#fff;}
        .team-action-btn.locked{opacity:.45;cursor:not-allowed;}

        .panel-title{
          height:32px;background:linear-gradient(to bottom,#18344f,#091521);
          border-bottom:1px solid #244b70;display:flex;align-items:center;justify-content:center;
          color:#d7ad4a;font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:1px;
        }

        .stats-table,.roster-table{width:100%;border-collapse:collapse;font-size:12px;}
        .stats-table th,.roster-table th{
          background:#050c14;color:#fff;padding:9px 8px;border-bottom:1px solid #244b70;
          text-align:center;font-size:11px;text-transform:uppercase;
        }

        .stats-table td,.roster-table td{
          color:#cfe2f2;padding:10px 8px;border-bottom:1px solid rgba(255,255,255,.06);text-align:center;
        }

        .stats-table{table-layout:fixed;}
        .stats-table th:first-child,.stats-table td:first-child{width:15%;text-align:left;padding-left:12px;}
        .stats-table th:nth-child(2),.stats-table td:nth-child(2){width:9%;text-align:left;padding-left:0;}
        .stats-table th:nth-child(3),.stats-table td:nth-child(3){width:10%;text-align:center;}

        .xp-head{color:#fff;}
        .xp-cell{color:#fff;font-weight:bold;}
        .level-cell{color:#fff;font-weight:900;text-align:center;}
        .level-pill{
          display:inline-block;min-width:auto;height:auto;line-height:normal;text-align:center;
          background:transparent;border:0;color:#fff;font-weight:900;
        }

        .mini-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
        .empty-text{color:#cfe2f2;font-size:13px;text-align:center;padding:36px 10px;}

        .match-list-wrap{
          max-height:150px;
          overflow-y:auto;
          overflow-x:hidden;
          background:#02070c;
          padding:5px 6px;
          scrollbar-gutter:stable;
        }

        .match-list-row{
          min-height:29px;
          display:grid;
          grid-template-columns:1fr 1fr 1fr 1fr;
          align-items:center;
          width:100%;
          border-bottom:1