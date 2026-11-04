"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Season = { id: string; name: string; starts_at: string; ends_at: string };
type Row = { id: string; name: string; wins: number; losses: number; rank: number };

export default function ChampionsPage() {
  const [seasons, setSeasons] = useState<(Season & { teams: Row[]; players: Row[] })[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("seasons")
        .select("id,name,starts_at,ends_at")
        .lt("ends_at", new Date().toISOString())
        .order("ends_at", { ascending: false });

      const out = [];
      for (const s of (data || []) as Season[]) {
        const [teams, players] = await Promise.all([
          supabase.rpc("gb_season_standings", { p_season: s.id, p_kind: "teams", p_limit: 3 }),
          supabase.rpc("gb_season_standings", { p_season: s.id, p_kind: "players", p_limit: 3 }),
        ]);
        out.push({ ...s, teams: (teams.data as Row[]) || [], players: (players.data as Row[]) || [] });
      }
      setSeasons(out);
      setLoaded(true);
    })();
  }, []);

  const list = (rows: Row[]) =>
    rows.length === 0 ? (
      <div style={{ color: "#8193a1", fontSize: 12 }}>No results</div>
    ) : (
      rows.map((r) => (
        <div key={r.id} style={{ fontSize: 13, padding: "2px 0" }}>
          {["🥇", "🥈", "🥉"][r.rank - 1] || r.rank}. {r.name} <span style={{ color: "#8193a1" }}>({r.wins}-{r.losses})</span>
        </div>
      ))
    );

  return (
    <div style={{ background: "#000", color: "#d7e2ee", minHeight: "100vh", fontFamily: "Tahoma,Verdana,Arial,sans-serif" }}>
      <div style={{ width: "min(900px,100%)", margin: "0 auto", padding: "24px 18px" }}>
        <div style={{ background: "#0a1119", border: "1px solid #263b4d" }}>
          <div style={{ padding: "18px 20px", background: "#101c28", borderBottom: "1px solid #263b4d" }}>
            <h1 style={{ color: "#f2c14e", fontSize: 20, textTransform: "uppercase" }}>Champions Hall</h1>
            <p style={{ color: "#9aabba", fontSize: 12, marginTop: 5 }}>
              Top teams and players from every finished season. <Link href="/teams/top" style={{ color: "#7fc0ff" }}>Current standings</Link>
            </p>
          </div>
          {loaded && seasons.length === 0 && <div style={{ padding: 20, color: "#9aabba" }}>No season has finished yet.</div>}
          {seasons.map((s) => (
            <div key={s.id} style={{ padding: "14px 20px", borderTop: "1px solid #13293d" }}>
              <div style={{ color: "#f2c14e", fontWeight: 700, marginBottom: 8 }}>{s.name}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 16 }}>
                <div>
                  <div style={{ color: "#7fc0ff", fontSize: 11, textTransform: "uppercase", marginBottom: 4 }}>Teams</div>
                  {list(s.teams)}
                </div>
                <div>
                  <div style={{ color: "#7fc0ff", fontSize: 11, textTransform: "uppercase", marginBottom: 4 }}>Players</div>
                  {list(s.players)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
