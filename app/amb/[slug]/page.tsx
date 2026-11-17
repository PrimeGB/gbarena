"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

export default function AmbassadorLinkPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    void supabase.rpc("gb_ambassador_resolve", { p_slug: slug }).then(({ data }) => {
      if (!active) return;
      const row = Array.isArray(data) ? data[0] : data;
      if (row?.referral_code) {
        window.location.replace(`/join?ref=${encodeURIComponent(row.referral_code)}`);
      } else {
        setFailed(true);
      }
    });
    return () => { active = false; };
  }, [slug]);

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#05090f", color: "#d7e2ee", fontFamily: "Tahoma,Verdana,Arial,sans-serif", textAlign: "center", padding: 20 }}>
      {failed ? (
        <div>
          <h1 style={{ color: "#f2c14e", fontSize: 22, marginBottom: 8 }}>Link not found</h1>
          <p style={{ color: "#8fa9c2", fontSize: 13, marginBottom: 16 }}>This ambassador link doesn&apos;t exist or is no longer active.</p>
          <Link href="/join" style={{ color: "#67bdff", fontSize: 13 }}>Join GameBattles</Link>
        </div>
      ) : (
        <p style={{ color: "#8fa9c2", fontSize: 13 }}>Taking you to GameBattles...</p>
      )}
    </main>
  );
}
