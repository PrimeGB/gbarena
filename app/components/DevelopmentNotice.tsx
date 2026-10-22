"use client";

import { useState, type CSSProperties } from "react";
import { supabase } from "../../lib/supabase";
import { useUser } from "../../lib/useUser";

const ACKNOWLEDGEMENT_KEY = "gb_development_notice_acknowledged";

export default function DevelopmentNotice() {
  const { user, loading } = useUser();
  const [dismissedUserId, setDismissedUserId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [acknowledgementError, setAcknowledgementError] = useState<{
    userId: string;
    message: string;
  } | null>(null);
  const visible =
    !loading &&
    Boolean(user) &&
    user?.user_metadata?.[ACKNOWLEDGEMENT_KEY] !== true &&
    dismissedUserId !== user?.id;
  const currentError =
    user && acknowledgementError?.userId === user.id
      ? acknowledgementError.message
      : null;

  async function acknowledge() {
    if (!user || saving) return;

    setSaving(true);
    setAcknowledgementError(null);

    const { error: updateError } = await supabase.auth.updateUser({
      data: { [ACKNOWLEDGEMENT_KEY]: true },
    });

    if (updateError) {
      setAcknowledgementError({
        userId: user.id,
        message: `We couldn't save your acknowledgement. Please try again. (${updateError.message})`,
      });
      setSaving(false);
      return;
    }

    setDismissedUserId(user.id);
    setSaving(false);
  }

  if (!visible) return null;

  return (
    <div style={styles.backdrop}>
      <section
        aria-labelledby="development-notice-title"
        aria-modal="true"
        role="dialog"
        style={styles.dialog}
      >
        <h2 id="development-notice-title" style={styles.title}>
          Thanks for signing up!
        </h2>
        <p style={styles.message}>
          GameBattles is still in development. Some features may be buggy, and
          things may change before launch. Thanks for being here while we build
          and improve the site.
        </p>
        {currentError && (
          <p role="alert" style={styles.error}>
            {currentError}
          </p>
        )}
        <button
          type="button"
          disabled={saving}
          onClick={acknowledge}
          style={styles.button}
        >
          {saving ? "Saving..." : "Acknowledge"}
        </button>
      </section>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  backdrop: {
    position: "fixed",
    inset: 0,
    zIndex: 1000,
    display: "grid",
    placeItems: "center",
    padding: 20,
    background: "rgba(0, 0, 0, 0.78)",
  },
  dialog: {
    width: "min(100%, 480px)",
    padding: "28px",
    border: "1px solid #315f88",
    borderRadius: 8,
    background: "#07111b",
    boxShadow: "0 18px 60px rgba(0, 0, 0, 0.65)",
    color: "#d7e2ee",
  },
  title: {
    margin: "0 0 14px",
    color: "#f2c14e",
    fontSize: 22,
    fontWeight: 800,
  },
  message: {
    margin: "0 0 22px",
    fontSize: 15,
    lineHeight: 1.6,
  },
  error: {
    margin: "0 0 14px",
    color: "#ff8888",
    fontSize: 13,
  },
  button: {
    width: "100%",
    minHeight: 44,
    border: "1px solid #bd2727",
    borderRadius: 4,
    background: "linear-gradient(#b80000, #690000)",
    color: "#fff",
    fontWeight: 800,
    cursor: "pointer",
  },
};
