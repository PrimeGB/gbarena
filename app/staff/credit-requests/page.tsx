"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type CreditRequest = {
  id: string;
  user_id: string;
  username: string | null;
  credits: number;
  price_cad: number;
  status: "pending" | "awaiting_payment" | "completed" | "cancelled";
  staff_note: string | null;
  created_at: string;
  details_sent_at: string | null;
  closed_at: string | null;
  balance: number;
  player_replied_at: string | null;
};

const STATUS_LABEL: Record<CreditRequest["status"], string> = {
  pending: "New request",
  awaiting_payment: "Waiting for payment",
  completed: "Credits added",
  cancelled: "Cancelled",
};

const EMAIL_KEY = "gb_founder_paypal_email";

const money = (n: number) => `$${Number(n).toFixed(2)} CAD`;
const when = (d: string) => new Date(d).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

function messagePreview(r: CreditRequest, email: string) {
  const name = r.username || "player";
  const price = money(r.price_cad);
  return [
    `Hi ${name},`,
    "",
    "Thanks for your credit request! Here are your purchase details.",
    "",
    "WHAT YOU ARE BUYING",
    `${r.credits} GameBattles credits`,
    `Price: ${price}`,
    "",
    "HOW TO PAY",
    "1. Open PayPal and choose Send.",
    `2. Send ${price} to: ${email || "(your PayPal email)"}`,
    '3. Choose "Friends and Family". Payments sent as "Goods and Services" cannot be accepted.',
    `4. In the payment note, write your GameBattles username: ${name}`,
    "",
    "AFTER YOU PAY",
    `Reply to this message to let us know your payment has been sent. Once we confirm it, your ${r.credits} credits will be added to your account and you will get a message.`,
    "",
    "If you pay in another currency, PayPal converts it to Canadian dollars. Credits are non-refundable but can be used toward paid tournaments, including events with cash prizes.",
    "",
    "Stay safe: never share your PayPal password or login details with anyone. GameBattles staff will never ask for them.",
  ].join("\n");
}

