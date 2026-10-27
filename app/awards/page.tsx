"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import AwardArt, { AWARD_CSS, awardAccent } from "./AwardArt";

type PublicAward = {
  name: string;
  award_group: string;
  purpose: string;
  auto?: boolean;
};

export default function AwardsPage() {
  const [catalog, setCatalog] = useState<PublicAward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  return (
    <main style={styles.page}>
      <style>{AWARD_CSS}</style>
      <section style={styles.shell}>
        <nav style={styles.nav}>
          <Link href="/home">Home</Link>
        </nav>
        <header style={styles.header}>
          <p style={styles.eyebrow}>GAMEBATTLES AWARDS</p>
          <h1 style={styles.title}>Awards &amp; Achievements</h1>
          <p style={styles.subheading}>
            Browse every award and trophy you can work toward on GameBattles.
          </p>
        </header>
        {error && <p role="alert" style={styles.error}>{error}</p>}
        <section style={styles.content}>
          <section>
            <h2 style={styles.sectionTitle}>Award catalog</h2>
            {loading ? (
              <p style={styles.text}>Loading awards...</p>
            ) : (
              <div style={styles.catalog}>
                {catalog.map((award) => (
                  <article
                    key={award.name}
                    className="award-card"
                    style={{ ...styles.card, ["--accent" as string]: awardAccent(award.name, award.award_group) }}
                  >
                    <div className="award-stage">
                      <AwardArt name={award.name} group={award.award_group} />
                    </div>
                    <strong style={styles.cardName}>{award.name}</strong>
                    <p style={styles.group}>{award.award_group}</p>
                    <p style={styles.purpose}>{award.purpose}</p>
                    {award.auto && <p style={{ margin: "8px 0 0", color: "#38f2a7", fontSize: 10, fontWeight: 900, letterSpacing: 0.6 }}>⚡ EARNED AUTOMATICALLY</p>}
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
  card: { padding: 12, border: "1px solid #244b70", background: "#050b12", lineHeight: 1.55, textAlign: "center" },
  cardName: { color: "#fff", fontSize: 14 },
  group: { margin: "4px 0 6px", color: "#f2c14e", fontWeight: 800, fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase" },
  purpose: { margin: 0, color: "#a9c3db", fontSize: 12 },
  text: { color: "#a9c3db", fontSize: 13 },
  notice: { margin: 16, padding: 12, border: "1px solid #2c7a59", color: "#c8f2d8" },
  error: { margin: 16, padding: 12, border: "1px solid #a83e3e", color: "#ffd5d5" },
};
