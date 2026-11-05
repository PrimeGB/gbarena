const SITE = "https://gamebattles.app";

const escape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

type Template = {
  subject: string;
  heading: string;
  intro: string;
  button?: string;
  href?: string;
  accent: string;
  steps?: string[];
};

function buildTemplate(type: string, subject: string, relatedType: string, relatedId: string): Template {
  const matchHref = relatedType === "match" && relatedId ? `${SITE}/matches/${relatedId}` : `${SITE}/messages`;
  const make = (title: string, intro: string, button: string, href: string, accent: string): Template => ({
    subject: title,
    heading: title,
    intro,
    button,
    href,
    accent,
  });

  if (type === "welcome") {
    return {
      subject: "Welcome to GameBattles!",
      heading: "Welcome to GameBattles!",
      intro:
        "Your account is ready. GameBattles is a community for competitive gaming, teamwork, ladders, and tournaments. Set up your profile, find teammates, and start competing whenever you're ready.",
      accent: "#f2c14e",
    };
  }
  if (subject.startsWith("Match accepted")) return make("Match Accepted", "Congratulations, you got a match!", "View Match", matchHref, "#3fb950");
  if (subject.startsWith("Confirm the score")) return make("Confirm the Score", "Your opponent reported a score. Confirm it or dispute it.", "Review Score", matchHref, "#f2c14e");
  if (subject.startsWith("Score submitted")) return make("Match Reported", "Your score was submitted and is waiting on your opponent.", "View Match", matchHref, "#7fc0ff");
  if (subject.startsWith("Score disputed")) return make("Match Disputed", "A score was disputed. Staff will review it.", "View Match", matchHref, "#ff4d4d");
  if (subject.startsWith("Dispute resolved")) return make("Dispute Resolved", "Staff made a ruling on your dispute.", "View Result", matchHref, "#3fb950");
  if (subject.startsWith("Match completed")) return make("Match Completed", "Your match is finished and the result is recorded.", "View Result", matchHref, "#7fc0ff");
  if (subject.startsWith("Team invite")) return make("Team Invite", "You have been invited to join a team.", "View Invite", `${SITE}/messages`, "#f2c14e");
  if (subject.startsWith("New message") || relatedType === "message" || relatedType === "") {
    return make("New Message", "You have a new message on GameBattles.", "Open Messages", `${SITE}/messages`, "#7fc0ff");
  }
  return make("New Notification", "You have a new notification on GameBattles.", "Open GameBattles", `${SITE}/messages`, "#7fc0ff");
}
function render(t: Template) {
  return `<!doctype html><html><body style="margin:0;background:#05080c;font-family:Tahoma,Verdana,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#05080c;padding:24px 0;"><tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#0a1119;border:1px solid #263b4d;">
<tr><td style="background:#101c28;padding:18px 24px;border-bottom:3px solid ${t.accent};color:#f2c14e;font-size:20px;font-weight:bold;letter-spacing:1px;">GAMEBATTLES</td></tr>
<tr><td style="padding:28px 24px;color:#d7e2ee;">
<h1 style="margin:0 0 14px;font-size:22px;color:#ffffff;">${escape(t.heading)}</h1>
<p style="margin:0 0 ${t.steps ? "14px" : "24px"};font-size:15px;line-height:1.55;color:#b9c7d6">${escape(t.intro)}</p>
${t.steps ? `<ul style="margin:0 0 24px;padding-left:20px;font-size:14px;line-height:1.8;color:#d7e2ee;">${t.steps.map((s) => `<li>${escape(s)}</li>`).join("")}</ul>` : ""}
${t.button && t.href ? `<a href="${t.href}" style="display:inline-block;background:#c40000;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 22px;font-size:14px;">${escape(t.button)}</a>` : ""}
</td></tr>
${t.href ? `<tr><td style="padding:16px 24px;border-top:1px solid #13293d;color:#6f8294;font-size:12px;">You can turn off email notifications anytime in Edit Profile on GameBattles.</td></tr>` : ""}
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
  const relatedType = typeof payload?.related_type === "string" ? payload.related_type : "";
  const relatedId = typeof payload?.related_id === "string" ? payload.related_id : "";

  if (!to || (!subject && type !== "welcome")) {
    return Response.json({ ok: false }, { status: 400 });
  }

  const template = buildTemplate(type, subject, relatedType, relatedId);

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