export default function CreditRequestsPage() {
  const [rows, setRows] = useState<CreditRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [paypalEmail, setPaypalEmail] = useState("");
  const [editingEmail, setEditingEmail] = useState(false);

  const load = useCallback(async () => {
    const { data, error: rpcError } = await supabase.rpc("staff_credit_requests");
    if (rpcError) setError(rpcError.message);
    else {
      setError("");
      setRows((data || []) as CreditRequest[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    let active = true;
    void supabase.rpc("staff_credit_requests").then(({ data, error: rpcError }) => {
      if (!active) return;
      const saved = localStorage.getItem(EMAIL_KEY) || "";
      setPaypalEmail((current) => current || saved);
      if (!saved) setEditingEmail(true);
      if (rpcError) setError(rpcError.message);
      else setRows((data || []) as CreditRequest[]);
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  function saveEmail() {
    const email = paypalEmail.trim();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Enter a valid PayPal email.");
      return;
    }
    localStorage.setItem(EMAIL_KEY, email);
    setPaypalEmail(email);
    setEditingEmail(false);
    setError("");
  }

  async function run(id: string, action: () => PromiseLike<{ error: { message: string } | null }>, done: string) {
    setBusy(id);
    setNotice("");
    setError("");
    const { error: rpcError } = await action();
    setBusy(null);
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    setNotice(done);
    await load();
  }

  function sendMessage(r: CreditRequest) {
    const email = paypalEmail.trim();
    if (!email || editingEmail) {
      setEditingEmail(true);
      setError("Save your PayPal email at the top first.");
      return;
    }
    void run(r.id, () => supabase.rpc("staff_send_credit_payment_details", { p_request: r.id, p_paypal_email: email }),
      `Payment message sent to ${r.username}. They'll reply in your inbox once they've paid.`);
  }

  function complete(r: CreditRequest) {
    if (!window.confirm(`Confirm you received ${money(r.price_cad)} from ${r.username} and add ${r.credits} credits?`)) return;
    void run(r.id, () => supabase.rpc("staff_complete_credit_request", { p_request: r.id }), `${r.credits} credits added to ${r.username}.`);
  }

  function cancel(r: CreditRequest) {
    const reason = window.prompt(`Cancel ${r.username}'s request? Optional reason for the player:`);
    if (reason === null) return;
    void run(r.id, () => supabase.rpc("staff_cancel_credit_request", { p_request: r.id, p_reason: reason }), "Request cancelled.");
  }

  const open = rows.filter((r) => r.status === "pending" || r.status === "awaiting_payment");
  const closed = rows.filter((r) => r.status === "completed" || r.status === "cancelled");
  const newCount = open.filter((r) => r.status === "pending").length;
  const repliedCount = open.filter((r) => r.player_replied_at).length;

  return (
    <main className="cr-page">
      <div className="cr-shell">
        <Link href="/staff/dashboard" className="cr-back">← Staff Dashboard</Link>
        <header className="cr-head">
          <div>
            <h1>Pending Credit Purchases</h1>
            <p className="cr-lead">Founder only · All prices in Canadian dollars · PayPal Friends &amp; Family</p>
          </div>
          <div className="cr-stats">
            <span><b>{newCount}</b>New</span>
            <span><b>{open.length - newCount}</b>Waiting</span>
            <span className={repliedCount ? "hot" : ""}><b>{repliedCount}</b>Replied</span>
          </div>
        </header>

        <ol className="cr-how">
          <li><b>1</b>Send the payment message</li>
          <li><b>2</b>Player pays &amp; replies to confirm</li>
          <li><b>3</b>Check PayPal, then add credits</li>
        </ol>

        <section className="cr-email">
          <span className="cr-label">PayPal email players will pay</span>
          {editingEmail ? (
            <form className="cr-email-row" onSubmit={(e) => { e.preventDefault(); saveEmail(); }}>
              <input type="email" value={paypalEmail} onChange={(e) => setPaypalEmail(e.target.value)} placeholder="you@example.com" />
              <button type="submit">Save</button>
            </form>
          ) : (
            <div className="cr-email-row">
              <strong>{paypalEmail}</strong>
              <button type="button" className="cr-link" onClick={() => setEditingEmail(true)}>Change</button>
            </div>
          )}
        </section>

        {error && <p className="cr-error" role="alert">{error}</p>}
        {notice && <p className="cr-ok" role="status">{notice}</p>}

        <h2>Open requests <span>{open.length}</span></h2>
        {loading ? <p className="cr-empty">Loading…</p> : open.length === 0 ? <p className="cr-empty">No open credit requests. You&apos;ll get an email when someone asks for credits.</p> : (
          <div className="cr-list">
            {open.map((r) => {
              const sent = r.status === "awaiting_payment";
              return (
                <article key={r.id} className={`cr-card ${r.status}${r.player_replied_at ? " replied" : ""}`}>
                  <div className="cr-top">
                    <div className="cr-who">
                      <Link href={`/profile?userId=${r.user_id}`} className="cr-name">{r.username || "Unknown player"}</Link>
                      <span className="cr-meta">Requested {when(r.created_at)} · Balance {r.balance} credits</span>
                    </div>
                    <div className="cr-buy">
                      <strong>{r.credits} credits</strong>
                      <span>{money(r.price_cad)}</span>
                    </div>
                  </div>

                  <ol className="cr-track">
                    <li className="done">Requested<small>{when(r.created_at)}</small></li>
                    <li className={sent ? "done" : "now"}>Message sent<small>{r.details_sent_at ? when(r.details_sent_at) : "Not yet"}</small></li>
                    <li className={r.player_replied_at ? "done" : sent ? "now" : ""}>Player replied<small>{r.player_replied_at ? when(r.player_replied_at) : sent ? "Waiting" : "—"}</small></li>
                    <li className={r.player_replied_at ? "now" : ""}>Credits added<small>After payment</small></li>
                  </ol>

                  {r.player_replied_at && (
                    <p className="cr-replied">
                      {r.username} replied {when(r.player_replied_at)}. Check your <Link href="/profile/inbox">inbox</Link> and PayPal, then add the credits.
                    </p>
                  )}

                  <div className="cr-actions">
                    {!sent ? (
                      <button type="button" className="cr-primary" disabled={busy === r.id} onClick={() => sendMessage(r)}>
                        {busy === r.id ? "Sending…" : "Send payment message"}
                      </button>
                    ) : (
                      <>
                        <button type="button" className="cr-primary" disabled={busy === r.id} onClick={() => complete(r)}>Payment confirmed · Add credits</button>
                        <button type="button" disabled={busy === r.id} onClick={() => sendMessage(r)}>Resend message</button>
                      </>
                    )}
                    <button type="button" className="cr-danger" disabled={busy === r.id} onClick={() => cancel(r)}>Cancel request</button>
                  </div>

                  <details className="cr-preview">
                    <summary>{sent ? "View the message they received" : "Preview the message they'll get"}</summary>
                    <pre>{messagePreview(r, paypalEmail.trim())}</pre>
                  </details>
                </article>
              );
            })}
          </div>
        )}

        {closed.length > 0 && (
          <details className="cr-closed">
            <summary>Closed in the last 30 days <span>{closed.length}</span></summary>
            <div className="cr-list">
              {closed.map((r) => (
                <div key={r.id} className={`cr-row ${r.status}`}>
                  <Link href={`/profile?userId=${r.user_id}`} className="cr-name">{r.username || "Unknown player"}</Link>
                  <span>{r.credits} credits · {money(r.price_cad)}</span>
                  <span className="cr-meta">{r.closed_at && when(r.closed_at)}{r.staff_note && <> · {r.staff_note}</>}</span>
                  <span className={`cr-status ${r.status}`}>{STATUS_LABEL[r.status]}</span>
                </div>
              ))}
            </div>
          </details>
        )}
      </div>
      <style>{`
        .cr-page{min-height:100vh;background:radial-gradient(circle at 50% -10%,#16314a 0,#07111c 55%);color:#d7e2ee;font-family:Tahoma,Verdana,Arial,sans-serif;padding:24px 16px 60px}
        .cr-shell{max-width:920px;margin:0 auto}
        .cr-back{color:#f2c14e;font-size:12px;text-decoration:none}
        .cr-head{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;flex-wrap:wrap;margin:12px 0 16px}
        .cr-head h1{margin:0 0 4px;color:#fff;font-size:26px}
        .cr-lead{margin:0;color:#8fa9c0;font-size:12px}
        .cr-stats{display:flex;gap:8px}
        .cr-stats span{display:grid;min-width:72px;padding:8px 10px;text-align:center;border-radius:8px;background:#0b1825;border:1px solid #1d3e5a;color:#7f9ab3;font-size:10px;text-transform:uppercase;letter-spacing:.05em}
        .cr-stats b{color:#fff;font-size:20px}
        .cr-stats .hot{border-color:#2f7a5a;background:#0f2b22}
        .cr-stats .hot b{color:#7affc8}
        .cr-how{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:0 0 14px;padding:0;list-style:none}
        .cr-how li{display:flex;align-items:center;gap:8px;padding:9px 11px;border-radius:8px;background:rgba(11,24,37,.7);color:#b8cadb;font-size:12px}
        .cr-how b{display:grid;place-items:center;flex:0 0 22px;height:22px;border-radius:50%;background:#f2c14e;color:#101820;font-size:11px}
        .cr-email{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:12px 14px;border-radius:10px;background:#0b1825;border:1px solid #1d3e5a}
        .cr-label{color:#8fa9c0;font-size:11px;text-transform:uppercase;letter-spacing:.05em}
        .cr-email-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
        .cr-email-row strong{color:#fff;font-size:14px}
        .cr-email input{min-width:240px;padding:8px 10px;border-radius:6px;background:#02070c;border:1px solid #315b7d;color:#fff;font:inherit}
        .cr-email button{padding:8px 14px;border-radius:6px;border:1px solid #e3c36f;background:linear-gradient(#f2c14e,#b98722);color:#101820;font:bold 11px Tahoma,Verdana,Arial,sans-serif;cursor:pointer}
        .cr-email .cr-link{padding:0;border:0;background:none;color:#8fd0ff;text-decoration:underline}
        .cr-error,.cr-ok{margin:12px 0 0;padding:10px 12px;border-radius:8px;font-size:13px}
        .cr-error{border:1px solid #8e4141;background:#30181b;color:#ffc1bc}
        .cr-ok{border:1px solid #2f7a5a;background:#0f2b22;color:#9ff0c6}
        .cr-shell h2{display:flex;align-items:center;gap:8px;margin:26px 0 10px;color:#e5c573;font-size:13px;text-transform:uppercase;letter-spacing:.06em}
        .cr-shell h2 span,.cr-closed summary span{padding:1px 8px;border-radius:10px;background:#1d3e5a;color:#fff;font-size:11px}
        .cr-empty{padding:18px;border-radius:10px;border:1px dashed #1d3e5a;color:#7f9ab3;font-style:italic;text-align:center}
        .cr-list{display:grid;gap:10px}
        .cr-card{display:grid;gap:14px;padding:16px;border-radius:12px;border:1px solid #1d3e5a;background:linear-gradient(180deg,#0e1f30,#0a1622);box-shadow:0 6px 18px rgba(0,0,0,.25)}
        .cr-card.pending{border-color:#6d5a27}
        .cr-card.replied{border-color:#2f7a5a;box-shadow:0 0 0 1px rgba(122,255,200,.15),0 6px 18px rgba(0,0,0,.25)}
        .cr-top{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap}
        .cr-who{display:grid;gap:3px}
        .cr-name{color:#fff;font-weight:bold;font-size:16px;text-decoration:none}
        .cr-name:hover{color:#f2c14e}
        .cr-meta{color:#7f9ab3;font-size:11px}
        .cr-buy{display:grid;justify-items:end;gap:2px}
        .cr-buy strong{color:#7affc8;font-size:18px}
        .cr-buy span{color:#fff;font-size:13px}
        .cr-track{display:grid;grid-template-columns:repeat(4,1fr);margin:0;padding:0;list-style:none}
        .cr-track li{position:relative;padding-top:18px;text-align:center;color:#5f7a92;font-size:11px;font-weight:bold}
        .cr-track li::before{content:"";position:absolute;top:4px;left:50%;width:12px;height:12px;margin-left:-6px;border-radius:50%;background:#1d3e5a;z-index:1}
        .cr-track li::after{content:"";position:absolute;top:9px;left:-50%;width:100%;height:2px;background:#1d3e5a}
        .cr-track li:first-child::after{display:none}
        .cr-track li.done{color:#9ff0c6}
        .cr-track li.done::before,.cr-track li.done::after{background:#3fbf8a}
        .cr-track li.now{color:#f2c14e}
        .cr-track li.now::before{background:#f2c14e;box-shadow:0 0 0 4px rgba(242,193,78,.2)}
        .cr-track small{display:block;margin-top:2px;color:#6e879d;font-weight:normal;font-size:10px}
        .cr-replied{margin:0;padding:9px 12px;border-radius:8px;background:#0f2b22;border:1px solid #2f7a5a;color:#9ff0c6;font-size:12px}
        .cr-replied a{color:#7affc8}
        .cr-actions{display:flex;gap:8px;flex-wrap:wrap}
        .cr-actions button{padding:9px 14px;border-radius:6px;border:1px solid #416b88;background:#173449;color:#fff;font:bold 12px Tahoma,Verdana,Arial,sans-serif;cursor:pointer}
        .cr-actions .cr-primary{border-color:#e3c36f;background:linear-gradient(#f2c14e,#b98722);color:#101820}
        .cr-actions .cr-danger{margin-left:auto;border-color:transparent;background:none;color:#ff9f9f}
        .cr-actions button:disabled{opacity:.6;cursor:wait}
        .cr-preview summary,.cr-closed summary{cursor:pointer;color:#8fd0ff;font-size:12px}
        .cr-preview pre{margin:8px 0 0;padding:12px;max-height:320px;overflow:auto;border-radius:8px;background:#02070c;border:1px solid #1d3e5a;color:#c8d6e3;font:12px/1.5 Tahoma,Verdana,Arial,sans-serif;white-space:pre-wrap}
        .cr-closed{margin-top:26px}
        .cr-closed summary{display:flex;align-items:center;gap:8px;margin-bottom:10px;color:#e5c573;font-size:13px;font-weight:bold;text-transform:uppercase;letter-spacing:.06em}
        .cr-row{display:grid;grid-template-columns:1.2fr 1fr 1.4fr auto;gap:10px;align-items:center;padding:10px 12px;border-radius:8px;background:#0b1825;font-size:12px}
        .cr-row .cr-name{font-size:13px}
        .cr-status{padding:3px 8px;border-radius:10px;border:1px solid #75602d;color:#f2c14e;font-size:10px;font-weight:bold;text-transform:uppercase;white-space:nowrap}
        .cr-status.completed{border-color:#2f7a5a;color:#9ff0c6}
        .cr-status.cancelled{border-color:#6b3a3a;color:#ff9f9f}
        @media(max-width:640px){
          .cr-how{grid-template-columns:1fr}
          .cr-buy{justify-items:start}
          .cr-row{grid-template-columns:1fr auto}
          .cr-actions button{flex:1 1 100%}
          .cr-actions .cr-danger{margin-left:0}
          .cr-email input{min-width:0;width:100%}
        }
      `}</style>
    </main>
  );
}
