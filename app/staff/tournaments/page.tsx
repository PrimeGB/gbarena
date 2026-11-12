"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useUser } from "@/lib/useUser";
import { supabase } from "@/lib/supabase";
import { ladderPlatforms } from "@/lib/ladderCatalog";

type Tournament = {
  id: string;
  title: string;
  platform: string | null;
  game: string | null;
  starts_at: string | null;
  status: string;
  is_free: boolean;
  entry_fee: number | null;
  entry_fee_credits: number;
  prize_credits: number;
  competition_type: "standard" | "weekly_cup";
};

function getNextSaturdayAtEightEastern(weeksAhead = 0) {
  const now = new Date();
  const easternParts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const part = (type: string) => easternParts.find((value) => value.type === type)?.value || "";
  const weekdays: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  };
  const today = new Date(Date.UTC(Number(part("year")), Number(part("month")) - 1, Number(part("day"))));
  let daysUntilSaturday = (6 - weekdays[part("weekday")]) % 7 + weeksAhead * 7;
  if (daysUntilSaturday === 0 && Number(part("hour")) >= 20) daysUntilSaturday = 7;
  today.setUTCDate(today.getUTCDate() + daysUntilSaturday);

  const wantedWallTime = Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate(),
    20
  );
  let instant = new Date(wantedWallTime);
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const displayed = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(instant);
    const value = (type: string) => Number(displayed.find((entry) => entry.type === type)?.value);
    const displayedWallTime = Date.UTC(
      value("year"),
      value("month") - 1,
      value("day"),
      value("hour"),
      value("minute")
    );
    instant = new Date(instant.getTime() + wantedWallTime - displayedWallTime);
  }

  const local = (value: number) => String(value).padStart(2, "0");
  return `${instant.getFullYear()}-${local(instant.getMonth() + 1)}-${local(instant.getDate())}T${local(instant.getHours())}:${local(instant.getMinutes())}`;
}

const emptyForm = {
  title: "Weekly Free Community Cup",
  competition_type: "weekly_cup",
  platform: "",
  game: "",
  format: "Single Elimination",
  team_size: "",
  starts_at: "",
  check_in_minutes: "30",
  max_teams: "",
  entry_fee_credits: "0",
  prize_credits: "5",
  prize: "5 credits per player + Weekly Cup Winner award",
  rules: "",
};

