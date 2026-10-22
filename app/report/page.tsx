"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useUser } from "@/lib/useUser";
import { supabase } from "@/lib/supabase";

const reportTypes = [
  ["player", "Player conduct"],
  ["team", "Team conduct"],
  ["match", "Match issue"],
  ["harassment", "Harassment"],
  ["cheating", "Cheating"],
  ["impersonation", "Impersonation"],
  ["abuse", "Abuse"],
  ["other", "Other"],
];

export default function ReportPage() {
  const { user, loading } = useUser();
  const [reportType, setReportType] = useState("player");
  const [targetUsername, setTargetUsername] = useState("");
  const [targetTeamName, setTargetTeamName] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [evidence, setEvidence] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [caseNumber, setCaseNumber] = useState("");

  async function submitReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) {
      setError("Sign in to submit a report.");
      return;
    }
    setError("");
    setSubmitting(true);
    const { data, error: submitError } = await supabase.rpc("staff_submit_report", {
      report_type: reportType,
      report_title: title.trim(),
      report_description: description.trim(),
      target_username: targetUsername.trim() || null,
      target_team_name: targetTeamName.trim() || null,
      target_match: null,
      evidence_text: evidence.trim(),
    });
    setSubmitting(false);
    if (submitError) {
      setError(`Your report could not be submitted: ${submitError.message}`);
      return;
    }
    setCaseNumber(`GB-${String(data).padStart(8, "0")}`);
    setTargetUsername("");
    setTargetTeamName("");
    setTitle("");
    setDescription("");
    setEvidence("");
  }

  return (
    <main style={styles.page}>
      <section style={styles.shell}>
        <nav style={styles.nav}>
          <Link href="/support">Support Center</Link>
          <Link href="/home">GameBattles Home</Link>
        </nav>
        <header style={styles.header}>
          <p style={styles.eyebrow}>GAMEBATTLES PLAYER SERVICES</p>
          <h1 style={styles.title}>Submit a report</h1>
          <p style={styles.description}>
            Reports are private and reviewed by authorized staff. Include clear facts
            and relevant evidence; do not submit duplicate or abusive reports.
          </p>
        </header>
        {loading ? (
          <p style={styles.message}>Checking your sign-in...</p>
        ) : !user ? (
          <div style={styles.message}>
            <p>Sign in to submit a report.</p>
            <Link href="/login?next=%2Freport" style={styles.button}>Sign in</Link>
          </div>
        ) : (
          <form onSubmit={submitReport} style={styles.form}>
            {caseNumber && (
              <p role="status" style={styles.success}>
                Report received. Your case number is <strong>{caseNumber}</strong>.
              </p>
            )}
            {error && <p role="alert" style={styles.error}>{error}</p>}
            <label style={styles.label}>
              Report category
              <select
                value={reportType}
                onChange={(event) => setReportType(event.target.value)}
                style={styles.input}
              >
                {reportTypes.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>
            <label style={styles.label}>
              Player username (optional)
              <input
                value={targetUsername}
                onChange={(event) => setTargetUsername(event.target.value)}
                maxLength={40}
                style={styles.input}
              />
            </label>
            <label style={styles.label}>
              Team name (optional)
              <input
                value={targetTeamName}
                onChange={(event) => setTargetTeamName(event.target.value)}
                maxLength={100}
                style={styles.input}
              />
            </label>
            <label style={styles.label}>
              Subject
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                minLength={4}
                maxLength={160}
                required
                style={styles.input}
              />
            </label>
            <label style={styles.label}>
              What happened?
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                minLength={10}
                maxLength={5000}
                required
                rows={7}
                style={styles.input}
              />
            </label>
            <label style={styles.label}>
              Evidence links or details (optional)
              <textarea
                value={evidence}
                onChange={(event) => setEvidence(event.target.value)}
                maxLength={3000}
                rows={3}
                style={styles.input}
              />
            </label>
            <button disabled={submitting} style={styles.button} type="submit">
              {submitting ? "Submitting..." : "Submit private report"}
            </button>
          </form>
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
    maxWidth: 760,
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
  description: { margin: 0, color: "#cfe2f2", fontSize: 13, lineHeight: 1.6 },
  form: { display: "grid", gap: 14, padding: 18 },
  label: { display: "grid", gap: 7, color: "#d7e2ee", fontSize: 13, fontWeight: 700 },
  input: {
    width: "100%",
    minHeight: 42,
    padding: 10,
    border: "1px solid #315b7d",
    background: "#02070c",
    color: "#fff",
    font: "inherit",
    borderRadius: 2,
  },
  button: {
    display: "inline-flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: 44,
    padding: "10px 16px",
    border: "1px solid #e8c46a",
    background: "linear-gradient(to bottom, #d6a943, #7b560e)",
    color: "#07111b",
    fontWeight: 900,
    cursor: "pointer",
    textDecoration: "none",
  },
  message: { padding: 20, lineHeight: 1.7 },
  success: {
    margin: 0,
    padding: 12,
    border: "1px solid #2c7a59",
    background: "#092519",
    color: "#c8f2d8",
  },
  error: {
    margin: 0,
    padding: 12,
    border: "1px solid #a83e3e",
    background: "#2a0b0b",
    color: "#ffd5d5",
  },
};
