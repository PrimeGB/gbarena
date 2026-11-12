"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useUser } from "../../lib/useUser";

type RosterEntry = {
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  role: string;
  position: string;
};

type Tier = "owner" | "admin" | "senior_staff" | "staff" | "referee";

const tierInfo: { tier: Tier; label: string; plural: string; blurb: string; duties: string[] }[] = [
  {
    tier: "owner",
    label: "Owner",
    plural: "Owner",
    blurb: "Founds and runs GameBattles. Has final say on every decision.",
    duties: ["Full access to every staff tool", "Assigns and removes staff ranks", "Final ruling on appeals and escalations"],
  },
  {
    tier: "admin",
    label: "Administrator",
    plural: "Administrators",
    blurb: "Runs day-to-day operations and keeps competition fair.",
    duties: ["Finalizes disputed match results", "Handles player reports and team enforcement", "Manages awards and reviews the audit log"],
  },
  {
    tier: "senior_staff",
    label: "Senior Staff",
    plural: "Senior Staff",
    blurb: "Experienced moderators who handle the tougher cases.",
    duties: ["Reviews escalated reports", "Checks moderator decisions", "Handles basic moderation"],
  },
  {
    tier: "staff",
    label: "Staff",
    plural: "Staff",
    blurb: "The front line. Keeps the community safe and the matches running.",
    duties: ["Reviews new player reports", "Issues basic moderation actions", "Escalates serious cases to Senior Staff"],
  },
];

function tierFor(entry: RosterEntry): Tier {
  if (entry.role === "owner") return (entry.username || "").toLowerCase() === "prime" ? "owner" : "staff";
  if (entry.role === "admin" || entry.role === "senior_staff" || entry.role === "referee") return entry.role;
  return "staff";
}

function labelFor(tier: Tier) {
  return tier === "referee" ? "Referee" : tierInfo.find((info) => info.tier === tier)?.label || "Staff";
}

