"use client";

import Link from "next/link";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { useUser } from "../../lib/useUser";
import { gamingGameLabel } from "../../lib/gamingAccounts";
import { tournamentSystemLabel } from "../../lib/tournamentDisplay";
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
  entry_kind: "team" | "player";
  min_players: number | null;
};

type OwnedTeam = {
  id: string;
  name: string;
  platform: string | null;
  category: string | null;
  game: string | null;
};
type Registration = { tournament_id: string; team_id: string };
type PlayerRegistration = { tournament_id: string; player_id: string };
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
  const [playerRegistrations, setPlayerRegistrations] = useState<PlayerRegistration[]>([]);
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
    const [teamResult, playerResult] = await Promise.all([
      supabase.from("tournament_registrations").select("tournament_id, team_id"),
      supabase.from("tournament_player_registrations").select("tournament_id, player_id"),
    ]);
    if (teamResult.error || playerResult.error) {
      setMessage({ id: "", ok: false, text: `Could not load registrations: ${teamResult.error?.message || playerResult.error?.message}` });
      return;
    }
    setRegistrations((teamResult.data as Registration[]) || []);
    setPlayerRegistrations((playerResult.data as PlayerRegistration[]) || []);
  }

  useEffect(() => {
    let active = true;
    Promise.all([
      supabase.from("tournament_registrations").select("tournament_id, team_id"),
      supabase.from("tournament_player_registrations").select("tournament_id, player_id"),
    ]).then(([teamResult, playerResult]) => {
        if (!active) return;
        if (teamResult.error || playerResult.error) {
          setMessage({ id: "", ok: false, text: `Could not load registrations: ${teamResult.error?.message || playerResult.error?.message}` });
          return;
        }
        setRegistrations((teamResult.data as Registration[]) || []);
        setPlayerRegistrations((playerResult.data as PlayerRegistration[]) || []);
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

  async function togglePlayerRegistration(t: Tournament, registered: boolean) {
    setBusyId(t.id);
    setMessage(null);
    const { error } = await supabase.rpc(
      registered ? "unregister_player_from_tournament" : "register_player_for_tournament",
      { p_tournament_id: t.id }
    );
    setBusyId(null);
    setMessage({ id: t.id, ok: !error, text: error ? error.message : registered ? "Registration withdrawn." : "You are registered!" });
    await loadRegistrations();
  }

  useEffect(() => {
    let active = true;
    let settled = false;
    const timeout = setTimeout(() => {
      if (active && !settled) {
        setMessage({ id: "", ok: false, text: "Tournaments are taking too long to load. Please refresh the page." });
        setLoading(false);
      }
    }, 15000);
    (async () => {
      setLoading(true);
      const currentScope = platformParam && categoryParam && gameParam
        ? { platform: platformParam, category: categoryParam, game: gameParam }
        : null;

      const { data, error: tournamentError } = await supabase
        .from("tournaments")
        .select("*")
        .in("status", ["upcoming", "live"])
        .order("starts_at", { ascending: true });
      if (!active) return;
      settled = true;
      clearTimeout(timeout);
      if (tournamentError) {
        setMessage({ id: "", ok: false, text: `Could not load tournaments: ${tournamentError.message}` });
        setLoading(false);
        return;
      }
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
      clearTimeout(timeout);
    };
  }, [platformParam, categoryParam, gameParam]);

  const featuredTournamentId =
    tournaments.find((tournament) => tournament.status === "live")?.id ||
    tournaments[0]?.id;

  return (
    <>
      <style>{`
        .t-page{max-width:1120px;margin:0 auto;padding:22px 14px 34px;font-family:Tahoma,Verdana,Arial,sans-serif;color:#d7e2ee;}
        .t-hero{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(380px,.85fr);align-items:center;gap:22px;background:linear-gradient(135deg,#101d2a,#07111b 72%);border:1px solid #263d52;border-left:3px solid #b51c24;border-radius:14px;padding:22px;margin-bottom:16px;}
        .t-hero-text{min-width:0;}
        .t-hero-side{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;align-items:stretch;}
        .t-request-box{grid-column:1/-1;display:flex;align-items:center;justify-content:space-between;gap:14px;background:linear-gradient(120deg,#13283a,#0a1723);border:1px solid #3c617d;border-radius:10px;padding:12px;color:#c8d8e8;}
        .t-request-box h2{margin:0 0 5px;color:#f2c14e;font-size:11px;text-transform:uppercase;letter-spacing:.04em;}
        .t-request-box p{margin:0;max-width:none;color:#b8c8d6;font-size:11px;line-height:1.5;}
        .t-request-link{flex:none;padding:9px 11px;border:1px solid #85bce5;border-radius:6px;background:#1a4568;color:#fff;font-size:10px;font-weight:bold;text-decoration:none;text-align:center;text-transform:uppercase;}
        .t-request-link:hover{background:#245d88;}
        .td-box{width:auto;background:#09131d;border:1px solid #263d52;border-radius:10px;padding:12px;font-size:12px;color:#c8d8e8;}
        .td-head{color:#e7edf3;font-weight:bold;text-transform:uppercase;font-size:11px;letter-spacing:.04em;margin-bottom:6px;}
        .td-box p{margin:0 0 8px;max-width:none;font-size:12px;}
        .td-btn{background:#3b7fc2;color:#fff;border:0;font-weight:bold;padding:8px 14px;cursor:pointer;text-transform:uppercase;font-size:11px;}
        .td-body{margin-top:10px;max-height:360px;overflow-y:auto;padding-right:4px;}
        .td-sec{margin-bottom:10px;}
        .td-sec-title{color:#eaf5ff;font-weight:bold;font-size:11px;text-transform:uppercase;margin-bottom:4px;}
        .td-sec ul{margin:0;padding-left:16px;}
        .td-sec li{font-size:11px;line-height:1.45;margin-bottom:3px;color:#9fb9cf;}
        .td-link{color:#f2c14e;font-size:11px;}
        .td-note{margin-top:8px;font-size:10px;color:#7f9ab3;font-style:italic;}
        .gc-box{width:auto;background:#0c151d;border:1px solid #75602d;border-radius:10px;padding:12px;font-size:12px;color:#c8d8e8;}
        .gc-head{color:#f2c14e;font-weight:bold;text-transform:uppercase;font-size:11px;letter-spacing:.04em;margin-bottom:6px;}
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
        .gc-checks{display:grid;gap:2px;margin-bottom:4px;}
        .gc-agree{margin-bottom:8px;padding:8px 9px;border:1px solid #23435f;background:#06101a;}
        .gc-agree .gc-terms{margin:0;}
        .gc-more{margin-top:5px;font-size:10px;color:#9fb9cf;}
        .gc-more summary{cursor:pointer;color:#8fd0ff;font-weight:bold;list-style:none;}
        .gc-more summary::-webkit-details-marker{display:none;}
        .gc-more summary::before{content:"▸ ";}
        .gc-more[open] summary::before{content:"▾ ";}
        .gc-more ul{margin:6px 0 0;padding-left:16px;line-height:1.5;}
        .gc-more li+li{margin-top:3px;}
        .gc-more b{color:#f2c14e;}
        .gc-more a{color:#8fd0ff;}
        .gc-terms input{flex:0 0 auto;margin-top:1px;}
        .gc-terms b{color:#f2c14e;}
        .gc-box p.gc-small{font-size:10px;color:#9fb9cf;margin:0 0 8px;}
        .gc-actions{display:flex;gap:6px;flex-wrap:wrap;}
        .gc-btn:disabled{opacity:.5;cursor:not-allowed;}
        .gc-cancel{background:#173449;color:#fff;border:1px solid #416b88;padding:8px 12px;cursor:pointer;font-size:11px;font-weight:bold;text-transform:uppercase;}
        .gc-hint{font-size:10px;margin-top:6px;}
        .gc-steps{margin:10px 0 0;padding-left:16px;font-size:10px;color:#7f9ab3;line-height:1.5;}
        .gc-dialog{box-sizing:border-box;width:min(440px,calc(100% - 32px));margin:auto;padding:0;border:1px solid #406f91;border-radius:6px;background:#081521;color:#d7e6f2;font-family:Tahoma,Verdana,Arial,sans-serif;box-shadow:0 20px 60px #000c;}
        .gc-dialog::backdrop{background:rgba(0,0,0,.8);}
        .gc-dialog-header{padding:13px 14px;background:linear-gradient(#1b4664,#0d2639);border-bottom:1px solid #315b79;color:#e5c573;font-size:11px;font-weight:900;letter-spacing:.7px;text-transform:uppercase;}
        .gc-dialog-body{padding:24px;text-align:center;}
        .gc-dialog-icon{display:grid;place-items:center;width:44px;height:44px;margin:0 auto 14px;border:1px solid #4b9b76;border-radius:50%;background:#12372b;color:#8ce5b4;font-size:22px;font-weight:bold;}
        .gc-dialog-body h2{margin:0 0 10px;color:#fff;font-size:20px;}
        .gc-dialog-body p{margin:0 0 12px;color:#bcd0df;font-size:13px;line-height:1.6;}
        .gc-dialog-body p b{color:#fff;}
        .gc-dialog-body p.gc-dialog-warn{padding:10px 12px;border:1px solid #8e6b2e;background:#2a2112;color:#f3dca6;text-align:left;font-size:12px;}
        .gc-dialog-ok{min-height:42px;padding:0 28px;border:1px solid #e3c36f;background:linear-gradient(#f2c14e,#b98722);color:#101820;font:bold 12px Tahoma,Verdana,Arial,sans-serif;cursor:pointer;}
        .t-hero h1{font-size:30px;font-weight:900;color:#f4f6f8;text-transform:uppercase;letter-spacing:.02em;}
        .t-hero p{margin-top:9px;font-size:13px;line-height:1.65;color:#aab8c5;max-width:560px;}
        .t-panel{background:#09131d;border:1px solid #26394b;border-radius:12px;overflow:hidden;margin-bottom:16px;}
        .t-title{min-height:42px;background:#101b27;border-bottom:1px solid #26394b;display:flex;align-items:center;padding:0 16px;font-size:11px;font-weight:bold;color:#eaf0f5;text-transform:uppercase;letter-spacing:.06em;}
        .t-events .t-title{border-left:3px solid #b51c24;}
        .t-empty{padding:34px 16px;text-align:center;font-size:12px;color:#9fb9cf;line-height:1.6;}
        .t-empty strong{display:block;color:#f2c14e;font-size:14px;margin-bottom:6px;text-transform:uppercase;}
        .t-empty .t-all-link{display:block;width:max-content;max-width:100%;margin:16px auto 0;padding:9px 14px;border:1px solid #566779;border-radius:999px;color:#d7e2ee;font-size:11px;font-weight:bold;text-decoration:none;}
        .t-empty .t-all-link:hover{background:#172331;color:#fff;}
        .t-list{padding:14px;display:grid;gap:12px;}
        .t-card{background:linear-gradient(150deg,#0d1a26,#08111a);border:1px solid #26394b;border-radius:11px;overflow:hidden;}
        .t-card.featured{border-color:#a9272e;box-shadow:0 10px 28px rgba(119,17,23,.18);}
        .t-card.live{border-color:#c40000;box-shadow:0 0 18px rgba(196,0,0,.25);}
        .t-head{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;background:#101b27;border-bottom:1px solid #26394b;padding:14px 16px;}
        .t-card.featured .t-head,.t-card.live .t-head{background:linear-gradient(100deg,rgba(125,17,24,.24),#101b27 72%);border-bottom-color:#70252b;}
        .t-name{font-size:16px;font-weight:900;color:#f2c14e;text-transform:uppercase;letter-spacing:.3px;}
        .t-badges{display:flex;align-items:center;gap:6px;flex-wrap:wrap;}
        .t-cup-label{display:inline-block;margin-left:9px;padding:4px 7px;border:1px solid #6b5217;border-radius:999px;color:#ffe9a8;font-size:9px;vertical-align:middle;letter-spacing:.05em;}
        .t-badge{font-size:10px;font-weight:bold;padding:3px 10px;border:1px solid;border-radius:999px;text-transform:uppercase;}
        .t-badge.featured{background:#64171d;border-color:#a9272e;color:#ffe2e3;}
        .t-badge.free{background:#0d3a1f;border-color:#2fbf62;color:#7dffae;}
        .t-badge.paid{background:#3a2a05;border-color:#f2c14e;color:#ffd978;}
        .t-badge.live{background:#6a0000;border-color:#c40000;color:#fff;margin-right:6px;}
        .t-badge.crossplay{background:#103425;border-color:#2e8054;color:#a9efc3;}
        .t-badge.system-only{background:#3a171b;border-color:#8f3037;color:#ffd2d4;}
        .t-meta{display:flex;flex-wrap:wrap;gap:8px;padding:14px 16px 4px;}
        .t-meta span{background:#101d29;border:1px solid #26394b;border-radius:999px;padding:6px 12px;font-size:12px;color:#d7e2ee;}
        .t-stats{display:grid;grid-template-columns:1.6fr 1fr 1fr 1fr;gap:10px;padding:12px 16px;}
        .t-stat{background:#0a1a2a;border:1px solid #16324a;border-radius:8px;padding:10px 12px;}
        .t-stat span{display:block;font-size:10px;color:#8fb0cc;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px;}
        .t-stat b{font-size:14px;color:#eaf5ff;}
        .t-stat.prize{border-color:#6b5217;background:linear-gradient(#1b1606,#100d04);}
        .t-stat.prize b{color:#f2c14e;font-size:16px;}
        .t-bar{height:5px;border-radius:999px;background:#16324a;margin-top:8px;overflow:hidden;}
        .t-bar i{display:block;height:100%;background:linear-gradient(90deg,#2fbf62,#7dffae);}
        .t-actions{padding:12px 16px 16px;display:flex;gap:10px;flex-wrap:wrap;justify-content:space-between;align-items:center;border-top:1px solid #223447;}
        .t-actions-left,.t-actions-right{display:flex;gap:8px;flex-wrap:wrap;align-items:center;}
        .t-btn{background:linear-gradient(#f2c14e,#c9951f);border:1px solid #f2c14e;border-radius:999px;color:#111;font-size:11px;font-weight:800;text-transform:uppercase;padding:9px 18px;cursor:pointer;}
        .t-btn:hover{filter:brightness(1.1);}
        .t-btn.ghost{background:transparent;border-color:#526477;color:#d7e2ee;}
        .t-btn.ghost:hover{background:#172331;}
        .t-btn.off{opacity:.55;cursor:not-allowed;background:#1a2a3a;border-color:#2a4560;color:#9fb9cf;}
        a.t-btn{text-decoration:none;display:inline-block;}
        .t-select{background:#07111b;border:1px solid #2a4560;border-radius:999px;color:#eaf5ff;padding:8px 12px;font-size:12px;}
        .t-msg{margin:0 16px 12px;padding:8px 12px;font-size:12px;border:1px solid;border-radius:6px;}
        .t-msg.ok{background:#0d3a1f;border-color:#2fbf62;color:#7dffae;}
        .t-msg.err{background:#3a0a0a;border-color:#c40000;color:#ffb3b3;}
        .t-rules{border-top:1px solid #16324a;padding:12px;font-size:12px;line-height:1.6;white-space:pre-wrap;color:#d7e2ee;}
        .t-rules h4{color:#f2c14e;font-size:11px;text-transform:uppercase;margin-bottom:6px;}
        .t-coming{margin:0 0 16px;padding:16px;background:#09131d;border:1px solid #26394b;border-radius:12px;}
        .t-coming-head{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:12px;}
        .t-coming-title{color:#f2c14e;font-size:11px;font-weight:bold;text-transform:uppercase;}
        .t-coming-link{color:#c6d0da;font-size:11px;font-weight:bold;text-decoration:none;}
        .t-coming-link:hover{color:#fff;}
        .t-coming-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;}
        .t-coming-card{background:#0c1722;border:1px solid #26394b;border-radius:10px;padding:14px 16px;}
        .t-coming-card h2{margin:0 0 6px;color:#edf2f7;font-size:14px;}
        .t-coming-card p{margin:0;color:#aab8c5;font-size:12px;line-height:1.55;}
        .t-coming-label{display:inline-block;margin-bottom:7px;padding:3px 8px;border:1px solid #44586c;border-radius:999px;color:#c8d4de;font-size:9px;font-weight:bold;text-transform:uppercase;letter-spacing:.05em;}
        .t-coming-card.solo{border-color:#6b5217;background:linear-gradient(140deg,#211b0d,#0c151d 75%);}
        .t-coming-card.solo .t-coming-label{border-color:#8a6c21;color:#ffe5a0;}
        .t-how{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:10px;}
        .t-step{background:#0b1722;border:1px solid #26394b;border-radius:9px;padding:12px;font-size:11px;line-height:1.5;color:#bac7d3;}
        .t-step b{display:block;color:#e9c66e;text-transform:uppercase;margin-bottom:4px;font-size:10px;letter-spacing:.04em;}
        @media(max-width:768px){
          .t-stats{grid-template-columns:repeat(2,minmax(0,1fr));}
          .t-how{grid-template-columns:minmax(0,1fr);}
          .t-hero{grid-template-columns:minmax(0,1fr);padding:18px;}
          .t-hero-side{grid-template-columns:repeat(2,minmax(0,1fr));}
          .t-actions{flex-direction:column;align-items:stretch;}
          .t-hero h1{font-size:22px;}
        }
        @media(max-width:560px){
          .t-page{padding:14px 10px 26px;}
          .t-hero-side,.t-coming-grid{grid-template-columns:minmax(0,1fr);}
          .t-request-box{flex-direction:column;align-items:stretch;gap:12px;padding:14px;}
          .t-request-box h2{font-size:12px;}
          .t-request-box p{font-size:12px;}
          .t-request-link{min-height:44px;display:flex;align-items:center;justify-content:center;padding:0 12px;font-size:11px;}
          .t-stats{grid-template-columns:minmax(0,1fr);}
          .t-name{font-size:14px;}
          .t-meta{padding:12px 12px 2px;}
          .t-stats,.t-actions{padding-left:12px;padding-right:12px;}
        }
      `}</style>

      <div className="t-page">
        <div className="t-hero">
          <div className="t-hero-text">
            <h1>{scope ? `${gameLabel} Tournaments` : "Tournaments"}</h1>
            <p>
              {scope
                ? `Upcoming and live events for ${gameLabel}. Review details, rules and prizes, then register your eligible team. Tournaments are crossplay unless marked system-only.`
                : "Browse upcoming player and team events, check rules and prizes, and register. All tournaments are crossplay unless marked system-only."}
            </p>
          </div>
          <div className="t-hero-side">
            <GetCreditsBox />
            <TournamentDisclaimerBox />
            <section className="t-request-box">
              <div><h2>Want us to host a tournament?</h2><p>Send your game, player count and format. The Founder will review your idea and reply with a decision.</p></div>
              <Link className="t-request-link" href="/tournaments/request">Submit a request</Link>
            </section>
          </div>
        </div>

        <div className="t-panel t-events">
          <div className="t-title">
            {scope ? `${scope.platform} · ${gameLabel} Events` : "Live & Upcoming Tournaments"}
          </div>
          {(!scope || (scope.category === "battlefield" && scope.game === "battlefield-6")) && (
            <div className="t-empty">
              <strong>Battlefield 6 team tournaments coming soon</strong>
              Small tournaments are planned for 5v5 Domination, 4v4 Squad Obliteration and 8v8, 12v12 and 32v32 Conquest. Dates, rules and registration will be announced when ready.
            </div>
          )}
          {message?.id === "" && <div className="t-msg err" role="alert">{message.text}</div>}

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
                const featured = t.id === featuredTournamentId;
                const open = openId === t.id;
                const regs = registrations.filter((r) => r.tournament_id === t.id);
                const playerRegs = playerRegistrations.filter((r) => r.tournament_id === t.id);
                const isPlayerEvent = t.entry_kind === "player";
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
                const entryCount = isPlayerEvent ? playerRegs.length : regs.length;
                const myPlayerReg = playerRegs.some((r) => r.player_id === user?.id);
                const full = t.max_teams != null && entryCount >= t.max_teams;
                const picked = pickedTeam[t.id] || eligible[0]?.id || "";
                return (
                  <div
                    key={t.id}
                    className={`t-card ${featured ? "featured" : ""} ${t.status === "live" ? "live" : ""}`}
                  >
                    <div className="t-head">
                      <div className="t-name">
                        {t.title}
                        {t.competition_type === "weekly_cup" && (
                          <span className="t-cup-label">Weekly Community Cup</span>
                        )}
                      </div>
                      <div className="t-badges">
                        {featured && t.status !== "live" && (
                          <span className="t-badge featured">Featured</span>
                        )}
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
                        <span className={`t-badge ${t.platform ? "system-only" : "crossplay"}`}>
                          {tournamentSystemLabel(t.platform)}
                        </span>
                      </div>
                    </div>

                    <div className="t-meta">
                      <span>📅 {t.starts_at ? `${formatDate(t.starts_at)} · ${formatTime(t.starts_at)}` : "Date & time TBA"}</span>
                      <span>🎮 {t.game || "Game TBA"}</span>
                      <span>🌐 {tournamentSystemLabel(t.platform)}</span>
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
                        <span>{isPlayerEvent ? "Players" : "Teams"}</span>
                        <b>
                          {entryCount} / {t.max_teams ?? "∞"}
                        </b>
                        {isPlayerEvent && t.min_players && <small>Minimum {t.min_players} players</small>}
                        {t.max_teams ? (
                          <div className="t-bar">
                            <i style={{ width: `${Math.min(100, (entryCount / t.max_teams) * 100)}%` }} />
                          </div>
                        ) : null}
                      </div>
                      <div className="t-stat">
                        <span>Entry</span>
                        <b>{credits > 0 ? `${credits.toLocaleString()} credits` : free ? "Free" : `$${Number(t.entry_fee).toFixed(2)}`}</b>
                      </div>
                      <div className="t-stat">
                        <span>{isPlayerEvent ? "Start" : "Check-in"}</span>
                        <b>{isPlayerEvent ? (t.starts_at ? formatDate(t.starts_at) : "Date TBD") : `${t.check_in_minutes ?? 30} min before`}</b>
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
                      ) : isPlayerEvent ? (
                        <button className={`t-btn ${full && !myPlayerReg ? "off" : ""}`} disabled={busyId === t.id || (full && !myPlayerReg)}
                          onClick={() => togglePlayerRegistration(t, myPlayerReg)}>
                          {myPlayerReg ? "Registered - Withdraw" : full ? "Tournament Full" : "Register Player"}
                        </button>
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

        <section className="t-coming" aria-label="More ways to compete">
          <div className="t-coming-head">
            <div className="t-coming-title">More ways to compete</div>
            <Link className="t-coming-link" href="/champions">
              Season Champions &amp; Hall of Fame
            </Link>
          </div>
          <div className="t-coming-grid">
            <article className="t-coming-card">
              <span className="t-coming-label">Free team events</span>
              <h2>Weekly Community Cups</h2>
              <p>
                Recurring weekly cups, separate from one-off tournaments. Scheduled cups appear below when announced.
                Entry is free; each event lists its game, format, date and confirmed rewards.
              </p>
            </article>
            {!tournaments.some((t) => t.entry_kind === "player") && <article className="t-coming-card solo">
              <span className="t-coming-label">Planned</span>
              <h2>Free solo tournaments</h2>
              <p>Solo tournaments are being added to the schedule. Game, platform and dates will be announced here once registration opens.</p>
            </article>}
          </div>
        </section>

        <div className="t-how">
          <div className="t-step">
            <b>1. Find an event</b>
            Pick a tournament and note the date, start time and entry cost.
          </div>
          <div className="t-step">
            <b>2. Read the rules</b>
            Every event lists its own rules and prizes. Review them before signing up.
          </div>
          <div className="t-step">
            <b>3. Check in</b>
            Follow the event&apos;s instructions before the start time.
          </div>
        </div>
      </div>
    </>
  );
}
