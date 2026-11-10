import { createClient } from "@supabase/supabase-js";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FeedbackPayload = {
  type?: unknown;
  title?: unknown;
  details?: unknown;
};

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) {
    return Response.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 8_000) {
    return Response.json({ error: "Submission is too large." }, { status: 413 });
  }

  let payload: FeedbackPayload;
  try {
    payload = (await request.json()) as FeedbackPayload;
  } catch {
    return Response.json({ error: "Invalid submission." }, { status: 400 });
  }

  const type =
    payload.type === "Suggestion" || payload.type === "Bug Report"
      ? payload.type
      : null;
  const title = typeof payload.title === "string" ? payload.title.trim() : "";
  const details = typeof payload.details === "string" ? payload.details.trim() : "";
  if (
    !type ||
    title.length < 4 ||
    title.length > 160 ||
    details.length < 10 ||
    details.length > 5000
  ) {
    return Response.json(
      { error: "Enter a title and details within the allowed length." },
      { status: 400 }
    );
  }

  const token = (request.headers.get("authorization") || "").match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return Response.json({ error: "Sign in to submit feedback." }, { status: 401 });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.error("Feedback submission is not configured: Supabase settings are missing.");
    return Response.json({ error: "Feedback submissions are unavailable." }, { status: 503 });
  }
  const client = createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userError } = await client.auth.getUser(token);
  if (userError || !userData.user) {
    return Response.json({ error: "Sign in to submit feedback." }, { status: 401 });
  }
  const { error: inboxError } = await client.rpc("gb_submit_owner_feedback", {
    p_type: type,
    p_title: title,
    p_details: details,
  });
  if (inboxError) {
    console.error("Feedback inbox delivery failed:", inboxError.message);
    return Response.json({ error: inboxError.message }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!apiKey || !from || !serviceKey) {
    console.error("Feedback email is not configured: set SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, and EMAIL_FROM.");
    return Response.json({ ok: true, emailDelivered: false });
  }
  const text = [
    `New GameBattles ${type.toLowerCase()}`,
    "",
    `Title: ${title}`,
    "",
    "Details:",
    details,
    "",
    `Submitted: ${new Date().toISOString()}`,
    `Page: ${new URL("/suggestions", request.url).toString()}`,
  ].join("\n");

  try {
    const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: email, error: ownerError } = await admin.rpc("gb_owner_feedback_email");
    const ownerEmail = typeof email === "string" ? email.trim() : "";
    if (ownerError || !emailPattern.test(ownerEmail)) {
      console.error("Could not resolve the owner account's feedback email:", ownerError?.message || "Email is missing or invalid.");
      return Response.json({ ok: true, emailDelivered: false });
    }
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [ownerEmail],
        subject: `[GameBattles] New ${type}: ${title.replace(/[\r\n]+/g, " ")}`,
        text,
      }),
    });

    if (!response.ok) {
      console.error("Feedback email delivery failed with status", response.status);
      return Response.json({ ok: true, emailDelivered: false });
    }
  } catch (error) {
    console.error("Feedback email delivery failed.", error);
    return Response.json({ ok: true, emailDelivered: false });
  }

  return Response.json({ ok: true, emailDelivered: true });
}
