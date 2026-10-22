"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useState,
  type CSSProperties,
  type FormEvent,
} from "react";
import { supabase } from "../../../lib/supabase";
import { useUser } from "../../../lib/useUser";
import "../staff-responsive.css";

const workAreas = [
  {
    key: "match_review",
    title: "Disputed match tickets",
    description: "Review submitted disputes and finalize official match results.",
    href: "/staff/matches",
  },
  {
    key: "staff_reports",
    title: "Player reports and enforcement",
    description: "Review new cases, manage evidence, and record decisions.",
    href: "#reports-inbox",
  },
  {
    key: "awards",
    title: "Awards management",
    description: "Work with community and competition awards.",
    href: "/staff/awards",
  },
  {
    key: "staff_directory",
    title: "Staff roles and oversight",
    description: "Review staff positions, duties, and rank assignments.",
    href: null,
  },
] as const;

type PermissionKey =
  | (typeof workAreas)[number]["key"]
  | "basic_moderation"
  | "escalated_reports"
  | "moderation_review"
  | "staff_access"
  | "audit_log"
  | "team_enforcement";

type StaffRank = "member" | "staff" | "senior_staff" | "admin";

const rankNames: Record<string, string> = {
  owner: "Founder — Prime",
  admin: "Administrator",
  senior_staff: "Senior Staff",
  staff: "Moderator",
  referee: "Referee",
  member: "User",
};

const rankPermissions: Record<string, PermissionKey[]> = {
  owner: workAreas.map((area) => area.key),
  admin: ["match_review", "staff_reports", "awards", "staff_directory", "team_enforcement", "audit_log"],
  senior_staff: ["staff_reports", "basic_moderation", "escalated_reports", "moderation_review"],
  staff: ["staff_reports", "basic_moderation"],
};

type DashboardOverview = {
  role: string;
  open_disputes: number;
  new_reports: number;
  priority_cases: number;
  pending_awards: number;
  my_cases: number;
  recent_actions: {
    action: string;
    target_type: string;
    target_id: string | null;
    case_id: number | null;
    reason: string;
    previous_values: Record<string, unknown> | null;
    new_values: Record<string, unknown> | null;
    created_at: string;
    actor_username: string;
  }[];
};

type StaffCase = {
  id: number;
  case_number: string;
  report_type: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  reported_by: string | null;
  reporter_username: string | null;
  assigned_to: string | null;
  assignee_username: string | null;
  target_username: string | null;
  target_team_name: string | null;
  evidence: string;
  decision: string;
  created_at: string;
};

type StaffDirectoryEntry = {
  user_id: string;
  username: string;
  position: string;
  duties: string;
  is_owner: boolean;
};

type ProfileRow = {
  role: string;
};

type PermissionRow = {
  permission_key: PermissionKey;
};

