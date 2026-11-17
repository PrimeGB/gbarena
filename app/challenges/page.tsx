"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { supabase } from "@/lib/supabase";
import AwardArt, { AWARD_CSS, awardAccent } from "../awards/AwardArt";
import { CHALLENGE_TROPHIES, type ChallengeTrophy } from "./challengeTrophies";

type Stats = Record<string, number>;
type DailyChallenge = { title: string; description: string; requirements: Stats; date?: string };
type ScheduledChallenge = {
  id: string;
  cadence: "weekly" | "monthly";
  title: string;
  description: string;
  starts_at: string;
  ends_at: string;
  requirements: Stats;
  award_name: string;
  locked: boolean;
  completed: boolean;
  progress: Stats | null;
};
type Overview = {
  now: string;
  signed_in: boolean;
  totals: (Stats & { current_streak: number }) | null;
  daily_schedule: DailyChallenge[];
  today: { challenge: DailyChallenge; active: boolean; completed: boolean; stats: Stats | null };
  earned: string[];
  challenges: ScheduledChallenge[];
};

const LABELS: Record<string, [string, string, string]> = {
  matches: ["Play", "ladder match", "ladder matches"],
  wins: ["Win", "ladder match", "ladder matches"],
  win_streak: ["Win", "ladder match in a row", "ladder matches in a row"],
  hosted: ["Post", "match that gets played", "matches that get played"],
  games: ["Play matches in", "game", "different games"],
  opponents: ["Play", "opponent", "different opponents"],
  rival_wins: ["Beat the same opponent", "time", "times"],
  bounce_backs: ["Win straight after a loss", "time", "times"],
  friend_matches: ["Play", "match with a friend", "matches with a friend"],
  threads_replied: ["Reply to", "thread by another player", "different threads by other players"],
  forum_items: ["Make", "forum post or reply", "forum posts or replies"],
  friends: ["Add", "friend", "friends"],
  suggestions: ["Send", "suggestion", "suggestions"],
  active_days: ["Sign in on", "day", "different days"],
};

function requirementText(key: string, need: number) {
  const [verb, one, many] = LABELS[key] || ["Reach", key, key];
  return `${verb} ${need} ${need === 1 ? one : many}`;
}

function dateRange(start: string, end: string) {
  const format = (value: Date) => value.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  return `${format(new Date(start))} – ${format(new Date(new Date(end).getTime() - 1))}`;
}

function timeLeft(end: string, now: number) {
  const ms = new Date(end).getTime() - now;
  if (ms <= 0) return "Ended";
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  return days > 0 ? `${days}d ${hours}h left` : `${hours}h ${Math.floor((ms % 3600000) / 60000)}m left`;
}

const subscribePreview = () => () => {};
const getPreview = () => process.env.NODE_ENV === "development" && new URLSearchParams(window.location.search).get("preview") === "progress";
const getServerPreview = () => false;

function sampleOverview(base: Overview): Overview {
  const earned = ["On Fire Trophy", "Thread Starter Trophy", "Squad Up Trophy", "Bug Reporter Trophy"];
  return {
    ...base,
    signed_in: true,
    totals: { daily_completions: 2, longest_streak: 4, current_streak: 4, active_days: 6, threads_started: 1, threads_replied: 0, engaged_threads: 0, friends: 3, suggestions: 0, bug_reports: 1, messages_sent: 0, players_followed: 2, followers: 0, reactions: 0, match_comments: 0, recruit_posts: 0, match_posts: 0, tournament_entries: 0 },
    today: { ...base.today, active: true, completed: false, stats: {} },
    earned,
    challenges: base.challenges.map((challenge) => ({
      ...challenge,
      completed: earned.includes(challenge.award_name),
      progress: Object.fromEntries(Object.keys(challenge.requirements).map((key) => [key, 0])),
    })),
  };
}

