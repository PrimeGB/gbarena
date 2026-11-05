"use client";

import Link from "next/link";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { useUser } from "../../lib/useUser";
import { gamingGameLabel } from "../../lib/gamingAccounts";
import GetCreditsBox from "../components/GetCreditsBox";
import TournamentDisclaimerBox from "../components/TournamentDisclaimerBox";

type Tournament = {
  id: string;
  title: string;
  platform: string | null;
  game: string | null;
  format: string | null;
  team_size: string | null;
  starts_at: string | null;
  check_in_minutes: number | null;
  max_teams: number | null;
  is_free: boolean;
  entry_fee: number | null;
  entry_fee_credits: number;
  prize_credits: number;
  prize_per_player?: boolean;
  competition_type?: "standard" | "weekly_cup";
  prize: string | null;
  rules: string | null;
  status: string;
};

type OwnedTeam = {
  id: string;
  name: string;
  platform: string | null;
  category: string | null;
  game: string | null;
};
type Registration = { tournament_id: string; team_id: string };
type TournamentScope = {
  platform: string;
  category: string;
  game: string;
};

function normalizeValue(value: string | null | undefined) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function matchesPlatform(value: string | null | undefined, platform: string) {
  if (!value) return true;
  const actual = normalizeValue(value);
  const expected = normalizeValue(platform);
  if (actual === expected) return true;
  if (expected === "nintendo" && actual.includes("switch")) return true;
  return actual.startsWith(expected) || expected.startsWith(actual);
}

function matchesGame(value: string | null | undefined, category: string, game: string) {
  if (!value) return false;
  const actual = normalizeValue(value);
  const canonical = normalizeValue(gamingGameLabel(category, game) || game);
  const slug = normalizeValue(game);
  const aliases = game === "modern-warfare-4" ? ["mw4", "codmw4"] : [];
  return (
    actual === canonical ||
    actual === slug ||
    actual.endsWith(canonical) ||
    aliases.includes(actual)
  );
}

