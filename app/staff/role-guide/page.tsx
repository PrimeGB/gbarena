"use client";

import { useSyncExternalStore } from "react";
import StaffToolShell from "../StaffToolShell";
import "./role-guide.css";

const roles = [
  {
    title: "Founder",
    short: "FOUNDER",
    tone: "owner",
    description: "Leads the site and has full access to staff work areas.",
    access: [
      { title: "Staff management", detail: "Assign or remove staff roles, including Administrators, and grant or remove Administrator credit access." },
      { title: "Disputes and reviews", detail: "Review match evidence, finalize results and review requests about staff decisions." },
      { title: "Community and enforcement", detail: "Manage reports, moderation, awards, team-name requests, feedback and staff activity." },
      { title: "Tournaments, credits and site changes", detail: "Set tournament fees and prizes, manage credits and review proposed site changes." },
    ],
    limit: "Staff actions must follow the same conflict-of-interest safeguards as everyone else.",
  },
  {
    title: "Administrator",
    short: "ADMIN",
    tone: "admin",
    description: "Manages day-to-day operations and supports the staff team.",
    access: [
      { title: "Staff management", detail: "Assign or remove Moderators and Referees, and manage staff positions and duties. Only a Founder can change Administrator access." },
      { title: "Disputes and reviews", detail: "Review match evidence, finalize results and review eligible requests about staff decisions." },
      { title: "Community and enforcement", detail: "Manage reports, moderation, awards, team-name requests, feedback and staff activity." },
      { title: "Tournaments and site requests", detail: "Manage tournaments and propose site changes for Founder review. Tournament fees and prizes are set by a Founder." },
    ],
    limit: "Credit changes and prize payouts require a separate Founder grant. Administrators cannot set tournament fees or prizes.",
  },
  {
    title: "Moderator / Senior Staff",
    short: "MOD",
    tone: "moderator",
    description: "Helps keep the community safe and handles player reports.",
    access: [
      { title: "Player reports and feedback", detail: "Review and escalate player reports and read community feedback. High-priority changes are reserved for Administrators and Founders." },
      { title: "Forum moderation", detail: "Moderate forum posts and individual replies. Deleting other players' threads is reserved for Administrators and Founders." },
      { title: "Temporary mutes", detail: "Issue or lift mutes of up to 24 hours within the moderation safeguards." },
      { title: "Award recommendations", detail: "Recommend a player or team for an award for review by authorized staff." },
    ],
    limit: "Cannot assign staff, suspend accounts, finalize disputed matches, grant awards or manage credits.",
  },
  {
    title: "Referee",
    short: "REF",
    tone: "referee",
    description: "Focuses on match disputes and fair results.",
    access: [
      { title: "Disputed match tickets", detail: "Review both teams' evidence and finalize a match result with a recorded reason." },
      { title: "Completed and revised tickets", detail: "See your completed decisions and feedback when a higher-up has reviewed them." },
      { title: "Award recommendations", detail: "Recommend a player or team for an award for review by authorized staff." },
    ],
    limit: "Cannot manage unrelated player reports, moderate content, assign staff, grant awards or manage credits.",
  },
];

const standards = [
  { title: "Access can be removed", detail: "Staff access is a privilege and can be changed or revoked at any time." },
  { title: "Staff work is voluntary", detail: "This is not a paid service. A staff role does not promise payment or compensation." },
  { title: "Lead by example", detail: "Follow site and ladder rules, treat everyone respectfully, and be a positive example for the community." },
  { title: "No personal profit or favors", detail: "Never use staff status, inside information, tools or decisions for personal profit. Do not sell access, favors, decisions or benefits." },
  { title: "Be fair and accountable", detail: "Review the evidence, explain decisions honestly, and leave matters involving yourself or your team to another authorized staff member." },
  { title: "Protect private information", detail: "Keep staff-only information private, use your own account, and escalate concerns or mistakes to a higher-up." },
];

const subscribePreview = () => () => {};
const getPreview = () => process.env.NODE_ENV === "development" && new URLSearchParams(window.location.search).get("preview") === "1";
const getServerPreview = () => false;

export default function StaffRoleGuidePage() {
  const preview = useSyncExternalStore(subscribePreview, getPreview, getServerPreview);
  const guide = <div className="role-guide">
        <div className="role-guide-intro">
          <div>
            <p className="role-guide-kicker">STAFF HANDBOOK</p>
            <h2>Know your role. Know your responsibility.</h2>
            <p>Every role has a purpose. Explore the access and limits below, and use your permissions responsibly.</p>
          </div>
          <div className="role-guide-intro-note"><strong>Access is role-based</strong><span>Permissions are checked by the server, not just by the buttons shown.</span></div>
        </div>

        <section aria-labelledby="role-guide-roles">
          <div className="role-guide-section-heading">
            <div><p className="role-guide-kicker">THE STAFF TEAM</p><h2 id="role-guide-roles">Roles at a glance</h2></div>
            <p>Select any bullet to learn more.</p>
          </div>
          <div className="role-guide-grid">
            {roles.map((role) => (
              <article className={`role-guide-card role-guide-card--${role.tone}`} key={role.title}>
                <div className="role-guide-card-head">
                  <span className="role-guide-badge" aria-hidden="true">{role.short}</span>
                  <div><p className="role-guide-role-label">STAFF ROLE</p><h3>{role.title}</h3><p className="role-guide-description">{role.description}</p></div>
                </div>
                <h4>WHAT THEY CAN ACCESS</h4>
                <ul className="role-guide-access">
                  {role.access.map((item) => <li key={item.title}>
                    <details><summary>{item.title}</summary><p>{item.detail}</p></details>
                  </li>)}
                </ul>
                <div className="role-guide-limit"><strong>ROLE LIMITS</strong><p>{role.limit}</p></div>
              </article>
            ))}
          </div>
        </section>

        <section className="role-guide-standards" aria-labelledby="role-guide-standards">
          <div className="role-guide-section-heading">
            <div><p className="role-guide-kicker">THE STANDARD FOR EVERY ROLE</p><h2 id="role-guide-standards">Staff access &amp; conduct</h2></div>
            <p>Trust is earned through how we act.</p>
          </div>
          <ul className="role-guide-standards-list">
            {standards.map((item) => <li key={item.title}><strong>{item.title}</strong><span>{item.detail}</span></li>)}
          </ul>
        </section>

        <section className="role-guide-reminders" aria-labelledby="role-guide-reminders">
          <h2 id="role-guide-reminders">Good to know</h2>
          <ul>
            <li>Changing a staff role removes any separate credit grant.</li>
            <li>Administrator payouts use the Founder-set tournament prize. Verify the winning registered team before paying.</li>
            <li>Approving a site-change request records a decision; it does not change the site. Only a Founder controls implementation.</li>
            <li>Leave staff area returns you to the site while signed in. Sign out on the dashboard to end your session.</li>
            <li>Site permissions do not control separate repository, hosting or database accounts.</li>
          </ul>
        </section>
      </div>;
  if (preview) {
    return <main className="staff-mobile-page staff-portal-page role-guide-preview">
      <div className="staff-mobile-shell">
        <header className="staff-mobile-header"><h1>Staff roles and access</h1><p>Preview only &mdash; no permissions are changed.</p></header>
        <section className="staff-mobile-section">{guide}</section>
      </div>
    </main>;
  }
  return <StaffToolShell title="Staff roles and access">{guide}</StaffToolShell>;
}
