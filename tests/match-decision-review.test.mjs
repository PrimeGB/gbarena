import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const require = createRequire(import.meta.url);
const source = readFileSync(new URL("../app/matches/DecisionReviewRequest.tsx", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;

function harness(statusResult, submitResult = { error: null }) {
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
    useEffect(effect, deps) {
      const position = index++;
      const previous = effects[position];
      if (!previous || deps.some((value, i) => value !== previous.deps[i])) {
        previous?.cleanup?.();
        effects[position] = { deps, cleanup: effect() };
      }
    },
  };
  const exports = {};
  new Function("require", "exports", compiled)((name) => {
    if (name === "react") return react;
    if (name.endsWith("/supabase")) return {
      supabase: { rpc: async (method, args) => {
        calls.push({ method, args });
        return method === "match_decision_review_status" ? statusResult : submitResult;
      } },
    };
    return require(name);
  }, exports);
  const render = () => {
    index = 0;
    return exports.default({ matchId: "match", teamId: "team", teamName: "Example" });
  };
  return { render, calls };
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));
function find(element, type) {
  if (!element || typeof element !== "object") return null;
  if (element.type === type) return element;
  for (const child of [element.props?.children].flat(Infinity)) {
    const result = find(child, type);
    if (result) return result;
  }
  return null;
}

test("review form is only shown for a staff decision and displays lookup errors", async () => {
  const ineligible = harness({ data: { eligible: false }, error: null });
  ineligible.render();
  await flush();
  assert.equal(ineligible.render(), null);

  const failed = harness({ data: null, error: { message: "offline" } });
  failed.render();
  await flush();
  assert.match(renderToStaticMarkup(failed.render()), /Review request status could not be loaded: offline/);
});

test("submitting a review records the team's reason and shows pending status", async () => {
  const page = harness({ data: { eligible: true, status: null, decision_reason: "Evidence checked", posting_score: 2, accepting_score: 1 }, error: null });
  page.render();
  await flush();
  const form = page.render();
  assert.match(renderToStaticMarkup(form), /Staff decision review.*Example/);
  find(form, "textarea").props.onChange({ target: { value: "Evidence was overlooked" } });
  await find(page.render(), "form").props.onSubmit({ preventDefault() {} });
  assert.deepEqual(page.calls[1], {
    method: "request_match_decision_review",
    args: { p_match_id: "match", p_team_id: "team", p_reason: "Evidence was overlooked" },
  });
  assert.match(renderToStaticMarkup(page.render()), /review request: pending/);
  assert.equal(find(page.render(), "form"), null);
});

test("submission failures remain visible and do not mark the request pending", async () => {
  const page = harness(
    { data: { eligible: true, status: null, decision_reason: "Evidence checked", posting_score: 2, accepting_score: 1 }, error: null },
    { error: { message: "already requested" } },
  );
  page.render();
  await flush();
  await find(page.render(), "form").props.onSubmit({ preventDefault() {} });
  assert.match(renderToStaticMarkup(page.render()), /Review request could not be submitted: already requested/);
  assert.ok(find(page.render(), "form"));
});
