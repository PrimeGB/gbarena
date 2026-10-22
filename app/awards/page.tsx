"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useUser } from "@/lib/useUser";
import { supabase } from "@/lib/supabase";

type PublicAward = {
  name: string;
  award_group: string;
  purpose: string;
};

export default function AwardsPage() {
  const { user, loading: authLoading } = useUser();
  const [catalog, setCatalog] = useState<PublicAward[]>([]);
  const [awardName, setAwardName] = useState("");
  const [reason, setReason] = useState("");
  const [evidence, setEvidence] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let mounted = true;
    void supabase.rpc("staff_public_award_catalog").then(({ data, error: catalogError }) => {
      if (!mounted) return;
      if (catalogError) {
        setError(`The award catalog could not be loaded: ${catalogError.message}`);
      } else {
        setCatalog((data || []) as PublicAward[]);
      }
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  async function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) {
      setError("Sign in before requesting an award.");
      return;
    }
    setError("");
    setNotice("");
    setSubmitting(true);
    const { data, error: requestError } = await supabase.rpc("staff_submit_award_request", {
      award_name: awardName,
      request_reason: reason.trim(),
      request_evidence: evidence.trim(),
    });
    setSubmitting(false);
    if (requestError) {
      setError(`Your award request could not be submitted: ${requestError.message}`);
      return;
    }
    setNotice(`Request #${data} submitted for staff review.`);
    setReason("");
    setEvidence("");
  }

  return (
    <main style={styles.page}>
      <section style={styles.shell}>
        <nav style={styles.nav}>
          <Link href="/support">Support</Link>
          <Link href="/profile">Profile</Link>
          <Link href="/home">Home</Link>
        </nav>
        <header style={styles.header}>
          <p style={styles.eyebrow}>GAMEBATTLES AWARDS</p>
          <h1 style={styles.title}>Awards &amp; Trophies</h1>
          <p style={styles.subheading}>
            Browse the awards catalog and request consideration for an award. Staff
            review every request; submitting one does not guarantee it will be granted.
          </p>
        </header>
        {notice && <p role="status" style={styles.notice}>{notice}</p>}
        {error && <p role="alert" style={styles.error}>{error}</p>}
        <section style={styles.content}>
          <form onSubmit={submitRequest} style={styles.form}>
            <h2 style={styles.sectionTitle}>Request an award</h2>
            {authLoading ? (
              <p style={styles.text}>Checking sign-in...</p>
            ) : !user ? (
              <p style={styles.text}>
                <Link href="/login?next=%2Fawards">Sign in</Link> to submit a request.
              </p>
            ) : (
              <>
                <label style={styles.label}>
                  Award
                  <select
                    value={awardName}
                    onChange={(event) => setAwardName(event.target.value)}
                    required
                    style={styles.input}
                  >
                    <option value="">Select an award</option>
                    {catalog.map((award) => (
                      <option key={award.name} value={award.name}>
                        {award.name} · {award.award_group}
                      </option>
                    ))}
                  </select>
                </label>
                <label style={styles.label}>
                  Why should this award be granted to you? (10–1000 characters)
                  <textarea
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    minLength={10}
                    maxLength={1000}
                    required
                    rows={4}
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
                <button disabled={submitting || catalog.length === 0} style={styles.button}>
                  {submitting ? "Submitting..." : "Submit for staff review"}
                </button>
              </>
            )}
          </form>
          <section>
            <h2 style={styles.sectionTitle}>Award catalog</h2>
            {loading ? (
              <p style={styles.text}>Loading awards...</p>
            ) : (
              <div style={styles.catalog}>
                {catalog.map((award) => (
                  <article key={award.name} style={styles.card}>
                    <strong>{award.name}</strong>
                    <p style={styles.group}>{award.award_group}</p>
                    <p>{award.purpose}</p>
                  </article>
                ))}
              </div>
            )}
          </section>
        </section>
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
    justifyContent: "flex-end",
    gap: 18,
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
  content: { display: "grid", gap: 20, padding: 18 },
  form: { display: "grid", gap: 12, padding: 14, border: "1px solid #244b70", background: "#050b12" },
  sectionTitle: { margin: "0 0 4px", color: "#f2c14e", fontSize: 15, textTransform: "uppercase" },
  label: { display: "grid", gap: 6, color: "#d7e2ee", fontSize: 12, fontWeight: 700 },
  input: {
    width: "100%",
    minHeight: 42,
    padding: 10,
    border: "1px solid #315b7d",
    background: "#02070c",
    color: "#fff",
    font: "inherit",
  },
  button: {
    minHeight: 44,
    padding: "10px 14px",
    border: "1px solid #e8c46a",
    background: "linear-gradient(to bottom, #d6a943, #7b560e)",
    color: "#07111b",
    fontWeight: 900,
    cursor: "pointer",
  },
  catalog: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
    gap: 10,
  },
  card: { padding: 12, border: "1px solid #244b70", background: "#050b12", lineHeight: 1.55 },
  group: { color: "#f2c14e", fontWeight: 800 },
  text: { color: "#a9c3db", fontSize: 13 },
  notice: { margin: 16, padding: 12, border: "1px solid #2c7a59", color: "#c8f2d8" },
  error: { margin: 16, padding: 12, border: "1px solid #a83e3e", color: "#ffd5d5" },
};
