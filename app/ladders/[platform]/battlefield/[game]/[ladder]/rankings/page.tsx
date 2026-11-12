"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../../../../../lib/supabase";
import { ladderPlatforms, systemRankings } from "../../../../../../../lib/ladderStandings";
import RankingSystemFilter from "../../../../../../components/RankingSystemFilter";

type TeamRow = {
  id: string;
  name: string | null;
  tag: string | null;
  logo_url: string | null;
  wins: number | null;
  losses: number | null;
  rating_points: number | null;
  platform: string | null;
  created_at: string | null;
};

type RosterIdentity = {
  userId: string;
  username: string;
  accountId: string;
};

const platformNames: Record<string, string> = {
  xbox: "Xbox",
  playstation: "PlayStation",
  pc: "PC",
};

const battlefieldTitles: Record<string, string> = {
  "battlefield-6": "Battlefield 6",
  "battlefield-2042": "Battlefield 2042",
  "battlefield-v": "Battlefield V",
  "battlefield-1": "Battlefield 1",
};

function winPercentage(wins: number, losses: number) {
  const total = wins + losses;
  return total ? `${Math.round((wins / total) * 100)}%` : "—";
}

export default function BattlefieldRankingsPage() {
  const { platform, game, ladder } = useParams<{
    platform: string;
    game: string;
    ladder: string;
  }>();
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [rostersByTeam, setRostersByTeam] = useState<Record<string, RosterIdentity[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [systems, setSystems] = useState<string[]>([]);
  const [systemFilter, setSystemFilter] = useState("all");

  const platformName = platformNames[platform];
  const gameName = battlefieldTitles[game];
  const ladderName =
    ladder === "redsec"
      ? "RedSec"
      : ladder === "rapid-royal-duos"
        ? "Rapid Royal"
        : ladder === "singles"
        ? "Singles"
        : ladder === "duos"
          ? "Duos"
          : ladder === "team"
            ? "Team"
            : null;

  const rankedTeams = useMemo(
    () =>
      systemRankings(teams),
    [teams]
  );

  useEffect(() => {
    let cancelled = false;

    async function loadRankings() {
      setLoading(true);
      setError("");

      if (
        !platformNames[platform] ||
        !battlefieldTitles[game] ||
        !ladderName ||
        ((ladder === "redsec" || ladder === "rapid-royal-duos") &&
          game !== "battlefield-6")
      ) {
        setError("This Battlefield ladder is not available.");
        setLoading(false);
        return;
      }

      let availableSystems: string[];
      try {
        availableSystems = await ladderPlatforms("battlefield", game, platform);
      } catch (reason) {
        if (!cancelled) { setError(reason instanceof Error ? reason.message : "Could not load compatible systems."); setLoading(false); }
        return;
      }
      if (cancelled) return;
      setSystems(availableSystems);
      setSystemFilter("all");
      const { data, error: queryError } = await supabase
        .from("teams")
        .select("id,name,tag,logo_url,wins,losses,rating_points,platform,created_at")
        .in("platform", availableSystems)
        .eq("category", "battlefield")
        .eq("game", game)
        .eq("ladder", ladder)
        .or("wins.gt.0,losses.gt.0")
        .order("rating_points", { ascending: false })
        .order("wins", { ascending: false })
        .order("losses", { ascending: true });

      if (cancelled) return;
      if (queryError) {
        setError(queryError.message);
      } else {
        const loadedTeams = (data || []) as TeamRow[];
        setTeams(loadedTeams);

        if (loadedTeams.length) {
          const { data: members, error: memberError } = await supabase
            .from("team_members")
            .select("team_id,user_id")
            .in("team_id", loadedTeams.map((team) => team.id));

          if (cancelled) return;
          if (memberError) {
            setError("Team gaming IDs could not be loaded: " + memberError.message);
          } else {
            const memberIds = (members || []).map((member) => member.user_id);
            if (memberIds.length) {
              const [{ data: profiles, error: profileError }, { data: accounts, error: accountError }] =
                await Promise.all([
                  supabase.from("profiles").select("id,username").in("id", memberIds),
                  supabase
                    .from("gaming_accounts")
                    .select("user_id,account_id,platform")
                    .in("user_id", memberIds)
                    .in("platform", availableSystems)
                    .eq("category", "battlefield")
                    .eq("game", game),
                ]);

              if (cancelled) return;
              if (profileError || accountError) {
                setError(
                  "Team gaming IDs could not be loaded: " +
                    (profileError?.message || accountError?.message),
                );
              } else {
                const usernameById = new Map(
                  (profiles || []).map((profile) => [profile.id, profile.username || "Player"]),
                );
                const accountByUserId = new Map(
                  (accounts || []).map((account) => [`${account.user_id}:${account.platform}`, account.account_id]),
                );
                const teamSystems = new Map(loadedTeams.map((team) => [team.id, team.platform]));
                const rosterMap: Record<string, RosterIdentity[]> = {};

                (members || []).forEach((member) => {
                  const accountId = accountByUserId.get(`${member.user_id}:${teamSystems.get(member.team_id)}`);
                  if (!accountId) return;
                  rosterMap[member.team_id] ||= [];
                  rosterMap[member.team_id].push({
                    userId: member.user_id,
                    username: usernameById.get(member.user_id) || "Player",
                    accountId,
                  });
                });
                setRostersByTeam(rosterMap);
              }
            } else {
              setRostersByTeam({});
            }
          }
        } else {
          setRostersByTeam({});
        }
      }
      setLoading(false);
    }

    loadRankings();
    return () => {
      cancelled = true;
    };
  }, [platform, game, ladder, ladderName]);

  if (!platformName || !gameName || !ladderName) {
    return (
      <main className="page">
        <section className="panel">
          <h1>Battlefield ladder not found</h1>
          <Link href={`/ladders/${platform}/battlefield/${game}`}>
            Back to {gameName || "Battlefield"}
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="page">
      <section className="panel">
        <Link className="back-link" href={`/ladders/${platform}/battlefield/${game}`}>
          Back to {gameName} ladders
        </Link>
        <header>
          <p>Battlefield Ladder Rankings</p>
          <h1>{gameName} {ladderName}</h1>
          <RankingSystemFilter systems={systems} value={systemFilter} onChange={setSystemFilter} />
          <Link
            className="create-link"
            href={`/team-hub?platform=${platform}&category=battlefield&game=${game}&ladder=${ladder}`}
          >
            View/Create Team
          </Link>
        </header>
        {loading ? (
          <p className="state">Loading standings…</p>
        ) : error ? (
          <p className="state error">{error}</p>
        ) : rankedTeams.every((team) => systemFilter !== "all" && team.platform !== systemFilter) ? (
          <p className="state">No ranked teams yet.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Team</th>
                  <th>Rating</th>
                  <th>Wins</th>
                  <th>Losses</th>
                  <th>Win %</th>
                </tr>
              </thead>
              <tbody>
                {rankedTeams.map((team) => systemFilter !== "all" && team.platform !== systemFilter ? null : (
                  <tr key={team.id}>
                    <td>{team.systemRank}</td>
                    <td>
                      <Link href={`/teams/${team.id}`}>
                        {team.tag ? `[${team.tag}] ` : ""}
                        {team.name || "Unnamed Team"}
                      </Link>
                      <div className="roster-identities">{platformNames[team.platform || ""] || team.platform}</div>
                      <div className="roster-identities">
                        {(rostersByTeam[team.id] || []).map((member) => (
                          <span key={member.userId}>
                            {member.username}: {member.accountId}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>{team.rating_points ?? 100}</td>
                    <td>{team.wins ?? 0}</td>
                    <td>{team.losses ?? 0}</td>
                    <td>
                      {winPercentage(team.wins || 0, team.losses || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <style jsx>{`
        .page {
          min-height: 100vh;
          padding: 24px 14px;
          background: radial-gradient(circle at top, #173d5f, #02060a 65%);
          color: #eaf6ff;
          font-family: Tahoma, Verdana, Arial, sans-serif;
        }
        .panel {
          max-width: 980px;
          margin: 0 auto;
          border: 1px solid #2d6f9f;
          background: #071522;
          box-shadow: 0 0 34px #000c;
        }
        .back-link {
          display: inline-block;
          margin: 18px;
          color: #9bd8ff;
          font-size: 12px;
          font-weight: 700;
          text-decoration: none;
        }
        .back-link:hover,
        td a:hover {
          color: #f2c14e;
        }
        .roster-identities {
          display: flex;
          flex-wrap: wrap;
          gap: 2px 10px;
          margin-top: 4px;
          color: #b8dfff;
          font-size: 10px;
          line-height: 15px;
        }
        header {
          padding: 8px 20px 18px;
          border-bottom: 1px solid #2d6f9f;
          background: linear-gradient(#153a57, #071522);
        }
        header p {
          margin: 0 0 6px;
          color: #b8dfff;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
        }
        .system-label {
          display: inline-flex;
          align-items: center;
          margin: 0 0 12px;
          padding: 5px 10px;
          border: 1px solid rgba(125,182,216,.35);
          border-radius: 5px;
          background: rgba(15,42,64,.55);
          color: #c4d9e8;
          font-size: 11px;
          letter-spacing: .01em;
          text-transform: none;
        }
        h1 {
          margin: 0 0 14px;
          color: #f2c14e;
          font-size: 26px;
          text-transform: uppercase;
        }
        .create-link {
          color: #9bd8ff;
          font-size: 12px;
          font-weight: 700;
        }
        .state {
          padding: 30px 20px;
          color: #cfe2f2;
          text-align: center;
        }
        .error {
          color: #ff8585;
        }
        .table-wrap {
          overflow-x: auto;
          padding: 16px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          min-width: 620px;
          font-size: 13px;
        }
        th,
        td {
          padding: 12px 10px;
          border-bottom: 1px solid #214b68;
          text-align: left;
        }
        th {
          color: #061622;
          background: #7db6d8;
          text-transform: uppercase;
        }
        td a {
          color: #9bd8ff;
          font-weight: 700;
          text-decoration: none;
        }
      `}</style>
    </main>
  );
}
