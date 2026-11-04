"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

type BracketMatch = {
  id: string;
  round: number;
  slot: number;
  team_a: string | null;
  team_b: string | null;
  winner_id: string | null;
};

type TeamInfo = { id: string; name: string; logo_url: string | null };

type TournamentInfo = {
  id: string;
  title: string;
  game: string | null;
  platform: string | null;
  status: string;
  starts_at: string | null;
};

function roundName(round: number, total: number) {
  if (round === total) return "Final";
  if (round === total - 1) return "Semifinals";
  if (round === total - 2) return "Quarterfinals";
  return `Round ${round}`;
}

export default function TournamentBracketPage() {
  return (
    <Suspense fallback={<div className="br-empty">Loading tournament...</div>}>
      <TournamentBracket />
    </Suspense>
  );
}

function TournamentBracket() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = String(params?.id || "");
  const [tournament, setTournament] = useState<TournamentInfo | null>(null);
  const [matches, setMatches] = useState<BracketMatch[]>([]);
  const [teams, setTeams] = useState<Record<string, TeamInfo>>({});
  const [isStaff, setIsStaff] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const requestedReturn = searchParams.get("returnTo");
  const backHref = requestedReturn?.startsWith("/tournaments?")
    ? requestedReturn
    : "/tournaments";

  const load = useCallback(async () => {
    const [{ data: t }, { data: ms }] = await Promise.all([
      supabase.from("tournaments").select("id,title,game,platform,status,starts_at").eq("id", id).maybeSingle(),
      supabase.from("tournament_matches").select("id,round,slot,team_a,team_b,winner_id").eq("tournament_id", id).order("round").order("slot"),
    ]);
    const rows = (ms || []) as BracketMatch[];
    const teamIds = Array.from(new Set(rows.flatMap((m) => [m.team_a, m.team_b]).filter(Boolean))) as string[];
    if (teamIds.length > 0) {
      const { data: tm } = await supabase.from("teams").select("id,name,logo_url").in("id", teamIds);
      setTeams(Object.fromEntries(((tm || []) as TeamInfo[]).map((x) => [x.id, x])));
    }
    setTournament((t as TournamentInfo) || null);
    setMatches(rows);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    if (id) queueMicrotask(load);
  }, [id, load]);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: allowed } = await supabase.rpc("has_staff_permission", { permission_key: "staff_access" });
      setIsStaff(allowed === true);
    });
  }, []);

  async function run(fn: string, args: Record<string, unknown>, confirmText?: string) {
    if (confirmText && !window.confirm(confirmText)) return;
    setMessage("");
    const { error } = await supabase.rpc(fn, args);
    if (error) setMessage(error.message);
    await load();
  }

  const totalRounds = matches.reduce((max, m) => Math.max(max, m.round), 0);
  const rounds = Array.from({ length: totalRounds }, (_, i) => i + 1);

  function teamRow(m: BracketMatch, teamId: string | null) {
    const team = teamId ? teams[teamId] : null;
    const won = teamId && m.winner_id === teamId;
    const lost = teamId && m.winner_id && m.winner_id !== teamId;
    const canPick = isStaff && m.team_a && m.team_b && teamId;
    return (
      <div className={`br-team ${won ? "won" : ""} ${lost ? "lost" : ""}`}>
        {team ? (
          <Link href={`/teams/${team.id}`}>{team.name}</Link>
        ) : (
          <span className="tbd">{teamId ? "Loading..." : m.round === 1 ? "BYE" : "TBD"}</span>
        )}
        {canPick && !m.winner_id && (
          <button type="button" onClick={() => run("set_tournament_match_winner", { p_match: m.id, p_winner: teamId })}>
            Win
          </button>
        )}
        {won && <span className="crown">✓</span>}
      </div>
    );
  }

  return (
    <>
      <style>{`
        *{margin:0;padding:0;box-sizing:border-box;}
        body{background:#000;font-family:Tahoma,Verdana,Arial,sans-serif;color:#cfd6dc;}
        .br-page{min-height:100vh;padding:28px 16px;background:radial-gradient(circle at top,rgba(20,55,85,.3),transparent 40%),linear-gradient(#020202,#000);}
        .br-head{max-width:1200px;margin:0 auto 18px;}
        .br-head a{color:#f2c14e;font-size:12px;text-decoration:none;}
        .br-head h1{color:#fff;font-size:26px;margin:8px 0 4px;}
        .br-head p{font-size:13px;opacity:.8;}
        .br-staff{max-width:1200px;margin:0 auto 14px;display:flex;gap:8px;flex-wrap:wrap;align-items:center;}
        .br-staff button{background:linear-gradient(#f2c14e,#c9951f);border:0;border-radius:999px;padding:8px 16px;font:800 11px Tahoma;text-transform:uppercase;cursor:pointer;}
        .br-staff button.red{background:#a33030;color:#fff;}
        .br-msg{color:#ff9b9b;font-size:13px;}
        .br-scroll{max-width:1200px;margin:0 auto;overflow-x:auto;padding-bottom:16px;}
        .br-grid{display:flex;gap:28px;min-width:max-content;align-items:stretch;}
        .br-round{display:flex;flex-direction:column;justify-content:space-around;gap:14px;min-width:220px;}
        .br-round h2{font-size:12px;text-transform:uppercase;letter-spacing:.8px;color:#f2c14e;text-align:center;margin-bottom:4px;}
        .br-match{border:1px solid rgba(255,255,255,.12);border-radius:10px;overflow:hidden;background:linear-gradient(#0e2336,#07111b);}
        .br-team{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:9px 12px;font-size:13px;min-height:38px;}
        .br-team + .br-team{border-top:1px solid rgba(255,255,255,.08);}
        .br-team a{color:#fff;text-decoration:none;font-weight:700;}
        .br-team .tbd{opacity:.45;font-style:italic;}
        .br-team.won{background:rgba(46,139,61,.25);}
        .br-team.lost{opacity:.45;}
        .br-team button{background:#2e8b3d;color:#fff;border:0;border-radius:6px;padding:4px 10px;font:800 10px Tahoma;cursor:pointer;}
        .crown{color:#7ee08a;font-weight:900;}
        .br-empty{max-width:600px;margin:40px auto;text-align:center;font-size:14px;line-height:1.6;}
      `}</style>
      <div className="br-page">
        <div className="br-head">
          <Link href={backHref}>
            {backHref === "/tournaments" ? "← All Tournaments" : "← Back to game tournaments"}
          </Link>
          <h1>{tournament?.title || (loading ? "Loading..." : "Tournament not found")}</h1>
          {tournament && (
            <p>
              {[tournament.game, tournament.platform].filter(Boolean).join(" - ")}
              {tournament.starts_at ? ` - ${new Date(tournament.starts_at).toLocaleString()}` : ""} - {tournament.status}
            </p>
          )}
        </div>

        {isStaff && tournament && (
          <div className="br-staff">
            {matches.length === 0 ? (
              <button type="button" onClick={() => run("generate_tournament_bracket", { p_tournament: id }, "Generate a randomly seeded bracket from the registered teams? The tournament will go live.")}>
                Generate Bracket
              </button>
            ) : (
              <button type="button" className="red" onClick={() => run("reset_tournament_bracket", { p_tournament: id }, "Delete this bracket and all results?")}>
                Reset Bracket
              </button>
            )}
            {message && <span className="br-msg">{message}</span>}
          </div>
        )}

        {!loading && tournament && matches.length === 0 && (
          <div className="br-empty">
            The bracket has not been generated yet. It is posted here once registration closes and the tournament
            starts.
          </div>
        )}

        {matches.length > 0 && (
          <div className="br-scroll">
            <div className="br-grid">
              {rounds.map((round) => (
                <div className="br-round" key={round}>
                  <h2>{roundName(round, totalRounds)}</h2>
                  {matches
                    .filter((m) => m.round === round)
                    .map((m) => (
                      <div className="br-match" key={m.id}>
                        {teamRow(m, m.team_a)}
                        {teamRow(m, m.team_b)}
                      </div>
                    ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
