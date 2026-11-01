import { NextResponse } from "next/server";
import { adminClient, paypalConfigured, paypalRequest } from "@/lib/paypalServer";

type PayPalEvent = {
  id: string;
  event_type: string;
  resource?: {
    id?: string;
    disputed_transactions?: { seller_transaction_id?: string }[];
    links?: { rel?: string; href?: string }[];
  };
};

function captureIdsFor(event: PayPalEvent) {
  const r = event.resource || {};
  switch (event.event_type) {
    case "PAYMENT.CAPTURE.REFUNDED": {
      // The resource is the refund; the original capture is in its "up" link.
      const up = r.links?.find((l) => l.rel === "up")?.href || "";
      const id = up.split("/captures/")[1];
      return id ? [id] : [];
    }
    case "PAYMENT.CAPTURE.REVERSED":
    case "PAYMENT.CAPTURE.DENIED":
      return r.id ? [r.id] : [];
    case "CUSTOMER.DISPUTE.CREATED":
      return (r.disputed_transactions || []).map((t) => t.seller_transaction_id).filter(Boolean) as string[];
    default:
      return [];
  }
}

export async function POST(request: Request) {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!paypalConfigured() || !webhookId) {
    return NextResponse.json({ error: "Not configured." }, { status: 503 });
  }

  const event = (await request.json().catch(() => null)) as PayPalEvent | null;
  if (!event?.id || !event.event_type) return NextResponse.json({ error: "Bad event." }, { status: 400 });

  const h = request.headers;
  const verify = await paypalRequest("/v1/notifications/verify-webhook-signature", {
    auth_algo: h.get("paypal-auth-algo"),
    cert_url: h.get("paypal-cert-url"),
    transmission_id: h.get("paypal-transmission-id"),
    transmission_sig: h.get("paypal-transmission-sig"),
    transmission_time: h.get("paypal-transmission-time"),
    webhook_id: webhookId,
    webhook_event: event,
  });
  if (!verify.ok || verify.json?.verification_status !== "SUCCESS") {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  const admin = adminClient();
  const { error: seenError } = await admin
    .from("paypal_webhook_events")
    .insert({ event_id: event.id, event_type: event.event_type });
  if (seenError) return NextResponse.json({ ok: true, duplicate: true });

  const reason =
    event.event_type === "CUSTOMER.DISPUTE.CREATED"
      ? "PayPal dispute/chargeback opened"
      : "PayPal payment refunded or reversed";

  for (const captureId of captureIdsFor(event)) {
    await admin.rpc("reverse_credit_purchase", { p_capture_id: captureId, p_reason: reason });
  }

  return NextResponse.json({ ok: true });
}
