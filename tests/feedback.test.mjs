import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const source = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "app", "api", "feedback", "route.ts"), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;

function loadHandler({ inboxError = null, email = "owner@example.test", user = true } = {}) {
  const calls = [];
  const exports = {};
  const createClient = (_url, key) => key === "service-key"
    ? { rpc: async (name) => { calls.push(name); return { data: email, error: null }; } }
    : {
      auth: { getUser: async () => ({ data: { user: user ? { id: "player" } : null }, error: null }) },
      rpc: async (name, args) => { calls.push([name, args]); return { error: inboxError }; },
    };
  new Function("require", "exports", compiled)((name) => {
    assert.equal(name, "@supabase/supabase-js");
    return { createClient };
  }, exports);
  return { post: exports.POST, calls };
}

function request(token = "player-token", type = "Suggestion") {
  const headers = { origin: "https://example.test", "content-type": "application/json" };
  if (token) headers.authorization = `Bearer ${token}`;
  return new Request("https://example.test/api/feedback", {
    method: "POST",
    headers,
    body: JSON.stringify({ type, title: "Test title", details: "Test feedback details" }),
  });
}

test("feedback requires sign-in and stores inbox before emailing the owner", async () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.test";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-key";
  process.env.RESEND_API_KEY = "test-key";
  process.env.EMAIL_FROM = "sender@example.test";
  const oldFetch = globalThis.fetch;
  const deliveries = [];
  globalThis.fetch = async (_url, options) => {
    deliveries.push(JSON.parse(options.body));
    return new Response("{}", { status: 200 });
  };
  try {
    const { post, calls } = loadHandler();
    assert.equal((await post(request(""))).status, 401);
    const response = await post(request());
    assert.deepEqual(await response.json(), { ok: true, emailDelivered: true });
    assert.equal(calls[0][0], "gb_submit_community_feedback");
    assert.equal(calls[1], "gb_owner_feedback_email");
    assert.deepEqual(deliveries[0].to, ["owner@example.test"]);
  } finally {
    globalThis.fetch = oldFetch;
  }
});

test("bug reports are submitted to the staff queue and inbox before the owner email", async () => {
  process.env.RESEND_API_KEY = "test-key";
  const oldFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response("{}", { status: 200 });
  try {
    const { post, calls } = loadHandler();
    const response = await post(request("player-token", "Bug Report"));
    assert.deepEqual(await response.json(), { ok: true, emailDelivered: true });
    assert.equal(calls[0][0], "gb_submit_community_feedback");
    assert.equal(calls[0][1].p_type, "Bug Report");
    assert.equal(calls[1], "gb_owner_feedback_email");
  } finally {
    globalThis.fetch = oldFetch;
  }
});

test("email delivery failure is reported after feedback is saved", async () => {
  process.env.RESEND_API_KEY = "test-key";
  const oldFetch = globalThis.fetch;
  const originalError = console.error;
  globalThis.fetch = async () => new Response("Unavailable", { status: 503 });
  console.error = () => {};
  try {
    const { post, calls } = loadHandler();
    assert.deepEqual(await (await post(request())).json(), { ok: true, emailDelivered: false });
    assert.equal(calls[0][0], "gb_submit_community_feedback");
  } finally {
    globalThis.fetch = oldFetch;
    console.error = originalError;
  }
});

test("inbox failures are errors and missing email configuration reports partial success", async () => {
  const originalError = console.error;
  console.error = () => {};
  try {
    const failed = loadHandler({ inboxError: { message: "Too many submissions." } });
    assert.equal((await failed.post(request())).status, 400);
    assert.equal(failed.calls.length, 1);
    delete process.env.RESEND_API_KEY;
    const saved = loadHandler();
    assert.deepEqual(await (await saved.post(request())).json(), { ok: true, emailDelivered: false });
    assert.equal(saved.calls.length, 1);
  } finally {
    console.error = originalError;
  }
});
