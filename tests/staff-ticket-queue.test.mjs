import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const require = createRequire(import.meta.url);
const source = readFileSync(new URL("../app/staff/matches/page.tsx", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;

function harness({ preview = false, queueError = null } = {}) {
  const states = [];
  const effects = [];
  const calls = [];
  let index = 0;
  const react = {
    useState(initial) {
      const position = index++;
      if (!(position in states)) states[position] = initial;
      return [states[position], (next) => {
        states[position] = typeof next === "function" ? next(states[position]) : next;
      }];
    },
    useRef(initial) {
      const position = index++;
      if (!(position in states)) states[position] = { current: initial };
      return states[position];
    },
    useCallback(fn, deps) {
      const position = index++;
      const previous = states[position];
      if (!previous || deps.some((value, i) => value !== previous.deps[i])) states[position] = { fn, deps };
      return states[position].fn;
    },
    useEffect(fn, deps) {
      const position = index++;
      const previous = effects[position];
      if (!previous || deps.some((value, i) => value !== previous.deps[i])) {
        previous?.cleanup?.();
        effects[position] = { deps, cleanup: fn() };
      }
    },
    useSyncExternalStore() { return preview; },
  };
  const entries = [{
    ticket_id: "101", match_id: "match-1", game: "Test game", platform: "Xbox", ladder: "Doubles",
    best_of: "Best of 3", posting_team_name: "Alpha", accepting_team_name: "Bravo",
    posting_team_score: 2, accepting_team_score: 1, posting_team_reported_score: "2 - 1",
    accepting_team_reported_score: "1 - 2", ticket_submissions: [],
    dispute_reason: "Score", dispute_description: "The reported score is incorrect.",
  }];
  const supabase = { rpc: async (method, args) => {
    calls.push({ method, args });
    if (method === "has_staff_permission") return { data: true, error: null };
    if (method === "staff_get_match_review_queue") return { data: queueError ? null : entries, error: queueError };
    if (method === "staff_my_match_decisions" || method === "staff_my_match_decision_reviews") return { data: [], error: null };
    if (method === "staff_finalize_disputed_match") return { data: { ok: true }, error: null };
    throw new Error(`Unexpected RPC: ${method}`);
  } };
  const exports = {};
  new Function("require", "exports", compiled)((name) => {
    if (name === "react") return react;
    if (name === "next/link") return { __esModule: true, default: ({ children, ...props }) => React.createElement("a", props, children) };
    if (name.endsWith("/useUser")) return { useUser: () => ({ user: preview ? null : { id: "staff-user" }, loading: false }) };
    if (name.endsWith("/supabase")) return { supabase };
    if (name.endsWith("/UnscannedEvidenceLink")) return { UnscannedEvidenceLink: ({ children, ...props }) => React.createElement("a", props, children) };
    if (name.endsWith(".css")) return {};
    return require(name);
  }, exports);
  return {
    calls,
    render() { index = 0; return exports.default(); },
  };
}

function find(element, predicate) {
  if (!element || typeof element !== "object") return null;
  if (predicate(element)) return element;
  for (const child of [element.props?.children].flat(Infinity)) {
    const result = find(child, predicate);
    if (result) return result;
  }
  return null;
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

test("the preview switches between sample tickets and higher-up feedback without saving", () => {
  const page = harness({ preview: true });
  let view = page.render();
  assert.match(renderToStaticMarkup(view), /Nova Elite/);
  const revised = find(view, (element) => element.type === "button" && renderToStaticMarkup(element).includes("Revised tickets"));
  revised.props.onClick();
  view = page.render();
  const markup = renderToStaticMarkup(view);
  assert.match(markup, /Higher-up comment/);
  assert.match(markup, /evidence may have been overlooked/);
  assert.match(markup, /This review did not change the result/);
  assert.deepEqual(page.calls, []);
});

test("the real queue loads only personal history and finalizes a decision with its reason", async () => {
  const page = harness();
  page.render();
  await flush();
  let view = page.render();
  assert.match(renderToStaticMarkup(view), /Alpha.*Bravo/);
  assert.match(renderToStaticMarkup(view), /Best of 3/);
  assert.doesNotMatch(renderToStaticMarkup(view), /Best of Best of 3/);
  assert.ok(page.calls.some((call) => call.method === "staff_my_match_decisions"));
  assert.ok(page.calls.some((call) => call.method === "staff_my_match_decision_reviews"));
  find(view, (element) => element.type === "textarea").props.onChange({ target: { value: "Evidence confirms the score" } });
  view = page.render();
  const previousWindow = globalThis.window;
  globalThis.window = { confirm: () => true };
  try {
    await find(view, (element) => element.type === "form").props.onSubmit({ preventDefault() {} });
  } finally {
    globalThis.window = previousWindow;
  }
  assert.deepEqual(page.calls.find((call) => call.method === "staff_finalize_disputed_match").args, {
    match_uuid: "match-1", posting_score: 2, accepting_score: 1, decision_note: "Evidence confirms the score",
  });
  assert.match(renderToStaticMarkup(page.render()), /Official score finalized and recorded/);
});

test("queue loading failures are shown rather than an empty success state", async () => {
  const page = harness({ queueError: { message: "offline" } });
  page.render();
  await flush();
  const markup = renderToStaticMarkup(page.render());
  assert.match(markup, /Tickets could not be loaded: offline/);
  assert.doesNotMatch(markup, /No open tickets are available/);
});
