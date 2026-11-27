// Automated broken-link monitor. Crawls same-origin internal links and reports
// any that do not return a 2xx/3xx status. No external dependencies.
//
// Usage:
//   node scripts/check-links.mjs [startUrl]
//   BASE_URL=https://gamebattles.app node scripts/check-links.mjs
//
// Exit code is non-zero if any broken links are found (CI-friendly).

const START = process.argv[2] || process.env.BASE_URL || "http://localhost:3000/home";
const MAX_PAGES = Number(process.env.MAX_PAGES || 200);
const SKIP = /\.(png|jpe?g|gif|svg|webp|ico|css|js|json|xml|txt|mp4|webm|woff2?)$/i;

const origin = new URL(START).origin;
const seen = new Set();
const queue = [START];
const broken = [];
let checked = 0;

function sameOrigin(url) {
  try {
    return new URL(url).origin === origin;
  } catch {
    return false;
  }
}

async function check(url) {
  try {
    const res = await fetch(url, { redirect: "manual", headers: { "user-agent": "gb-link-checker" } });
    return res.status;
  } catch (e) {
    return 0;
  }
}

while (queue.length && checked < MAX_PAGES) {
  const url = queue.shift();
  if (seen.has(url)) continue;
  seen.add(url);
  checked++;

  const status = await check(url);
  if (status === 0 || status >= 400) {
    broken.push({ url, status: status || "ERR" });
    continue;
  }
  if (status >= 300 && status < 400) continue;

  try {
    const res = await fetch(url);
    const html = await res.text();
    const hrefs = [...html.matchAll(/href=["']([^"'#]+)["']/g)].map((m) => m[1]);
    for (const href of hrefs) {
      if (!sameOrigin(href) || SKIP.test(href)) continue;
      const abs = new URL(href, url).href.split("#")[0];
      if (!seen.has(abs)) queue.push(abs);
    }
  } catch {
    /* ignore parse errors */
  }
}

console.log(`Checked ${checked} page(s).`);
if (broken.length) {
  console.error(`Found ${broken.length} broken link(s):`);
  for (const b of broken) console.error(`  [${b.status}] ${b.url}`);
  process.exit(1);
} else {
  console.log("No broken links found.");
}