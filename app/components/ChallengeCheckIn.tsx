"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "../../lib/supabase";

// Marks the signed-in player as active for today's Player Challenges (once per UTC day per browser).
export default function ChallengeCheckIn() {
  const pathname = usePathname();

  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(async ({ data }) => {
      const userId = data.session?.user.id;
      if (!active || !userId) return;
      const key = `gb-challenge-checkin:${userId}`;
      const today = new Date().toISOString().slice(0, 10);
      try {
        if (window.localStorage.getItem(key) === today) return;
      } catch {}
      const { error } = await supabase.rpc("gb_challenge_checkin");
      if (!error) {
        try { window.localStorage.setItem(key, today); } catch {}
      }
    });
    return () => { active = false; };
  }, [pathname]);

  return null;
}
