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
};

const emptyForm = {
  title: "",
  platform: "",
  game: "",
  format: "Single Elimination",
  team_size: "",
  starts_at: "",
  check_in_minutes: "30",
  max_teams: "",
  entry_fee_credits: "0",
  prize_credits: "0",
  prize: "",
  rules: "",
};

export default function StaffTournamentsPage() {
  const { user, loading: authLoading } = useUser();
  const [allowed, setAllowed] = useState(false);
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

  const load = useCallback(async () => {
    if (!user) return;
    const { data: permission } = await supabase.rpc("has_staff_permission", {
      permission_key: "staff_access",
    });
    if (permission !== true) {
      setAllowed(false);
      setChecking(false);
      return;
    }
    setAllowed(true);
    const { data } = await supabase
      .from("tournaments")
      .select("id,title,platform,game,starts_at,status,is_free,entry_fee,entry_fee_credits,prize_credits")
      .order("starts_at", { ascending: true });
    setTournaments((data as Tournament[]) || []);
    setChecking(false);
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setChecking(false);
      return;
    }
    load();
  }, [authLoading, user, load]);

  function set<K extends keyof typeof emptyForm>(key: K, value: (typeof emptyForm)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function create(e: FormEvent) {
    e.preventDefault();
    setError("");
    setNotice("");
    if (!form.title.trim()) {
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
      prize: form.prize.trim() || null,
      rules: form.rules.trim() || null,
      created_by: user?.id,
    });
    setSaving(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setForm(emptyForm);
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
      p_total_credits: payAmount ? Number(payAmount) : null,
    });
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    setNotice(`Paid ${Number(data).toLocaleString()} credits to the team.`);
    setPayFor(null);
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
            <div className="st-body">This account cannot manage tournaments.</div>
          </div>
        ) : (
          <>
            {error && <div className="st-msg err">{error}</div>}
            {notice && <div className="st-msg ok">{notice}</div>}

            <div className="st-panel">
              <div className="st-title">Create Tournament</div>
              <form className="st-body st-form" onSubmit={create}>
                <label className="wide">
                  Title
                  <input value={form.title} onChange={(e) => set("title", e.target.value)} maxLength={120} />
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
                  Start date and time (your local time)
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
                  Entry fee (credits, 0 = free)
                  <input type="number" min={0} step="1" value={form.entry_fee_credits} onChange={(e) => set("entry_fee_credits", e.target.value)} />
                </label>
                <label>
                  Prize (credits, paid to winning team)
                  <input type="number" min={0} step="1" value={form.prize_credits} onChange={(e) => set("prize_credits", e.target.value)} />
                </label>
                <label className="wide">
                  Prizes (display text)
                  <input value={form.prize} onChange={(e) => set("prize", e.target.value)} placeholder="e.g. 1st: 500 credits" />
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
                        {t.prize_credits > 0 ? ` - ${t.prize_credits} credit prize` : ""}
                      </small>
                    </div>
                    <div className="st-actions">
                      <Link className="st-btn" href={`/tournaments/${t.id}`}>
                        Bracket
                      </Link>
                      <button className="st-btn" onClick={() => openPay(t)}>
                        Pay Prize
                      </button>
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
                      <button className="st-btn red" onClick={() => remove(t.id)}>
                        Delete
                      </button>
                    </div>
                    {payFor === t.id && (
                      <div className="st-body" style={{ width: "100%", display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                        <select value={payTeam} onChange={(e) => setPayTeam(e.target.value)}>
                          <option value="">Select winning team</option>
                          {payTeams.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                        <input type="number" min={1} style={{ width: 80 }} value={payPlace} onChange={(e) => setPayPlace(e.target.value)} title="Placement" />
                        <input type="number" min={1} style={{ width: 120 }} value={payAmount} onChange={(e) => setPayAmount(e.target.value)} placeholder={`Credits (${t.prize_credits})`} />
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
