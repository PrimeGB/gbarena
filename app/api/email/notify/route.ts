const SITE = "https://gbarena.vercel.app";

const escape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

type Template = { subject: string; heading: string; intro: string; button: string; href: string; accent: string };

function buildTemplate(type: string, subject: string, body: string, relatedType: string, relatedId: string): Template {
  const detail = subject.includes(":") ? subject.split(":").slice(1).join(":").trim() : "";
  const matchHref = relatedType === "match" && relatedId ? `${SITE}/matches/${relatedId}` : `${SITE}/messages`;

  if (type === "welcome") {
    return {
      subject: "Welcome to GameBattles!",
      heading: "Welcome to GameBattles!",
      intro: "Your account is ready. Link your gaming accounts, build or join a team, and start climbing the ladders.",
      button: "Get Started",
      href: `${SITE}/getting-started`,
      accent: "#f2c14e",
    };
  }
  if (subject.startsWith("Match accepted")) {
    return {
      subject: `Your match was accepted: ${detail}`,
      heading: "Congratulations, you got a match!",
      intro: body,
      button: "View Match",
      href: matchHref,
      accent: "#3fb950",
    };
  }
  if (subject.startsWith("Confirm the score")) {
    return {
      subject: `Action needed: confirm the score for ${detail}`,
      heading: "Confirm the score",
      intro: body || "Your opponent reported a score. Confirm it or open a dispute.",
      button: "Review Score",
      href: matchHref,
      accent: "#f2c14e",
    };
  }
  if (subject.startsWith("Score submitted")) {
    return {
      subject: `Score submitted: ${detail}`,
      heading: "Score submitted",
      intro: body || "Your score was submitted and is waiting on your opponent to confirm.",
      button: "View Match",
      href: matchHref,
      accent: "#7fc0ff",
    };
  }
  if (subject.startsWith("Score disputed")) {
    return {
      subject: `Match disputed: ${detail}`,
      heading: "Match disputed",
      intro: body || "The reported score was disputed. Staff will review it. Add any proof you have on the match page.",
      button: "View Dispute",
      href: matchHref,
      accent: "#ff4d4d",
    };
  }
  if (subject.startsWith("Dispute resolved")) {
    return {
      subject: `Dispute resolved: ${detail}`,
      heading: "Dispute resolved",
      intro: body || "Staff reviewed your dispute and made a ruling.",
      button: "View Result",
      href: matchHref,
      accent: "#3fb950",
    };
  }
  if (subject.startsWith("Match completed")) {
    return {
      subject: `Match completed: ${detail}`,
      heading: "Match completed",
      intro: body || "Your match is finished and the result has been recorded.",
      button: "View Result",
      href: matchHref,
      accent: "#7fc0ff",
    };
  }
  if (subject.startsWith("Team invite")) {
    return {
      subject: `You were invited to join ${detail}`,
      heading: "You have a team invite",
      intro: body || "A team invited you to join their roster.",
      button: "View Invite",
      href: `${SITE}/messages`,
      accent: "#f2c14e",
    };
  }
  return {
    subject,
    heading: subject,
    intro: body,
    button: "Open GameBattles",
    href: `${SITE}/messages`,
    accent: "#7fc0ff",
  };
}

function render(t: Template) {
  return `<!doctype html><html><body style="margin:0;background:#05080c;font-family:Tahoma,Verdana,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#05080c;padding:24px 0;"><tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#0a1119;border:1px solid #263b4d;">
<tr><td style="background:#101c28;padding:18px 24px;border-bottom:3px solid ${t.accent};color:#f2c14e;font-size:20px;font-weight:bold;letter-spacing:1px;">GAMEBATTLES</td></tr>
<tr><td style="padding:28px 24px;color:#d7e2ee;">
<h1 style="margin:0 0 14px;font-size:22px;color:#ffffff;">${escape(t.heading)}</h1>
<p style="margin:0 0 24px;font-size:15px;line-height:1.55;color:#b9c7d6;">${escape(t.intro)}</p>
<a href="${t.href}" style="display:inline-block;background:#c40000;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 22px;font-size:14px;">${escape(t.button)}</a>
</td></tr>
<tr><td style="padding:16px 24px;border-top:1px solid #13293d;color:#6f8294;font-size:12px;">You can turn off email notifications anytime in Edit Profile on GameBattles.</td></tr>
</table></td></tr></table></body></html>`;
}

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
  const type = typeof payload?.type === "string" ? payload.type : "message";
  const subject = typeof payload?.subject === "string" ? payload.subject.slice(0, 200) : "";
  const body = typeof payload?.body === "string" ? payload.body.slice(0, 5000) : "";
  const relatedType = typeof payload?.related_type === "string" ? payload.related_type : "";
  const relatedId = typeof payload?.related_id === "string" ? payload.related_id : "";

  if (!to || (!subject && type !== "welcome")) {
    return Response.json({ ok: false }, { status: 400 });
  }

  const template = buildTemplate(type, subject, body, relatedType, relatedId);

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || "GameBattles <onboarding@resend.dev>",
      to,
      subject: template.subject,
      html: render(template),
    }),
  });

  return Response.json({ ok: res.ok }, { status: res.ok ? 200 : 502 });
}
