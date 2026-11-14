const SITE = "https://gamebattles.app";

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

type Template = {
  subject: string;
  heading: string;
  intro: string;
  details?: string;
  button: string;
  href: string;
  accent: string;
};

function buildTemplate(type: string, subject: string, body: string, relatedType: string, relatedId: string): Template {
  const inboxHref = `${SITE}/profile/inbox`;
  const matchHref = relatedId ? `${SITE}/matches/${encodeURIComponent(relatedId)}` : inboxHref;
  const details = body.trim().slice(0, 1200);
  const make = (
    emailSubject: string,
    heading: string,
    intro: string,
    button: string,
    href: string,
    accent: string,
    eventDetails = details,
  ): Template => ({
    subject: emailSubject,
    heading,
    intro,
    details: eventDetails || undefined,
    button,
    href,
    accent,
  });
  const matchLabel = subject.replace(/^(Match accepted|Confirm the score|Score submitted|Score disputed|Dispute opened|Dispute resolved|Match completed|Match cancellation requested|Match cancellation accepted|Match cancellation denied):?\s*/i, "");
  const matchDetails = [matchLabel && `Match: ${matchLabel}`, details].filter(Boolean).join("\n");

  if (type === "welcome") {
    return make(
      "Welcome to GameBattles — your account is ready",
      "Welcome to GameBattles!",
      "Your account is ready. Set up your profile, find teammates, and start competing in ladders and tournaments.",
      "Set Up Your Profile",
      `${SITE}/profile/edit`,
      "#f2c14e",
      "",
    );
  }
  if (relatedType === "award" || /^(You|Your team) earned an award:/i.test(subject)) {
    const isTeamAward = /^Your team earned an award:/i.test(subject);
    const awardName = subject.replace(/^(You|Your team) earned an award:\s*/i, "").trim();
    return make(
      awardName
        ? `${isTeamAward ? "Your team" : "You"} earned a new trophy: ${awardName}`
        : `${isTeamAward ? "Your team earned" : "You earned"} a new trophy on GameBattles`,
      isTeamAward ? "Your Team Earned a New Trophy!" : "You Earned a New Trophy!",
      isTeamAward
        ? "Congratulations! A new trophy has been added to your team's GameBattles profile."
        : "Congratulations! A new trophy has been added to your GameBattles profile.",
      isTeamAward ? "View Team Awards" : "View Your Awards",
      `${SITE}/profile/awards`,
      "#f2c14e",
    );
  }
  if (relatedType === "match" || /^(Match accepted|Confirm the score|Score submitted|Score disputed|Dispute opened|Dispute resolved|Match completed|Match cancellation)/i.test(subject)) {
    const prefix = subject.toLowerCase();
    if (prefix.startsWith("match accepted")) {
      return make("Your match was accepted on GameBattles", "Your Match Was Accepted", "A ladder match is ready. Review the match details with your team.", "View Match", matchHref, "#3fb950", matchDetails);
    }
    if (prefix.startsWith("confirm the score")) {
      return make("Action needed: confirm your match score", "Please Confirm the Score", "Your opponent reported the match score. Review it and confirm or dispute the result.", "Review Match", matchHref, "#f2c14e", matchDetails);
    }
    if (prefix.startsWith("score submitted")) {
      return make("Your match score was submitted", "Match Score Submitted", "Your reported score is waiting for the other team to confirm it.", "View Match", matchHref, "#7fc0ff", matchDetails);
    }
    if (prefix.startsWith("score disputed")) {
      return make("Your match score was disputed", "Match Score Disputed", "The reported score was disputed. Submit your evidence so staff can review the match.", "Review Match", matchHref, "#ff4d4d", matchDetails);
    }
    if (prefix.startsWith("dispute opened")) {
      return make("A dispute was opened for your match", "Match Dispute Opened", "A dispute ticket was opened. Review the match and provide any requested information.", "View Match", matchHref, "#ff4d4d", matchDetails);
    }
    if (prefix.startsWith("dispute resolved")) {
      return make("Your match dispute has been resolved", "Match Dispute Resolved", "Staff reviewed the dispute and recorded a ruling for your match.", "View Result", matchHref, "#3fb950", matchDetails);
    }
    if (prefix.startsWith("match completed")) {
      return make("Your match is complete", "Match Completed", "The result is recorded and your ladder record has been updated.", "View Result", matchHref, "#7fc0ff", matchDetails);
    }
    if (prefix.startsWith("match cancellation requested")) {
      return make("A team requested to cancel your match", "Match Cancellation Requested", "Review the cancellation request and respond from the match page.", "Review Match", matchHref, "#f2c14e", matchDetails);
    }
    if (prefix.startsWith("match cancellation accepted")) {
      return make("Your match cancellation was accepted", "Match Cancellation Accepted", "Both teams agreed to cancel the match.", "View Match", matchHref, "#7fc0ff", matchDetails);
    }
    if (prefix.startsWith("match cancellation denied")) {
      return make("Your match cancellation was denied", "Match Cancellation Denied", "The match remains scheduled. Check the match page for the latest details.", "View Match", matchHref, "#f2c14e", matchDetails);
    }
  }
  if (relatedType === "team_invite" || /^(Team invite|Invite accepted|Invite declined):?/i.test(subject)) {
    if (/^Invite accepted/i.test(subject)) {
      return make("A player accepted your team invite", "Your Team Invite Was Accepted", "A player accepted your invitation to join the team.", "Open My Teams", `${SITE}/team-hub`, "#3fb950");
    }
    if (/^Invite declined/i.test(subject)) {
      return make("A player declined your team invite", "Your Team Invite Was Declined", "A player declined your invitation to join the team.", "Open My Teams", `${SITE}/team-hub`, "#7fc0ff");
    }
    return make("You have a team invite on GameBattles", "You Have a Team Invite", "A team invited you to join its roster. Open your inbox to review the invitation.", "Review Invite", inboxHref, "#f2c14e");
  }
  if (relatedType === "friend_request" || /^Friend Request$/i.test(subject)) {
    return make("You have a new friend request", "New Friend Request", "Someone on GameBattles would like to add you as a friend.", "View Friend Requests", `${SITE}/profile/friends`, "#7fc0ff");
  }
  if (relatedType === "sanction" || /muted|suspended/i.test(subject)) {
    const isMuted = /muted/i.test(subject);
    return make(
      isMuted ? "Your GameBattles account has been muted" : "Your GameBattles account has been suspended",
      isMuted ? "Account Muted" : "Account Suspended",
      "There has been an update to your account. Review the details and contact support if you need help.",
      "Visit Account Support",
      `${SITE}/support/account`,
      "#ff4d4d",
    );
  }
  if (relatedType === "team" || /^Team name/i.test(subject) || /^Team name changed/i.test(subject)) {
    const teamHref = relatedId ? `${SITE}/teams/${encodeURIComponent(relatedId)}` : `${SITE}/team-hub`;
    return make(
      `Team update: ${subject || "your team"}`,
      subject || "Team Update",
      "There is an update about your team.",
      "View Team",
      teamHref,
      "#7fc0ff",
    );
  }
  if (relatedType === "message" || relatedType === "") {
    return make(
      "You have a new inbox message on GameBattles",
      "You Have a New Inbox Message",
      "There is a new message waiting in your GameBattles inbox. Sign in to read it.",
      "Open Your Inbox",
      inboxHref,
      "#7fc0ff",
      "",
    );
  }

  return make(
    subject ? `GameBattles update: ${subject}` : "A new update on GameBattles",
    subject || "A New GameBattles Update",
    "There is a new update waiting in your GameBattles inbox.",
    "View Update",
    inboxHref,
    "#7fc0ff",
  );
}

