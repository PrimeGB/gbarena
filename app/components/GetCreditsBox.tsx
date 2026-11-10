"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { CREDIT_PACKAGES } from "@/lib/creditPackages";
import { useUser } from "@/lib/useUser";
import Link from "next/link";

type PayPalButtons = {
  Buttons: (config: Record<string, unknown>) => { render: (el: HTMLElement) => Promise<void>; close: () => void };
};

declare global {
  interface Window {
    paypal?: PayPalButtons;
  }
}

const CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

export default function GetCreditsBox() {
  const { user, loading: authLoading } = useUser();
  const userId = user?.id;
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string>(CREDIT_PACKAGES[1].key);
  const [agreed, setAgreed] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sdkReady, setSdkReady] = useState(false);
  const holder = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const payingRef = useRef(false);
  const agreedRef = useRef(false);
  const selectedRef = useRef(selected);

  useEffect(() => {
    if (!open) return;
    function onOutside(e: MouseEvent) {
      if (payingRef.current) return;
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [open]);

  useEffect(() => {
    agreedRef.current = agreed;
  }, [agreed]);
  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  useEffect(() => {
    if (!open || !userId || !CLIENT_ID || window.paypal) {
      if (window.paypal) setSdkReady(true);
      return;
    }
    const s = document.createElement("script");
    s.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(CLIENT_ID)}&currency=USD&intent=capture`;
    s.onload = () => setSdkReady(true);
    s.onerror = () => setError("Could not load PayPal.");
    document.body.appendChild(s);
  }, [open, userId]);

  async function finishPayment(orderId: string) {
    const { data } = await supabase.auth.getSession();
    const res = await fetch("/api/paypal/capture-order", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session?.access_token}` },
      body: JSON.stringify({ orderId }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "Payment could not be completed.");
      return;
    }
    setMessage(`Payment complete. Your balance is now ${Number(json.balance).toLocaleString()} credits.`);
  }

  useEffect(() => {
    if (!open || !userId || !sdkReady || !window.paypal || !holder.current) return;
    const el = holder.current;
    el.innerHTML = "";
    const buttons = window.paypal.Buttons({
      style: { layout: "vertical", color: "gold", shape: "rect", label: "paypal" },
      onClick: (_: unknown, actions: { resolve: () => Promise<void>; reject: () => Promise<void> }) => {
        if (!agreedRef.current) {
          setError("Please accept the Credit Terms first.");
          return actions.reject();
        }
        setError("");
        return actions.resolve();
      },
      createOrder: async () => {
        payingRef.current = true;
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (!token) throw new Error("Sign in to buy credits.");
        const res = await fetch("/api/paypal/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ packageKey: selectedRef.current }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Could not start payment.");
        return json.id;
      },
      onApprove: async (approval: { orderID: string }) => {
        try {
          await finishPayment(approval.orderID);
        } finally {
          payingRef.current = false;
        }
      },
      onCancel: () => {
        payingRef.current = false;
      },
      onError: (err: Error) => {
        payingRef.current = false;
        setError(err?.message || "Payment failed.");
      },
    });
    buttons.render(el);
    return () => {
      try {
        buttons.close();
      } catch {
        /* already closed */
      }
    };
  }, [open, sdkReady, userId]);

  return (
    <div className="gc-box" ref={boxRef}>
      <div className="gc-head">Get Credits</div>
      {!open ? (
        <>
          <p>Use credits for tournament entry. Packs of 5 to 25.</p>
          <button className="gc-btn" onClick={() => setOpen(true)}>{user ? "Buy Credits" : "View Credit Packs"}</button>
        </>
      ) : (
        <>
          <div className="gc-packs">
            {CREDIT_PACKAGES.map((p) => (
              <label key={p.key} className={`gc-pack ${selected === p.key ? "on" : ""}`}>
                <input type="radio" name="pack" checked={selected === p.key} onChange={() => setSelected(p.key)} />
                <b>{p.credits} credits</b>
                <span>${p.price}</span>
              </label>
            ))}
          </div>
          <label className="gc-terms">
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
            <span>
              I am 18+ (or have a parent/guardian&apos;s permission) and agree to the{" "}
              <a href="/credits-terms" target="_blank" rel="noreferrer">Credit Terms</a>: purchases are final, non-refundable,
              have no cash value, and I will not file a chargeback or dispute.
            </span>
          </label>
          {!CLIENT_ID ? (
            <div className="gc-note">Credit purchases are being set up and will open soon.</div>
          ) : authLoading ? (
            <div className="gc-note">Checking sign-in...</div>
          ) : !user ? (
            <div className="gc-note"><Link href="/login?next=%2Ftournaments">Sign in</Link> to buy credits.</div>
          ) : (
            <div ref={holder} className="gc-paypal" />
          )}
          {error && <div className="gc-err">{error}</div>}
          {message && <div className="gc-ok">{message}</div>}
          <div className="gc-secure">Payments are processed by PayPal. We never see your card or PayPal login.</div>
        </>
      )}
    </div>
  );
}
