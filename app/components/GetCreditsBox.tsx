"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { CREDIT_PACKAGES } from "@/lib/creditPackages";
import { useUser } from "@/lib/useUser";

const TERMS = [
  { key: "age", text: <>You are 18 or older, or have a parent or guardian&apos;s permission.</> },
  { key: "paypal", text: <>Payment is by <b>PayPal Friends &amp; Family</b> only, to prevent chargebacks.</> },
  { key: "refund", text: <>Credits are <b>non-refundable</b>, but can be used toward paid tournaments, including events with cash prizes.</> },
  { key: "cad", text: <>Prices are in <b>Canadian dollars (CAD)</b>. Other currencies are converted to CAD by PayPal.</> },
] as const;

export default function GetCreditsBox() {
  const { user, loading: authLoading } = useUser();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string>(CREDIT_PACKAGES[1].key);
  const [agreed, setAgreed] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const okRef = useRef<HTMLButtonElement>(null);
  const pack = CREDIT_PACKAGES.find((p) => p.key === selected) ?? CREDIT_PACKAGES[0];

  useEffect(() => {
    if (sent && dialogRef.current && !dialogRef.current.open) {
      dialogRef.current.showModal();
      okRef.current?.focus();
    }
  }, [sent]);

  async function sendRequest() {
    if (!agreed || sending) return;
    setSending(true);
    setError("");
    const { error: rpcError } = await supabase.rpc("gb_request_credits", { p_package: selected });
    setSending(false);
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    setSent(true);
  }

  function closeDialog() {
    setSent(false);
    setOpen(false);
    setAgreed(false);
  }

  return (
    <div className="gc-box">
      <div className="gc-head">Get Credits</div>
      {!open ? (
        <>
          <p>Use credits for tournament entry. Packs of 5 to 25. Prices in CAD.</p>
          <button className="gc-btn" onClick={() => setOpen(true)}>{user ? "Buy Credits" : "View Credit Packs"}</button>
        </>
      ) : (
        <>
          <div className="gc-packs">
            {CREDIT_PACKAGES.map((p) => (
              <label key={p.key} className={`gc-pack ${selected === p.key ? "on" : ""}`}>
                <input type="radio" name="pack" checked={selected === p.key} onChange={() => setSelected(p.key)} />
                <b>{p.credits} credits</b>
                <span>${p.price} CAD</span>
              </label>
            ))}
          </div>
          <div className="gc-agree">
            <label className="gc-terms">
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
              <span>I am 18+ and agree to the <b>credit purchase terms</b>.</span>
            </label>
            <details className="gc-more">
              <summary>Read full terms</summary>
              <ul>
                {TERMS.map((t) => <li key={t.key}>{t.text}</li>)}
                <li>Full details are in the <a href="/credits-terms" target="_blank" rel="noreferrer">Credit Terms</a>, <a href="/terms" target="_blank" rel="noreferrer">Terms of Service</a> and <a href="/privacy" target="_blank" rel="noreferrer">Privacy Policy</a>.</li>
              </ul>
            </details>
          </div>
          {authLoading ? (
            <div className="gc-note">Checking sign-in...</div>
          ) : !user ? (
            <div className="gc-note"><Link href="/login?next=%2Ftournaments">Sign in</Link> to request credits.</div>
          ) : (
            <div className="gc-actions">
              <button className="gc-btn" type="button" disabled={!agreed || sending} onClick={sendRequest}>
                {sending ? "Sending..." : `Send Request · ${pack.credits} credits`}
              </button>
              <button className="gc-cancel" type="button" disabled={sending} onClick={() => { setOpen(false); setError(""); }}>Cancel</button>
            </div>
          )}
          {!agreed && user && <div className="gc-note gc-hint">Tick the box above to send your request.</div>}
          {error && <div className="gc-err" role="alert">{error}</div>}
          <ol className="gc-steps">
            <li>Send your request.</li>
            <li>We message you in your GameBattles inbox with PayPal payment details.</li>
            <li>Your credits are added once payment is confirmed.</li>
          </ol>
        </>
      )}

      <dialog ref={dialogRef} className="gc-dialog" aria-labelledby="gc-dialog-title" onClose={closeDialog}>
        <div className="gc-dialog-header">GameBattles Notification</div>
        <div className="gc-dialog-body">
          <div className="gc-dialog-icon" aria-hidden="true">✓</div>
          <h2 id="gc-dialog-title">Request Sent</h2>
          <p>
            Your request for <b>{pack.credits} credits (${pack.price} CAD)</b> has been sent. You will be contacted soon to
            finish your purchase, so keep an eye on your GameBattles inbox.
          </p>
          <p className="gc-dialog-warn">
            <b>Stay safe:</b> do not share your PayPal password or personal login details with anyone.
            No GameBattles staff member will ever ask for them.
          </p>
          <button ref={okRef} type="button" className="gc-dialog-ok" onClick={() => dialogRef.current?.close()}>OK</button>
        </div>
      </dialog>
    </div>
  );
}
