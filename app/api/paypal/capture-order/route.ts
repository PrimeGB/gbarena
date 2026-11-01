import { NextResponse } from "next/server";
import { adminClient, getSignedInUserId, paypalConfigured, paypalRequest } from "@/lib/paypalServer";

export async function POST(request: Request) {
  if (!paypalConfigured()) {
    return NextResponse.json({ error: "Credit purchases are not available yet." }, { status: 503 });
  }

  const userId = await getSignedInUserId(request);
  if (!userId) return NextResponse.json({ error: "Sign in to buy credits." }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const orderId = typeof body?.orderId === "string" ? body.orderId : "";
  if (!orderId) return NextResponse.json({ error: "Missing order." }, { status: 400 });

  const admin = adminClient();
  const { data: purchase } = await admin
    .from("credit_purchases")
    .select("user_id, amount_usd, status, package_key")
    .eq("paypal_order_id", orderId)
    .maybeSingle();

  if (!purchase || purchase.user_id !== userId) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  const finish = async (captureId: string) => {
    const { data, error } = await admin.rpc("complete_credit_purchase", {
      p_order_id: orderId,
      p_capture_id: captureId,
    });
    if (error) return NextResponse.json({ error: "Payment received but credits could not be added. Contact support." }, { status: 500 });
    return NextResponse.json({ balance: data });
  };

  if (purchase.status === "completed") return finish("");

  const capture = await paypalRequest(`/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, undefined, `cap-${orderId}`);
  const unit = capture.json?.purchase_units?.[0];
  const cap = unit?.payments?.captures?.[0];

  const valid =
    capture.ok &&
    capture.json?.status === "COMPLETED" &&
    cap?.status === "COMPLETED" &&
    cap?.amount?.currency_code === "USD" &&
    Number(cap?.amount?.value) === Number(purchase.amount_usd) &&
    unit?.custom_id === `${userId}:${purchase.package_key}`;

  if (!valid) {
    return NextResponse.json({ error: "The payment could not be verified, so no credits were added." }, { status: 402 });
  }

  return finish(cap.id);
}
