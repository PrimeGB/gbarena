"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useUser } from "@/lib/useUser";
import { supabase } from "@/lib/supabase";
import AwardArt, { AWARD_CSS, awardAccent } from "../../awards/AwardArt";

type CatalogAward = {
  id: number;
  name: string;
  award_group: string;
  purpose: string;
  exclusive: boolean;
  active_award_count: number;
};

type ActiveAward = {
  id: number;
  award_name: string;
  recipient_type: "player" | "team";
  target_name: string;
  reason: string;
  granted_at: string;
  granted_by: string;
  exclusive: boolean;
};

type AwardTarget = {
  id: string;
  target_type: "player" | "team";
  label: string;
};

type AwardRequest = {
  id: number;
  award_name: string;
  exclusive: boolean;
  requested_by: string;
  recipient_username: string;
  reason: string;
  evidence: string;
  status: string;
  created_at: string;
};

export default function StaffAwardsPage() {
  const { user, loading: authLoading } = useUser();
  const [catalog, setCatalog] = useState<CatalogAward[]>([]);
  const [activeAwards, setActiveAwards] = useState<ActiveAward[]>([]);
  const [requests, setRequests] = useState<AwardRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [recipientSearch, setRecipientSearch] = useState("");
  const [recipientOptions, setRecipientOptions] = useState<AwardTarget[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<AwardTarget | null>(null);
  const [awardName, setAwardName] = useState("");
  const [reason, setReason] = useState("");
  const [evidence, setEvidence] = useState("");
  const [saving, setSaving] = useState(false);
  const [isStaff, setIsStaff] = useState(false);

  const loadAwards = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    const { data: permission, error: permissionError } = await supabase.rpc(
      "has_staff_permission",
      { permission_key: "awards" }
    );
    if (permissionError || permission !== true) {
      setIsStaff(false);
      setCatalog([]);
      setActiveAwards([]);
      setRequests([]);
      setError(permissionError?.message || "This account cannot access award administration.");
      setLoading(false);
      return;
    }

    const [
      { data: catalogData, error: catalogError },
      { data: activeData, error: activeError },
      { data: requestData, error: requestError },
    ] = await Promise.all([
      supabase.rpc("staff_list_awards"),
      supabase.rpc("staff_list_active_awards"),
      supabase.rpc("staff_list_award_requests"),
    ]);
    const loadError = catalogError || activeError || requestError;
    if (loadError) {
      setIsStaff(false);
      setCatalog([]);
      setActiveAwards([]);
      setRequests([]);
      setError(`Award administration could not be loaded: ${loadError.message}`);
      setLoading(false);
      return;
    }
    setIsStaff(true);
    setCatalog((catalogData || []) as CatalogAward[]);
    setActiveAwards((activeData || []) as ActiveAward[]);
    setRequests((requestData || []) as AwardRequest[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading && user) {
      void Promise.resolve().then(loadAwards);
    } else if (!authLoading) {
      void Promise.resolve().then(() => setLoading(false));
    }
  }, [authLoading, loadAwards, user]);

  async function grantAward(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedRecipient) {
      setError("Search for and select a player or team.");
      return;
    }
    setSaving(true);
    setError("");
    setNotice("");
    const { error: grantError } = selectedRecipient.target_type === "player"
      ? await supabase.rpc("staff_award_user", {
          target_username: selectedRecipient.label,
          award_name: awardName,
          award_reason: reason.trim(),
          award_evidence: evidence.trim(),
        })
      : await supabase.rpc("staff_award_team", {
          target_team_id: selectedRecipient.id,
          award_name: awardName,
          award_reason: reason.trim(),
          award_evidence: evidence.trim(),
        });
    setSaving(false);
    if (grantError) {
      setError(`Award could not be granted: ${grantError.message}`);
      return;
    }
    setNotice(`${awardName} granted to ${selectedRecipient.label}.`);
    setRecipientSearch("");
    setRecipientOptions([]);
    setSelectedRecipient(null);
    setReason("");
    setEvidence("");
    await loadAwards();
  }

  async function searchRecipients(value: string) {
    setRecipientSearch(value);
    setSelectedRecipient(null);
    if (value.trim().length < 2) {
      setRecipientOptions([]);
      return;
    }
    const { data, error: searchError } = await supabase.rpc(
      "staff_search_award_targets",
      { query_text: value.trim() }
    );
    if (searchError) {
      setError(`Recipients could not be searched: ${searchError.message}`);
      setRecipientOptions([]);
      return;
    }
    setRecipientOptions((data || []) as AwardTarget[]);
  }

  async function revokeAward(award: ActiveAward) {
    const revokeReason = window.prompt(
      `Why are you revoking ${award.award_name} from ${award.target_name}?`
    );
    if (!revokeReason || revokeReason.trim().length < 10) {
      setError("Enter a revocation reason of at least 10 characters.");
      return;
    }
    const { error: revokeError } = await supabase.rpc("staff_revoke_award", {
      award_record_id: award.id,
      revoke_reason: revokeReason.trim(),
    });
    if (revokeError) {
      setError(`Award could not be revoked: ${revokeError.message}`);
      return;
    }
    setNotice(`${award.award_name} revoked and recorded in the audit log.`);
    await loadAwards();
  }

  async function reviewRequest(request: AwardRequest, approve: boolean) {
    const decisionReason = window.prompt(
      `${approve ? "Why are you approving" : "Why are you rejecting"} request ${request.id}?`
    );
    if (!decisionReason || decisionReason.trim().length < 10) {
      setError("Enter a review reason of at least 10 characters.");
      return;
    }
    const { error: reviewError } = await supabase.rpc("staff_review_award_request", {
      award_request_id: request.id,
      approve_request: approve,
      decision_reason: decisionReason.trim(),
    });
    if (reviewError) {
      setError(`Award request could not be reviewed: ${reviewError.message}`);
      return;
    }
    setNotice(`Award request ${request.id} ${approve ? "approved" : "rejected"}.`);
    await loadAwards();
  }

  const filteredCatalog = catalog.filter((award) =>
    `${award.name} ${award.award_group} ${award.purpose}`
      .toLowerCase()
      .includes(search.trim().toLowerCase())
  );

  return (
    <main style={styles.page}>
      <section style={styles.shell}>
        <nav style={styles.nav}>
          <Link href="/staff/dashboard">Staff Dashboard</Link>
          <Link href="/home">GameBattles Home</Link>
        </nav>
        <header style={styles.header}>
          <p style={styles.eyebrow}>AUTHORIZED STAFF WORK AREA</p>
          <h1 style={styles.title}>Awards &amp; Trophy Management</h1>
          <p style={styles.subheading}>
            Every grant, revocation, and request decision requires a reason and is
            recorded against the staff member who took the action.
          </p>
        </header>
        {authLoading || loading ? (
          <p style={styles.message}>Checking award access...</p>
        ) : !user ? (
          <p style={styles.message}>
            Sign in with an authorized staff account to continue.{" "}
            <Link href="/login?next=%2Fstaff%2Fawards">Staff login</Link>
          </p>
        ) : !isStaff ? (
          <p role="alert" style={styles.error}>{error}</p>
        ) : (
          <div style={styles.content}>
            {error && <p role="alert" style={styles.error}>{error}</p>}
            {notice && <p role="status" style={styles.notice}>{notice}</p>}

            <section style={styles.panel}>
              <h2 style={styles.sectionTitle}>Grant an award</h2>
              <form onSubmit={grantAward} style={styles.form}>
                <label style={styles.label}>
                  Search players and teams
                  <input
                    required
                    value={selectedRecipient?.label || recipientSearch}
                    onChange={(event) => void searchRecipients(event.target.value)}
                    placeholder="Enter at least two characters"
                    style={styles.input}
                  />
                  {recipientOptions.length > 0 && (
                    <div style={styles.suggestions}>
                      {recipientOptions.map((option) => (
                        <button
                          type="button"
                          key={`${option.target_type}-${option.id}`}
                          onClick={() => {
                            setSelectedRecipient(option);
                            setRecipientSearch(option.label);
                            setRecipientOptions([]);
                          }}
                          style={styles.suggestion}
                        >
                          {option.label} · {option.target_type}
                        </button>
                      ))}
                    </div>
                  )}
                </label>
                <label style={styles.label}>
                  Award
                  <select
                    required
                    value={awardName}
                    onChange={(event) => setAwardName(event.target.value)}
                    style={styles.input}
                  >
                    <option value="">Select an award</option>
                    {catalog.map((award) => (
                      <option key={award.id} value={award.name}>
                        {award.name}{award.exclusive ? " — Founder only" : ""}
                      </option>
                    ))}
                  </select>
                </label>
                <label style={styles.label}>
                  Reason (10–1000 characters)
                  <textarea
                    required
                    minLength={10}
                    maxLength={1000}
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    style={styles.input}
                  />
                </label>
                <label style={styles.label}>
                  Evidence (optional)
                  <textarea
                    maxLength={3000}
                    value={evidence}
                    onChange={(event) => setEvidence(event.target.value)}
                    style={styles.input}
                  />
                </label>
                <button type="submit" disabled={saving || !selectedRecipient} style={styles.button}>
                  {saving ? "Saving..." : "Grant award"}
                </button>
              </form>
            </section>

            <section style={styles.panel}>
              <h2 style={styles.sectionTitle}>Pending award requests</h2>
              {requests.length === 0 ? (
                <p style={styles.empty}>No pending requests.</p>
              ) : (
                <div style={styles.list}>
                  {requests.filter((request) => request.status === "pending").map((request) => (
                    <article key={request.id} style={styles.card}>
                      <strong>{request.award_name} · {request.recipient_username}</strong>
                      <p>{request.reason}</p>
                      {request.evidence && <p>Evidence: {request.evidence}</p>}
                      <small>Requested by {request.requested_by}</small>
                      <div style={styles.actions}>
                        <button onClick={() => void reviewRequest(request, true)} style={styles.button}>
                          Approve
                        </button>
                        <button onClick={() => void reviewRequest(request, false)} style={styles.secondaryButton}>
                          Reject
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section style={styles.panel}>
              <h2 style={styles.sectionTitle}>Active player awards</h2>
              {activeAwards.length === 0 ? (
                <p style={styles.empty}>No staff-issued active awards yet.</p>
              ) : (
                <div style={styles.list}>
                  {activeAwards.map((award) => (
                    <article key={award.id} style={styles.card}>
                      <div style={styles.cardHeader}>
                        <strong>{award.award_name} · {award.target_name} ({award.recipient_type})</strong>
                        <button
                          onClick={() => void revokeAward(award)}
                          style={styles.secondaryButton}
                        >
                          Revoke
                        </button>
                      </div>
                      <p>{award.reason}</p>
                      <small>
                        Granted by {award.granted_by} · {new Date(award.granted_at).toLocaleString()}
                      </small>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section style={styles.panel}>
              <h2 style={styles.sectionTitle}>Award catalog ({catalog.length})</h2>
              <input
                aria-label="Search awards"
                placeholder="Search awards, groups, or descriptions"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                style={styles.input}
              />
              <div style={styles.catalog}>
                {filteredCatalog.map((award) => (
                  <article
                    key={award.id}
                    className="award-card"
                    style={{ ...styles.card, ["--accent" as string]: awardAccent(award.name, award.award_group) }}
                  >
                    <style>{AWARD_CSS}</style>
                    <div className="award-stage">
                      <AwardArt name={award.name} group={award.award_group} />
                    </div>
                    <strong>{award.name}</strong>
                    <p style={styles.group}>{award.award_group}{award.exclusive ? " · Founder only" : ""}</p>
                    <p>{award.purpose}</p>
                    <small>{award.active_award_count} active grants</small>
                  </article>
                ))}
              </div>
            </section>
          </div>
        )}
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    padding: "24px 14px",
    background: "radial-gradient(circle at top, #123654, #02060a 55%)",
    color: "#d7e2ee",
    fontFamily: "Tahoma, Verdana, Arial, sans-serif",
  },
  shell: {
    maxWidth: 1120,
    margin: "0 auto",
    border: "1px solid #315f88",
    background: "#07111b",
    boxShadow: "0 0 28px rgba(0,80,140,.3)",
  },
  nav: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    padding: "12px 16px",
    background: "#050b12",
    borderBottom: "1px solid #244b70",
    fontSize: 12,
  },
  header: {
    padding: "22px 18px",
    background: "linear-gradient(to bottom, #173956, #07111b)",
    borderBottom: "2px solid #315f88",
  },
  eyebrow: { margin: 0, color: "#f2c14e", fontSize: 11, fontWeight: 900 },
  title: { margin: "8px 0", color: "#fff", fontSize: 28 },
  subheading: { margin: 0, color: "#cfe2f2", fontSize: 13, lineHeight: 1.6 },
  content: { display: "grid", gap: 16, padding: 18 },
  panel: { padding: 14, border: "1px solid #244b70", background: "#050b12" },
  sectionTitle: {
    margin: "0 0 12px",
    color: "#f2c14e",
    fontSize: 15,
    textTransform: "uppercase",
  },
  form: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 },
  label: { display: "grid", gap: 6, color: "#d7e2ee", fontSize: 12, fontWeight: 700 },
  input: {
    width: "100%",
    minHeight: 40,
    padding: 9,
    border: "1px solid #315b7d",
    background: "#02070c",
    color: "#fff",
    font: "inherit",
    borderRadius: 2,
  },
  button: {
    minHeight: 40,
    padding: "9px 14px",
    border: "1px solid #e8c46a",
    background: "linear-gradient(to bottom, #d6a943, #7b560e)",
    color: "#07111b",
    fontWeight: 900,
    cursor: "pointer",
  },
  secondaryButton: {
    minHeight: 36,
    padding: "8px 12px",
    border: "1px solid #4b95d8",
    background: "linear-gradient(to bottom, #1c4b72, #0a1724)",
    color: "#fff",
    fontWeight: 800,
    cursor: "pointer",
  },
  list: { display: "grid", gap: 10 },
  suggestions: { display: "grid", maxHeight: 220, overflowY: "auto", border: "1px solid #315b7d" },
  suggestion: {
    padding: 9,
    border: 0,
    borderBottom: "1px solid #244b70",
    background: "#07111b",
    color: "#fff",
    textAlign: "left",
    cursor: "pointer",
  },
  card: { padding: 12, border: "1px solid #244b70", background: "#07111b", lineHeight: 1.55 },
  cardHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 },
  actions: { display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" },
  catalog: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
    gap: 10,
    marginTop: 12,
  },
  group: { color: "#f2c14e", fontWeight: 800 },
  empty: { color: "#a9c3db", fontSize: 13 },
  message: { padding: 20, lineHeight: 1.7 },
  notice: { margin: 0, padding: 12, border: "1px solid #2c7a59", color: "#c8f2d8" },
  error: { margin: 0, padding: 12, border: "1px solid #a83e3e", color: "#ffd5d5" },
};
