"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function NotificationBell() {
  const pathname = usePathname();
  const [count, setCount] = useState(0);

  useEffect(() => {
    let active = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function load(userId: string) {
      const { count: unread } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("recipient_id", userId)
        .eq("is_read", false);
      if (active) setCount(unread || 0);
    }

    async function init() {
      const { data } = await supabase.auth.getUser();
      const userId = data.user?.id;
      if (!userId || !active) {
        setCount(0);
        return;
      }
      await load(userId);
      channel = supabase
        .channel(`bell-${userId}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "messages", filter: `recipient_id=eq.${userId}` },
          () => load(userId)
        )
        .subscribe();
    }

    init();
    return () => {
      active = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, [pathname]);

  if (count === 0 || pathname.startsWith("/profile/inbox")) return null;

  return (
    <>
      <Link href="/profile/inbox" className="notif-bell" aria-label={`${count} unread notifications`}>
        <span aria-hidden="true">🔔</span> {count > 99 ? "99+" : count}
      </Link>
      <style>{`
        .notif-bell {
          position: fixed;
          right: 16px;
          bottom: 62px;
          z-index: 80;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border: 1px solid #ff8a8a;
          border-radius: 999px;
          background: linear-gradient(#7a1d1d, #3a0b0b);
          color: #fff;
          font: 800 12px/1 Tahoma, Verdana, Arial, sans-serif;
          text-decoration: none;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.6);
        }
      `}</style>
    </>
  );
}
