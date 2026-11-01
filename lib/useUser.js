"use client";

import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export function useUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Supabase re-emits the session (SIGNED_IN / TOKEN_REFRESHED) whenever a tab regains
    // focus or the token refreshes. Keeping the same user object when nothing changed stops
    // every effect that depends on `user` from refetching and re-rendering the page.
    const applyUser = (nextUser) => {
      setUser((prev) => {
        if (!prev && !nextUser) return prev;
        if (
          prev &&
          nextUser &&
          prev.id === nextUser.id &&
          prev.updated_at === nextUser.updated_at
        ) {
          return prev;
        }
        return nextUser || null;
      });
    };

    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      applyUser(data.session?.user || null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        applyUser(session?.user || null);
      }
    );

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
}