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
};

function prettyText(value: string | null) {
  if (!value) return "";
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
  const [inviteOpen, setInviteOpen] = useState(false);
  const [playerSearch, setPlayerSearch] = useState("");

  const canEditTeamProfile = viewerRole === "leader";
  const canEditRoster = viewerRole === "leader" || viewerRole === "co-leader";
  const canCreateMatch =
    viewerRole === "leader" ||
    viewerRole === "co-leader" ||
    viewerRole === "captain";

  const isLeader = viewerRole === "leader";

  const teamName = team?.name || "Team Name";
  const teamTag = team?.tag || "TAG";
  const platformName = prettyText(team?.platform || "xbox");
  const gameName = prettyText(team?.game || "modern-warfare-4");
  const ladderName = prettyText(team?.ladder || "team") + " Ladder";

  const ladderUrl = `/ladders/${team?.platform || "xbox"}/${team?.category || "call-of-duty"}/${team?.game || "modern-warfare-4"}/${team?.ladder || "team"}/rankings`;
  const rulesUrl = `/ladders/${team?.platform || "xbox"}/${team?.category || "call-of-duty"}/${team?.game || "modern-warfare-4"}/${team?.ladder || "team"}/rules`;

  const players: Player[] = [
    { id: 1, username: "Prime", rank: "Free Agent", record: "0-0" },
    { id: 2, username: "ShadowShot", rank: "Free Agent", record: "0-0" },
    { id: 3, username: "ClutchKing", rank: "Free Agent", record: "0-0" },
    { id: 4, username: "RetroSniper", rank: "Free Agent", record: "0-0" },
    { id: 5, username: "GBLegend", rank: "Free Agent", record: "0-0" },
  ];

  const filteredPlayers = useMemo(() => {
    const clean = playerSearch.trim().toLowerCase();

    if (!clean) return players;

    return players.filter((player) =>
      player.username.toLowerCase().includes(clean)
    );
  }, [playerSearch]);

  useEffect(() => {
    async function loadTeamPage() {
      if (!teamId) return;

      setLoading(true);

      const { data: teamData } = await supabase
        .from("teams")
        .select(
          "id, name, tag, platform, category, game, ladder, owner_id, logo_url, avatar_url"
        )
        .eq("id", teamId)
        .single();

      if (teamData) {
        setTeam(teamData as TeamData);
      }

      if ((user as any)?.id) { {
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

        const username =
          user.user_metadata?.username ||
          user.user_metadata?.display_name ||
          user.email?.split("@")[0] ||
          "Leader";

        setLeaderName(username);
      }

      setLoading(false);
    }

    loadTeamPage();
  }, [teamId, user]);

  async function handleDisband() {
    if (!teamId) return;

    const confirmDelete = confirm(
      "Are you sure you want to disband this team? This cannot be undone."
    );

    if (!confirmDelete) return;

    setDeleting(true);

    const { error: membersError } = await supabase
      .from("team_members")
      .delete()
      .eq("team_id", teamId);

    if (membersError) {
      alert("Could not remove team members: " + membersError.message);
      setDeleting(false);
      return;
    }

    const { error: teamError } = await supabase
      .from("teams")
      .delete()
      .eq("id", teamId);

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

        .top-strip{
          height:30px;background:linear-gradient(to bottom,#8b0000,#3b0000);
          border-bottom:1px solid #b32222;display:flex;align-items:center;
          justify-content:flex-end;gap:18px;padding:0 14px;
        }

        .top-strip a{
          color:#fff;font-size:12px;font-weight:bold;text-transform:uppercase;text-decoration:none;
        }

        .header{
          min-height:104px;background:linear-gradient(to bottom,#173956,#07111b);
          border-bottom:2px solid #315f88;display:flex;align-items:center;
          justify-content:space-between;padding:0 24px;
        }

        .game-header{display:flex;align-items:center;gap:18px;}
        .game-cover{width:126px;height:78px;border:1px solid #315f88;background:#050c14;overflow:hidden;}
        .game-cover img{width:100%;height:100%;object-fit:cover;object-position:center;display:block;}

        .game-name{
          color:#f2c14e;font-size:15px;font-weight:900;letter-spacing:1.3px;
          text-transform:uppercase;margin-bottom:8px;text-shadow:0 1px 2px #000;
        }

        .ladder-name{
          color:#fff;font-size:30px;font-weight:900;text-transform:uppercase;text-shadow:0 2px 4px #000;
        }

        .view-ladder{
          border:1px solid #6ba8d6;background:linear-gradient(to bottom,#214765,#0b1c2d);
          color:#f5f8ff;font-size:15px;font-weight:900;text-transform:uppercase;
          padding:14px 22px;text-decoration:none;
        }

        .view-ladder:hover{border-color:#d7ad4a;color:#d7ad4a;}

        .avatar-row{height:28px;background:#050b12;border-bottom:1px solid #244b70;position:relative;}

        .team-avatar{
          position:absolute;left:26px;top:2px;width:58px;height:58px;border:1px solid #315f88;
          background:#000;display:flex;align-items:center;justify-content:center;color:#8aa7c0;
          font-size:18px;font-weight:900;text-transform:uppercase;z-index:5;
        }

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
          padding:34px 20px 20px 20px;display:flex;flex-direction:column;justify-content:flex-start;
        }

        .team-name{color:#fff;font-size:32px;font-weight:900;text-transform:uppercase;margin-bottom:14px;}
        .team-tag{color:#d7ad4a;font-size:14px;font-weight:900;text-transform:uppercase;margin-bottom:24px;}
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

        .stats-table td:first-child,.stats-table th:first-child{
          text-align:left;padding-left:14px;width:24%;
        }

        .mini-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
        .empty-text{color:#cfe2f2;font-size:13px;text-align:center;padding:36px 10px;}

        .roster-table th{text-align:left;}
        .roster-table td{text-align:left;}
        .roster-table th:last-child,.roster-table td:last-child{text-align:center;}

        .member-name{
          color:#7fc7ff;font-weight:bold;display:flex;align-items:center;gap:12px;
        }

        .status-box{
          width:24px;height:22px;border:1px solid #244b70;background:#02070c;
          display:flex;align-items:center;justify-content:center;flex-shrink:0;
        }

        .online-guy{width:10px;height:14px;position:relative;display:inline-block;}
        .online-guy:before{
          content:"";position:absolute;top:0;left:3px;width:5px;height:5px;border-radius:50%;background:#36e86b;
        }
        .online-guy:after{
          content:"";position:absolute;bottom:0;left:1px;width:9px;height:8px;
          border-radius:4px 4px 2px 2px;background:#36e86b;
        }

        .rank{color:#d7ad4a;font-weight:bold;}
        .eligible{width:14px;height:14px;border-radius:50%;background:#d7ad4a;display:inline-block;vertical-align:middle;}

        .eligibility-head{display:flex;align-items:center;justify-content:center;gap:8px;}
        .eligibility-help{position:relative;display:inline-flex;align-items:center;}

        .help-button{
          width:15px;height:15px;border-radius:50%;border:1px solid #d7ad4a;
          background:#02070c;color:#d7ad4a;font-size:10px;font-weight:900;cursor:pointer;line-height:13px;
        }

        .help-popup{
          display:none;position:absolute;right:0;top:20px;width:210px;border:1px solid #315f88;
          background:#02070c;color:#cfe2f2;font-size:11px;line-height:16px;padding:9px;z-index:10;text-transform:none;
        }

        .eligibility-help:focus-within .help-popup{display:block;}

        .side{display:flex;flex-direction:column;gap:12px;}
        .side-box{border:1px solid #244b70;background:#050b12;min-height:156px;}
        .side-box.ladder-info-box{min-height:172px;}

        .side-box-title{
          height:30px;background:linear-gradient(to bottom,#18344f,#091521);
          border-bottom:1px solid #244b70;color:#d7ad4a;display:flex;align-items:center;
          justify-content:center;font-size:11px;font-weight:900;text-transform:uppercase;
        }

        .side-box-body{padding:18px 12px;color:#cfe2f2;font-size:12px;line-height:26px;}

        .side-box-body a,.side-box-body button{
          color:#cfe2f2;text-decoration:none;background:none;border:0;padding:0;
          font-size:12px;cursor:pointer;font-family:Tahoma,Verdana,Arial,sans-serif;
        }

        .side-box-body a:hover,.side-box-body button:hover{color:#d7ad4a;}

        .locked-control{color:#66798b;cursor:not-allowed;}
        .danger-link{color:#ff7c7c !important;}
        .danger-link:hover{color:#ffb0b0 !important;}
        .rules-link{color:#7fc7ff !important;font-weight:bold;}

        .footer{
          height:36px;background:#07111b;border-top:1px solid #244b70;
          display:flex;align-items:center;justify-content:center;color:#a9c3db;font-size:11px;
        }

        .modal-backdrop{
          position:fixed;inset:0;background:rgba(0,0,0,.72);
          display:flex;align-items:center;justify-content:center;z-index:99;
        }

        .invite-modal{width:430px;border:1px solid #315f88;background:#050b12;}

        .invite-title{
          height:34px;background:linear-gradient(to bottom,#18344f,#091521);
          border-bottom:1px solid #244b70;color:#d7ad4a;font-size:12px;font-weight:900;
          text-transform:uppercase;display:flex;align-items:center;justify-content:space-between;padding:0 12px;
        }

        .invite-close{
          border:1px solid #315f88;background:#000;color:#fff;width:22px;height:22px;cursor:pointer;font-weight:bold;
        }

        .invite-body{padding:14px;}

        .invite-search{
          width:100%;height:34px;border:1px solid #315f88;background:#000;color:#d7e2ee;
          padding:0 10px;font-size:12px;outline:none;margin-bottom:12px;
        }

        .invite-results{border:1px solid #244b70;background:#02070c;max-height:230px;overflow:auto;}

        .player-row{
          display:grid;grid-template-columns:1fr 70px 72px;gap:8px;align-items:center;
          padding:10px;border-bottom:1px solid rgba(255,255,255,.06);font-size:12px;
        }

        .player-row:last-child{border-bottom:0;}
        .player-name{color:#7fc7ff;font-weight:bold;}
        .player-rank{color:#cfe2f2;font-size:11px;}

        .invite-btn{
          height:26px;border:1px solid #d7ad4a;background:linear-gradient(to bottom,#d6a943,#7b560e);
          color:#07111b;font-size:11px;font-weight:900;cursor:pointer;text-transform:uppercase;
        }

        .loading-text{
          color:#fff;
          padding:40px;
          text-align:center;
          font-size:18px;
          font-weight:900;
          text-transform:uppercase;
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
                <img src="/mw4.jpeg" alt="Game Cover" />
              </div>

              <div>
                <div className="game-name">{gameName}</div>
                <div className="ladder-name">{ladderName}</div>
              </div>
            </div>

            <a className="view-ladder" href={ladderUrl}>
              View Ladder
            </a>
          </header>

          <div className="avatar-row">
            <div className="team-avatar">
              {team?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={team.avatar_url as string} alt="Team Avatar" />
              ) : (
                teamTag.slice(0, 2)
              )}
            </div>
          </div>

          <nav className="nav">
            <a href="/home">Home</a>
            <a href="/profile/teams">My Teams</a>
            <a href="/members">Members</a>
            <a href="/forums">Forums</a>
            <a href="/teams/top">Top Teams</a>
          </nav>

          {loading ? (
            <div className="loading-text">Loading Team...</div>
          ) : (
            <section className="content">
              <div className="main">
                <div className="panel">
                  <div className="team-head">
                    <div className="team-logo-box">
                      {team?.logo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={team.logo_url as string} alt="Team Logo" />
                      ) : (
                        "Team Logo"
                      )}
                    </div>

                    <div className="team-info">
                      <div className="team-name">{teamName}</div>
                      <div className="team-tag">Clan Tag: {teamTag}</div>

                      <div className="team-line">Achievements: None</div>
                      <div className="team-line">Fame: New Team</div>
                      <div className="team-line">
                        Founder: <span className="founder-name">{leaderName}</span>
                      </div>

                      <div className="team-match-actions">
                        {canCreateMatch ? (
                          <a className="team-action-btn" href="/matches/create">
                            Create Match
                          </a>
                        ) : (
                          <button className="team-action-btn locked" type="button">
                            Create Match
                          </button>
                        )}

                        <a className="team-action-btn secondary" href="/matches/finder">
                          Match Finder
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="panel">
                  <div className="panel-title">Team Stats</div>

                  <table className="stats-table">
                    <thead>
                      <tr>
                        <th>Season</th>
                        <th>Place</th>
                        <th>W</th>
                        <th>L</th>
                        <th>Streak</th>
                        <th>Best Streak</th>
                      </tr>
                    </thead>

                    <tbody>
                      <tr>
                        <td>Current</td>
                        <td>-</td>
                        <td>0</td>
                        <td>0</td>
                        <td>-</td>
                        <td>-</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="mini-grid">
                  <div className="panel">
                    <div className="panel-title">Upcoming & Recent Matches</div>
                    <div className="empty-text">No matches have been played or scheduled.</div>
                  </div>

                  <div className="panel">
                    <div className="panel-title">Challenges</div>
                    <div className="empty-text">No pending challenges.</div>
                  </div>
                </div>

                <div className="panel">
                  <div className="panel-title">Roster</div>

                  <table className="roster-table">
                    <thead>
                      <tr>
                        <th>Member</th>
                        <th>Role</th>
                        <th>GB Rank</th>
                        <th>Member Since</th>
                        <th>
                          <span className="eligibility-head">
                            Eligibility
                            <span className="eligibility-help">
                              <button className="help-button" type="button">?</button>
                              <span className="help-popup">
                                Eligibility means this player is allowed to play official ladder matches for this team.
                              </span>
                            </span>
                          </span>
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      <tr>
                        <td className="member-name">
                          <span className="status-box">
                            <span className="online-guy"></span>
                          </span>
                          {leaderName}
                        </td>
                        <td className="rank">Leader</td>
                        <td>-</td>
                        <td>Today</td>
                        <td>
                          <span className="eligible"></span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <aside className="side">
                <div className="side-box">
                  <div className="side-box-title">Team Controls</div>

                  <div className="side-box-body">
                    {canEditTeamProfile ? (
                      <a href={`/teams/${teamId}/edit`}>Edit Team Profile</a>
                    ) : (
                      <span className="locked-control">Edit Team Profile</span>
                    )}
                    <br />

                    {canEditRoster ? (
                      <a href={`/teams/${teamId}/roster`}>Edit Roster</a>
                    ) : (
                      <span className="locked-control">Edit Roster</span>
                    )}
                    <br />

                    {canEditRoster ? (
                      <button type="button" onClick={() => setInviteOpen(true)}>
                        Invite Players
                      </button>
                    ) : (
                      <span className="locked-control">Invite Players</span>
                    )}
                    <br />

                    {isLeader ? (
                      <button
                        className="danger-link"
                        disabled={deleting}
                        onClick={handleDisband}
                        type="button"
                      >
                        {deleting ? "Disbanding..." : "Disband Team"}
                      </button>
                    ) : (
                      <button className="danger-link" onClick={handleLeave} type="button">
                        Leave Team
                      </button>
                    )}
                  </div>
                </div>

                <div className="side-box ladder-info-box">
                  <div className="side-box-title">Ladder Info</div>

                  <div className="side-box-body">
                    Platform: {platformName}
                    <br />
                    Game: {gameName}
                    <br />
                    Ladder: {ladderName}
                    <br />
                    Rules:{" "}
                    <a className="rules-link" href={rulesUrl}>
                      View Rules
                    </a>
                  </div>
                </div>
              </aside>
            </section>
          )}

          <footer className="footer">© 2026 Competitive Gaming Network</footer>
        </div>
      </main>

      {inviteOpen && (
        <div className="modal-backdrop">
          <div className="invite-modal">
            <div className="invite-title">
              Invite Players
              <button
                className="invite-close"
                type="button"
                onClick={() => setInviteOpen(false)}
              >
                X
              </button>
            </div>

            <div className="invite-body">
              <input
                className="invite-search"
                type="text"
                value={playerSearch}
                onChange={(event) => setPlayerSearch(event.target.value)}
                placeholder="Search players by username..."
              />

              <div className="invite-results">
                {filteredPlayers.map((player) => (
                  <div className="player-row" key={player.id}>
                    <div>
                      <div className="player-name">{player.username}</div>
                      <div className="player-rank">{player.rank}</div>
                    </div>

                    <div>{player.record}</div>

                    <button className="invite-btn" type="button">
                      Invite
                    </button>
                  </div>
                ))}

                {filteredPlayers.length === 0 && (
                  <div className="empty-text">No players found.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}