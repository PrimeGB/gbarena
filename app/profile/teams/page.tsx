"use client";

import Link from "next/link";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { ladderGameLabel, ladderPlatformLabel } from "../../../lib/ladderCatalog";
import { rankedLadderTeams } from "../../../lib/ladderStandings";
import { useUser } from "../../../lib/useUser";
import { rapidRoyalDisplayName } from "../../../lib/rapidRoyal";

type TeamRow = {
  id: string;
  name: string | null;
  tag: string | null;
  platform: string | null;
  category: string | null;
  game: string | null;
  ladder: string | null;
  created_at: string | null;
  logo_url?: string | null;
  avatar_url?: string | null;
  wins?: number | null;
  losses?: number | null;
  rating_points?: number | null;
  place?: number | null;
};

function prettyText(value: string | null) {
  if (!value) return "Unknown";
  value = rapidRoyalDisplayName(value);
  return value
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function isMissingTableError(error: { message?: string; code?: string }) {
  const msg = String(error?.message || "").toLowerCase();
  return error?.code === "42P01" || msg.includes("does not exist") || (msg.includes("relation") && msg.includes("does not exist"));
}

function ProfileTeamsContent() {
  const { user, loading: authLoading } = useUser();
  const searchParams = useSearchParams();
  const requestedUserId = searchParams.get("userId") || "";
  const viewedUserId = requestedUserId || user?.id || "";
  const isOwn = !!user?.id && user.id === viewedUserId;
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [pendingInvites, setPendingInvites] = useState<TeamRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [rankError, setRankError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState("");
  const requestId = useRef(0);

  const loadTeams = useCallback(async (targetUserId: string, viewerUserId: string | null) => {
    const currentRequest = ++requestId.current;
    setLoading(true);

    const viewingOwnTeams = targetUserId === viewerUserId;
    if (viewingOwnTeams) {
      const { data: { user: verifiedUser }, error: authError } = await supabase.auth.getUser();
      if (currentRequest !== requestId.current) return;
      if (!verifiedUser?.id || verifiedUser.id !== viewerUserId) {
        setPlayerName("");
        setRankError("");
        setLoadError(authError?.message || "Could not verify your account. Please sign in again.");
        setLoadedUserId(targetUserId);
        setLoading(false);
        return;
      }
    }
    setLoadError("");

    const { data: profile, error: profileError } = await supabase
      .from("profiles").select("username").eq("id", targetUserId).maybeSingle();

    const { data: ownedTeams, error: ownedError } = await supabase
      .from("teams")
      .select("id, name, tag, platform, category, game, ladder, created_at, logo_url, avatar_url, wins, losses, rating_points")
      .eq("owner_id", targetUserId)
      .returns<TeamRow[]>();

    const { data: memberRows, error: memberError } = await supabase
      .from("team_members")
      .select("team_id, teams(id, name, tag, platform, category, game, ladder, created_at, logo_url, avatar_url, wins, losses, rating_points)")
      .eq("user_id", targetUserId)
      .returns<{ teams: TeamRow | TeamRow[] | null }[]>();

    let pendingTeams: TeamRow[] = [];
    let inviteError: { message: string } | null = null;
    if (viewingOwnTeams) {
      const result = await supabase
        .from("team_invites")
        .select("id, team_id, status, teams(id, name, tag, platform, category, game, ladder, created_at, logo_url, avatar_url, wins, losses, rating_points)")
        .eq("user_id", targetUserId)
        .eq("status", "pending")
        .returns<{ teams: TeamRow | TeamRow[] | null }[]>();
      inviteError = result.error;
      pendingTeams = (result.data || []).flatMap((row) => row.teams ? (Array.isArray(row.teams) ? row.teams : [row.teams]) : []);
    }

    if (currentRequest !== requestId.current) return;
    const queryError = profileError || ownedError || memberError || inviteError;
    if (queryError || !profile) {
      setTeams([]);
      setPendingInvites([]);
      setPlayerName("");
      setRankError("");
      setLoadError(queryError ? "Could not load teams: " + queryError.message : "Player profile not found.");
      setLoadedUserId(targetUserId);
      setLoading(false);
      return;
    }

    const memberTeams =
      (memberRows || []).flatMap((row) => row.teams ? (Array.isArray(row.teams) ? row.teams : [row.teams]) : []);

    const combinedTeams = [...(ownedTeams || []), ...memberTeams];

    const uniqueTeams = Array.from(
      new Map(combinedTeams.map((team: TeamRow) => [team.id, team])).values()
    );

    if (currentRequest !== requestId.current) return;
    setRankError("");
    const withPlaces = await Promise.all(
      uniqueTeams.map(async (team: TeamRow) => {
        if (!team.platform || !team.category || !team.game || !team.ladder) return team;
        try {
          const ranked = await rankedLadderTeams(team.category, team.game, team.ladder, team.platform);
          const index = ranked.findIndex((row) => row.id === team.id);
          return { ...team, place: index >= 0 ? index + 1 : null };
        } catch (reason) {
          if (currentRequest === requestId.current) {
            setRankError(reason instanceof Error ? reason.message : "Could not load ladder rankings.");
          }
          return { ...team, place: null };
        }
      }),
    );

    if (currentRequest !== requestId.current) return;
    setTeams(withPlaces);
    setPendingInvites(pendingTeams);
    setPlayerName(profile.username || "Player");
    setLoadedUserId(targetUserId);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (authLoading || !viewedUserId) return;
    let active = true;
    const requests = requestId;
    queueMicrotask(() => {
      if (active) void loadTeams(viewedUserId, user?.id || null);
    });
    return () => {
      active = false;
      requests.current++;
    };
  }, [authLoading, loadTeams, user?.id, viewedUserId]);

  async function handleInviteResponse(teamId: string, accepted: boolean) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id || user.id !== viewedUserId) {
      alert("Could not verify your account. Please sign in again.");
      return;
    }

    if (accepted) {
      const { data: existingMember } = await supabase
        .from("team_members")
        .select("id")
        .eq("team_id", teamId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (!existingMember) {
        const { error: addError } = await supabase
          .from("team_members")
          .insert({
            team_id: teamId,
            user_id: user.id,
            role: "member",
          });

        if (addError) {
          alert(addError.message);
          return;
        }
      }
    }

    const { error } = await supabase
      .from("team_invites")
      .update({ status: accepted ? "accepted" : "declined" })
      .eq("team_id", teamId)
      .eq("user_id", user.id)
      .eq("status", "pending");

    if (error) {
      if (isMissingTableError(error)) {
        alert("Team invites are not set up yet. Run the SQL in sql/create_team_invites.sql in Supabase.");
        return;
      }
      alert(error.message);
      return;
    }

    await loadTeams(viewedUserId, user.id);
  }

  function renderTeamHead(team: TeamRow) {
    const label = (team.tag || team.name || "GB").slice(0, 2).toUpperCase();
    return (
      <>
        <div className="team-system" data-platform={team.platform || "unknown"}>
          <span>System</span>
          <strong>{ladderPlatformLabel(team.platform || "") || prettyText(team.platform)}</strong>
        </div>
        <div className="team-head">
          <div className="team-logo">
            {team.logo_url || team.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img loading="lazy" decoding="async" src={team.logo_url || team.avatar_url || ""} alt={team.name || "Team logo"} />
            ) : (
              label
            )}
          </div>
          <div>
            <div className="team-name">{team.name || "Unnamed Team"}</div>
            <div className="team-identifiers">
              <span className="team-tag">{team.tag || "TAG"}</span>
            </div>
          </div>
        </div>
        <div className="team-chips">
          <span className="chip">{ladderGameLabel(team.category || "", team.game || "") || prettyText(team.game)}</span>
          <span className="chip">{prettyText(team.ladder)}</span>
        </div>
        <div className="team-stats">
          <div className="stat">
            <div className="stat-value">{team.place ? `#${team.place}` : rankError ? "Unavailable" : "Unranked"}</div>
            <div className="stat-label">Rank</div>
          </div>
          <div className="stat">
            <div className="stat-value">
              <b className="w">{team.wins ?? 0}</b>-<b className="l">{team.losses ?? 0}</b>
            </div>
            <div className="stat-label">Record</div>
          </div>
          <div className="stat">
            <div className="stat-value">{Number(team.rating_points ?? 0).toLocaleString()}</div>
            <div className="stat-label">Points</div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{`
        .teams-page{min-height:100vh;padding:32px 18px 64px;background:#050b12;color:#d7e2ee;font-family:Tahoma,Verdana,Arial,sans-serif;}
        .teams-page *{box-sizing:border-box;}
        .wrapper{max-width:1120px;margin:0 auto;}
        .back-link{color:#91c9ef;font-size:13px;text-decoration:none;}
        .back-link:hover{text-decoration:underline;}
        .title-bar{padding:22px 0 18px;border-bottom:2px solid #9a1f27;}
        .title-bar h1{margin:0;color:#fff;font-size:30px;line-height:1.2;text-transform:uppercase;overflow-wrap:anywhere;}
        .title-bar p{margin:8px 0 0;color:#9fb3c5;font-size:13px;}
        .tabs{display:flex;gap:22px;flex-wrap:wrap;border-bottom:1px solid #253a4a;}
        .tab{padding:13px 0;color:#a8bed0;text-decoration:none;font-size:12px;font-weight:bold;text-transform:uppercase;}
        .tab.active{color:#fff;border-bottom:2px solid #cf3038;}
        .box{margin-top:24px;}
        .box-title{padding:0 0 12px;border-bottom:1px solid #35516a;color:#fff;font-size:14px;font-weight:bold;letter-spacing:.08em;text-transform:uppercase;}
        .loading,.empty-message{padding:28px 0;color:#adc2d2;font-size:14px;line-height:1.6;}
        .empty-message strong{display:block;color:#fff;font-size:16px;margin-bottom:5px;}
        .empty-message a{color:#91c9ef;}
        .team-list{display:flex;flex-direction:column;}
        .team-card{display:grid;grid-template-columns:minmax(210px,1.3fr) minmax(145px,1fr) minmax(240px,1.2fr) auto;grid-template-areas:"head details stats action" "head system stats action";align-items:center;gap:5px 20px;min-width:0;padding:18px 12px;border-bottom:1px solid #233849;background:#0b1722;}
        .team-card:nth-child(even){background:#09131d;}
        .team-head{grid-area:head;display:flex;align-items:center;gap:14px;min-width:0;}
        .team-logo{width:60px;height:60px;flex:none;overflow:hidden;background:#162d40;border:1px solid #3b6584;display:flex;align-items:center;justify-content:center;color:#d7eaff;font-weight:bold;font-size:18px;}
        .team-logo img{width:100%;height:100%;object-fit:cover;}
        .team-name{color:#fff;font-size:16px;font-weight:bold;line-height:1.25;overflow-wrap:anywhere;}
        .team-tag{display:inline-block;margin-top:5px;color:#8aa8bd;font-size:11px;font-weight:bold;letter-spacing:.05em;}
        .team-system{grid-area:system;display:flex;gap:7px;align-items:baseline;color:#adc6d8;font-size:12px;}
        .team-system span{color:#788fa1;font-size:10px;font-weight:bold;text-transform:uppercase;}
        .team-system strong{overflow-wrap:anywhere;}
        .team-chips{grid-area:details;display:flex;flex-wrap:wrap;gap:4px 9px;color:#dce9f2;font-size:12px;line-height:1.4;}
        .chip + .chip:before{content:"/";color:#71889a;margin-right:9px;}
        .team-stats{grid-area:stats;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;}
        .stat-value{color:#fff;font-size:16px;font-weight:bold;overflow-wrap:anywhere;}
        .stat-value .w{color:#79d6a0;}.stat-value .l{color:#e89595;}
        .stat-label{color:#829caf;font-size:10px;text-transform:uppercase;margin-top:4px;letter-spacing:.05em;}
        .team-actions{grid-area:action;display:flex;gap:8px;flex-wrap:wrap;}
        .view-btn{min-height:36px;padding:9px 14px;border:1px solid #547792;background:#142b3c;color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:bold;text-decoration:none;text-transform:uppercase;cursor:pointer;}
        .view-btn:hover,.view-btn:focus-visible{background:#21435b;border-color:#a4d8ff;}
        .reject-btn{border-color:#915253;background:#4a2225;}
        .pending-box{margin-top:32px;}
        @media(max-width:850px){.team-card{grid-template-columns:minmax(180px,1fr) minmax(160px,1fr) auto;grid-template-areas:"head details action" "head system action" "stats stats stats";row-gap:12px;}.team-stats{max-width:360px;}}
        @media(max-width:500px){.teams-page{padding:22px 12px 50px;}.title-bar h1{font-size:24px;}.team-card{grid-template-columns:minmax(0,1fr) auto;grid-template-areas:"head head" "details system" "stats stats" "action action";gap:12px;padding:16px 10px;}.team-logo{width:52px;height:52px;}.team-actions .view-btn{flex:1;}}
      `}</style>

      <main className="teams-page"><div className="wrapper">
        <Link className="back-link" href={requestedUserId ? `/profile?userId=${encodeURIComponent(requestedUserId)}` : "/profile"}>← Back to profile</Link>
        <div className="title-bar">
          <h1>{isOwn ? "My Teams" : loadedUserId === viewedUserId && playerName ? `${playerName}'s Teams` : "Player Teams"}</h1>
          <p>Teams, records and ladder standings.</p>
        </div>

        {isOwn && <div className="tabs">
          <Link className="tab" href="/profile">Profile</Link>
          <Link className="tab active" href="/profile/teams">Teams</Link>
          <Link className="tab" href="/profile/matches">Matches</Link>
          <Link className="tab" href="/profile/friends">Friends</Link>
        </div>}

        <div className="box">
          <div className="box-title">Teams</div>

          <div className="box-body">
            {loadedUserId === viewedUserId && rankError && <p role="alert">{rankError}</p>}
            {authLoading || (viewedUserId && (loading || loadedUserId !== viewedUserId)) ? (
              <div className="loading">Loading teams...</div>
            ) : !viewedUserId ? (
              <div className="empty-message">
                <Link href="/login?next=%2Fprofile%2Fteams">Sign in</Link> to view your teams and invitations.
              </div>
            ) : loadError ? (
              <div className="empty-message" role="alert">{loadError}</div>
            ) : teams.length === 0 ? (
              <div className="empty-message">
                <strong>{isOwn ? "Looks lonely in here." : "No teams yet."}</strong>
                {isOwn ? "Create or join a team to get started." : "This player has not joined a team yet."}
              </div>
            ) : (
              <div className="team-list">
                {teams.map((team) => (
                  <div className="team-card" key={team.id}>
                    {renderTeamHead(team)}
                    <div className="team-actions">
                      <Link className="view-btn" href={`/teams/${team.id}`}>
                        View Team
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {isOwn && !loading && loadedUserId === viewedUserId && pendingInvites.length > 0 && (
              <div className="box pending-box">
                <div className="box-title">Pending Team Invites</div>
                <div className="box-body">
                  <div className="team-list">
                    {pendingInvites.map((team) => (
                        <div className="team-card" key={`invite-${team.id}`}>
                          {renderTeamHead(team)}
                          <div className="team-actions">
                            <button className="view-btn" onClick={() => handleInviteResponse(team.id, true)}>
                              Accept
                            </button>
                            <button className="view-btn reject-btn" onClick={() => handleInviteResponse(team.id, false)}>
                              Decline
                            </button>
                          </div>
                        </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div></main>
    </>
  );
}

export default function ProfileTeamsPage() {
  return <Suspense fallback={<div>Loading teams...</div>}><ProfileTeamsContent /></Suspense>;
}