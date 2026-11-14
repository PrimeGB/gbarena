import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";

const source = readFileSync(new URL("../app/api/email/notify/route.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
const route = {};
new Function("exports", compiled)(route);

async function send(payload) {
  const previous = {
    EMAIL_WEBHOOK_SECRET: process.env.EMAIL_WEBHOOK_SECRET,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM,
  };
  const originalFetch = globalThis.fetch;
  let email;
  process.env.EMAIL_WEBHOOK_SECRET = "test-secret";
  process.env.RESEND_API_KEY = "test-api-key";
  delete process.env.EMAIL_FROM;
  globalThis.fetch = async (_url, options) => {
    email = JSON.parse(options.body);
    return new Response(null, { status: 200 });
  };

  try {
    const response = await route.POST(new Request("https://gamebattles.app/api/email/notify", {
      method: "POST",
      headers: { "content-type": "application/json", "x-webhook-secret": "test-secret" },
      body: JSON.stringify({ to: "player@example.com", ...payload }),
    }));
    assert.equal(response.status, 200);
    return email;
  } finally {
    globalThis.fetch = originalFetch;
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

test("match emails use the match details and an event-specific subject", async () => {
  const email = await send({
    subject: "Match accepted: Prime vs Rivals",
    body: "Your match was accepted. Fortnite - 4v4 on Xbox.",
    related_type: "match",
    related_id: "match-123",
  });

  assert.equal(email.subject, "Your match was accepted on GameBattles");
  assert.match(email.html, /Your Match Was Accepted/);
  assert.match(email.html, /Match: Prime vs Rivals<br>Your match was accepted/);
  assert.match(email.html, /https:\/\/gamebattles\.app\/matches\/match-123/);
});

test("award emails identify the earned trophy, including team awards", async () => {
  const email = await send({
    subject: "Your team earned an award: Squad Spirit Trophy",
    body: 'Congratulations! "Squad Spirit Trophy" was added to your team.',
    related_type: "award",
  });

  assert.equal(email.subject, "Your team earned a new trophy: Squad Spirit Trophy");
  assert.match(email.html, /Your Team Earned a New Trophy!/);
  assert.match(email.html, /added to your team&#39;s GameBattles profile/);
});

test("inbox emails show the GameBattles logo and do not include private message text", async () => {
  const email = await send({
    subject: "New message",
    body: "A private message that should stay in the inbox.",
    related_type: "message",
  });

  assert.equal(email.subject, "You have a new inbox message on GameBattles");
  assert.match(email.html, /src="https:\/\/gamebattles\.app\/logo-emblem\.png"/);
  assert.match(email.html, /You Have a New Inbox Message/);
  assert.doesNotMatch(email.html, /A private message that should stay in the inbox/);
  assert.match(email.text, /Open Your Inbox/);
});
