"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../../../../../lib/supabase";

type TeamRow = {
  id: string;
  name: string | null;
  tag: string | null;
  logo_url: string | null;
  wins: number | null;
  losses: number | null;
  rating_points: number | null;
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const platformName = platformNames[platform];
  const gameName = battlefieldTitles[game];
  const ladderName =
    ladder === "redsec"
      ? "RedSec"
      : ladder === "singles"
        ? "Singles"
        : ladder === "duos"
          ? "Duos"
          : ladder === "team"
            ? "Team"
            : null;

  const rankedTeams = useMemo(
    () =>
      [...teams].sort((a, b) => {
        const ratingDifference =
          Number(b.rating_points || 100) - Number(a.rating_points || 100);
        if (ratingDifference) return ratingDifference;
        const winDifference = Number(b.wins || 0) - Number(a.wins || 0);
        if (winDifference) return winDifference;
        return Number(a.losses || 0) - Number(b.losses || 0);
      }),
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
        (ladder === "redsec" && game !== "battlefield-6")
      ) {
        setError("This Battlefield ladder is not available.");
        setLoading(false);
        return;
      }

      const { data, error: queryError } = await supabase
        .from("teams")
        .select("id,name,tag,logo_url,wins,losses,rating_points")
        .eq("platform", platform)
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
        setTeams((data || []) as TeamRow[]);
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
          <p>{platformName} Battlefield Ladder Rankings</p>
          <h1>{gameName} {ladderName}</h1>
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
        ) : rankedTeams.length === 0 ? (
          <p className="state">No teams are ranked on this ladder yet.</p>
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
                {rankedTeams.map((team, index) => (
                  <tr key={team.id}>
                    <td>{index + 1}</td>
                    <td>
                      <Link href={`/teams/${team.id}`}>
                        {team.tag ? `[${team.tag}] ` : ""}
                        {team.name || "Unnamed Team"}
                      </Link>
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
