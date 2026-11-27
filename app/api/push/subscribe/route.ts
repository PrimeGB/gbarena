import { adminClient } from "@/lib/paypalServer";

export const dynamic = "force-dynamic";

type Sub = { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } };

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) {
    return Response.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return Response.json({ error: "Missing session." }, { status: 401 });

  let body: Sub;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const endpoint = typeof body.endpoint === "string" ? body.endpoint : "";
  const p256dh = body.keys?.p256dh;
  const auth = body.keys?.auth;
  if (!endpoint || typeof p256dh !== "string" || typeof auth !== "string") {
    return Response.json({ error: "Invalid push subscription." }, { status: 400 });
  }

  const admin = adminClient();
  const { data: userData, error: userError } = await admin.auth.getUser(token);
  const userId = userData?.user?.id;
  if (userError || !userId) return Response.json({ error: "Invalid session." }, { status: 401 });

  const { error } = await admin.from("push_subscriptions").upsert(
    { user_id: userId, endpoint, p256dh, auth },
    { onConflict: "endpoint" },
  );
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ ok: true });
}

export async function DELETE(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) {
    return Response.json({ error: "Invalid request origin." }, { status: 403 });
  }
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return Response.json({ error: "Missing session." }, { status: 401 });

  const admin = adminClient();
  const { data: userData } = await admin.auth.getUser(token);
  const userId = userData?.user?.id;
  if (!userId) return Response.json({ error: "Invalid session." }, { status: 401 });

  let endpoint = "";
  try {
    const body = await request.json();
    endpoint = typeof body.endpoint === "string" ? body.endpoint : "";
  } catch {
    /* ignore */
  }
  const query = admin.from("push_subscriptions").delete().eq("user_id", userId);
  if (endpoint) query.eq("endpoint", endpoint);
  const { error } = await query;
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}