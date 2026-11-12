import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const require = createRequire(import.meta.url);
const source = readFileSync("app/components/AwardDetailsDialog.tsx", "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

function harness(responses) {
  const states = [];
  const effects = [];
  const dialog = { open: false, showModal() { this.open = true; }, close() { this.open = false; } };
  let index = 0;
  let calls = 0;
  const react = {
    useRef() { return { current: dialog }; },
    useState(initial) {
      const position = index++;
      if (!(position in states)) states[position] = initial;
      return [states[position], (next) => {
        states[position] = typeof next === "function" ? next(states[position]) : next;
      }];
    },
    useEffect(fn, deps) {
      const position = index++;
      const previous = effects[position];
      if (!previous || deps.some((value, i) => value !== previous.deps[i])) {
        previous?.cleanup?.();
        effects[position] = { deps, cleanup: fn() };
      }
    },
  };
  const exports = {};
  new Function("require", "exports", compiled)((name) => {
    if (name === "react") return react;
    if (name.endsWith("/supabase")) return { supabase: { rpc() { return Promise.resolve(responses[calls++]); } } };
    if (name.endsWith("/AwardArt")) return { __esModule: true, default: () => null };
    return require(name);
  }, exports);
  return {
    dialog,
    get calls() { return calls; },
    render(award, playerName = "Alex") { index = 0; return exports.default({ award, playerName, onClose() {} }); },
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

const award = { id: 1, name: "Test Trophy", award_group: "Trophies", granted_at: "2026-01-02T12:00:00Z", reason: "Great sportsmanship" };

test("award details show the catalog description, recipient, earned date, and manual reason", async () => {
  const page = harness([{ data: [{ name: award.name, purpose: "Help the community" }], error: null }]);
  page.render(award);
  await flush();
  const markup = renderToStaticMarkup(page.render(award));
  assert.match(markup, /Help the community/);
  assert.match(markup, /Great sportsmanship/);
  assert.match(markup, /Earned by Alex/);
  assert.match(markup, /<time dateTime="2026-01-02T12:00:00Z">/i);
  assert.equal(page.dialog.open, true);
  page.render(null);
  assert.equal(page.dialog.open, false);
});

test("catalog errors are visible and retryable; automatic reasons are not repeated", async () => {
  const page = harness([
    { data: null, error: { message: "offline" } },
    { data: [{ name: award.name, purpose: "Complete a challenge" }], error: null },
  ]);
  const automatic = { ...award, reason: "Awarded automatically: completed challenge" };
  page.render(automatic);
  await flush();
  let view = page.render(automatic);
  assert.match(renderToStaticMarkup(view), /Award details could not be loaded: offline/);
  find(view, (element) => element.type === "button" && element.props.children === "Try again").props.onClick();
  page.render(automatic);
  await flush();
  view = page.render(automatic, "Jordan");
  const markup = renderToStaticMarkup(view);
  assert.match(markup, /Complete a challenge/);
  assert.match(markup, /Earned by Jordan/);
  assert.doesNotMatch(markup, /Awarded for/);
  assert.equal(page.calls, 2);
});
