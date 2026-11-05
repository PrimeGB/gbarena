import { adminClient } from "../../../../lib/paypalServer";

// Reports only whether an email is taken so signup never needs to read emails.
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) {
    return Response.json({ error: "Invalid request origin." }, { status: 403 });
  }

  let body: { email?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email || email.length > 254 || !email.includes("@")) {
    return Response.json({ error: "Invalid email." }, { status: 400 });
  }

  const escaped = email.replace(/[\\%_]/g, (char) => `\\${char}`);
  const { data, error } = await adminClient()
    .from("profiles")
    .select("id")
    .ilike("email", escaped)
    .limit(1);

  if (error) {
    return Response.json({ error: "Could not check email." }, { status: 500 });
  }

  return Response.json({ emailTaken: (data || []).length > 0 });
}