export default function StaffDashboardPage() {
  const { user, loading: authLoading } = useUser();
  const [role, setRole] = useState("");
  const [permissions, setPermissions] = useState<PermissionKey[]>([]);
  const [staff, setStaff] = useState<StaffDirectoryEntry[]>([]);
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [cases, setCases] = useState<StaffCase[]>([]);
  const [emailAllowed, setEmailAllowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadedUserIdentity, setLoadedUserIdentity] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [username, setUsername] = useState("");
  const [position, setPosition] = useState("");
  const [duties, setDuties] = useState("");
  const [staffRank, setStaffRank] = useState<StaffRank>("staff");
  const [rankReason, setRankReason] = useState("");

  const isOwner = role === "owner";
  const canEditDirectory = isOwner || permissions.includes("staff_directory");
  const hasPortalAccess = emailAllowed;

  const loadDashboard = useCallback(async (userId: string, userEmail: string) => {
    const userIdentity = `${userId}:${userEmail}`;
    setLoading(true);
    const { data: portalAccess, error: portalAccessError } = await supabase.rpc(
      "staff_has_portal_access"
    );

    if (portalAccessError) {
      setEmailAllowed(false);
      setRole("");
      setPermissions([]);
      setStaff([]);
      setError(`Staff access could not be checked: ${portalAccessError.message}`);
      setLoadedUserIdentity(userIdentity);
      setLoading(false);
      return;
    }

    const isAllowed = portalAccess === true;
    setEmailAllowed(isAllowed);
    if (!isAllowed) {
      setRole("");
      setPermissions([]);
      setStaff([]);
      setError("");
      setLoadedUserIdentity(userIdentity);
      setLoading(false);
      return;
    }

    const [{ data: profile, error: profileError }, { data: grants, error: grantsError }] =
      await Promise.all([
        supabase.from("profiles").select("role").eq("id", userId).maybeSingle(),
        supabase
          .from("staff_access_grants")
          .select("permission_key")
          .eq("user_id", userId),
      ]);

    setError("");
    if (profileError || grantsError) {
      setRole("");
      setPermissions([]);
      setStaff([]);
      setError(
        `Staff access could not be loaded: ${
          profileError?.message || grantsError?.message
        }`
      );
      setLoadedUserIdentity(userIdentity);
      setLoading(false);
      return;
    }

    const profileRow = profile as ProfileRow | null;
    const permissionRows = (grants || []) as PermissionRow[];
    const userPermissions = rankPermissions[profileRow?.role || ""] ||
      permissionRows.map((grant) => grant.permission_key);
    setRole(profileRow?.role || "");
    setPermissions(userPermissions);

    const [
      { data: directory, error: directoryError },
      { data: overviewData, error: overviewError },
      { data: caseData, error: caseError },
    ] = await Promise.all([
      supabase.rpc("get_staff_directory"),
      supabase.rpc("staff_dashboard_overview"),
      supabase.rpc("staff_list_cases"),
    ]);
    if (directoryError || overviewError || caseError) {
      setStaff([]);
      setOverview(null);
      setCases([]);
      setError(
        `Staff dashboard could not be loaded: ${
          directoryError?.message || overviewError?.message || caseError?.message
        }`
      );
      setLoadedUserIdentity(userIdentity);
      setLoading(false);
      return;
    }

    setStaff((directory || []) as StaffDirectoryEntry[]);
    setOverview(overviewData as DashboardOverview);
    setCases((caseData || []) as StaffCase[]);
    setLoadedUserIdentity(userIdentity);
    setLoading(false);
  }, []);

  const userId = user?.id;
  const userEmail = user?.email || "";
  useEffect(() => {
    if (authLoading) return;
    if (!userId) return;

    void Promise.resolve().then(() => loadDashboard(userId, userEmail));
  }, [authLoading, loadDashboard, userEmail, userId]);

  async function assignStaffMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (!username.trim()) {
      setError("Enter an existing account username.");
      return;
    }
    if (staffRank !== "member" && (!position.trim() || !duties.trim())) {
      setError("Enter a staff position and duty description.");
      return;
    }
    if (rankReason.trim().length < 10) {
      setError("Enter a reason of at least 10 characters for the rank assignment.");
      return;
    }

    setSaving(true);
    const { error: assignError } = await supabase.rpc("staff_set_rank", {
      target_username: username.trim(),
      target_role: staffRank,
      staff_position: staffRank === "member" ? "" : position.trim(),
      staff_duties: staffRank === "member" ? "" : duties.trim(),
      decision_reason: rankReason.trim(),
    });
    setSaving(false);

    if (assignError) {
      setError(`Staff access could not be saved: ${assignError.message}`);
      return;
    }

    setUsername("");
    setPosition("");
    setDuties("");
    setRankReason("");
    setStaffRank("staff");
    setNotice("Staff rank and audit entry saved.");
    if (user) await loadDashboard(user.id, user.email || "");
  }

  async function removeStaffMember(memberUsername: string) {
    const reason = window.prompt(
      `Why are you removing staff access for ${memberUsername}?`
    );
    if (!reason || reason.trim().length < 10) {
      setError("Enter a removal reason of at least 10 characters.");
      return;
    }

    setError("");
    setNotice("");

    const { error: removeError } = await supabase.rpc("staff_set_rank", {
      target_username: memberUsername,
      target_role: "member",
      staff_position: "",
      staff_duties: "",
      decision_reason: reason.trim(),
    });

    if (removeError) {
      setError(`Staff access could not be removed: ${removeError.message}`);
      return;
    }

    setNotice(`Staff access removed for ${memberUsername}.`);
    if (user) await loadDashboard(user.id, user.email || "");
  }

  async function updateDirectoryEntry(
    event: FormEvent<HTMLFormElement>,
    memberUsername: string
  ) {
    event.preventDefault();
    setError("");
    setNotice("");

    const formData = new FormData(event.currentTarget);
    const memberPosition = String(formData.get("position") || "").trim();
    const memberDuties = String(formData.get("duties") || "").trim();
    const decisionReason = String(formData.get("reason") || "").trim();
    const { error: updateError } = await supabase.rpc("staff_update_directory", {
      target_username: memberUsername,
      staff_position: memberPosition,
      staff_duties: memberDuties,
      decision_reason: decisionReason,
    });

    if (updateError) {
      setError(`Directory entry could not be updated: ${updateError.message}`);
      return;
    }

    setNotice(`Directory entry updated for ${memberUsername}.`);
    if (user) await loadDashboard(user.id, user.email || "");
  }

  async function updateCaseStatus(event: FormEvent<HTMLFormElement>, staffCase: StaffCase) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const status = String(data.get("status") || staffCase.status);
    const priority = String(data.get("priority") || staffCase.priority);
    const assignedUsername = String(data.get("assignee") || "");
    const decision = String(data.get("decision") || "");
    const { error: caseUpdateError } = await supabase.rpc("staff_update_case", {
      target_case_id: staffCase.id,
      new_status: status,
      new_priority: priority,
      assigned_username: assignedUsername || null,
      decision_note: decision,
    });
    if (caseUpdateError) {
      setError(`Case ${staffCase.case_number} could not be updated: ${caseUpdateError.message}`);
      return;
    }
    setNotice(`Case ${staffCase.case_number} updated and recorded in the audit log.`);
    if (user) await loadDashboard(user.id, user.email || "");
  }

  return (
    <main className="staff-mobile-page staff-portal-page" style={styles.page}>
      <section className="staff-mobile-shell" style={styles.shell}>
        <header className="staff-mobile-header" style={styles.header}>
          <p style={styles.eyebrow}>GAMEBATTLES STAFF</p>
          <div style={styles.titleRow}>
            <div>
              <h1 style={styles.title}>Administration Command Center</h1>
              <p style={styles.subheading}>
                Competitive operations · disputes · player safety · awards
              </p>
            </div>
            {role && (
              <span style={styles.rankBadge}>
                {rankNames[role] || "Staff"}
              </span>
            )}
          </div>
          <p style={styles.subheading}>
            Authorized staff workspace. Tools and actions are limited by rank and
            recorded for accountability.
          </p>
        </header>
        <nav className="staff-mobile-nav" style={styles.nav}>
          <Link href="/home">Back to GameBattles</Link>
          {user && hasPortalAccess && (
            <>
              {permissions.includes("staff_reports") && <a href="#reports-inbox">Reports</a>}
              {(isOwner || permissions.includes("match_review")) && <Link href="/staff/matches">Dispute tickets</Link>}
              {(isOwner || permissions.includes("awards")) && <Link href="/staff/awards">Awards</Link>}
              {(isOwner || permissions.includes("staff_directory")) && <a href="#staff-directory">Staff roster</a>}
            </>
          )}
        </nav>

        {authLoading ||
        (user &&
          (loading ||
            loadedUserIdentity !== `${user.id}:${user.email || ""}`)) ? (
          <p style={styles.message}>Checking your staff access...</p>
        ) : !user ? (
          <div style={styles.message}>
            <p>Sign in with your GameBattles account to continue.</p>
            <Link href="/login?next=%2Fstaff%2Fdashboard" style={styles.button}>
              Staff Login
            </Link>
          </div>
        ) : error && !role ? (
          <p style={styles.error} role="alert">{error}</p>
        ) : !hasPortalAccess ? (
          <p style={styles.message}>
            This account is not on the approved staff email list. Contact the site
            Owner if you believe this is a mistake.
          </p>
        ) : (
          <>
            {error && <p style={styles.error} role="alert">{error}</p>}
            {notice && <p style={styles.notice} role="status">{notice}</p>}

            <section id="dashboard-overview" className="staff-mobile-section" style={styles.section}>
              <h2 style={styles.sectionTitle}>Dashboard / Overview</h2>
              <p style={styles.cardText}>
                Rank: <strong>{rankNames[role] || "Staff"}</strong>
              </p>
              <div className="staff-mobile-grid" style={styles.cards}>
                {[
                  ["Open disputes", overview?.open_disputes],
                  ["New reports", overview?.new_reports],
                  ["Priority cases", overview?.priority_cases],
                  ["Pending awards", overview?.pending_awards],
                  ["Assigned to me", overview?.my_cases],
                ].map(([label, value]) => (
                  <article key={String(label)} style={styles.card}>
                    <p style={styles.metricLabel}>{label}</p>
                    <strong style={styles.metricValue}>{value ?? "—"}</strong>
                  </article>
                ))}
              </div>
            </section>

            {permissions.includes("staff_reports") && (
              <section id="reports-inbox" className="staff-mobile-section" style={styles.section}>
                <h2 style={styles.sectionTitle}>Reports and enforcement inbox</h2>
                {cases.length === 0 ? (
                  <p style={styles.help}>No player reports or enforcement cases are open.</p>
                ) : (
                  <div className="staff-mobile-list" style={styles.staffList}>
                    {cases.map((staffCase) => (
                      <article key={staffCase.id} className="staff-mobile-card" style={styles.staffCard}>
                        <div className="staff-mobile-card-header" style={styles.staffCardHeader}>
                          <strong style={styles.cardTitle}>
                            {staffCase.case_number} · {staffCase.title}
                          </strong>
                          <span style={styles.statusBadge}>
                            {staffCase.priority.toUpperCase()} · {staffCase.status.replaceAll("_", " ").toUpperCase()}
                          </span>
                        </div>
                        <p style={styles.cardText}>
                          {staffCase.report_type.toUpperCase()} report · from {staffCase.reporter_username || "Unknown"} · player {staffCase.target_username || "—"} · team {staffCase.target_team_name || "—"}
                        </p>
                        <p style={styles.cardText}>{staffCase.description}</p>
                        {staffCase.evidence && (
                          <p style={styles.help}>Evidence: {staffCase.evidence}</p>
                        )}
                        <form
                          className="staff-mobile-form"
                          style={styles.form}
                          onSubmit={(event) => updateCaseStatus(event, staffCase)}
                        >
                          <label style={styles.label}>
                            Status
                            <select name="status" defaultValue={staffCase.status} style={styles.input}>
                              {["new", "under_review", "awaiting_evidence", "escalated", "resolved", "dismissed"].map((status) => (
                                <option key={status} value={status}>{status.replaceAll("_", " ")}</option>
                              ))}
                            </select>
                          </label>
                          <label style={styles.label}>
                            Reason for this case update
                            <textarea
                              name="reason"
                              minLength={10}
                              maxLength={1000}
                              rows={2}
                              style={styles.input}
                              required
                            />
                          </label>
                          <label style={styles.label}>
                            Priority
                            <select name="priority" defaultValue={staffCase.priority} style={styles.input}>
                              {["low", "normal", "high", "urgent"].map((priority) => (
                                <option key={priority} value={priority}>{priority}</option>
                              ))}
                            </select>
                          </label>
                          <label style={styles.label}>
                            {isOwner || permissions.includes("staff_directory")
                              ? "Assign to staff username"
                              : "Assign to yourself (enter your staff username)"}
                            <input
                              name="assignee"
                              defaultValue={staffCase.assignee_username || ""}
                              style={styles.input}
                            />
                          </label>
                          <label style={styles.label}>
                            Decision / audit reason
                            <textarea
                              name="decision"
                              placeholder="Reason for this case update"
                              minLength={10}
                              maxLength={1000}
                              rows={2}
                              style={styles.input}
                              required
                            />
                          </label>
                          <button type="submit" style={styles.secondaryButton}>Save case update</button>
                        </form>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            )}

            {overview && overview.recent_actions.length > 0 && (
              <section id="staff-audit" className="staff-mobile-section" style={styles.section}>
                <h2 style={styles.sectionTitle}>Recent staff actions</h2>
                <div className="staff-mobile-list" style={styles.staffList}>
                  {overview.recent_actions.map((action, index) => (
                    <article key={`${action.action}-${action.created_at}-${index}`} style={styles.staffCard}>
                      <strong style={styles.cardTitle}>
                        {action.action.replaceAll("_", " ")} · {action.target_type}
                      </strong>
                      <p style={styles.cardText}>
                        {action.actor_username} · {new Date(action.created_at).toLocaleString()}
                      </p>
                      <p style={styles.help}>{action.reason}</p>
                      {action.previous_values && action.new_values && (
                        <p style={styles.help}>
                          Before: {JSON.stringify(action.previous_values)} · After:{" "}
                          {JSON.stringify(action.new_values)}
                        </p>
                      )}
                    </article>
                  ))}
                </div>
              </section>
            )}

            <section id="staff-work-areas" className="staff-mobile-section" style={styles.section}>
              <h2 style={styles.sectionTitle}>Staff work areas</h2>
              {workAreas.some((area) => isOwner || permissions.includes(area.key)) ? (
                <div className="staff-mobile-grid" style={styles.cards}>
                  {workAreas
                    .filter((area) => isOwner || permissions.includes(area.key))
                    .map((area) => (
                    <article
                      key={area.key}
                      className={area.key === "match_review" ? "staff-ticket-card" : undefined}
                      style={styles.card}
                    >
                      {area.key === "match_review" && (
                        <p className="staff-ticket-kicker">TICKET QUEUE</p>
                      )}
                      <h3 style={styles.cardTitle}>{area.title}</h3>
                      <p style={styles.cardText}>{area.description}</p>
                      {area.href ? (
                        <Link
                          href={area.href}
                          className={area.key === "match_review" ? "staff-ticket-link" : undefined}
                          style={styles.cardLink}
                        >
                          {area.key === "match_review" ? "Open ticket queue" : "Open work area"}
                        </Link>
                      ) : area.key === "staff_directory" ? (
                        <a href="#staff-directory" style={styles.cardLink}>
                          Manage directory details
                        </a>
                      ) : (
                        <p style={styles.help}>This rank has access to this staff area.</p>
                      )}
                    </article>
                  ))}
                </div>
              ) : (
                <p style={styles.help}>
                  This approved account has no staff work areas assigned yet.
                  Contact the site Owner to request the duties you need.
                </p>
              )}
            </section>

            {isOwner && (
              <section id="staff-access" className="staff-mobile-section" style={styles.section}>
                <h2 style={styles.sectionTitle}>Assign staff access</h2>
                <p style={styles.help}>
                  Founder — Prime is the only rank that can grant or remove staff
                  ranks. Every change requires a reason and is recorded.
                </p>
                <form className="staff-mobile-form" onSubmit={assignStaffMember} style={styles.form}>
                  <label style={styles.label}>
                    Existing account username
                    <input
                      autoComplete="off"
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      style={styles.input}
                      required
                    />
                  </label>
                  <label style={styles.label}>
                    Rank
                    <select value={staffRank} onChange={(event) => setStaffRank(event.target.value as StaffRank)} style={styles.input}>
                      <option value="member">User — remove staff access</option>
                      <option value="staff">Moderator</option>
                      <option value="senior_staff">Senior Staff</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </label>
                  {staffRank !== "member" && (
                    <>
                      <label style={styles.label}>
                        Position
                        <input maxLength={60} value={position} onChange={(event) => setPosition(event.target.value)} style={styles.input} required />
                      </label>
                      <label style={styles.label}>
                        Duties
                        <textarea maxLength={400} value={duties} onChange={(event) => setDuties(event.target.value)} style={styles.input} rows={3} required />
                      </label>
                    </>
                  )}
                  <label style={styles.label}>
                    Reason for rank change
                    <textarea maxLength={1000} minLength={10} value={rankReason} onChange={(event) => setRankReason(event.target.value)} style={styles.input} rows={2} required />
                  </label>
                  <button type="submit" disabled={saving} style={styles.button}>
                    {saving ? "Saving..." : "Save rank change"}
                  </button>
                </form>
              </section>
            )}

            {(isOwner || permissions.length > 0) && (
              <section className="staff-mobile-section" style={styles.section}>
                <h2 id="staff-directory" style={styles.sectionTitle}>Trusted staff roster</h2>
                {staff.length === 0 ? (
                  <p style={styles.help}>No staff assignments have been created yet.</p>
                ) : (
                <div className="staff-mobile-list" style={styles.staffList}>
                  {staff.map((member) => (
                    <article key={member.user_id} style={styles.staffCard}>
                      {canEditDirectory ? (
                        <form
                          onSubmit={(event) =>
                            updateDirectoryEntry(event, member.username)
                          }
                          className="staff-mobile-form"
                          style={styles.form}
                        >
                          <strong style={styles.cardTitle}>{member.username}</strong>
                          <label style={styles.label}>
                            Position
                            <input
                              name="position"
                              defaultValue={member.position}
                              maxLength={60}
                              style={styles.input}
                              required
                            />
                          </label>
                          <label style={styles.label}>
                            Duties
                            <textarea
                              name="duties"
                              defaultValue={member.duties}
                              maxLength={400}
                              rows={3}
                              style={styles.input}
                              required
                            />
                          </label>
                          <label style={styles.label}>
                            Reason for directory change
                            <textarea
                              name="reason"
                              minLength={10}
                              maxLength={1000}
                              rows={2}
                              style={styles.input}
                              required
                            />
                          </label>
                          <button type="submit" style={styles.secondaryButton}>
                            Save directory details
                          </button>
                        </form>
                      ) : (
                        <>
                          <strong style={styles.cardTitle}>
                            {member.position} — {member.username}
                          </strong>
                          <p style={styles.cardText}>{member.duties}</p>
                        </>
                      )}
                      {isOwner && !member.is_owner && (
                        <button
                          type="button"
                          onClick={() => removeStaffMember(member.username)}
                          style={styles.removeButton}
                        >
                          Remove staff access
                        </button>
                      )}
                    </article>
                  ))}
                </div>
                )}
              </section>
            )}
          </>
        )}
      </section>
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    padding: "16px 18px",
    background: "radial-gradient(circle at top, #102a40, #02060a 55%)",
    color: "#d7e2ee",
    fontFamily: "Tahoma, Verdana, Arial, sans-serif",
  },
  shell: {
    maxWidth: 1050,
    margin: "0 auto",
    border: "1px solid #315f88",
    background: "#07111b",
    boxShadow: "0 0 28px rgba(0,80,140,.25)",
  },
  nav: {
    display: "flex",
    justifyContent: "space-between",
    padding: "12px 18px",
    borderBottom: "1px solid #244b70",
    background: "#0b1823",
  },
  header: {
    padding: "30px 24px 24px",
    borderBottom: "2px solid #315f88",
    background:
      "radial-gradient(ellipse at 85% 0%, rgba(53,119,165,.28), transparent 42%), linear-gradient(115deg, #102a40, #07111b 70%)",
  },
  eyebrow: {
    margin: 0,
    color: "#f2c14e",
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: 1,
  },
  title: { margin: "8px 0", color: "#fff", fontSize: 30, letterSpacing: "-0.03em" },
  titleRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    flexWrap: "wrap",
    margin: "6px 0 12px",
  },
  rankBadge: {
    padding: "9px 13px",
    border: "1px solid #d7ad4a",
    background: "linear-gradient(#4c3509, #120b02)",
    color: "#f2c14e",
    fontSize: 12,
    fontWeight: 900,
    textTransform: "uppercase",
  },
  subheading: { margin: 0, color: "#b8cede", lineHeight: 1.6 },
  section: { padding: "20px 22px", borderBottom: "1px solid #17334a" },
  sectionTitle: {
    margin: "0 0 14px",
    paddingBottom: 10,
    borderBottom: "1px solid #244b70",
    color: "#f2c14e",
    fontSize: 15,
    fontWeight: 900,
    letterSpacing: ".06em",
    textTransform: "uppercase",
  },
  cards: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 },
  card: {
    padding: 16,
    border: "1px solid #244b70",
    background: "linear-gradient(145deg, #0d1e2d, #07111b)",
    boxShadow: "inset 0 1px rgba(255,255,255,.025)",
  },
  cardTitle: { display: "block", color: "#fff", fontSize: 14 },
  cardText: { margin: "8px 0 0", color: "#a9c3db", fontSize: 13, lineHeight: 1.5 },
  metricLabel: { margin: 0, color: "#a9c3db", fontSize: 12, textTransform: "uppercase" },
  metricValue: { display: "block", marginTop: 8, color: "#f2c14e", fontSize: 32, lineHeight: 1 },
  staffCardHeader: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
  statusBadge: { color: "#f2c14e", fontSize: 11, fontWeight: 900, textAlign: "right" },
  cardLink: { display: "inline-block", marginTop: 12, color: "#f2c14e", fontSize: 13, fontWeight: 700 },
  message: { padding: 22, color: "#cfe2f2", lineHeight: 1.6 },
  help: { color: "#91abc1", fontSize: 13, lineHeight: 1.55 },
  form: { display: "grid", gap: 12 },
  label: { display: "grid", gap: 6, color: "#cfe2f2", fontSize: 13 },
  input: {
    width: "100%",
    padding: 10,
    border: "1px solid #315f88",
    background: "#02080e",
    color: "#fff",
    font: "inherit",
  },
  fieldset: { display: "grid", gap: 10, padding: 12, border: "1px solid #244b70" },
  legend: { padding: "0 6px", color: "#f2c14e", fontWeight: 700 },
  checkboxLabel: { display: "flex", alignItems: "center", gap: 9, color: "#cfe2f2", fontSize: 13 },
  button: {
    display: "inline-flex",
    justifyContent: "center",
    padding: "11px 16px",
    border: "1px solid #e8c46a",
    background: "linear-gradient(#d6a943, #7b560e)",
    color: "#07111b",
    fontWeight: 900,
    cursor: "pointer",
    textDecoration: "none",
  },
  logoutButton: {
    border: "1px solid #e34242",
    background: "linear-gradient(#bd1717, #5c0000)",
    color: "#fff",
    fontWeight: 800,
    cursor: "pointer",
    textDecoration: "none",
  },
  secondaryButton: {
    justifySelf: "start",
    padding: "9px 12px",
    border: "1px solid #315f88",
    background: "#102a40",
    color: "#fff",
    cursor: "pointer",
  },
  removeButton: {
    marginTop: 12,
    padding: "8px 11px",
    border: "1px solid #8f2e2e",
    background: "#240b0b",
    color: "#ffb0b0",
    cursor: "pointer",
  },
  staffList: { display: "grid", gap: 12 },
  staffCard: { padding: 14, border: "1px solid #244b70", background: "#091521" },
  error: { margin: 18, padding: 12, border: "1px solid #8f2e2e", color: "#ffb0b0" },
  notice: { margin: 18, padding: 12, border: "1px solid #286b47", color: "#98efbd" },
};
