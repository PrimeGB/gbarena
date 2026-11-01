"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useUser } from "../../lib/useUser";

type Tournament = {
  id: string;
  title: string;
  platform: string | null;
  game: string | null;
  format: string | null;
  team_size: string | null;
  starts_at: string;
  check_in_minutes: number | null;
  max_teams: number | null;
  is_free: boolean;
  entry_fee: number | null;
  prize: string | null;
  rules: string | null;
  status: string;
};

type OwnedTeam = { id: string; name: string; platform: string | null };
type Registration = { tournament_id: string; team_id: string };

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const { user } = useUser();
  const [teams, setTeams] = useState<OwnedTeam[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [pickedTeam, setPickedTeam] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ id: string; text: string; ok: boolean } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function loadRegistrations() {
    const { data } = await supabase
      .from("tournament_registrations")
      .select("tournament_id, team_id");
    setRegistrations((data as Registration[]) || []);
  }

  useEffect(() => {
    loadRegistrations();
  }, []);

  useEffect(() => {
    if (!user) {
      setTeams([]);
      return;
    }
    supabase
      .from("teams")
      .select("id, name, platform")
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
      const { data } = await supabase
        .from("tournaments")
        .select("*")
        .in("status", ["upcoming", "live"])
        .order("starts_at", { ascending: true });
      if (!active) return;
      setTournaments((data as Tournament[]) || []);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <style>{`
        .t-page{max-width:1100px;margin:0 auto;padding:14px 10px 30px;font-family:Tahoma,Verdana,Arial,sans-serif;color:#d7e2ee;}
        .t-nav{display:flex;gap:14px;flex-wrap:wrap;background:#0a1622;border:1px solid #3b7fc2;padding:9px 12px;margin-bottom:10px;}
        .t-nav a{color:#e3f1ff;font-size:11px;font-weight:bold;text-transform:uppercase;text-decoration:none;}
        .t-nav a:hover{color:#f2c14e;}
        .t-hero{background:linear-gradient(135deg,#0b2036,#06101a);border:1px solid #3b7fc2;padding:22px 20px;margin-bottom:10px;}
        .t-hero h1{font-size:28px;font-style:italic;font-weight:900;color:#eaf5ff;text-transform:uppercase;letter-spacing:.5px;}
        .t-hero p{margin-top:8px;font-size:12px;line-height:1.5;color:#9fb9cf;max-width:720px;}
        .t-panel{background:#0a1622;border:1px solid #3b7fc2;}
        .t-title{height:26px;background:#0f2a40;border-bottom:1px solid #3b7fc2;display:flex;align-items:center;padding-left:10px;font-size:11px;font-weight:bold;color:#f2c14e;text-transform:uppercase;}
        .t-empty{padding:34px 16px;text-align:center;font-size:12px;color:#9fb9cf;line-height:1.6;}
        .t-empty strong{display:block;color:#f2c14e;font-size:14px;margin-bottom:6px;text-transform:uppercase;}
        .t-list{padding:10px;display:grid;gap:10px;}
        .t-card{background:#07111b;border:1px solid #16324a;}
        .t-card.live{border-color:#c40000;}
        .t-head{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;background:#0f2a40;border-bottom:1px solid #3b7fc2;padding:9px 12px;}
        .t-name{font-size:15px;font-weight:bold;color:#f2c14e;text-transform:uppercase;}
        .t-badge{font-size:10px;font-weight:bold;padding:3px 8px;border:1px solid;text-transform:uppercase;}
        .t-badge.free{background:#0d3a1f;border-color:#2fbf62;color:#7dffae;}
        .t-badge.paid{background:#3a2a05;border-color:#f2c14e;color:#ffd978;}
        .t-badge.live{background:#6a0000;border-color:#c40000;color:#fff;margin-right:6px;}
        .t-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:1px;background:#16324a;}
        .t-cell{background:#07111b;padding:10px 12px;}
        .t-cell span{display:block;font-size:9px;color:#8fb0cc;text-transform:uppercase;margin-bottom:4px;}
        .t-cell b{font-size:12px;color:#eaf5ff;}
        .t-actions{padding:10px 12px;display:flex;gap:8px;flex-wrap:wrap;}
        .t-btn{background:linear-gradient(#1d5f9c,#0f3a63);border:1px solid #4f93d6;color:#fff;font-size:11px;font-weight:bold;text-transform:uppercase;padding:7px 14px;cursor:pointer;}
        .t-btn:hover{background:linear-gradient(#2a78c0,#154a7a);}
        .t-btn.off{opacity:.55;cursor:not-allowed;}
        a.t-btn{text-decoration:none;display:inline-block;}
        .t-select{background:#07111b;border:1px solid #16324a;color:#eaf5ff;padding:6px;font-size:12px;}
        .t-msg{margin:0 12px 10px;padding:7px 10px;font-size:12px;border:1px solid;}
        .t-msg.ok{background:#0d3a1f;border-color:#2fbf62;color:#7dffae;}
        .t-msg.err{background:#3a0a0a;border-color:#c40000;color:#ffb3b3;}
        .t-rules{border-top:1px solid #16324a;padding:12px;font-size:12px;line-height:1.6;white-space:pre-wrap;color:#d7e2ee;}
        .t-rules h4{color:#f2c14e;font-size:11px;text-transform:uppercase;margin-bottom:6px;}
        .t-how{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:10px;}
        .t-step{background:#07111b;border:1px solid #16324a;padding:12px;font-size:11px;line-height:1.5;color:#c8d8e8;}
        .t-step b{display:block;color:#f2c14e;text-transform:uppercase;margin-bottom:4px;font-size:11px;}
        @media(max-width:768px){
          .t-grid{grid-template-columns:repeat(2,minmax(0,1fr));}
          .t-how{grid-template-columns:minmax(0,1fr);}
          .t-hero h1{font-size:22px;}
        }
      `}</style>

      <div className="t-page">
        <nav className="t-nav">
          <a href="/home">Home</a>
          <a href="/forums">Forums</a>
          <a href="/members">Members</a>
          <a href="/rules">Rules</a>
          <a href="/support">Support</a>
        </nav>

        <div className="t-hero">
          <h1>Tournaments</h1>
          <p>
            Every GameBattles tournament starts here. Browse what&apos;s coming
            up, check the date, time, rules and prizes, and see whether it&apos;s
            free to enter.
          </p>
        </div>

        <div className="t-panel">
          <div className="t-title">Upcoming Tournaments</div>

          {loading ? (
            <div className="t-empty">Loading tournaments...</div>
          ) : tournaments.length === 0 ? (
            <div className="t-empty">
              <strong>0 Upcoming Tournaments</strong>
              Nothing is scheduled right now. Check back soon - dates, times,
              rules and prizes will be posted here as soon as a tournament is
              announced.
            </div>
          ) : (
            <div className="t-list">
              {tournaments.map((t) => {
                const free = t.is_free || !t.entry_fee;
                const open = openId === t.id;
                const regs = registrations.filter((r) => r.tournament_id === t.id);
                const eligible = teams.filter(
                  (tm) => !t.platform || tm.platform === t.platform
                );
                const myReg = regs.find((r) => teams.some((tm) => tm.id === r.team_id));
                const full = t.max_teams != null && regs.length >= t.max_teams;
                const picked = pickedTeam[t.id] || eligible[0]?.id || "";
                return (
                  <div
                    key={t.id}
                    className={`t-card ${t.status === "live" ? "live" : ""}`}
                  >
                    <div className="t-head">
                      <div className="t-name">{t.title}</div>
                      <div>
                        {t.status === "live" && (
                          <span className="t-badge live">Live</span>
                        )}
                        <span className={`t-badge ${free ? "free" : "paid"}`}>
                          {free
                            ? "Free Entry"
                            : `Entry $${Number(t.entry_fee).toFixed(2)}`}
                        </span>
                      </div>
                    </div>

                    <div className="t-grid">
                      <div className="t-cell">
                        <span>Date</span>
                        <b>{formatDate(t.starts_at)}</b>
                      </div>
                      <div className="t-cell">
                        <span>Start Time</span>
                        <b>{formatTime(t.starts_at)}</b>
                      </div>
                      <div className="t-cell">
                        <span>Game / Platform</span>
                        <b>
                          {[t.game, t.platform].filter(Boolean).join(" - ") ||
                            "TBA"}
                        </b>
                      </div>
                      <div className="t-cell">
                        <span>Format</span>
                        <b>
                          {[t.format, t.team_size].filter(Boolean).join(" - ") ||
                            "TBA"}
                        </b>
                      </div>
                      <div className="t-cell">
                        <span>Prizes</span>
                        <b>{t.prize || "TBA"}</b>
                      </div>
                      <div className="t-cell">
                        <span>Check-In</span>
                        <b>{t.check_in_minutes ?? 30} min before start</b>
                      </div>
                      <div className="t-cell">
                        <span>Max Teams</span>
                        <b>
                          {regs.length} registered / {t.max_teams ?? "Unlimited"}
                        </b>
                      </div>
                      <div className="t-cell">
                        <span>Cost</span>
                        <b>{free ? "Free" : `$${Number(t.entry_fee).toFixed(2)}`}</b>
                      </div>
                    </div>

                    <div className="t-actions">
                      <button
                        className="t-btn"
                        onClick={() => setOpenId(open ? null : t.id)}
                      >
                        {open ? "Hide Rules" : "View Rules"}
                      </button>
                      {t.status !== "upcoming" ? (
                        <button className="t-btn off" disabled>
                          Registration Closed
                        </button>
                      ) : !free ? (
                        <button className="t-btn off" disabled>
                          Paid Entry - Online Registration Coming Soon
                        </button>
                      ) : !user ? (
                        <a className="t-btn" href="/login">
                          Sign In To Register
                        </a>
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