export default function ChallengesPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState("");
  const [now, setNow] = useState(0);
  const preview = useSyncExternalStore(subscribePreview, getPreview, getServerPreview);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      const { data: session } = await supabase.auth.getSession();
      if (session.session) await supabase.rpc("gb_challenge_checkin");
      const { data, error: loadError } = await supabase.rpc("gb_challenge_overview");
      if (!mounted) return;
      if (loadError) setError(`Challenges could not be loaded: ${loadError.message}`);
      else {
        setOverview(data as Overview);
        setNow(Date.parse((data as Overview).now));
      }
    })();
    const timer = window.setInterval(() => setNow((value) => (value ? value + 30000 : value)), 30000);
    return () => { mounted = false; window.clearInterval(timer); };
  }, []);

  const view = overview && preview ? sampleOverview(overview) : overview;
  const earned = new Set(view?.earned || []);
  const live = view?.challenges.find((c) => !c.locked && Date.parse(c.starts_at) <= now && Date.parse(c.ends_at) > now);
  const allTrophies = [...CHALLENGE_TROPHIES.map((trophy) => trophy.name), ...(view?.challenges.filter((c) => !c.locked).map((c) => c.award_name) || [])];
  const earnedCount = allTrophies.filter((name) => earned.has(name)).length;

  return (
    <main className="pc-page">
      <style>{AWARD_CSS + PAGE_CSS}</style>
      <div className="pc-shell">
        <header className="pc-hero">
          <div>
            <p className="pc-eyebrow">Awards &amp; Achievements</p>
            <h1>Player Challenges</h1>
            <p className="pc-lead">Earn profile trophies just for using GameBattles: sign in, chat, add friends, play matches and take on limited-time events.</p>
            {preview && <p className="pc-preview">Preview with sample progress, not real account data.</p>}
          </div>
          {view?.signed_in && view.totals ? (
            <div className="pc-stats">
              <span><b>🔥 {view.totals.current_streak}</b>day streak</span>
              <span className={view.today.completed ? "done" : ""}><b>{view.today.completed ? "✓ Done" : "Open"}</b>today&apos;s daily</span>
              <span><b>🏆 {earnedCount}/{allTrophies.length}</b>trophies</span>
            </div>
          ) : view && (
            <p className="pc-signin"><Link href="/login">Sign in</Link> to track progress. Visiting while signed in counts as your daily check-in.</p>
          )}
        </header>

        {error && <p role="alert" className="pc-error">{error}</p>}
        {!view && !error && <p className="pc-muted">Loading challenges…</p>}

        {view && <>
          <div className="pc-top">
            <section className="pc-panel" style={{ ["--accent" as string]: awardAccent("Daily Grind Trophy", "") }}>
              <div className="pc-panel-head"><span className="pc-tag">Daily challenge</span><span className="pc-timer">Resets 00:00 UTC</span></div>
              <h2>{view.today.challenge.title}</h2>
              <p className="pc-desc">{view.today.challenge.description}</p>
              {view.signed_in && <p className={`pc-state ${view.today.completed ? "done" : ""}`}>{view.today.completed ? "✓ Complete. Come back tomorrow." : "Not done yet today."}</p>}
              <ol className="pc-week">
                {view.daily_schedule.map((day, index) => (
                  <li key={day.date || index} className={index === 0 ? "today" : ""} title={day.description}>
                    <b>{new Date(`${day.date}T00:00:00Z`).toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" })}</b>
                    <span>{day.description}</span>
                  </li>
                ))}
              </ol>
              <p className="pc-note">Each day has a different challenge. Complete 3 to earn the Daily Grind Trophy.</p>
            </section>

            {live ? <LiveCard challenge={live} now={now} signedIn={view.signed_in} /> : (
              <section className="pc-panel empty"><p className="pc-muted">The next limited-time event starts soon.</p></section>
            )}
          </div>

          <section className="pc-section">
            <h2 className="pc-title">Trophies you can earn</h2>
            <div className="pc-grid">
              {CHALLENGE_TROPHIES.map((trophy) => (
                <TrophyCard trophy={trophy} earned={earned.has(trophy.name)} value={view.totals?.[trophy.stat]} key={trophy.name} />
              ))}
            </div>
          </section>

          <section className="pc-section">
            <h2 className="pc-title">Limited-time events</h2>
            <ol className="pc-calendar">
              {view.challenges.map((challenge) => {
                const started = Date.parse(challenge.starts_at) <= now;
                const ended = Date.parse(challenge.ends_at) <= now;
                const status = challenge.completed ? "Earned" : challenge.locked ? "Locked" : ended ? "Ended" : started ? "Live" : "Upcoming";
                return (
                  <li className={`pc-cal-row ${status.toLowerCase()}`} key={challenge.id} style={{ ["--accent" as string]: awardAccent(challenge.award_name, "") }}>
                    <div className="pc-cal-art"><AwardArt name={challenge.award_name} group="" height={52} /></div>
                    <div className="pc-cal-body">
                      <strong>{challenge.title}</strong>
                      <span>{challenge.locked ? (challenge.id === "2026-w47-launch-week" ? "Starts once GameBattles reaches 100 members." : "Unlocks once the ladders get busier.") : Object.entries(challenge.requirements).map(([key, need]) => requirementText(key, need)).join(" · ")}</span>
                    </div>
                    <span className="pc-cal-date">{dateRange(challenge.starts_at, challenge.ends_at)}</span>
                    <span className={`pc-badge ${status.toLowerCase()}`}>{status === "Locked" ? "🔒 Locked" : status}</span>
                  </li>
                );
              })}
            </ol>
          </section>

          <section className="pc-section pc-ranks">
            <h2 className="pc-title">Player Ranks</h2>
            <div className="pc-ranks-row">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/ranks/rookie.png?v=3" alt="Rookie rank emblem" width={84} height={84} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/ranks/veteran.png?v=3" alt="Veteran rank emblem" width={84} height={84} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/ranks/legend.png?v=3" alt="Legend rank emblem" width={84} height={84} />
              <div className="pc-ranks-copy">
                <strong>Climb from Rookie to Legend</strong>
                <span>Every ladder match earns XP: +25 per win, +5 per loss. 50 levels across 10 ranks, with your emblem building up on your profile as you go.</span>
              </div>
              <Link className="pc-ranks-btn" href="/ranks">View all ranks ›</Link>
            </div>
          </section>

          <p className="pc-foot">Trophies are awarded automatically and appear on your profile. Past activity counts too, but voided matches or hidden posts do not. <Link href="/awards">See all awards</Link> · <Link href="/suggestions">Suggest a challenge</Link></p>
        </>}
      </div>
    </main>
  );
}

