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

  const ownerEmail = process.env.SITE_OWNER_EMAIL?.trim();
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM?.trim();
  if (!ownerEmail || !emailPattern.test(ownerEmail) || !apiKey || !from) {
    console.error("Feedback email is not configured: set SITE_OWNER_EMAIL, RESEND_API_KEY, and EMAIL_FROM.");
    return Response.json(
      { error: "Email notifications are not configured. Please try again later." },
      { status: 503 }
    );
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
      return Response.json(
        { error: "Your submission could not be emailed. Please try again later." },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error("Feedback email delivery failed.", error);
    return Response.json(
      { error: "Your submission could not be emailed. Please try again later." },
      { status: 502 }
    );
  }

  return Response.json({ ok: true });
}
