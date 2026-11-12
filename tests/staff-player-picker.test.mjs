import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const require = createRequire(import.meta.url);
const compiled = ts.transpileModule(readFileSync("app/staff/dashboard/StaffPlayerPicker.tsx", "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;

function harness() {
  const states = [];
  const effects = [];
  const requests = [];
  let index = 0;
  let value = "";
  const react = {
    useId: () => "players",
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
      if (!previous || deps.some((item, i) => item !== previous.deps[i])) {
        previous?.cleanup?.();
        effects[position] = { deps, cleanup: fn() };
      }
    },
  };
  const supabase = { from() {
    const query = {
      select() { return query; },
      ilike(column, term) { query.term = term; return query; },
      order() { return query; },
      limit() { return new Promise((resolve) => requests.push({ term: query.term, resolve })); },
    };
    return query;
  } };
  const exports = {};
  new Function("require", "exports", compiled)((name) => {
    if (name === "react") return react;
    if (name.endsWith("/supabase")) return { supabase };
    return require(name);
  }, exports);
  return {
    requests,
    get value() { return value; },
    render() { index = 0; return exports.default({ value, onChange(next) { value = next; } }); },
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

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

test("typing finds players and keyboard selection fills the username", async () => {
  const picker = harness();
  let view = picker.render();
  find(view, (el) => el.type === "input").props.onChange({ target: { value: "Pri" } });
  picker.render();
  await wait(220);
  assert.equal(picker.requests[0].term, "%Pri%");
  picker.requests[0].resolve({ data: [{ id: "1", username: "Prime" }], error: null });
  await wait(0);
  view = picker.render();
  assert.match(renderToStaticMarkup(view), /Prime/);
  find(view, (el) => el.type === "input").props.onKeyDown({ key: "ArrowDown", preventDefault() {} });
  view = picker.render();
  find(view, (el) => el.type === "input").props.onKeyDown({ key: "Enter", preventDefault() {} });
  assert.equal(picker.value, "Prime");
  assert.doesNotMatch(renderToStaticMarkup(picker.render()), /role="listbox"/);
});

test("stale results are ignored and search failures are visible", async () => {
  const picker = harness();
  let view = picker.render();
  find(view, (el) => el.type === "input").props.onChange({ target: { value: "old" } });
  picker.render();
  await wait(220);
  view = picker.render();
  find(view, (el) => el.type === "input").props.onChange({ target: { value: "new" } });
  picker.render();
  await wait(220);
  picker.requests[1].resolve({ data: null, error: { message: "offline" } });
  picker.requests[0].resolve({ data: [{ id: "1", username: "Old" }], error: null });
  await wait(0);
  const markup = renderToStaticMarkup(picker.render());
  assert.match(markup, /Player search failed: offline/);
  assert.doesNotMatch(markup, />Old</);
});