function LiveCard({ challenge, now, signedIn }: { challenge: ScheduledChallenge; now: number; signedIn: boolean }) {
  return (
    <section className={`pc-panel pc-live ${challenge.completed ? "complete" : ""}`} style={{ ["--accent" as string]: awardAccent(challenge.award_name, "") }}>
      <div className="pc-live-art"><AwardArt name={challenge.award_name} group="" height={120} /></div>
      <div>
        <div className="pc-panel-head"><span className="pc-tag">Limited event</span><span className="pc-timer">⏱ {timeLeft(challenge.ends_at, now)}</span></div>
        <h2>{challenge.title}</h2>
        <p className="pc-desc">{challenge.description}</p>
        <ul className="pc-reqs">
          {Object.entries(challenge.requirements).map(([key, need]) => {
            const have = challenge.completed ? need : Math.min(need, challenge.progress?.[key] || 0);
            return (
              <li key={key} className={have >= need ? "done" : ""}>
                <div className="pc-req-line"><span>{have >= need ? "✓ " : ""}{requirementText(key, need)}</span>{signedIn && <b>{have}/{need}</b>}</div>
                {signedIn && <div className="pc-bar"><i style={{ width: `${(have / need) * 100}%` }} /></div>}
              </li>
            );
          })}
        </ul>
        <p className="pc-note">{challenge.completed ? "🏆 Earned: " : "Reward: "}<strong>{challenge.award_name}</strong></p>
      </div>
    </section>
  );
}

function TrophyCard({ trophy, earned, value }: { trophy: ChallengeTrophy; earned: boolean; value?: number }) {
  const have = Math.min(trophy.need, value || 0);
  return (
    <article className={`award-card pc-trophy ${earned ? "earned" : ""}`} style={{ ["--accent" as string]: awardAccent(trophy.name, trophy.group) }}>
      {earned && <span className="pc-earned">✓</span>}
      <div className="pc-stage"><AwardArt name={trophy.name} group={trophy.group} height={92} /></div>
      <div>
        <strong>{trophy.name.replace(/ Trophy$/, "")}</strong>
        <p>{trophy.requirement}</p>
        {value !== undefined && !earned && trophy.need > 1 && (
          <div className="pc-progress"><div className="pc-bar"><i style={{ width: `${(have / trophy.need) * 100}%` }} /></div><span>{have}/{trophy.need}</span></div>
        )}
      </div>
    </article>
  );
}

