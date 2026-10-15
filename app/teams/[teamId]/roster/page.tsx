"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "../../../../lib/useUser";
import { supabase } from "../../../../lib/supabase";

type TeamRole = "leader" | "co-leader" | "captain" | "member";

type TeamData = {
  id: string;
  name: string | null;
  tag: string | null;
  platform: string | null;
  category: string | null;
  game: string | null;
  ladder: string | null;
  owner_id: string | null;
};

type RosterMember = {
  user_id: string;
  role: TeamRole;
  username: string;
  display_gt: string;
  gb_rank_points: number;
  gb_wins: number;
  gb_losses: number;
  gb_place: number | null;
  eligibility: "green" | "yellow" | "red";
};

type SearchResult = {
  id: string;
  username: string;
  display_gt: string;
  gb_rank_points: number;
  gb_wins: number;
  gb_losses: number;
  gb_place: number | null;
};

function prettyText(value: string | null | undefined) {
  if (!value) return "Unknown";

  const replacements: Record<string, string> = {
    mw2: "Modern Warfare 2",
    "modern-warfare-4": "Modern Warfare 4",
    "modern-warfare-iii": "Modern Warfare III",
    "black-ops-6": "Black Ops 6",
    "battlefield-6": "Battlefield 6",
    "battlefield-2042": "Battlefield 2042",
    "battlefield-v": "Battlefield V",
    "battlefield-1": "Battlefield 1",
  };

  if (replacements[value]) return replacements[value];

  return value
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function normalizeRole(value: unknown): TeamRole {
  const role = String(value || "").toLowerCase();

  if (role === "leader") return "leader";
  if (
    role === "co-leader" ||
    role === "coleader" ||
    role === "co_leader"
  ) {
    return "co-leader";
  }
  if (role === "captain") return "captain";

  return "member";
}

function roleLabel(role: TeamRole) {
  if (role === "co-leader") return "Co-Leader";
  if (role === "leader") return "Leader";
  if (role === "captain") return "Captain";
  return "Member";
}

function profileGamertag(profile: any, platform: string | null) {
  const p = String(platform || "").toLowerCase();

  const candidates =
    p === "xbox"
      ? [
          profile?.xbox_gamertag,
          profile?.xbox_gt,
          profile?.xbox,
          profile?.gamertag,
          profile?.gt,
          profile?.user_gt,
          profile?.platform_gt,
          profile?.display_gt,
        ]
      : p === "playstation" || p === "ps"
        ? [
            profile?.playstation_gamertag,
            profile?.psn,
            profile?.psn_id,
            profile?.playstation_id,
            profile?.gamertag,
            profile?.gt,
            profile?.user_gt,
            profile?.platform_gt,
            profile?.display_gt,
          ]
        : p === "nintendo" || p === "switch"
          ? [
              profile?.nintendo_gamertag,
              profile?.nintendo_id,
              profile?.switch_code,
              profile?.friend_code,
              profile?.gamertag,
              profile?.gt,
              profile?.user_gt,
              profile?.platform_gt,
              profile?.display_gt,
            ]
          : [
              profile?.pc_gamertag,
              profile?.steam,
              profile?.steam_id,
              profile?.battle_net,
              profile?.battlenet,
              profile?.gamertag,
              profile?.gt,
              profile?.user_gt,
              profile?.platform_gt,
              profile?.display_gt,
            ];

  const value = candidates.find(
    (item) =>
      item !== null &&
      item !== undefined &&
      String(item).trim() !== ""
  );

  if (value) return String(value);

  if (profile?.username === "Prime") {
    return "Prime#3139";
  }

  return profile?.username || "Unknown";
}

function isMissingTableError(error: any) {
  const msg = String(error?.message || "").toLowerCase();
  return error?.code === "42P01" || msg.includes("does not exist") || msg.includes("relation") && msg.includes("does not exist");
}

function eligibilityStatus(member: any): "green" | "yellow" | "red" {
  if (
    member?.can_play === false ||
    ["ineligible", "banned", "suspended"].includes(
      String(member?.status || member?.invite_status || "").toLowerCase()
    )
  ) {
    return "red";
  }

  return "green";
}

export default function EditRosterPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();

  const teamId = String(params?.teamId || "");

  const [team, setTeam] = useState<TeamData | null>(null);
  const [roster, setRoster] = useState<RosterMember[]>([]);
  const [viewerRole, setViewerRole] = useState<TeamRole>("member");

  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [invitingUserId, setInvitingUserId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const canEditRoster =
    viewerRole === "leader" || viewerRole === "co-leader";

  const isLeader = viewerRole === "leader";

  const rosterIds = useMemo(
    () => new Set(roster.map((member) => member.user_id)),
    [roster]
  );

  const loadRoster = async () => {
    if (!teamId) return;

    setLoading(true);
    setError("");

    const { data: teamData, error: teamError } = await supabase
      .from("teams")
      .select(
        "id, name, tag, platform, category, game, ladder, owner_id"
      )
      .eq("id", teamId)
      .maybeSingle();

    if (teamError) {
      setError(teamError.message);
      setLoading(false);
      return;
    }

    if (!teamData) {
      setError("Team not found.");
      setLoading(false);
      return;
    }

    setTeam(teamData as TeamData);

    let currentViewerRole: TeamRole = "member";

    if (user?.id) {
      const { data: viewerMember } = await supabase
        .from("team_members")
        .select("role")
        .eq("team_id", teamId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (viewerMember?.role) {
        currentViewerRole = normalizeRole(viewerMember.role);
      }

      if (
        teamData.owner_id &&
        String(teamData.owner_id) === String(user.id)
      ) {
        currentViewerRole = "leader";
      }
    }

    setViewerRole(currentViewerRole);

    if (
      currentViewerRole !== "leader" &&
      currentViewerRole !== "co-leader"
    ) {
      setLoading(false);
      return;
    }

    const { data: memberRows, error: memberError } = await supabase
      .from("team_members")
      .select("*")
      .eq("team_id", teamId);

    if (memberError) {
      setError(memberError.message);
      setLoading(false);
      return;
    }

    const memberUserIds = (memberRows || [])
      .map((member: any) => member.user_id)
      .filter(Boolean) as string[];

    if (memberUserIds.length === 0) {
      setRoster([]);
      setLoading(false);
      return;
    }

    const { data: memberProfiles } = await supabase
      .from("profiles")
      .select("*")
      .in("id", memberUserIds);

    const profileMap: Record<string, any> = {};

    (memberProfiles || []).forEach((profile: any) => {
      profileMap[String(profile.id)] = profile;
    });

    const { data: rankedProfiles } = await supabase
      .from("profiles")
      .select("id, gb_rank_points, gb_wins, gb_losses")
      .order("gb_rank_points", { ascending: false })
      .order("gb_wins", { ascending: false })
      .order("gb_losses", { ascending: true });

    const rankMap: Record<string, number> = {};

    (rankedProfiles || []).forEach((profile: any, index: number) => {
      rankMap[String(profile.id)] = index + 1;
    });

    const loadedRoster = (memberRows || []).map((member: any) => {
      const profile = profileMap[String(member.user_id)] || {};

      return {
        user_id: String(member.user_id),
        role: normalizeRole(member.role),
        username: profile.username || "Player",
        display_gt: profileGamertag(
          profile,
          teamData.platform
        ),
        gb_rank_points: Number(profile.gb_rank_points || 0),
        gb_wins: Number(profile.gb_wins || 0),
        gb_losses: Number(profile.gb_losses || 0),
        gb_place: rankMap[String(member.user_id)] || null,
        eligibility: eligibilityStatus(member),
      } as RosterMember;
    });

    loadedRoster.sort((a, b) => {
      const order: Record<TeamRole, number> = {
        leader: 0,
        "co-leader": 1,
        captain: 2,
        member: 3,
      };

      return order[a.role] - order[b.role];
    });

    setRoster(loadedRoster);
    setLoading(false);
  };

  useEffect(() => {
    loadRoster();
  }, [teamId, user?.id]);

  const searchAccounts = async () => {
    const query = search.trim();

    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    setMessage("");
    setError("");

    const { data: profiles, error: searchError } = await supabase
      .from("profiles")
      .select("*")
      .ilike("username", `%${query}%`)
      .limit(10);

    if (searchError) {
      setError(searchError.message);
      setSearchResults([]);
      setSearching(false);
      return;
    }

    const results = (profiles || []).map((profile: any) => ({
      id: String(profile.id),
      username: profile.username || "Player",
      display_gt: profileGamertag(
        profile,
        team?.platform || null
      ),
      gb_rank_points: Number(profile.gb_rank_points || 0),
      gb_wins: Number(profile.gb_wins || 0),
      gb_losses: Number(profile.gb_losses || 0),
      gb_place: null,
    }));

    setSearchResults(results);
    setSearching(false);
  };

  const invitePlayer = async (player: SearchResult) => {
    if (!team) return;

    if (rosterIds.has(player.id)) {
      setError(`${player.username} is already on this roster.`);
      return;
    }

    setInvitingUserId(player.id);
    setMessage("");
    setError("");

    const { data: existingMembership } = await supabase
      .from("team_members")
      .select("user_id")
      .eq("team_id", team.id)
      .eq("user_id", player.id)
      .maybeSingle();

    if (existingMembership) {
      setError(`${player.username} is already on this roster.`);
      setInvitingUserId(null);
      return;
    }

    let existingInvite: any = null;

    try {
      const { data, error } = await supabase
        .from("team_invites")
        .select("id")
        .eq("team_id", team.id)
        .eq("user_id", player.id)
        .eq("status", "pending")
        .maybeSingle();

      if (error && !isMissingTableError(error)) {
        throw error;
      }

      existingInvite = data;
    } catch (inviteError: any) {
      setError(inviteError?.message || "Unable to check pending invites.");
      setInvitingUserId(null);
      return;
    }

    if (existingInvite) {
      setError(`${player.username} already has a pending invite for this team.`);
      setInvitingUserId(null);
      return;
    }

    let insertError: any = null;

    try {
      const response = await supabase
        .from("team_invites")
        .insert({
          team_id: team.id,
          user_id: player.id,
          status: "pending",
        });

      insertError = response.error;

      if (insertError && !isMissingTableError(insertError)) {
        throw insertError;
      }
    } catch (error: any) {
      setError(error?.message || "Unable to send the invite.");
      setInvitingUserId(null);
      return;
    }

    if (insertError && isMissingTableError(insertError)) {
      setError("Team invites are not set up yet. Run the SQL in sql/create_team_invites.sql in Supabase.");
      setInvitingUserId(null);
      return;
    }

    setSearchResults((current) =>
      current.filter((result) => result.id !== player.id)
    );
    setSearch("");

    setMessage(
      `${player.username} was invited and must accept before joining the roster.`
    );

    setInvitingUserId(null);
  };

  const handleRoleChange = async (
    member: RosterMember,
    newRole: TeamRole
  ) => {
    if (!team) return;

    setMessage("");
    setError("");

    if (member.user_id === team.owner_id) {
      setError("The team leader cannot have their role changed.");
      return;
    }

    if (
      !isLeader &&
      (member.role === "co-leader" || newRole === "co-leader")
    ) {
      setError("Only the team leader can manage Co-Leaders.");
      return;
    }

    if (newRole === "leader") {
      setError("The team leader cannot be changed here.");
      return;
    }

    setSavingUserId(member.user_id);

    const { error: updateError } = await supabase
      .from("team_members")
      .update({ role: newRole })
      .eq("team_id", team.id)
      .eq("user_id", member.user_id);

    if (updateError) {
      setError(updateError.message);
      setSavingUserId(null);
      return;
    }

    setRoster((current) =>
      current.map((item) =>
        item.user_id === member.user_id
          ? { ...item, role: newRole }
          : item
      )
    );

    setMessage(`${member.username}'s role was updated.`);
    setSavingUserId(null);
  };

  const handleRemove = async (member: RosterMember) => {
    if (!team) return;

    setMessage("");
    setError("");

    if (member.user_id === team.owner_id) {
      setError("The team leader cannot be removed.");
      return;
    }

    if (!isLeader && member.role === "co-leader") {
      setError("Only the team leader can remove a Co-Leader.");
      return;
    }

    const confirmed = window.confirm(
      `Remove ${member.username} from ${team.name || "this team"}?`
    );

    if (!confirmed) return;

    setRemovingUserId(member.user_id);

    const { error: deleteError } = await supabase
      .from("team_members")
      .delete()
      .eq("team_id", team.id)
      .eq("user_id", member.user_id);

    if (deleteError) {
      setError(deleteError.message);
      setRemovingUserId(null);
      return;
    }

    setRoster((current) =>
      current.filter((item) => item.user_id !== member.user_id)
    );

    setMessage(`${member.username} was removed from the roster.`);
    setRemovingUserId(null);
  };

  if (loading) {
    return (
      <main className="page">
        <div className="loading">Loading roster...</div>

        <style jsx>{`
          .page {
            min-height: 100vh;
            background: #02050a;
            color: #d7e1ee;
            padding: 25px 15px;
            font-family: Arial, Helvetica, sans-serif;
          }

          .loading {
            max-width: 1000px;
            margin: 0 auto;
            padding: 40px;
            border: 1px solid #183c67;
            background: #07101c;
            text-align: center;
            color: #8094ad;
            font-size: 12px;
          }
        `}</style>
      </main>
    );
  }

  if (!team) {
    return (
      <main className="page">
        <div className="error-box">
          {error || "Team not found."}
        </div>

        <style jsx>{`
          .page {
            min-height: 100vh;
            background: #02050a;
            color: #d7e1ee;
            padding: 25px 15px;
            font-family: Arial, Helvetica, sans-serif;
          }

          .error-box {
            max-width: 1000px;
            margin: 0 auto;
            padding: 40px;
            border: 1px solid #613030;
            background: #12090b;
            color: #ff7777;
            text-align: center;
          }
        `}</style>
      </main>
    );
  }

  if (!canEditRoster) {
    return (
      <main className="page">
        <div className="wrap">
          <div className="top-strip" />

          <div className="header">
            <div className="logo-text">GAMEBATTLES</div>
            <div className="header-title">TEAM ROSTER</div>
          </div>

          <div className="denied">
            <h2>ACCESS DENIED</h2>
            <p>
              Only the team leader or co-leader can manage this
              roster.
            </p>

            <button onClick={() => router.push(`/teams/${teamId}`)}>
              BACK TO TEAM
            </button>
          </div>
        </div>

        <style jsx>{`
          .page {
            min-height: 100vh;
            background: #02050a;
            color: #d7e1ee;
            padding: 25px 15px;
            font-family: Arial, Helvetica, sans-serif;
          }

          .wrap {
            max-width: 1000px;
            margin: 0 auto;
            border: 1px solid #174271;
            background: #060c14;
          }

          .top-strip {
            height: 4px;
            background: #9d2020;
          }

          .header {
            padding: 18px 20px;
            background: linear-gradient(#142944, #081523);
            border-bottom: 1px solid #1d4b7b;
          }

          .logo-text {
            color: #e6c65b;
            font-size: 18px;
            font-weight: 900;
            letter-spacing: 2px;
          }

          .header-title {
            margin-top: 4px;
            color: #b9c9dd;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 1px;
          }

          .denied {
            padding: 60px 20px;
            text-align: center;
          }

          .denied h2 {
            margin: 0;
            color: #d95858;
            font-size: 18px;
          }

          .denied p {
            color: #7f91a8;
            font-size: 12px;
          }

          button {
            padding: 8px 14px;
            border: 1px solid #315f8d;
            background: #0c1d31;
            color: #cbdcf0;
            font-size: 10px;
            font-weight: 800;
            cursor: pointer;
          }
        `}</style>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="wrap">
        <div className="top-strip" />

        <div className="header">
          <div className="logo-text">GAMEBATTLES</div>

          <div className="header-title">TEAM ROSTER MANAGEMENT</div>

          <div className="team-line">
            {team.name || "Team"}{" "}
            <span>[{team.tag || "TEAM"}]</span>
          </div>

          <div className="details">
            {prettyText(team.platform)} &nbsp;|&nbsp;{" "}
            {prettyText(team.category)} &nbsp;|&nbsp;{" "}
            {prettyText(team.game)} &nbsp;|&nbsp;{" "}
            {prettyText(team.ladder)}
          </div>
        </div>

        <div className="sub-nav">
          <button onClick={() => router.push(`/teams/${teamId}`)}>
            TEAM HOME
          </button>

          <span>|</span>

          <span className="active">EDIT ROSTER</span>
        </div>

        {message && <div className="message success">{message}</div>}
        {error && <div className="message error">{error}</div>}

        <div className="content">
          <section className="panel">
            <div className="panel-heading">
              <span>INVITE A PLAYER</span>
            </div>

            <div className="invite-area">
              <div className="invite-label">
                SEARCH GAMEBATTLES ACCOUNTS
              </div>

              <div className="search-row">
                <input
                  type="text"
                  value={search}
                  placeholder="Enter GameBattles username..."
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setSearchResults([]);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      searchAccounts();
                    }
                  }}
                />

                <button
                  className="search-button"
                  onClick={searchAccounts}
                  disabled={searching}
                >
                  {searching ? "SEARCHING..." : "SEARCH"}
                </button>
              </div>

              {searchResults.length > 0 && (
                <div className="search-results">
                  <div className="results-title">
                    ACCOUNT SEARCH RESULTS
                  </div>

                  {searchResults.map((player) => {
                    const alreadyOnRoster = rosterIds.has(player.id);

                    return (
                      <div className="search-result" key={player.id}>
                        <div className="result-player">
                          <div className="result-name">
                            {player.username}
                          </div>

                          <div className="result-gt">
                            {player.display_gt}
                          </div>
                        </div>

                        <div className="result-stats">
                          <span>
                            Rank:{" "}
                            {player.gb_rank_points.toLocaleString()} pts
                          </span>

                          <span>
                            {player.gb_wins}-{player.gb_losses}
                          </span>
                        </div>

                        <button
                          className="invite-button"
                          disabled={
                            alreadyOnRoster ||
                            invitingUserId === player.id
                          }
                          onClick={() => invitePlayer(player)}
                        >
                          {alreadyOnRoster
                            ? "ON ROSTER"
                            : invitingUserId === player.id
                              ? "ADDING..."
                              : "INVITE"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {search.trim().length >= 2 &&
                !searching &&
                searchResults.length === 0 && (
                  <div className="no-results">
                    No GameBattles accounts found.
                  </div>
                )}
            </div>
          </section>

          <section className="panel">
            <div className="panel-heading">
              <span>CURRENT ROSTER</span>

              <span className="roster-count">
                {roster.length} PLAYER
                {roster.length === 1 ? "" : "S"}
              </span>
            </div>

            <div className="roster-note">
              Select a role to update a player's position on the
              team. Team leaders are protected.
            </div>

            <div className="roster-table-wrap">
              <table className="roster-table">
                <thead>
                  <tr>
                    <th>PLAYER</th>
                    <th>GAMERTAG</th>
                    <th>ROLE</th>
                    <th>GB RANK</th>
                    <th>RECORD</th>
                    <th>STATUS</th>
                    <th />
                  </tr>
                </thead>

                <tbody>
                  {roster.map((member) => {
                    const isOwner =
                      String(member.user_id) ===
                      String(team.owner_id);

                    const canManage =
                      isLeader ||
                      (!isOwner && member.role !== "co-leader");

                    return (
                      <tr key={member.user_id}>
                        <td>
                          <a
                            className="player-link"
                            href={`/profile?userId=${encodeURIComponent(member.user_id)}`}
                          >
                            {member.username}
                          </a>

                          {isOwner && (
                            <span className="leader-mark">
                              LEADER
                            </span>
                          )}
                        </td>

                        <td className="gamertag">
                          {member.display_gt}
                        </td>

                        <td>
                          {isOwner ? (
                            <span className="leader-role">
                              Leader
                            </span>
                          ) : (
                            <select
                              value={member.role}
                              disabled={
                                !canManage ||
                                savingUserId === member.user_id
                              }
                              onChange={(event) =>
                                handleRoleChange(
                                  member,
                                  normalizeRole(
                                    event.target.value
                                  )
                                )
                              }
                            >
                              <option value="member">
                                Member
                              </option>

                              <option value="captain">
                                Captain
                              </option>

                              {isLeader && (
                                <option value="co-leader">
                                  Co-Leader
                                </option>
                              )}
                            </select>
                          )}
                        </td>

                        <td>
                          <span className="rank">
                            {member.gb_place
                              ? `#${member.gb_place}`
                              : "Unranked"}
                          </span>

                          <span className="points">
                            {member.gb_rank_points} pts
                          </span>
                        </td>

                        <td className="record">
                          {member.gb_wins}-{member.gb_losses}
                        </td>

                        <td>
                          <span className="status">
                            <span
                              className={`dot ${member.eligibility}`}
                            />

                            {member.eligibility === "green"
                              ? "Eligible"
                              : member.eligibility === "yellow"
                                ? "Pending"
                                : "Ineligible"}
                          </span>
                        </td>

                        <td className="action-cell">
                          {!isOwner && canManage ? (
                            <button
                              className="remove-button"
                              disabled={
                                removingUserId ===
                                member.user_id
                              }
                              onClick={() =>
                                handleRemove(member)
                              }
                            >
                              {removingUserId === member.user_id
                                ? "..."
                                : "REMOVE"}
                            </button>
                          ) : (
                            <span className="protected">
                              PROTECTED
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {roster.length === 0 && (
                    <tr>
                      <td colSpan={7} className="empty">
                        No players are currently on this roster.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <div className="footer">
          GAMEBATTLES &nbsp;•&nbsp; TEAM MANAGEMENT
        </div>
      </div>

      <style jsx>{`
        .page {
          min-height: 100vh;
          background:
            linear-gradient(
              180deg,
              #03070d 0%,
              #050b13 55%,
              #020408 100%
            );
          color: #d5dfed;
          padding: 24px 12px 50px;
          font-family: Arial, Helvetica, sans-serif;
        }

        .wrap {
          width: 100%;
          max-width: 1000px;
          margin: 0 auto;
          border: 1px solid #183e68;
          background: #060c14;
          box-shadow:
            0 0 0 1px #020407 inset,
            0 12px 35px rgba(0, 0, 0, 0.55);
        }

        .top-strip {
          height: 5px;
          background: #9f2020;
          border-bottom: 1px solid #4c1717;
        }

        .header {
          padding: 17px 20px 15px;
          background:
            linear-gradient(
              180deg,
              #152a47 0%,
              #0c1b2e 52%,
              #081320 100%
            );
          border-bottom: 1px solid #204d7b;
        }

        .logo-text {
          color: #e4c45a;
          font-size: 19px;
          font-weight: 900;
          letter-spacing: 2px;
        }

        .header-title {
          margin-top: 4px;
          color: #8298b2;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 1.5px;
        }

        .team-line {
          margin-top: 14px;
          color: #e0e9f5;
          font-size: 16px;
          font-weight: 900;
        }

        .team-line span {
          color: #758ba6;
          font-size: 13px;
        }

        .details {
          margin-top: 6px;
          color: #627992;
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .sub-nav {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 7px 12px;
          background: #081321;
          border-bottom: 1px solid #183653;
          font-size: 9px;
          font-weight: 900;
        }

        .sub-nav button {
          padding: 4px 5px;
          border: 0;
          background: transparent;
          color: #7198bd;
          font-size: 9px;
          font-weight: 900;
          cursor: pointer;
        }

        .sub-nav button:hover {
          color: #dcecff;
        }

        .sub-nav > span {
          color: #334a63;
        }

        .sub-nav .active {
          color: #d5b34f;
        }

        .content {
          padding: 13px;
        }

        .panel {
          margin-bottom: 13px;
          border: 1px solid #173a60;
          background: #070d16;
        }

        .panel-heading {
          display: flex;
          justify-content: space-between;
          align-items: center;
          min-height: 34px;
          padding: 0 12px;
          background:
            linear-gradient(
              180deg,
              #112743 0%,
              #0b1a2c 100%
            );
          border-bottom: 1px solid #1d4b78;
          color: #dfc15b;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.8px;
        }

        .roster-count {
          color: #7187a1;
          font-size: 9px;
        }

        .invite-area {
          padding: 14px;
        }

        .invite-label {
          margin-bottom: 7px;
          color: #7389a3;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 0.5px;
        }

        .search-row {
          display: flex;
          gap: 6px;
        }

        .search-row input {
          flex: 1;
          min-width: 0;
          height: 31px;
          padding: 0 9px;
          border: 1px solid #244d76;
          outline: none;
          background: #030810;
          color: #d8e4f3;
          font-size: 11px;
        }

        .search-row input::placeholder {
          color: #536981;
        }

        .search-row input:focus {
          border-color: #3b6f9f;
        }

        .search-button,
        .invite-button {
          border: 1px solid #315d89;
          background:
            linear-gradient(
              180deg,
              #173552 0%,
              #0b1c2e 100%
            );
          color: #c9ddf2;
          font-size: 9px;
          font-weight: 900;
          cursor: pointer;
        }

        .search-button {
          width: 90px;
        }

        .search-button:hover,
        .invite-button:hover:not(:disabled) {
          border-color: #4a7cac;
          background: #163452;
          color: #ffffff;
        }

        .search-button:disabled,
        .invite-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .search-results {
          margin-top: 10px;
          border: 1px solid #1b3d61;
          background: #050a11;
        }

        .results-title {
          padding: 7px 9px;
          border-bottom: 1px solid #163451;
          background: #0a1727;
          color: #7088a4;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: 0.7px;
        }

        .search-result {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 9px;
          border-bottom: 1px solid #11253b;
        }

        .search-result:last-child {
          border-bottom: 0;
        }

        .result-player {
          flex: 1;
          min-width: 150px;
        }

        .result-name {
          color: #d8e6f7;
          font-size: 11px;
          font-weight: 900;
        }

        .result-gt {
          margin-top: 3px;
          color: #627993;
          font-size: 9px;
        }

        .result-stats {
          display: flex;
          gap: 14px;
          color: #7187a0;
          font-size: 9px;
        }

        .invite-button {
          min-width: 70px;
          padding: 6px 8px;
        }

        .no-results {
          margin-top: 9px;
          padding: 9px;
          border: 1px solid #172d46;
          background: #050a11;
          color: #63768e;
          font-size: 10px;
        }

        .message {
          margin: 10px 13px 0;
          padding: 8px 10px;
          border: 1px solid;
          font-size: 10px;
        }

        .message.success {
          border-color: #285d3a;
          background: #08160d;
          color: #68c98a;
        }

        .message.error {
          border-color: #6b3030;
          background: #17090a;
          color: #ee7777;
        }

        .roster-note {
          padding: 8px 10px;
          border-bottom: 1px solid #122942;
          background: #050a11;
          color: #657a93;
          font-size: 9px;
        }

        .roster-table-wrap {
          width: 100%;
          overflow-x: auto;
        }

        .roster-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 820px;
        }

        .roster-table th {
          padding: 8px 9px;
          border-bottom: 1px solid #173652;
          background: #04080e;
          color: #647a95;
          text-align: left;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: 0.6px;
        }

        .roster-table td {
          padding: 10px 9px;
          border-bottom: 1px solid #102338;
          color: #b8c7d9;
          font-size: 10px;
          vertical-align: middle;
        }

        .roster-table tbody tr:hover {
          background: #091321;
        }

        .player-link {
          color: #d5e5f7;
          font-weight: 900;
          text-decoration: none;
        }

        .player-link:hover {
          color: #ffffff;
          text-decoration: underline;
        }

        .leader-mark {
          display: inline-block;
          margin-left: 6px;
          padding: 2px 4px;
          border: 1px solid #66551f;
          background: #211b0b;
          color: #d3b550;
          font-size: 7px;
          font-weight: 900;
        }

        .gamertag {
          color: #71869e !important;
        }

        .leader-role {
          color: #d6b552;
          font-weight: 900;
        }

        select {
          min-width: 95px;
          padding: 5px 6px;
          border: 1px solid #254e77;
          background: #07111d;
          color: #c9d9ea;
          font-size: 9px;
          outline: none;
        }

        select:focus {
          border-color: #3b6d9e;
        }

        select:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        .rank {
          display: block;
          color: #c8d9ec;
          font-weight: 900;
        }

        .points {
          display: block;
          margin-top: 2px;
          color: #627993;
          font-size: 8px;
        }

        .record {
          color: #b8c9dd !important;
          font-weight: 800;
        }

        .status {
          display: flex;
          align-items: center;
          gap: 5px;
          color: #8195ad;
          font-size: 9px;
        }

        .dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          display: inline-block;
        }

        .dot.green {
          background: #3ac96a;
        }

        .dot.yellow {
          background: #d9b83e;
        }

        .dot.red {
          background: #d64c4c;
        }

        .action-cell {
          text-align: right;
        }

        .remove-button {
          padding: 5px 7px;
          border: 1px solid #602d2d;
          background: #160b0c;
          color: #d45e5e;
          font-size: 8px;
          font-weight: 900;
          cursor: pointer;
        }

        .remove-button:hover:not(:disabled) {
          border-color: #8c3d3d;
          color: #ff8585;
          background: #210e0f;
        }

        .remove-button:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        .protected {
          color: #5f6c7c;
          font-size: 8px;
          font-weight: 900;
        }

        .empty {
          padding: 25px !important;
          text-align: center;
          color: #64778e !important;
        }

        .footer {
          padding: 10px 14px;
          border-top: 1px solid #173451;
          background: #04080e;
          color: #43566d;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: 0.7px;
        }

        @media (max-width: 650px) {
          .page {
            padding: 10px 5px 30px;
          }

          .content {
            padding: 7px;
          }

          .header {
            padding: 14px;
          }

          .search-row {
            flex-direction: column;
          }

          .search-button {
            width: 100%;
            height: 30px;
          }

          .search-result {
            align-items: flex-start;
            flex-direction: column;
          }

          .invite-button {
            width: 100%;
          }
        }
      `}</style>
    </main>
  );
}