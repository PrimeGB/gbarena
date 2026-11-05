import { createClient } from "@supabase/supabase-js";
import { adminClient } from "../../../../lib/paypalServer";

// Signs in by username without ever sending the account email to the browser.
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) {
    return Response.json({ error: "Invalid request origin." }, { status: 403 });
  }

  let body: { identifier?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const identifier = typeof body.identifier === "string" ? body.identifier.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!identifier || !password || identifier.length > 254 || password.length > 256) {
    return Response.json({ error: "Invalid login credentials." }, { status: 400 });
  }

  let email = identifier;
  if (!identifier.includes("@")) {
    const escaped = identifier.replace(/[\\%_]/g, (char) => `\\${char}`);
    const { data, error } = await adminClient()
      .from("profiles")
      .select("email")
      .ilike("username", escaped)
      .maybeSingle();

    if (error) {
      return Response.json({ error: "Unable to look up username. Please try again." }, { status: 500 });
    }
    if (!data?.email) {
      return Response.json({ code: "username_not_found", error: "Username not found." }, { status: 404 });
    }
    email = data.email;
  }

  const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await anon.auth.signInWithPassword({ email, password });

  if (error || !data.session) {
    return Response.json({ error: error?.message || "Invalid login credentials." }, { status: 401 });
  }

  return Response.json({
    session: {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    },
  });
}
