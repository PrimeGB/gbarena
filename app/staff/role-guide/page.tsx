"use client";

import StaffToolShell from "../StaffToolShell";

const roles = [
  {
    title: "Founder / Owner",
    details: "Full site control. Assigns or removes Administrators, Moderators and Referees; grants or removes Administrator credit access; sets tournament fees and prizes; reviews site-change requests; and has access to staff work areas and audit records.",
  },
  {
    title: "Administrator",
    details: "Manages Moderators and Referees, reports, moderation, match disputes and results, awards, tournaments, team-name requests, feedback and staff audit records. May propose site changes for Owner review. Credit changes and prize payouts require a separate Owner grant; Administrators cannot set tournament fees or prizes.",
  },
  {
    title: "Moderator",
    details: "Reviews and escalates player reports, moderates forum posts and individual replies, and may issue or lift mutes of up to 24 hours. May recommend awards. Cannot assign staff, suspend accounts, decide matches, grant awards or delete other players' threads.",
  },
  {
    title: "Referee",
    details: "Reviews match dispute evidence and finalizes match results. May recommend awards. Cannot handle unrelated player reports, moderate content, assign staff, grant awards or manage credits.",
  },
];

export default function StaffRoleGuidePage() {
  return (
    <StaffToolShell title="Staff roles and access">
      <p>Permissions are checked by the server, not just by the buttons shown here. Each account keeps its own sign-in.</p>
      <div className="staff-mobile-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
        {roles.map((role) => <article key={role.title}><h2>{role.title}</h2><p>{role.details}</p></article>)}
      </div>
      <h2>Important safeguards</h2>
      <ul>
        <li>Staff must not decide cases involving themselves or their current teams; another authorized staff member must handle them.</li>
        <li>Owners can grant or revoke credit access for individual Administrators. Changing a role removes any credit grant.</li>
        <li>Administrator payouts use the Owner-set tournament prize. Staff must verify the winning registered team before paying.</li>
        <li>Approving a site-change request records a decision; it does not change the site. Only an Owner controls implementation.</li>
        <li>Use Leave staff area to return to the site while signed in, or Sign out on the dashboard to end the session.</li>
      </ul>
      <p>Application permissions do not control separate repository, hosting or database accounts.</p>
    </StaffToolShell>
  );
}
