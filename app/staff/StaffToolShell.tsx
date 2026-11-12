"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";
import "./staff-responsive.css";

export default function StaffToolShell({ title, permission, children }: {
  title: string;
  permission?: string;
  children: ReactNode;
}) {
  const { user, loading } = useUser();
  const [access, setAccess] = useState<{ identity: string; allowed: boolean; error: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    let active = true;
    const identity = user.id;
    void (async () => {
      const { data, error } = permission
        ? await supabase.rpc("has_staff_permission", { permission_key: permission })
        : await supabase.rpc("staff_has_portal_access");
      if (active) setAccess({ identity, allowed: data === true, error: error?.message || "" });
    })();
    return () => { active = false; };
  }, [user, permission]);

  return (
    <main className="staff-mobile-page staff-portal-page" style={{ minHeight: "100vh", color: "#e4edf5" }}>
      <div className="staff-mobile-shell" style={{ margin: "0 auto" }}>
        <header className="staff-mobile-header"><h1>{title}</h1></header>
        <nav className="staff-mobile-nav"><Link href="/staff/dashboard">Staff dashboard</Link><Link href="/">Leave staff area</Link></nav>
        <section className="staff-mobile-section">
          {loading || (user && access?.identity !== user.id) ? <p>Checking access...</p>
            : !user ? <p>Please sign in to access the staff area.</p>
            : access?.error ? <p role="alert">Access could not be checked: {access.error}</p>
            : !access?.allowed ? <p role="alert">This account does not have access to this area.</p>
            : children}
        </section>
      </div>
    </main>
  );
}
