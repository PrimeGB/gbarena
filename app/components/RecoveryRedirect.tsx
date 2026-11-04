"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { RECOVERY_FLAG, supabase } from "../../lib/supabase";

const RESET_PATH = "/login/reset-password";

// Supabase falls back to the Site URL when a recovery redirect isn't allow-listed,
// so recovery links can land on any page. Forward them to the reset form.
export default function RecoveryRedirect() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === RESET_PATH) return;

    if (window.sessionStorage.getItem(RECOVERY_FLAG)) {
      router.replace(RESET_PATH);
      return;
    }

    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    if (hash.has("error_code")) {
      router.replace(`${RESET_PATH}?link_error=1`);
      return;
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") router.replace(RESET_PATH);
    });

    return () => subscription.unsubscribe();
  }, [pathname, router]);

  return null;
}
