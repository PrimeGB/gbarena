import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const started = Date.now();
  const checks: Record<string, { ok: boolean; ms: number; detail?: string }> = {};

  try {
    const { count, error } = await supabase
      .from("teams")
      .select("*", { count: "exact", head: true });
    checks.database = {
      ok: !error,
      ms: Date.now() - started,
      detail: error ? error.message : `${count ?? 0} teams`,
    };
  } catch (e) {
    checks.database = { ok: false, ms: Date.now() - started, detail: e instanceof Error ? e.message : "unreachable" };
  }

  const healthy = checks.database.ok;
  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      service: "gamebattles",
      time: new Date().toISOString(),
      uptimeMs: Date.now() - started,
      checks,
    },
    { status: healthy ? 200 : 503 },
  );
}