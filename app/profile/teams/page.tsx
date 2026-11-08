"use client";

import Link from "next/link";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { ladderPlatformLabel } from "../../../lib/ladderCatalog";

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
  wins?: number | null;
  losses?: number | null;
  rating_points?: number | null;
  place?: number | null;
};

function prettyText(value: string | null) {
  if (!value) return "Unknown";
  return value
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function isMissingTableError(error: any) {
  const msg = String(error?.message || "").toLowerCase();
  return error?.code === "42P01" || msg.includes("does not exist") || (msg.includes("relation") && msg.includes("does not exist"));
}

export default function ProfileTeamsPage() {
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [pendingInvites, setPendingInvites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTeams();
  }, []);

  async function loadTeams() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      setTeams([]);
      setPendingInvites([]);
      setLoading(false);
      return;
    }

    const { data: ownedTeams } = await supabase
      .from("teams")
      .select("id, name, tag, platform, category, game, ladder, created_at, logo_url, wins, losses, rating_points")
      .eq("owner_id", user.id);

    const { data: memberRows } = await supabase
      .from("team_members")
      .select("team_id, teams(id, name, tag, platform, category, game, ladder, created_at, logo_url, wins, losses, rating_points)")
      .eq("user_id", user.id);

    let invitedRows: any[] = [];

    try {
      const { data, error } = await supabase
        .from("team_invites")
        .select("id, team_id, status, teams(id, name, tag, platform, category, game, ladder, created_at, logo_url, wins, losses, rating_points)")
        .eq("user_id", user.id)
        .eq("status", "pending");

      if (error && !isMissingTableError(error)) {
        throw error;
      }

      invitedRows = data || [];
    } catch {
      invitedRows = [];
    }

    const memberTeams =
      memberRows?.map((row: any) => row.teams).filter(Boolean) || [];

    const pendingTeams =
      invitedRows?.map((row: any) => row.teams).filter(Boolean) || [];

    const combinedTeams = [...(ownedTeams || []), ...memberTeams];

    const uniqueTeams = Array.from(
      new Map(combinedTeams.map((team: TeamRow) => [team.id, team])).values()
    );

    const withPlaces = await Promise.all(
      uniqueTeams.map(async (team: TeamRow) => {
        if (!team.platform || !team.category || !team.game || !team.ladder) return team;
        const { data: ranked } = await supabase
          .from("teams")
          .select("id")
          .eq("platform", team.platform)
          .eq("category", team.category)
          .eq("game", team.game)
          .eq("ladder", team.ladder)
          .or("wins.gt.0,losses.gt.0")
          .order("rating_points", { ascending: false })
          .order("wins", { ascending: false })
          .order("losses", { ascending: true })
          .order("created_at", { ascending: true });
        const index = (ranked || []).findIndex((row: any) => String(row.id) === String(team.id));
        return { ...team, place: index >= 0 ? index + 1 : null };
      }),
    );

    setTeams(withPlaces);
    setPendingInvites(pendingTeams);
    setLoading(false);
  }

  async function handleInviteResponse(teamId: string, accepted: boolean) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) return;

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

    await loadTeams();
  }

  function renderTeamHead(team: TeamRow) {
    const label = (team.tag || team.name || "GB").slice(0, 2).toUpperCase();
    return (
      <>
        <div className="team-head">
          <div className="team-logo">
            {team.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img loading="lazy" decoding="async" src={team.logo_url} alt={team.name || "Team logo"} />
            ) : (
              label
            )}
          </div>
          <div>
            <div className="team-name">{team.name || "Unnamed Team"}</div>
            <div className="team-identifiers">
              <span className="team-tag">{team.tag || "TAG"}</span>
              <span className="system-chip">
                System: {ladderPlatformLabel(team.platform || "") || prettyText(team.platform)}
              </span>
            </div>
          </div>
        </div>
        <div className="team-chips">
          <span className="chip">{prettyText(team.game)}</span>
          <span className="chip">{prettyText(team.ladder)}</span>
        </div>
        <div className="team-stats">
          <div className="stat">
            <div className="stat-value">{team.place ? `#${team.place}` : "Unranked"}</div>
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
        body{margin:0;background:#000;font-family:Tahoma,Verdana,Arial,sans-serif;color:#d7e2ee;}
        a{text-decoration:none;}
        .wrapper{width:1040px;margin:0 auto;}
        .top-strip{height:22px;background:linear-gradient(to bottom,#c40000,#6a0000);border-bottom:1px solid #140000;display:flex;justify-content:flex-end;align-items:center;padding:0 12px;}
        .top-strip a{color:#fff;font-size:10px;font-weight:bold;margin-left:12px;}
        .header{height:86px;background:#0a1622;border-left:1px solid #3b7fc2;border-right:1px solid #3b7fc2;border-bottom:2px solid #4f93d6;display:flex;align-items:center;padding:0 14px;}
        .logo-main{font-size:28px;font-weight:bold;color:#eaf5ff;}
        .logo-sub{color:#f2c14e;font-size:10px;text-transform:uppercase;margin-top:4px;}
        .title-bar{margin-top:8px;height:34px;background:linear-gradient(to bottom,#1f4c73,#0b2438);border:1px solid #3b7fc2;display:flex;align-items:center;padding-left:10px;color:#f2c14e;font-size:15px;font-weight:bold;text-transform:uppercase;}
        .tabs{height:28px;background:#07111b;border-left:1px solid #3b7fc2;border-right:1px solid #3b7fc2;border-bottom:1px solid #3b7fc2;display:flex;align-items:flex-end;padding-left:8px;}
        .tab{height:22px;padding:5px 12px 0;background:#0f2a40;border:1px solid #3b7fc2;border-bottom:none;color:#d7eaff;font-size:10px;margin-right:4px;}
        .tab.active{background:#173b59;color:#fff;font-weight:bold;}
        .box{background:#07111b;border:1px solid #3b7fc2;margin-top:8px;}
        .box-title{height:23px;background:linear-gradient(to bottom,#1f4c73,#0b2438);border-bottom:1px solid #3b7fc2;color:#f2c14e;font-weight:bold;font-size:10px;text-transform:uppercase;display:flex;align-items:center;padding-left:8px;}
        .box-body{padding:18px;}
        .loading,.empty-message{text-align:center;padding:30px;color:#d7eaff;font-size:13px;}
        .empty-message strong{display:block;color:#f2c14e;font-size:16px;margin-bottom:8px;}
        .team-list{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px;}
        .team-card{border:1px solid #244b70;background:linear-gradient(to bottom,#0b1b2b,#050c14);border-radius:12px;display:flex;flex-direction:column;gap:14px;padding:16px;transition:border-color .15s,transform .15s;}
        .team-card:hover{border-color:#f2c14e;transform:translateY(-2px);}
        .team-head{display:flex;align-items:center;gap:14px;}
        .team-logo{position:relative;width:64px;height:64px;flex:none;border-radius:12px;overflow:hidden;background:radial-gradient(circle at 30% 25%,#245f94,#0a1521 80%);border:2px solid #3b86c4;display:flex;align-items:center;justify-content:center;color:#f2c14e;font-weight:bold;font-size:18px;}
        .team-logo img{width:100%;height:100%;object-fit:cover;}
        .team-name{color:#fff;font-size:17px;font-weight:bold;text-transform:uppercase;line-height:1.2;overflow-wrap:anywhere;}
        .team-tag{display:inline-block;margin-top:4px;padding:1px 8px;border-radius:999px;background:rgba(242,193,78,.12);border:1px solid #f2c14e;color:#f2c14e;font-size:11px;font-weight:bold;}
        .team-identifiers{display:flex;flex-wrap:wrap;align-items:center;gap:6px;}
        .system-chip{display:inline-block;margin-top:4px;padding:3px 8px;border-radius:999px;background:#0a1d2b;border:1px solid #35546b;color:#a9bfd0;font-size:10px;font-weight:600;}
        .team-chips{display:flex;flex-wrap:wrap;gap:6px;}
        .chip{padding:4px 10px;border-radius:999px;background:#0f2a40;border:1px solid #244b70;color:#d7eaff;font-size:11px;}
        .team-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;}
        .stat{background:#050c14;border:1px solid #244b70;border-radius:8px;padding:8px 4px;text-align:center;}
        .stat-value{color:#f2c14e;font-size:16px;font-weight:bold;}
        .stat-value .w{color:#00ff88;}
        .stat-value .l{color:#ff7777;}
        .stat-label{color:#8aa7c0;font-size:10px;text-transform:uppercase;margin-top:2px;}
        .team-actions{display:flex;gap:8px;margin-top:auto;}
        .team-actions .view-btn{flex:1;}
        .view-btn{height:36px;border-radius:8px;background:linear-gradient(to bottom,#1d5d90,#0a1f33);border:1px solid #4daeff;color:#fff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:bold;text-transform:uppercase;cursor:pointer;}
        .view-btn:hover{border-color:#f2c14e;color:#f2c14e;}
        .reject-btn{background:linear-gradient(to bottom,#5b1f1f,#2a1010);border-color:#9e4b4b;}
        .pending-box{margin-top:18px;}
        @media (max-width:1060px){.wrapper{width:100%;}}
      `}</style>

      <div className="top-strip">
        <Link href="/home">Home</Link>
        <Link href="/profile">My Profile</Link>
      </div>

      <div className="wrapper">
        <header className="header">
          <Link href="/home">
            <div className="logo-main">GameBattles</div>
            <div className="logo-sub">Where Gaming Finds Its Edge</div>
          </Link>
        </header>

        <div className="title-bar">My Teams</div>

        <div className="tabs">
          <Link className="tab" href="/profile">Profile</Link>
          <Link className="tab active" href="/profile/teams">Teams</Link>
          <Link className="tab" href="/profile/matches">Matches</Link>
          <Link className="tab" href="/profile/friends">Friends</Link>
        </div>

        <div className="box">
          <div className="box-title">Teams</div>

          <div className="box-body">
            {loading ? (
              <div className="loading">Loading teams...</div>
            ) : teams.length === 0 ? (
              <div className="empty-message">
                <strong>Looks lonely in here.</strong>
                Create or join a team to get started.
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

            {pendingInvites.length > 0 && (
              <div className="box pending-box">
                <div className="box-title">Pending Team Invites</div>
                <div className="box-body">
                  <div className="team-list">
                    {pendingInvites.map((invite: any) => {
                      const team = invite;
                      if (!team) return null;

                      return (
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
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}