export default function StaffInfoPage() {
  const { user, loading: authLoading } = useUser();
  const [roster, setRoster] = useState<RosterEntry[]>([]);
  const [rosterLoaded, setRosterLoaded] = useState(false);
  const [isStaff, setIsStaff] = useState(false);

  useEffect(() => {
    let cancelled = false;
    supabase.rpc("get_public_staff_roster").then(({ data }) => {
      if (cancelled) return;
      setRoster((data || []) as RosterEntry[]);
      setRosterLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const userId = user?.id;
  useEffect(() => {
    if (authLoading) return;
    if (!userId) {
      queueMicrotask(() => setIsStaff(false));
      return;
    }
    let cancelled = false;
    supabase.rpc("staff_has_portal_access").then(({ data }) => {
      if (!cancelled) setIsStaff(data === true);
    });
    return () => {
      cancelled = true;
    };
  }, [authLoading, userId]);

  const grouped = (["owner", "admin", "senior_staff", "staff", "referee"] as Tier[])
    .map((tier) => ({ tier, members: roster.filter((entry) => tierFor(entry) === tier) }))
    .filter((group) => group.members.length > 0);

  return (
    <main className="si-page">
      <style>{`
        body{background:#0b1c2b radial-gradient(ellipse at 50% 0,#173956 0,#0b1c2b 75%) fixed;color:#d7e2ee;font-family:Tahoma,Verdana,Arial,sans-serif;}
        .si-page{max-width:1000px;margin:0 auto;padding:22px 16px 70px;}
        .si-top{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:22px;}
        .si-home{color:#7fb8ee;text-decoration:none;font-size:13px;}
        .si-login{display:inline-block;padding:10px 18px;border-radius:6px;font-weight:bold;font-size:13px;text-decoration:none;border:1px solid #f2c14e;background:linear-gradient(to bottom,#f6d36b,#c8901a);color:#1a1100;}
        .si-login:hover{filter:brightness(1.08);}
        .si-login.disabled{background:#1a232d;border-color:#2c3a48;color:#6b7d8f;cursor:not-allowed;filter:none;}
        .si-hero{background:linear-gradient(180deg,#10283d,#07111b);border:1px solid #1d4468;border-radius:10px;padding:26px 24px;margin-bottom:22px;}
        .si-eyebrow{font-size:11px;letter-spacing:.18em;color:#f2c14e;font-weight:bold;margin:0 0 6px;}
        .si-hero h1{margin:0 0 10px;font-size:32px;color:#fff;}
        .si-hero p{margin:0;line-height:1.6;font-size:14px;color:#b7cfe3;max-width:760px;}
        .si-hero p.si-eyebrow{font-size:11px;color:#f2c14e;margin:0 0 6px;}
        .si-h2{font-size:14px;text-transform:uppercase;letter-spacing:.08em;color:#f2c14e;margin:26px 0 12px;display:flex;align-items:center;gap:12px;}
        .si-h2::after{content:"";flex:1;height:1px;background:#1d4468;}
        .si-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;}
        .si-card{background:#07111b;border:1px solid #1d4468;border-radius:8px;padding:14px;}
        .si-card h3{margin:0 0 4px;font-size:16px;color:#fff;}
        .si-card .blurb{font-size:12px;color:#8fa9c2;margin-bottom:10px;line-height:1.5;}
        .si-card ul{margin:0;padding-left:18px;font-size:13px;line-height:1.7;color:#d7e2ee;}
        .si-rules{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:12px;}
        .si-rule{background:#07111b;border:1px solid #1d4468;border-radius:8px;padding:14px;font-size:13px;line-height:1.6;color:#d7e2ee;}
        .si-rule b{display:block;color:#fff;margin-bottom:4px;}
        .si-group{margin-bottom:20px;}
        .si-group-title{font-size:12px;color:#8fa9c2;font-weight:bold;text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px;}
        .si-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:12px;}
        .si-member{display:flex;align-items:center;gap:12px;padding:12px;background:linear-gradient(180deg,#0f2236,#09141f);border:1px solid #1d4468;border-radius:8px;text-decoration:none;color:inherit;transition:border-color .15s,transform .15s;}
        .si-member:hover{border-color:#f2c14e;transform:translateY(-2px);}
        .si-avatar{width:52px;height:52px;border-radius:8px;overflow:hidden;background:#0f2a40;display:grid;place-items:center;font-weight:bold;color:#f2c14e;flex:none;border:1px solid #244b70;}
        .si-avatar img{width:100%;height:100%;object-fit:cover;display:block;}
        .si-name{font-weight:bold;color:#f2c14e;font-size:15px;}
        .si-role{font-size:11px;color:#8fa9c2;margin-top:3px;text-transform:uppercase;letter-spacing:.06em;}
        .si-empty{color:#8fa9c2;font-size:13px;}
      `}</style>

      <div className="si-top">
        <Link className="si-home" href="/home">← Back to GameBattles</Link>
        {isStaff ? (
          <Link className="si-login" href="/staff/dashboard">Staff Login</Link>
        ) : (
          <span
            className="si-login disabled"
            aria-disabled="true"
            title="Only GameBattles staff can open the staff area"
          >
            Staff Login
          </span>
        )}
      </div>

      <section className="si-hero">
        <p className="si-eyebrow">GAMEBATTLES STAFF</p>
        <h1>Meet The Team</h1>
        <p>
          The GameBattles staff keeps matches fair, reviews disputes and reports, and looks after the community.
          Every staff action is tied to a rank and recorded in an audit log, so decisions stay accountable.
        </p>
      </section>

      <div className="si-h2">What Staff Does</div>
      <div className="si-rules">
        <div className="si-rule"><b>Match disputes</b>When teams disagree on a score or a team doesn&apos;t show, staff review the evidence and set the official result.</div>
        <div className="si-rule"><b>Reports and enforcement</b>Players can report rule breaking from the Report page. Staff review each case and can mute players or suspend teams.</div>
        <div className="si-rule"><b>Tournaments and awards</b>Staff run tournament brackets and hand out community and competition awards.</div>
        <div className="si-rule"><b>Need help?</b>Open a report or visit Support. Please don&apos;t message staff directly for rulings, as every decision goes through the ticket system.</div>
      </div>

      <div className="si-h2">Staff Roles</div>
      <div className="si-cards">
        {tierInfo.map((info) => (
          <div className="si-card" key={info.tier}>
            <h3>{info.label}</h3>
            <div className="blurb">{info.blurb}</div>
            <ul>
              {info.duties.map((duty) => (
                <li key={duty}>{duty}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="si-h2">Staff Roster</div>
      {!rosterLoaded && <div className="si-empty">Loading roster...</div>}
      {rosterLoaded && grouped.length === 0 && <div className="si-empty">No staff listed yet.</div>}
      {grouped.map((group) => (
        <div className="si-group" key={group.tier}>
          <div className="si-group-title">
            {group.tier === "referee" ? "Referees" : tierInfo.find((info) => info.tier === group.tier)?.plural}
          </div>
          <div className="si-grid">
            {group.members.map((member) => (
              <Link className="si-member" href={`/profile?userId=${member.user_id}`} key={member.user_id}>
                <span className="si-avatar">
                  {member.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={member.avatar_url} alt="" loading="lazy" decoding="async" />
                  ) : (
                    (member.username || "?").slice(0, 2).toUpperCase()
                  )}
                </span>
                <span>
                  <div className="si-name">{member.username || "Unnamed"}</div>
                  <div className="si-role">{member.position || labelFor(group.tier)}</div>
                </span>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </main>
  );
}