const PAGE_CSS = `
.pc-page{min-height:100vh;padding:18px 14px 32px;background:radial-gradient(1000px 420px at 50% -10%,#3a1420 0%,transparent 60%),radial-gradient(circle at top,#123654,#02060a 60%);color:#d7e2ee;font-family:Tahoma,Verdana,Arial,sans-serif}
.pc-shell{max-width:1140px;margin:0 auto}
.pc-hero{display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:14px;padding:18px 20px;border-radius:14px;background:linear-gradient(135deg,#1b0d18 0%,#10213a 55%,#07111b 100%);border:1px solid rgba(255,255,255,.08)}
.pc-eyebrow{margin:0;color:#f2c14e;font-size:10px;font-weight:900;letter-spacing:2.5px;text-transform:uppercase}
.pc-hero h1{margin:2px 0 4px;color:#fff;font-size:clamp(24px,4vw,32px);text-shadow:0 4px 20px rgba(255,61,90,.45)}
.pc-lead{max-width:560px;margin:0;color:#c9d8e6;font-size:13px;line-height:1.5}
.pc-preview{display:inline-block;margin:8px 0 0;padding:4px 10px;border-radius:999px;background:rgba(242,193,78,.14);color:#ffe3a1;font-size:11px;font-weight:700}
.pc-signin{margin:0;color:#c9d8e6;font-size:13px}.pc-signin a,.pc-foot a{color:#ffd36b;font-weight:800}
.pc-stats{display:flex;flex-wrap:wrap;gap:8px}
.pc-stats span{display:grid;min-width:96px;padding:8px 12px;border-radius:10px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.09);color:#93a9be;font-size:10px;letter-spacing:.8px;text-transform:uppercase}
.pc-stats b{color:#fff;font-size:17px;letter-spacing:0;text-transform:none}
.pc-stats span.done{border-color:rgba(46,229,157,.5);background:rgba(46,229,157,.1)}
.pc-top{display:grid;grid-template-columns:1.15fr 1fr;gap:12px;margin-top:12px}
.pc-panel{position:relative;padding:14px 16px;border-radius:14px;background:linear-gradient(140deg,color-mix(in srgb,var(--accent,#2fd4ff) 16%,#0a1420) 0%,#08111b 60%);border:1px solid color-mix(in srgb,var(--accent,#2fd4ff) 40%,transparent)}
.pc-panel.empty{display:flex;align-items:center;justify-content:center;--accent:#1c3550}
.pc-panel h2{margin:6px 0 2px;color:#fff;font-size:19px}
.pc-panel-head{display:flex;justify-content:space-between;gap:8px;align-items:center}
.pc-tag{padding:3px 9px;border-radius:999px;background:var(--accent);color:#14070a;font-size:9px;font-weight:900;letter-spacing:1px;text-transform:uppercase}
.pc-timer{color:#ffe3a1;font-size:11px;font-weight:800}
.pc-desc{margin:0;color:#c2d3e3;font-size:13px;line-height:1.5}
.pc-state{margin:6px 0 0;color:#ffe3a1;font-size:12px;font-weight:700}.pc-state.done{color:#7ff5c4}
.pc-week{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin:10px 0 6px;padding:0;list-style:none}
.pc-week li{padding:5px 4px;border-radius:7px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);text-align:center}
.pc-week li.today{border-color:var(--accent);background:color-mix(in srgb,var(--accent) 18%,transparent)}
.pc-week b{display:block;color:#fff;font-size:11px}.pc-week span{display:block;margin-top:2px;color:#93a9be;font-size:9px;line-height:1.25}
.pc-note{margin:6px 0 0;color:#93a9be;font-size:11px}.pc-note strong{color:#ffd36b}
.pc-live{display:grid;grid-template-columns:120px 1fr;gap:12px;align-items:center}
.pc-live.complete{border-color:#2ee59d}
.pc-reqs{display:grid;gap:6px;margin:8px 0 0;padding:0;list-style:none}
.pc-req-line{display:flex;justify-content:space-between;gap:8px;color:#e6eef6;font-size:12px}.pc-req-line b{color:#fff}
.pc-reqs li.done .pc-req-line{color:#7ff5c4}
.pc-bar{height:6px;margin-top:3px;border-radius:999px;background:rgba(255,255,255,.08);overflow:hidden}
.pc-bar i{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,var(--accent),#fff3c4)}
.pc-section{margin-top:18px}
.pc-title{margin:0 0 8px;padding-left:10px;border-left:3px solid #f2c14e;color:#fff;font-size:16px}
.pc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:8px}
.pc-trophy{display:grid;grid-template-columns:76px 1fr;gap:10px;align-items:center;padding:8px 12px 8px 6px;border-radius:12px;background:linear-gradient(90deg,color-mix(in srgb,var(--accent) 12%,#0b1826),#060c14 70%);border:1px solid #1c3550;text-align:left}
.pc-trophy .award-emblem{padding:4px}
.pc-trophy:not(.earned) .pc-stage{filter:saturate(.8) brightness(.85)}
.pc-trophy.earned{border-color:color-mix(in srgb,var(--accent) 65%,transparent);box-shadow:0 0 20px -10px var(--accent)}
.pc-trophy strong{color:#fff;font-size:13px}.pc-trophy p{margin:2px 0 0;color:#a9c3db;font-size:12px;line-height:1.4}
.pc-earned{position:absolute;top:6px;right:8px;width:18px;height:18px;border-radius:50%;background:#2ee59d;color:#05200f;font-size:11px;font-weight:900;line-height:18px;text-align:center}
.pc-progress{display:flex;align-items:center;gap:6px;margin-top:5px}.pc-progress .pc-bar{flex:1;margin:0}.pc-progress span{color:#93a9be;font-size:10px;font-weight:800}
.pc-calendar{display:grid;gap:5px;margin:0;padding:0;list-style:none}
.pc-cal-row{display:grid;grid-template-columns:56px 1fr auto 96px;gap:12px;align-items:center;padding:3px 12px 3px 4px;border-radius:10px;background:linear-gradient(90deg,color-mix(in srgb,var(--accent) 12%,#08111b),#08111b 55%);border:1px solid #1c3550}
.pc-cal-row .award-emblem{padding:2px}
.pc-cal-row.live{border-color:var(--accent)}
.pc-cal-row.ended{opacity:.55}.pc-cal-row.locked .pc-cal-art{filter:grayscale(.85) brightness(.6)}
.pc-cal-body{display:grid;gap:1px}.pc-cal-body strong{color:#fff;font-size:14px}.pc-cal-body span{color:#a9c3db;font-size:12px}
.pc-cal-date{color:#93a9be;font-size:11px;font-weight:700;white-space:nowrap}
.pc-badge{justify-self:end;padding:4px 10px;border-radius:999px;font-size:10px;font-weight:900;letter-spacing:.8px;text-transform:uppercase;background:rgba(255,255,255,.06);color:#c2d3e3;white-space:nowrap}
.pc-badge.live{background:var(--accent);color:#14070a}.pc-badge.earned{background:#2ee59d;color:#05200f}.pc-badge.locked{color:#93a9be}
.pc-muted{color:#93a9be;font-size:13px}
.pc-error{margin:12px 0;padding:10px;border-radius:10px;border:1px solid #a83e3e;color:#ffd5d5}
.pc-foot{margin:18px 0 0;color:#93a9be;font-size:11px;line-height:1.6;text-align:center}
.pc-ranks-row{display:flex;align-items:center;gap:14px;flex-wrap:wrap;padding:16px 18px;border-radius:12px;border:1px solid #2b4a68;background:linear-gradient(115deg,#101d2e,#0a1420)}
.pc-ranks-row img{filter:drop-shadow(0 4px 10px #0008)}
.pc-ranks-copy{flex:1;min-width:220px}
.pc-ranks-copy strong{display:block;color:#ffd96b;font-size:15px;margin-bottom:4px}
.pc-ranks-copy span{color:#a8bdcd;font-size:12px;line-height:1.6}
.pc-ranks-btn{padding:10px 18px;border-radius:6px;background:linear-gradient(180deg,#ffdf8e,#e0a020);color:#231600;font-size:11px;font-weight:900;letter-spacing:.06em;text-transform:uppercase;text-decoration:none}
@media (max-width:820px){.pc-top{grid-template-columns:1fr}.pc-week{grid-template-columns:repeat(4,1fr)}}
@media (max-width:560px){.pc-live{grid-template-columns:1fr}.pc-live-art{max-width:140px;margin:0 auto}.pc-cal-row{grid-template-columns:48px 1fr auto}.pc-cal-date{display:none}}
`;
