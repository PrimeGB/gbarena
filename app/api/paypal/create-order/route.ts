import { NextResponse } from "next/server";
import { findCreditPackage } from "@/lib/creditPackages";
import { adminClient, getSignedInUserId, paypalConfigured, paypalRequest } from "@/lib/paypalServer";

export async function POST(request: Request) {
  if (!paypalConfigured()) {
    return NextResponse.json({ error: "Credit purchases are not available yet." }, { status: 503 });
  }

  const userId = await getSignedInUserId(request);
  if (!userId) return NextResponse.json({ error: "Sign in to buy credits." }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const pkg = findCreditPackage(body?.packageKey);
  if (!pkg) return NextResponse.json({ error: "Unknown package." }, { status: 400 });

  const { data: blocked } = await adminClient()
    .from("credit_purchase_blocks")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (blocked) {
    return NextResponse.json({ error: "Credit purchases are disabled on this account. Contact Support." }, { status: 403 });
  }

  // Price and credit amount always come from the server, never from the browser.
  const order = await paypalRequest("/v2/checkout/orders", {
    intent: "CAPTURE",
    purchase_units: [
      {
        description: `${pkg.credits} GameBattles credits`,
        custom_id: `${userId}:${pkg.key}`,
        amount: { currency_code: "USD", value: pkg.price },
      },
    ],
  });
  if (!order.ok || !order.json?.id) {
    return NextResponse.json({ error: "Could not start the payment." }, { status: 502 });
  }

  const { error } = await adminClient().from("credit_purchases").insert({
    paypal_order_id: order.json.id,
    user_id: userId,
    package_key: pkg.key,
    credits: pkg.credits,
    amount_usd: pkg.price,
  });
  if (error) return NextResponse.json({ error: "Could not record the order." }, { status: 500 });

  return NextResponse.json({ id: order.json.id });
}
