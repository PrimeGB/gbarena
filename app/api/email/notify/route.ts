export async function POST(request: Request) {
  const secret = process.env.EMAIL_WEBHOOK_SECRET;
  const apiKey = process.env.RESEND_API_KEY;

  if (!secret || !apiKey) {
    return Response.json({ ok: false, reason: "not configured" }, { status: 200 });
  }

  if (request.headers.get("x-webhook-secret") !== secret) {
    return Response.json({ ok: false }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const to = typeof payload?.to === "string" ? payload.to : "";
  const subject = typeof payload?.subject === "string" ? payload.subject.slice(0, 200) : "";
  const body = typeof payload?.body === "string" ? payload.body.slice(0, 5000) : "";

  if (!to || !subject) {
    return Response.json({ ok: false }, { status: 400 });
  }

  const escape = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || "GameBattles <onboarding@resend.dev>",
      to,
      subject,
      html: `<div style="font-family:Arial,sans-serif;max-width:560px"><h2>${escape(subject)}</h2><p>${escape(body)}</p><p><a href="https://gbarena.vercel.app/messages">Open GameBattles</a></p><p style="color:#888;font-size:12px">Turn off email notifications in Edit Profile.</p></div>`,
    }),
  });

  return Response.json({ ok: res.ok }, { status: res.ok ? 200 : 502 });
}