function render(template: Template) {
  const details = template.details
    ? `<div style="margin:0 0 24px;padding:16px;background:#101c28;border-left:3px solid ${template.accent};color:#d7e2ee;font-size:14px;line-height:1.6;">${escapeHtml(template.details).replace(/\r?\n/g, "<br>")}</div>`
    : "";
  const href = escapeHtml(template.href);
  const text = [
    template.heading,
    template.intro,
    template.details,
    `${template.button}: ${template.href}`,
    `GameBattles — ${SITE}`,
  ].filter(Boolean).join("\n\n");

  return {
    html: `<!doctype html><html><body style="margin:0;padding:0;background:#05080c;font-family:Arial,Helvetica,sans-serif;color:#d7e2ee;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(template.intro)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#05080c;padding:28px 12px;"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#0a1119;border:1px solid #263b4d;">
<tr><td style="padding:20px 24px;background:#101c28;border-bottom:3px solid ${template.accent};">
<table role="presentation" cellpadding="0" cellspacing="0"><tr>
<td style="padding-right:14px;"><img src="${SITE}/logo-emblem.png" width="64" height="64" alt="GameBattles logo" style="display:block;width:64px;height:64px;border:0;"></td>
<td style="vertical-align:middle;"><div style="color:#ffffff;font-size:20px;font-weight:bold;letter-spacing:1px;">GAMEBATTLES</div><div style="margin-top:5px;color:#a9bacb;font-size:11px;letter-spacing:1.4px;">COMPETITIVE GAMING COMMUNITY</div></td>
</tr></table>
</td></tr>
<tr><td style="padding:30px 28px;">
<h1 style="margin:0 0 14px;color:#ffffff;font-size:24px;line-height:1.3;">${escapeHtml(template.heading)}</h1>
<p style="margin:0 0 ${template.details ? "16px" : "24px"};color:#b9c7d6;font-size:15px;line-height:1.65;">${escapeHtml(template.intro)}</p>
${details}
<table role="presentation" cellpadding="0" cellspacing="0"><tr><td align="center" style="background:#c40000;border-radius:3px;">
<a href="${href}" style="display:inline-block;padding:13px 22px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:bold;">${escapeHtml(template.button)}</a>
</td></tr></table>
</td></tr>
<tr><td style="padding:18px 28px;border-top:1px solid #1c2a38;color:#8192a3;font-size:12px;line-height:1.6;">
You received this because email notifications are enabled for your GameBattles account. <a href="${SITE}/profile/edit" style="color:#b9c7d6;">Manage notification settings</a>.
</td></tr>
</table>
<div style="padding:14px 0;color:#6f8294;font-size:11px;">&copy; GameBattles</div>
</td></tr></table></body></html>`,
    text,
  };
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
  const subject = typeof payload?.subject === "string" ? payload.subject.slice(0, 200).replace(/[\r\n]+/g, " ").trim() : "";
  const body = typeof payload?.body === "string" ? payload.body : "";
  const relatedType = typeof payload?.related_type === "string" ? payload.related_type : "";
  const relatedId = typeof payload?.related_id === "string" ? payload.related_id : "";

  if (!to || (!subject && type !== "welcome")) {
    return Response.json({ ok: false }, { status: 400 });
  }

  const template = buildTemplate(type, subject, body, relatedType, relatedId);
  const rendered = render(template);
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
      html: rendered.html,
      text: rendered.text,
    }),
  });

  return Response.json({ ok: res.ok }, { status: res.ok ? 200 : 502 });
}
