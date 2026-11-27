// Automated regression / smoke test. Runs against a live server and verifies
// that critical routes and PWA/SEO assets respond correctly.
//
// Usage:
//   node tests/smoke.mjs [baseUrl]
//   BASE_URL=http://localhost:3000 node tests/smoke.mjs
//
// Exit code is non-zero on any failure (CI-friendly).

const BASE = (process.argv[2] || process.env.BASE_URL || "http://localhost:3000").replace(/\/$/, "");

const checks = [
  { path: "/api/health", expect: 200, json: (b) => b.status === "ok" || b.status === "degraded" },
  { path: "/home", expect: 200 },
  { path: "/ranks", expect: 200 },
  { path: "/ranks/leaderboards", expect: 200 },
  { path: "/settings/notifications", expect: 200 },
  { path: "/manifest.webmanifest", expect: 200 },
  { path: "/sw.js", expect: 200 },
  { path: "/about", expect: 200 },
  { path: "/terms", expect: 200 },
];

let failures = 0;

for (const c of checks) {
  const url = BASE + c.path;
  try {
    const res = await fetch(url);
    let ok = res.status === c.expect;
    let detail = `${res.status}`;
    if (ok && c.json) {
      const body = await res.json().catch(() => null);
      ok = !!body && c.json(body);
      detail += ok ? " (json ok)" : " (json check failed)";
    }
    if (ok) {
      console.log(`PASS ${c.path} -> ${detail}`);
    } else {
      failures++;
      console.error(`FAIL ${c.path} -> expected ${c.expect}, got ${detail}`);
    }
  } catch (e) {
    failures++;
    console.error(`FAIL ${c.path} -> ${e instanceof Error ? e.message : "error"}`);
  }
}

console.log(`\n${checks.length - failures}/${checks.length} checks passed.`);
process.exit(failures ? 1 : 0);