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
    key: "forum_moderation",
    title: "Forum moderation",
    description: "Handle community forum moderation duties assigned to you.",
    href: null,
  },
  {
    key: "awards",
    title: "Awards management",
    description: "Work with community and competition awards.",
    href: null,
  },
  {
    key: "staff_directory",
    title: "Trusted staff roster and duties",
    description: "Update staff positions and duty descriptions without changing access.",
    href: null,
  },
] as const;

type PermissionKey = (typeof workAreas)[number]["key"];

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
  const [emailAllowed, setEmailAllowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadedUserIdentity, setLoadedUserIdentity] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [username, setUsername] = useState("");
  const [position, setPosition] = useState("");
  const [duties, setDuties] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<PermissionKey[]>([]);

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
    const userPermissions = permissionRows.map((grant) => grant.permission_key);
    setRole(profileRow?.role || "");
    setPermissions(userPermissions);

    if (profileRow?.role !== "owner" && userPermissions.length === 0) {
      setStaff([]);
      setLoadedUserIdentity(userIdentity);
      setLoading(false);
      return;
    }

    const { data: directory, error: directoryError } =
      await supabase.rpc("get_staff_directory");
    if (directoryError) {
      setStaff([]);
      setError(`Staff roster could not be loaded: ${directoryError.message}`);
      setLoadedUserIdentity(userIdentity);
      setLoading(false);
      return;
    }

    setStaff((directory || []) as StaffDirectoryEntry[]);
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

    if (!username.trim() || !position.trim() || !duties.trim()) {
      setError("Enter a username, position, and duty description.");
      return;
    }
    if (selectedPermissions.length === 0) {
      setError("Select at least one work area.");
      return;
    }

    setSaving(true);
    const { error: assignError } = await supabase.rpc("staff_assign_member", {
      target_username: username.trim(),
      staff_position: position.trim(),
      staff_duties: duties.trim(),
      permissions: selectedPermissions,
    });
    setSaving(false);

    if (assignError) {
      setError(`Staff access could not be saved: ${assignError.message}`);
      return;
    }

    setUsername("");
    setPosition("");
    setDuties("");
    setSelectedPermissions([]);
    setNotice("Staff position and work-area access saved.");
    if (user) await loadDashboard(user.id, user.email || "");
  }

  async function removeStaffMember(memberUsername: string) {
    if (!window.confirm(`Remove staff access for ${memberUsername}?`)) return;

    setError("");
    setNotice("");

    const { error: removeError } = await supabase.rpc("staff_remove_member", {
      target_username: memberUsername,
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
    const { error: updateError } = await supabase.rpc("staff_update_directory", {
      target_username: memberUsername,
      staff_position: memberPosition,
      staff_duties: memberDuties,
    });

    if (updateError) {
      setError(`Directory entry could not be updated: ${updateError.message}`);
      return;
    }

    setNotice(`Directory entry updated for ${memberUsername}.`);
    if (user) await loadDashboard(user.id, user.email || "");
  }

  function togglePermission(permission: PermissionKey) {
    setSelectedPermissions((current) =>
      current.includes(permission)
        ? current.filter((item) => item !== permission)
        : [...current, permission]
    );
  }

  return (
    <main className="staff-mobile-page staff-portal-page" style={styles.page}>
      <section className="staff-mobile-shell" style={styles.shell}>
        <header className="staff-mobile-header" style={styles.header}>
          <p style={styles.eyebrow}>GAMEBATTLES STAFF</p>
          <h1 style={styles.title}>Staff Portal</h1>
          <p style={styles.subheading}>
            Work access is granted by area. Staff permissions do not include account
            or site-wide administration.
          </p>
        </header>
        <nav className="staff-mobile-nav" style={styles.nav}>
          <Link href="/home">Back to GameBattles</Link>
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

            <section className="staff-mobile-section" style={styles.section}>
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
                        <p style={styles.help}>
                          This access area is defined; its staff action tools are not
                          connected yet.
                        </p>
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
              <section className="staff-mobile-section" style={styles.section}>
                <h2 style={styles.sectionTitle}>Assign staff access</h2>
                <p style={styles.help}>
                  Only the Owner can assign or remove staff. Choose only the work
                  areas this person needs. Owner-level access cannot be assigned here.
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
                    Position
                    <input
                      maxLength={60}
                      value={position}
                      onChange={(event) => setPosition(event.target.value)}
                      style={styles.input}
                      required
                    />
                  </label>
                  <label style={styles.label}>
                    Duties
                    <textarea
                      maxLength={400}
                      value={duties}
                      onChange={(event) => setDuties(event.target.value)}
                      style={styles.input}
                      rows={3}
                      required
                    />
                  </label>
                  <fieldset style={styles.fieldset}>
                    <legend style={styles.legend}>Allowed work areas</legend>
                    {workAreas.map((area) => (
                      <label key={area.key} style={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={selectedPermissions.includes(area.key)}
                          onChange={() => togglePermission(area.key)}
                        />
                        {area.title}
                      </label>
                    ))}
                    <p style={styles.help}>
                      Staff-access assignment is Owner-only and is not an assignable
                      permission.
                    </p>
                  </fieldset>
                  <button type="submit" disabled={saving} style={styles.button}>
                    {saving ? "Saving..." : "Save staff assignment"}
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
    padding: "26px 22px",
    borderBottom: "1px solid #244b70",
    background: "linear-gradient(to bottom, #173956, #07111b)",
  },
  eyebrow: {
    margin: 0,
    color: "#f2c14e",
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: 1,
  },
  title: { margin: "8px 0", color: "#fff", fontSize: 28 },
  subheading: { margin: 0, color: "#b8cede", lineHeight: 1.6 },
  section: { padding: "20px 22px", borderBottom: "1px solid #17334a" },
  sectionTitle: { margin: "0 0 14px", color: "#f2c14e", fontSize: 17 },
  cards: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 },
  card: { padding: 14, border: "1px solid #244b70", background: "#091521" },
  cardTitle: { display: "block", color: "#fff", fontSize: 14 },
  cardText: { margin: "8px 0 0", color: "#a9c3db", fontSize: 13, lineHeight: 1.5 },
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