function formatDate(value: string | null) {
  if (!value) return "TBD";
  return new Date(value).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(value: string | null) {
  if (!value) return "TBD";
  return new Date(value).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

export default function TournamentsPage() {
  return (
    <Suspense fallback={<div className="t-empty">Loading tournaments...</div>}>
      <TournamentListing />
    </Suspense>
  );
}

function TournamentListing() {
  const searchParams = useSearchParams();
  const platformParam = searchParams.get("platform") || "";
  const categoryParam = searchParams.get("category") || "";
  const gameParam = searchParams.get("game") || "";
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const { user } = useUser();
  const [teams, setTeams] = useState<OwnedTeam[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [pickedTeam, setPickedTeam] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ id: string; text: string; ok: boolean } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const scope: TournamentScope | null =
    platformParam && categoryParam && gameParam
      ? { platform: platformParam, category: categoryParam, game: gameParam }
      : null;
  const gameLabel = scope
    ? gamingGameLabel(scope.category, scope.game) || scope.game
    : "";

  async function loadRegistrations() {
    const { data } = await supabase
      .from("tournament_registrations")
      .select("tournament_id, team_id");
    setRegistrations((data as Registration[]) || []);
  }

  useEffect(() => {
    let active = true;
    supabase
      .from("tournament_registrations")
      .select("tournament_id, team_id")
      .then(({ data }) => {
        if (active) setRegistrations((data as Registration[]) || []);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("teams")
      .select("id, name, platform, category, game")
      .eq("owner_id", user.id)
      .then(({ data }) => setTeams((data as OwnedTeam[]) || []));
  }, [user]);

  async function register(t: Tournament, teamId: string) {
    setBusyId(t.id);
    setMessage(null);
    const { error } = await supabase.rpc("register_team_for_tournament", {
      p_tournament_id: t.id,
      p_team_id: teamId,
    });
    setBusyId(null);
    setMessage({ id: t.id, ok: !error, text: error ? error.message : "Team registered!" });
    loadRegistrations();
  }

  async function withdraw(t: Tournament, teamId: string) {
    setBusyId(t.id);
    setMessage(null);
    const { error } = await supabase.rpc("unregister_team_from_tournament", {
      p_tournament_id: t.id,
      p_team_id: teamId,
    });
    setBusyId(null);
    setMessage({ id: t.id, ok: !error, text: error ? error.message : "Team withdrawn." });
    loadRegistrations();
  }

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const currentScope = platformParam && categoryParam && gameParam
        ? { platform: platformParam, category: categoryParam, game: gameParam }
        : null;

      const { data } = await supabase
        .from("tournaments")
        .select("*")
        .in("status", ["upcoming", "live"])
        .order("starts_at", { ascending: true });
      if (!active) return;
      const availableTournaments = (data as Tournament[]) || [];
      setTournaments(
        currentScope
          ? availableTournaments.filter(
              (tournament) =>
                matchesPlatform(tournament.platform, currentScope.platform) &&
                matchesGame(tournament.game, currentScope.category, currentScope.game)
            )
          : availableTournaments
      );
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [platformParam, categoryParam, gameParam]);

  return (
    <>
      <style>{`
        .t-page{max-width:1100px;margin:0 auto;padding:14px 10px 30px;font-family:Tahoma,Verdana,Arial,sans-serif;color:#d7e2ee;}
        .t-nav{display:flex;gap:14px;flex-wrap:wrap;background:#0a1622;border:1px solid #3b7fc2;padding:9px 12px;margin-bottom:10px;}
        .t-nav a{color:#e3f1ff;font-size:11px;font-weight:bold;text-transform:uppercase;text-decoration:none;}
        .t-nav a:hover{color:#f2c14e;}
        .t-hero{background:linear-gradient(135deg,#0b2036,#06101a);border:1px solid #3b7fc2;padding:24px 22px;margin-bottom:12px;display:flex;flex-direction:column;gap:18px;}
        .t-hero-text{min-width:0;}
        .t-hero-side{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;}
        .td-box{width:auto;background:#07111b;border:1px solid #3b7fc2;padding:12px;font-size:12px;color:#c8d8e8;}
        .td-head{color:#7ec3ff;font-weight:bold;text-transform:uppercase;font-size:12px;margin-bottom:6px;}
        .td-box p{margin:0 0 8px;max-width:none;font-size:12px;}
        .td-btn{background:#3b7fc2;color:#fff;border:0;font-weight:bold;padding:8px 14px;cursor:pointer;text-transform:uppercase;font-size:11px;}
        .td-body{margin-top:10px;max-height:360px;overflow-y:auto;padding-right:4px;}
        .td-sec{margin-bottom:10px;}
        .td-sec-title{color:#eaf5ff;font-weight:bold;font-size:11px;text-transform:uppercase;margin-bottom:4px;}
        .td-sec ul{margin:0;padding-left:16px;}
        .td-sec li{font-size:11px;line-height:1.45;margin-bottom:3px;color:#9fb9cf;}
        .td-link{color:#f2c14e;font-size:11px;}
        .td-note{margin-top:8px;font-size:10px;color:#7f9ab3;font-style:italic;}
        .gc-box{width:auto;background:#07111b;border:1px solid #f2c14e;padding:12px;font-size:12px;color:#c8d8e8;}
        .gc-head{color:#f2c14e;font-weight:bold;text-transform:uppercase;font-size:12px;margin-bottom:6px;}
        .gc-box p{margin:0 0 8px;max-width:none;font-size:12px;}
        .gc-btn{background:#f2c14e;color:#111;border:0;font-weight:bold;padding:8px 14px;cursor:pointer;text-transform:uppercase;font-size:11px;}
        .gc-packs{display:grid;gap:4px;margin-bottom:8px;}
        .gc-pack{display:flex;align-items:center;gap:8px;border:1px solid #16324a;padding:6px 8px;cursor:pointer;}
        .gc-pack.on{border-color:#f2c14e;background:#10263a;}
        .gc-pack span{margin-left:auto;color:#7affc8;font-weight:bold;}
        .gc-terms{display:flex;gap:6px;font-size:10px;line-height:1.4;margin-bottom:8px;}
        .gc-terms a{color:#f2c14e;}
        .gc-err{color:#ff8a8a;margin-top:6px;}
        .gc-ok{color:#7affc8;margin-top:6px;}
        .gc-note{color:#9fb9cf;font-style:italic;}
        .gc-secure{margin-top:8px;font-size:10px;color:#7f9ab3;}
        .t-hero h1{font-size:28px;font-style:italic;font-weight:900;color:#eaf5ff;text-transform:uppercase;letter-spacing:.5px;}
        .t-hero p{margin-top:8px;font-size:12px;line-height:1.5;color:#9fb9cf;max-width:720px;}
        .t-panel{background:#0a1622;border:1px solid #3b7fc2;}
        .t-title{height:26px;background:#0f2a40;border-bottom:1px solid #3b7fc2;display:flex;align-items:center;padding-left:10px;font-size:11px;font-weight:bold;color:#f2c14e;text-transform:uppercase;}
        .t-empty{padding:34px 16px;text-align:center;font-size:12px;color:#9fb9cf;line-height:1.6;}
        .t-empty strong{display:block;color:#f2c14e;font-size:14px;margin-bottom:6px;text-transform:uppercase;}
        .t-empty .t-all-link{display:block;width:max-content;max-width:100%;margin:16px auto 0;padding:9px 14px;border:1px solid #4f93d6;border-radius:999px;color:#cfe6ff;font-size:11px;font-weight:bold;text-decoration:none;}
        .t-empty .t-all-link:hover{background:#10263a;color:#fff;}
        .t-list{padding:12px;display:grid;gap:14px;}
        .t-card{background:linear-gradient(#0b1a29,#07111b);border:1px solid #1f4566;border-radius:10px;overflow:hidden;}
        .t-card.live{border-color:#c40000;box-shadow:0 0 18px rgba(196,0,0,.25);}
        .t-head{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;background:#0f2a40;border-bottom:1px solid #3b7fc2;padding:12px 16px;}
        .t-name{font-size:16px;font-weight:900;color:#f2c14e;text-transform:uppercase;letter-spacing:.3px;}
        .t-cup-label{display:inline-block;margin-left:9px;padding:4px 7px;border:1px solid #6b5217;border-radius:999px;color:#ffe9a8;font-size:9px;vertical-align:middle;letter-spacing:.05em;}
        .t-badge{font-size:10px;font-weight:bold;padding:3px 10px;border:1px solid;border-radius:999px;text-transform:uppercase;}
        .t-badge.free{background:#0d3a1f;border-color:#2fbf62;color:#7dffae;}
        .t-badge.paid{background:#3a2a05;border-color:#f2c14e;color:#ffd978;}
        .t-badge.live{background:#6a0000;border-color:#c40000;color:#fff;margin-right:6px;}
        .t-meta{display:flex;flex-wrap:wrap;gap:8px;padding:14px 16px 4px;}
        .t-meta span{background:#0d2236;border:1px solid #1f4566;border-radius:999px;padding:6px 12px;font-size:12px;color:#d7e8f8;}
        .t-stats{display:grid;grid-template-columns:1.6fr 1fr 1fr 1fr;gap:10px;padding:12px 16px;}
        .t-stat{background:#0a1a2a;border:1px solid #16324a;border-radius:8px;padding:10px 12px;}
        .t-stat span{display:block;font-size:10px;color:#8fb0cc;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px;}
        .t-stat b{font-size:14px;color:#eaf5ff;}
        .t-stat.prize{border-color:#6b5217;background:linear-gradient(#1b1606,#100d04);}
        .t-stat.prize b{color:#f2c14e;font-size:16px;}
        .t-bar{height:5px;border-radius:999px;background:#16324a;margin-top:8px;overflow:hidden;}
        .t-bar i{display:block;height:100%;background:linear-gradient(90deg,#2fbf62,#7dffae);}
        .t-actions{padding:12px 16px 16px;display:flex;gap:10px;flex-wrap:wrap;justify-content:space-between;align-items:center;border-top:1px solid #16324a;}
        .t-actions-left,.t-actions-right{display:flex;gap:8px;flex-wrap:wrap;align-items:center;}
        .t-btn{background:linear-gradient(#f2c14e,#c9951f);border:1px solid #f2c14e;border-radius:999px;color:#111;font-size:11px;font-weight:800;text-transform:uppercase;padding:9px 18px;cursor:pointer;}
        .t-btn:hover{filter:brightness(1.1);}
        .t-btn.ghost{background:transparent;border-color:#4f93d6;color:#cfe6ff;}
        .t-btn.ghost:hover{background:#10263a;}
        .t-btn.off{opacity:.55;cursor:not-allowed;background:#1a2a3a;border-color:#2a4560;color:#9fb9cf;}
        a.t-btn{text-decoration:none;display:inline-block;}
        .t-select{background:#07111b;border:1px solid #2a4560;border-radius:999px;color:#eaf5ff;padding:8px 12px;font-size:12px;}
        .t-msg{margin:0 16px 12px;padding:8px 12px;font-size:12px;border:1px solid;border-radius:6px;}
        .t-msg.ok{background:#0d3a1f;border-color:#2fbf62;color:#7dffae;}
        .t-msg.err{background:#3a0a0a;border-color:#c40000;color:#ffb3b3;}
        .t-rules{border-top:1px solid #16324a;padding:12px;font-size:12px;line-height:1.6;white-space:pre-wrap;color:#d7e2ee;}
        .t-rules h4{color:#f2c14e;font-size:11px;text-transform:uppercase;margin-bottom:6px;}
        .t-how{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:10px;}
        .t-step{background:#07111b;border:1px solid #16324a;padding:12px;font-size:11px;line-height:1.5;color:#c8d8e8;}
        .t-step b{display:block;color:#f2c14e;text-transform:uppercase;margin-bottom:4px;font-size:11px;}
        @media(max-width:768px){
          .t-stats{grid-template-columns:repeat(2,minmax(0,1fr));}
          .t-how{grid-template-columns:minmax(0,1fr);}
          .t-hero-side{grid-template-columns:minmax(0,1fr);}
          .t-actions{flex-direction:column;align-items:stretch;}
          .t-hero h1{font-size:22px;}
        }
      `}</style>

      <div className="t-page">
        <nav className="t-nav">
          <Link href="/home">Home</Link>
          {scope && (
            <>
              <Link href={`/ladders/${scope.platform}/${scope.category}/${scope.game}`}>
                {gameLabel} Ladders
              </Link>
              <Link href="/tournaments">All Tournaments</Link>
            </>
          )}
          <Link href="/forums">Forums</Link>
          <Link href="/activity">Community</Link>
          <Link href="/members">Members</Link>
          <Link href="/rules">Rules</Link>
          <Link href="/support">Support</Link>
        </nav>

        <div className="t-hero">
          <div className="t-hero-text">
            <h1>{scope ? `${gameLabel} Tournaments` : "Tournaments"}</h1>
            <p>
              {scope
                ? `Upcoming and live events for ${gameLabel} on ${scope.platform}. View event details, rules and prizes, or register your eligible team.`
                : "Every GameBattles tournament starts here. Find free Saturday Community Cups, enter with your team, and compete for credits and winner awards. Monthly team champions also earn credits and an award."}
            </p>
          </div>
          <div className="t-hero-side">
            <GetCreditsBox />
            <TournamentDisclaimerBox />
          </div>
        </div>

        <div className="t-panel">
          <div className="t-title">
            {scope ? `${scope.platform} · ${gameLabel} Events` : "Upcoming Tournaments"}
          </div>

          {loading ? (
            <div className="t-empty">Loading tournaments...</div>
          ) : tournaments.length === 0 ? (
            <div className="t-empty">
              <strong>
                {scope ? `No active ${gameLabel} tournaments` : "0 Upcoming Tournaments"}
              </strong>
              {scope
                ? `There are no upcoming or live ${gameLabel} tournaments for ${scope.platform} right now. This is the ${gameLabel} tournament hub; check back for future events.`
                : "Nothing is scheduled right now. Check back soon - dates, times, rules and prizes will be posted here as soon as a tournament is announced."}
              {scope && (
                <Link className="t-all-link" href="/tournaments">
                  Click here to see all tournaments
                </Link>
              )}
            </div>
          ) : (
            <div className="t-list">
              {tournaments.map((t) => {
                const credits = t.entry_fee_credits || 0;
                const free = credits > 0 || t.is_free || !t.entry_fee;
                const open = openId === t.id;
                const regs = registrations.filter((r) => r.tournament_id === t.id);
                const eligible = teams.filter((tm) => {
                  const samePlatform = !t.platform || matchesPlatform(tm.platform, t.platform);
                  const sameGame = !t.game || matchesGame(t.game, tm.category || "", tm.game || "");
                  const sameScope = !scope || (
                    tm.category === scope.category &&
                    matchesPlatform(tm.platform, scope.platform) &&
                    matchesGame(tm.game, scope.category, scope.game)
                  );
                  return samePlatform && sameGame && sameScope;
                });
                const myReg = regs.find((r) => teams.some((tm) => tm.id === r.team_id));
                const full = t.max_teams != null && regs.length >= t.max_teams;
                const picked = pickedTeam[t.id] || eligible[0]?.id || "";
                return (
                  <div
                    key={t.id}
                    className={`t-card ${t.status === "live" ? "live" : ""}`}
                  >
                    <div className="t-head">
                      <div className="t-name">
                        {t.title}
                        {t.competition_type === "weekly_cup" && (
                          <span className="t-cup-label">Weekly Community Cup</span>
                        )}
                      </div>
                      <div>
                        {t.status === "live" && (
                          <span className="t-badge live">Live</span>
                        )}
                        <span className={`t-badge ${free ? "free" : "paid"}`}>
                          {credits > 0
                            ? `Entry ${credits.toLocaleString()} credits`
                            : free
                              ? "Free Entry"
                              : `Entry $${Number(t.entry_fee).toFixed(2)}`}
                        </span>
                      </div>
                    </div>

                    <div className="t-meta">
                      <span>📅 {t.starts_at ? `${formatDate(t.starts_at)} · ${formatTime(t.starts_at)}` : "Date & time TBA"}</span>
                      <span>🎮 {[t.game, t.platform].filter(Boolean).join(" · ") || "Game TBA"}</span>
                      <span>👥 {[t.format, t.team_size].filter(Boolean).join(" · ") || "Format TBA"}</span>
                    </div>

                    <div className="t-stats">
                      <div className="t-stat prize">
                        <span>Prize</span>
                        <b>
                          {[t.prize_credits > 0 ? `${t.prize_credits.toLocaleString()} credits${t.prize_per_player ? " each" : ""}` : "", t.prize || ""]
                            .filter(Boolean)
                            .join(" + ") || "TBA"}
                        </b>
                      </div>
                      <div className="t-stat">
                        <span>Teams</span>
                        <b>
                          {regs.length} / {t.max_teams ?? "∞"}
                        </b>
                        {t.max_teams ? (
                          <div className="t-bar">
                            <i style={{ width: `${Math.min(100, (regs.length / t.max_teams) * 100)}%` }} />
                          </div>
                        ) : null}
                      </div>
                      <div className="t-stat">
                        <span>Entry</span>
                        <b>{credits > 0 ? `${credits.toLocaleString()} credits` : free ? "Free" : `$${Number(t.entry_fee).toFixed(2)}`}</b>
                      </div>
                      <div className="t-stat">
                        <span>Check-in</span>
                        <b>{t.check_in_minutes ?? 30} min before</b>
                      </div>
                    </div>

                    <div className="t-actions">
                      <div className="t-actions-left">
                        <button
                          className="t-btn ghost"
                          onClick={() => setOpenId(open ? null : t.id)}
                        >
                          {open ? "Hide Rules" : "View Rules"}
                        </button>
                        <Link
                          className="t-btn ghost"
                          href={
                            scope
                              ? `/tournaments/${t.id}?returnTo=${encodeURIComponent(`/tournaments?platform=${scope.platform}&category=${scope.category}&game=${scope.game}`)}`
                              : `/tournaments/${t.id}`
                          }
                        >
                          View Bracket
                        </Link>
                      </div>
                      <div className="t-actions-right">
                      {t.status !== "upcoming" ? (
                        <button className="t-btn off" disabled>
                          Registration Closed
                        </button>
                      ) : !free ? (
                        <button className="t-btn off" disabled>
                          Paid Entry - Online Registration Coming Soon
                        </button>
                      ) : !user ? (
                        <Link className="t-btn" href="/login">
                          Sign In To Register
                        </Link>
                      ) : myReg ? (
                        <button
                          className="t-btn"
                          disabled={busyId === t.id}
                          onClick={() => withdraw(t, myReg.team_id)}
                        >
                          Registered - Withdraw
                        </button>
                      ) : eligible.length === 0 ? (
                        <button className="t-btn off" disabled>
                          You need a team you own{t.platform ? ` on ${t.platform}` : ""}
                        </button>
                      ) : full ? (
                        <button className="t-btn off" disabled>
                          Tournament Full
                        </button>
                      ) : (
                        <>
                          <select
                            className="t-select"
                            value={picked}
                            onChange={(e) =>
                              setPickedTeam((p) => ({ ...p, [t.id]: e.target.value }))
                            }
                          >
                            {eligible.map((tm) => (
                              <option key={tm.id} value={tm.id}>
                                {tm.name}
                              </option>
                            ))}
                          </select>
                          <button
                            className="t-btn"
                            disabled={busyId === t.id || !picked}
                            onClick={() => register(t, picked)}
                          >
                            Register Team
                          </button>
                        </>
                      )}
                      </div>
                    </div>
                    {message?.id === t.id && (
                      <div className={`t-msg ${message.ok ? "ok" : "err"}`}>
                        {message.text}
                      </div>
                    )}

                    {open && (
                      <div className="t-rules">
                        <h4>Tournament Rules</h4>
                        {t.rules || "Rules will be posted before the tournament starts."}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="t-how">
          <div className="t-step">
            <b>1. Find an event</b>
            Pick a tournament and note the date, start time and entry cost.
          </div>
          <div className="t-step">
            <b>2. Read the rules</b>
            Every event lists its own rules and prizes. Make sure your team
            agrees before signing up.
          </div>
          <div className="t-step">
            <b>3. Check in</b>
            Check in before the start time or your spot may be given away.
          </div>
        </div>
      </div>
    </>
  );
}