export default function StaffTournamentsPage() {
  const { user, loading: authLoading } = useUser();
  const [allowed, setAllowed] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [canPay, setCanPay] = useState(false);
  const [checking, setChecking] = useState(true);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [payFor, setPayFor] = useState<string | null>(null);
  const [payTeams, setPayTeams] = useState<{ id: string; name: string }[]>([]);
  const [payTeam, setPayTeam] = useState("");
  const [payPlace, setPayPlace] = useState("1");
  const [payAmount, setPayAmount] = useState("");
  const [rewardBusy, setRewardBusy] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const [permission, creditPermission, profile] = await Promise.all([
      supabase.rpc("has_staff_permission", { permission_key: "staff_access" }),
      supabase.rpc("has_staff_permission", { permission_key: "credit_management" }),
      supabase.from("profiles").select("role").eq("id", user.id).maybeSingle(),
    ]);
    if (permission.error || creditPermission.error || profile.error) {
      setError(`Tournament access could not be checked: ${permission.error?.message || creditPermission.error?.message || profile.error?.message}`);
      setAllowed(false);
      setChecking(false);
      return;
    }
    if (permission.data !== true) {
      setAllowed(false);
      setChecking(false);
      return;
    }
    setAllowed(true);
    const owner = profile.data?.role === "owner";
    setIsOwner(owner);
    setCanPay(creditPermission.data === true);
    if (!owner) {
      setForm((current) => current.competition_type === "weekly_cup" ? {
        ...current, competition_type: "standard", title: "", entry_fee_credits: "0", prize_credits: "0", prize: "",
      } : current);
    }
    const { data, error: tournamentsError } = await supabase
      .from("tournaments")
      .select("id,title,platform,game,starts_at,status,is_free,entry_fee,entry_fee_credits,prize_credits,competition_type")
      .order("starts_at", { ascending: true });
    if (tournamentsError) {
      setError(`Tournaments could not be loaded: ${tournamentsError.message}`);
      setChecking(false);
      return;
    }
    setTournaments((data as Tournament[]) || []);
    setChecking(false);
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      if (!user) {
        setChecking(false);
        return;
      }
      void load();
    });
    return () => {
      active = false;
    };
  }, [authLoading, user, load]);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) {
        setForm((current) => ({ ...current, starts_at: getNextSaturdayAtEightEastern() }));
      }
    });
    return () => {
      active = false;
    };
  }, []);

  function set<K extends keyof typeof emptyForm>(key: K, value: (typeof emptyForm)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function create(e: FormEvent) {
    e.preventDefault();
    setError("");
    setNotice("");
    if (!form.title.trim() || !form.starts_at) {
      setError("A title and a start date/time are required.");
      return;
    }
    const fee = Math.max(0, Math.trunc(Number(form.entry_fee_credits) || 0));
    const prizeCredits = Math.max(0, Math.trunc(Number(form.prize_credits) || 0));
    setSaving(true);
    const { error: insertError } = await supabase.from("tournaments").insert({
      title: form.title.trim(),
      platform: form.platform || null,
      game: form.game.trim() || null,
      format: form.format.trim() || null,
      team_size: form.team_size.trim() || null,
      starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
      check_in_minutes: Number(form.check_in_minutes) || 30,
      max_teams: form.max_teams ? Number(form.max_teams) : null,
      is_free: true,
      entry_fee: 0,
      entry_fee_credits: fee,
      prize_credits: prizeCredits,
      prize_per_player: form.competition_type === "weekly_cup",
      competition_type: form.competition_type,
      prize: form.prize.trim() || null,
      rules: form.rules.trim() || null,
      created_by: user?.id,
    });
    setSaving(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setForm({ ...emptyForm, starts_at: getNextSaturdayAtEightEastern(1) });
    setNotice("Tournament created.");
    load();
  }

  async function setStatus(id: string, status: string) {
    setError("");
    const { error: updateError } = await supabase
      .from("tournaments")
      .update({ status })
      .eq("id", id);
    if (updateError) setError(updateError.message);
    load();
  }

  async function openPay(t: Tournament) {
    setError("");
    if (payFor === t.id) {
      setPayFor(null);
      return;
    }
    const { data: regs } = await supabase
      .from("tournament_registrations")
      .select("team_id")
      .eq("tournament_id", t.id);
    const ids = (regs || []).map((r: { team_id: string }) => r.team_id);
    const { data: teams } = ids.length
      ? await supabase.from("teams").select("id,name").in("id", ids)
      : { data: [] as { id: string; name: string }[] };
    setPayTeams((teams as { id: string; name: string }[]) || []);
    setPayTeam("");
    setPayPlace("1");
    setPayAmount("");
    setPayFor(t.id);
  }

  async function payPrize(t: Tournament) {
    setError("");
    setNotice("");
    if (!payTeam) {
      setError("Select the winning team.");
      return;
    }
    const { data, error: rpcError } = await supabase.rpc("staff_award_tournament_prize", {
      p_tournament_id: t.id,
      p_team_id: payTeam,
      p_placement: Number(payPlace) || 1,
      p_total_credits: isOwner && payAmount ? Number(payAmount) : null,
    });
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    setNotice(`Paid ${Number(data).toLocaleString()} credits to the team.`);
    setPayFor(null);
  }

  async function awardChampion(rewardType: "weekly_cup" | "monthly", tournamentId?: string) {
    setError("");
    setNotice("");
    setRewardBusy(true);
    const { data, error: rewardError } = await supabase.rpc(
      "staff_award_competition_champion",
      {
        p_reward_type: rewardType,
        p_tournament_id: tournamentId || null,
      }
    );
    setRewardBusy(false);
    if (rewardError) {
      setError(rewardError.message);
      return;
    }
    const result = data as {
      players_rewarded?: number;
      credits_per_player?: number;
      award?: string;
    };
    setNotice(
      `${result.players_rewarded || 0} players received ${result.credits_per_player || 0} credits each and the ${result.award || "champion"} award.`
    );
    load();
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this tournament and all its registrations?")) return;
    const { error: deleteError } = await supabase.from("tournaments").delete().eq("id", id);
    if (deleteError) setError(deleteError.message);
    load();
  }

  return (
    <>
      <style>{`
        .st-page{max-width:1000px;margin:0 auto;padding:14px 10px 30px;font-family:Tahoma,Verdana,Arial,sans-serif;color:#d7e2ee;}
        .st-panel{background:#0a1622;border:1px solid #3b7fc2;margin-bottom:10px;}
        .st-title{height:26px;background:#0f2a40;border-bottom:1px solid #3b7fc2;display:flex;align-items:center;padding-left:10px;font-size:11px;font-weight:bold;color:#f2c14e;text-transform:uppercase;}
        .st-body{padding:12px;}
        .st-form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;}
        .st-form label{display:grid;gap:4px;font-size:10px;color:#8fb0cc;text-transform:uppercase;}
        .st-form .wide{grid-column:1/-1;}
        .st-form input,.st-form select,.st-form textarea{background:#07111b;border:1px solid #16324a;color:#eaf5ff;padding:8px;font-size:12px;font-family:inherit;}
        .st-form textarea{min-height:120px;resize:vertical;}
        .st-btn{background:linear-gradient(#1d5f9c,#0f3a63);border:1px solid #4f93d6;color:#fff;font-size:11px;font-weight:bold;text-transform:uppercase;padding:8px 16px;cursor:pointer;}
        .st-btn.red{background:linear-gradient(#a00000,#5a0000);border-color:#c40000;}
        .st-btn:disabled{opacity:.6;cursor:not-allowed;}
        .st-row{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;padding:10px 12px;border-bottom:1px solid #16324a;font-size:12px;}
        .st-row b{color:#f2c14e;}
        .st-row small{display:block;color:#8fb0cc;margin-top:3px;}
        .st-actions{display:flex;gap:6px;flex-wrap:wrap;}
        .st-msg{padding:8px 12px;font-size:12px;margin-bottom:10px;border:1px solid;}
        .st-msg.err{background:#3a0a0a;border-color:#c40000;color:#ffb3b3;}
        .st-msg.ok{background:#0d3a1f;border-color:#2fbf62;color:#7dffae;}
        .st-back{display:inline-block;margin-bottom:10px;color:#e3f1ff;font-size:11px;font-weight:bold;text-transform:uppercase;text-decoration:none;}
        @media(max-width:768px){.st-form{grid-template-columns:minmax(0,1fr);}}
      `}</style>

      <div className="st-page">
        <Link className="st-back" href="/staff/dashboard">
          &larr; Staff Dashboard
        </Link>

        {authLoading || checking ? (
          <div className="st-panel">
            <div className="st-body">Loading...</div>
          </div>
        ) : !user ? (
          <div className="st-panel">
            <div className="st-body">Please sign in.</div>
          </div>
        ) : !allowed ? (
          <div className="st-panel">
            <div className="st-body">{error || "This account cannot manage tournaments."}</div>
          </div>
        ) : (
          <>
            {error && <div className="st-msg err">{error}</div>}
            {notice && <div className="st-msg ok">{notice}</div>}

            <div className="st-panel">
              <div className="st-title">Monthly Championship</div>
              <div className="st-body">
                The previous full month&apos;s top team on the official team leaderboard receives 25 credits per player and the Monthly Team Champion award.
                {canPay && <div style={{ marginTop: 10 }}>
                  <button className="st-btn" disabled={rewardBusy} onClick={() => awardChampion("monthly")}>
                    {rewardBusy ? "Awarding..." : "Award monthly champion"}
                  </button>
                </div>}
              </div>
            </div>

            <div className="st-panel">
              <div className="st-title">Create Tournament</div>
              <form className="st-body st-form" onSubmit={create}>
                <label className="wide">
                  Title
                  <input value={form.title} onChange={(e) => set("title", e.target.value)} maxLength={120} />
                </label>
                <label>
                  Event type
                  <select
                    value={form.competition_type}
                    onChange={(e) => {
                      const competitionType = e.target.value;
                      setForm((current) => ({
                        ...current,
                        competition_type: competitionType,
                        title: competitionType === "weekly_cup" ? "Weekly Free Community Cup" : "",
                        entry_fee_credits: "0",
                        prize_credits: competitionType === "weekly_cup" ? "5" : "0",
                        prize: competitionType === "weekly_cup"
                          ? "5 credits per player + Weekly Cup Winner award"
                          : "",
                      }));
                    }}
                  >
                    {isOwner && <option value="weekly_cup">Weekly Free Cup</option>}
                    <option value="standard">Standard tournament</option>
                  </select>
                </label>
                <label>
                  Platform
                  <select value={form.platform} onChange={(e) => set("platform", e.target.value)}>
                    <option value="">Any platform</option>
                    {ladderPlatforms.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Game
                  <input value={form.game} onChange={(e) => set("game", e.target.value)} />
                </label>
                <label>
                  Format
                  <input value={form.format} onChange={(e) => set("format", e.target.value)} />
                </label>
                <label>
                  Team size (e.g. 4v4)
                  <input value={form.team_size} onChange={(e) => set("team_size", e.target.value)} />
                </label>
                <label>
                  Start date and time (your local time; default is Saturday at 8 PM Eastern)
                  <input type="datetime-local" value={form.starts_at} onChange={(e) => set("starts_at", e.target.value)} />
                </label>
                <label>
                  Check-in (minutes before start)
                  <input type="number" min={0} value={form.check_in_minutes} onChange={(e) => set("check_in_minutes", e.target.value)} />
                </label>
                <label>
                  Max teams (blank = unlimited)
                  <input type="number" min={2} value={form.max_teams} onChange={(e) => set("max_teams", e.target.value)} />
                </label>
                <label>
                  Entry fee (credits, weekly cups are free)
                  <input type="number" min={0} step="1" value={form.entry_fee_credits} disabled={!isOwner || form.competition_type === "weekly_cup"} onChange={(e) => set("entry_fee_credits", e.target.value)} />
                </label>
                <label>
                  Prize (credits per winner)
                  <input type="number" min={0} step="1" value={form.prize_credits} disabled={!isOwner || form.competition_type === "weekly_cup"} onChange={(e) => set("prize_credits", e.target.value)} />
                </label>
                <label className="wide">
                  Prizes (display text)
                  <input value={form.prize} disabled={!isOwner} onChange={(e) => set("prize", e.target.value)} placeholder="e.g. 1st: 500 credits" />
                </label>
                <label className="wide">
                  Rules
                  <textarea value={form.rules} onChange={(e) => set("rules", e.target.value)} />
                </label>
                <div className="wide">
                  <button className="st-btn" disabled={saving}>
                    {saving ? "Saving..." : "Create Tournament"}
                  </button>
                </div>
              </form>
            </div>

            <div className="st-panel">
              <div className="st-title">All Tournaments</div>
              {tournaments.length === 0 ? (
                <div className="st-body">No tournaments yet.</div>
              ) : (
                tournaments.map((t) => (
                  <div className="st-row" key={t.id}>
                    <div>
                      <b>{t.title}</b>
                      <small>
                        {t.starts_at ? new Date(t.starts_at).toLocaleString() : "Date TBD"} - {t.status} -{" "}
                        {t.entry_fee_credits > 0 ? `${t.entry_fee_credits} credit entry` : "Free"}
                        {t.prize_credits > 0 ? ` - ${t.prize_credits} credits${t.competition_type === "weekly_cup" ? " per player" : " prize"}` : ""}
                      </small>
                    </div>
                    <div className="st-actions">
                      <Link className="st-btn" href={`/tournaments/${t.id}`}>
                        Bracket
                      </Link>
                      {canPay && (t.competition_type === "weekly_cup" ? (
                        <button
                          className="st-btn"
                          disabled={t.status !== "completed" || rewardBusy}
                          onClick={() => awardChampion("weekly_cup", t.id)}
                        >
                          {rewardBusy ? "Awarding..." : "Award Cup Winner (5 credits + badge)"}
                        </button>
                      ) : (
                        <button className="st-btn" disabled={t.status !== "completed"} onClick={() => openPay(t)}>
                          Pay Prize
                        </button>
                      ))}
                      {t.status !== "live" && (
                        <button className="st-btn" onClick={() => setStatus(t.id, "live")}>
                          Go Live
                        </button>
                      )}
                      {t.status !== "completed" && (
                        <button className="st-btn" onClick={() => setStatus(t.id, "completed")}>
                          Complete
                        </button>
                      )}
                      {t.status !== "cancelled" && (
                        <button className="st-btn red" onClick={() => setStatus(t.id, "cancelled")}>
                          Cancel
                        </button>
                      )}
                      {t.competition_type !== "weekly_cup" && (isOwner || (!t.prize_credits && !t.entry_fee_credits && !t.entry_fee)) && (
                        <button className="st-btn red" onClick={() => remove(t.id)}>
                          Delete
                        </button>
                      )}
                    </div>
                    {payFor === t.id && (
                      <div className="st-body" style={{ width: "100%", display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                        <select value={payTeam} onChange={(e) => setPayTeam(e.target.value)}>
                          <option value="">Select winning team</option>
                          {payTeams.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                        {isOwner ? <input type="number" min={1} style={{ width: 80 }} value={payPlace} onChange={(e) => setPayPlace(e.target.value)} title="Placement" /> : <span>First place</span>}
                        {isOwner && <input type="number" min={1} style={{ width: 120 }} value={payAmount} onChange={(e) => setPayAmount(e.target.value)} placeholder={`Credits (${t.prize_credits})`} />}
                        <button className="st-btn" onClick={() => payPrize(t)}>Pay out</button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
