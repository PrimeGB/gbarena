"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Item = { kind: string; text: string; href?: string; at: string };

export default function ActivityPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    supabase.rpc("gb_recent_activity", { p_limit: 50 }).then(({ data }) => {
      setItems((data as Item[]) || []);
      setLoaded(true);
    });
  }, []);

  return (
    <div style={{ background: "#000", color: "#d7e2ee", minHeight: "100vh", fontFamily: "Tahoma,Verdana,Arial,sans-serif" }}>
      <div style={{ width: "min(900px,100%)", margin: "0 auto", padding: "24px 18px" }}>
        <div style={{ background: "#0a1119", border: "1px solid #263b4d" }}>
          <div style={{ padding: "18px 20px", background: "#101c28", borderBottom: "1px solid #263b4d" }}>
            <h1 style={{ color: "#f2c14e", fontSize: 20, textTransform: "uppercase" }}>Live Activity</h1>
            <p style={{ color: "#9aabba", fontSize: 12, marginTop: 5 }}>Recent matches, new teams and awards across GameBattles.</p>
          </div>
          {loaded && items.length === 0 && <div style={{ padding: 20, color: "#9aabba" }}>Nothing yet.</div>}
          {items.map((item, i) => (
            <div key={i} style={{ padding: "11px 18px", borderTop: i ? "1px solid #13293d" : "none", display: "flex", justifyContent: "space-between", gap: 12, fontSize: 13 }}>
              {item.href ? (
                <Link href={item.href} style={{ color: "#7fc0ff" }}>{item.text}</Link>
              ) : (
                <span>{item.text}</span>
              )}
              <span style={{ color: "#8193a1", fontSize: 11, whiteSpace: "nowrap" }}>{new Date(item.at).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
