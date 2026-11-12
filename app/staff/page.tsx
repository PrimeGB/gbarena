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

type Tier = "owner" | "admin" | "staff" | "referee";

const tierInfo: { tier: Tier; label: string; plural: string; blurb: string; duties: string[] }[] = [
  {
    tier: "owner",
    label: "Founder",
    plural: "Founders",
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
    tier: "staff",
    label: "Moderator",
    plural: "Moderators",
    blurb: "Helps keep the community safe and welcoming.",
    duties: ["Reviews reports and moderates content", "Can issue mutes up to 24 hours", "Escalates serious cases"],
  },
  {
    tier: "referee",
    label: "Referee",
    plural: "Referees",
    blurb: "Keeps competition fair by reviewing match disputes.",
    duties: ["Reviews match evidence", "Decides eligible disputes", "Recommends awards for review"],
  },
];

function tierFor(entry: RosterEntry): Tier {
  if (entry.role === "owner" || entry.role === "admin" || entry.role === "referee") return entry.role;
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

  const grouped = (["owner", "admin", "staff", "referee"] as Tier[])
    .map((tier) => ({ tier, members: roster.filter((entry) => tierFor(entry) === tier) }))
    .filter((group) => group.members.length > 0);

  return (
    <main className="si-page">
      <style>{`
        body{background:#06111d radial-gradient(ellipse at 50% 0,#285b80 0,#102d46 52%,#06111d 100%) fixed;color:#e5f1fb;font-family:Tahoma,Verdana,Arial,sans-serif;}
        .si-page{max-width:1000px;margin:0 auto;padding:22px 16px 70px;}
        .si-top{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:22px;}
        .si-home{color:#bce3ff;text-decoration:none;font-size:13px;font-weight:bold;}
        .si-home:hover,.si-home:focus-visible{color:#fff;text-decoration:underline;}
        .si-login{display:inline-block;padding:10px 18px;border-radius:6px;font-weight:bold;font-size:13px;text-decoration:none;border:1px solid #f2c14e;background:linear-gradient(to bottom,#f6d36b,#c8901a);color:#1a1100;}
        .si-login:hover{filter:brightness(1.08);}
        .si-login.disabled{background:#20374a;border-color:#52728a;color:#c0d0dc;cursor:not-allowed;filter:none;}
        .si-hero{background:radial-gradient(ellipse at 90% 0,#346c96,transparent 58%),linear-gradient(115deg,#1d4a6c,#0a2033);border:1px solid #5895bf;border-top:4px solid #c12a2a;border-radius:10px;padding:26px 24px;margin-bottom:22px;box-shadow:0 8px 24px #0005;}
        .si-eyebrow{font-size:11px;letter-spacing:.18em;color:#ffdb75;font-weight:bold;margin:0 0 6px;}
        .si-hero h1{margin:0 0 10px;font-size:32px;font-weight:900;color:#fff;text-shadow:0 2px 6px #0008;}
        .si-hero p{margin:0;line-height:1.6;font-size:14px;color:#e2f2ff;max-width:760px;}
        .si-hero p.si-eyebrow{font-size:11px;color:#ffdb75;margin:0 0 6px;}
        .si-h2{font-size:14px;font-weight:900;text-transform:uppercase;letter-spacing:.08em;color:#ffdb75;margin:26px 0 12px;display:flex;align-items:center;gap:12px;}
        .si-h2::after{content:"";flex:1;height:2px;background:linear-gradient(to right,#c3943b,#32658a);}
        .si-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;}
        .si-card{background:linear-gradient(155deg,#1a4160,#0c253a);border:1px solid #467ba0;border-top:3px solid #d5a840;border-radius:8px;padding:14px;box-shadow:0 5px 16px #0004;}
        .si-card h3{margin:0 0 4px;font-size:16px;font-weight:900;color:#fff;}
        .si-card .blurb{font-size:12px;color:#c6e0f3;margin-bottom:10px;line-height:1.5;}
        .si-card ul{margin:0;padding-left:18px;font-size:13px;line-height:1.7;color:#e4f2fb;}
        .si-rules{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:12px;}
        .si-rule{background:linear-gradient(135deg,#1c4666,#0b263c);border:1px solid #467fa5;border-left:4px solid #cb3030;border-radius:8px;padding:14px;font-size:13px;line-height:1.6;color:#e4f2fb;box-shadow:0 5px 16px #0004;}
        .si-rule b{display:block;color:#fff;font-size:14px;margin-bottom:4px;}
        .si-group{margin-bottom:20px;}
        .si-group-title{font-size:12px;color:#bce3ff;font-weight:900;text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px;}
        .si-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:12px;}
        .si-member{display:flex;align-items:center;gap:12px;padding:12px;background:linear-gradient(135deg,#1e4a6a,#0d283d);border:1px solid #5084a7;border-radius:8px;text-decoration:none;color:inherit;box-shadow:0 5px 16px #0004;transition:border-color .15s,transform .15s;}
        .si-member:hover,.si-member:focus-visible{border-color:#ffdb75;transform:translateY(-2px);}
        .si-member:focus-visible{outline:2px solid #ffdb75;outline-offset:2px;}
        .si-avatar{width:52px;height:52px;border-radius:8px;overflow:hidden;background:#12344e;display:grid;place-items:center;font-weight:bold;color:#ffdb75;flex:none;border:1px solid #6b9dbd;}
        .si-avatar img{width:100%;height:100%;object-fit:cover;display:block;}
        .si-name{font-weight:bold;color:#ffdb75;font-size:15px;}
        .si-role{font-size:11px;color:#c6e0f3;margin-top:3px;text-transform:uppercase;letter-spacing:.06em;}
        .si-empty{color:#c6e0f3;font-size:13px;}
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
                  <div className="si-role">{labelFor(group.tier)}</div>
                </span>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </main>
  );
}
