import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const require = createRequire(import.meta.url);
const source = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "app", "components", "TeamDisbandDialog.tsx"), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;

function harness(result) {
  const states = [];
  let index = 0;
  let requests = 0;
  let closed = 0;
  let done = 0;
  const dialog = { open: false, showModal() { this.open = true; }, close() { this.open = false; closed++; } };
  const react = {
    useState(initial) {
      const position = index++;
      if (!(position in states)) states[position] = initial;
      return [states[position], (next) => { states[position] = next; }];
    },
    useRef(initial) {
      const position = index++;
      if (!(position in states)) states[position] = { current: position === 0 ? dialog : initial };
      return states[position];
    },
    useEffect() {},
  };
  const jsx = (type, props) => ({ type, props: props || {} });
  const exports = {};
  const mockRequire = (name) => {
    if (name === "react") return react;
    if (name === "react/jsx-runtime") return { jsx, jsxs: jsx, Fragment: "fragment" };
    if (name.endsWith("/supabase")) return { supabase: { rpc(name, args) {
      requests++;
      assert.equal(name, "gb_disband_team");
      assert.deepEqual(args, { p_team_id: "team-1" });
      return result;
    } } };
    return require(name);
  };
  new Function("require", "exports", compiled)(mockRequire, exports);
  function render() {
    index = 0;
    return exports.default({ teamId: "team-1", teamName: "Example", onClose() {}, onDone() { done++; } });
  }
  function find(tree, predicate) {
    if (!tree || typeof tree !== "object") return null;
    if (predicate(tree)) return tree;
    const children = tree.props?.children;
    for (const child of Array.isArray(children) ? children : [children]) {
      const found = find(child, predicate);
      if (found) return found;
    }
    return null;
  }
  function button(tree, label) {
    const found = find(tree, (node) => node.type === "button" && node.props.children === label);
    assert.ok(found, `Missing ${label} button`);
    return found;
  }
  return { render, find, button, requests: () => requests, closed: () => closed, done: () => done };
}

test("cancel closes without deleting", () => {
  const page = harness(Promise.resolve({ error: null }));
  page.button(page.render(), "Cancel").props.onClick();
  assert.equal(page.closed(), 1);
  assert.equal(page.requests(), 0);
});

test("successful confirmation waits for OK before redirecting and prevents duplicate requests", async () => {
  let resolve;
  const page = harness(new Promise((done) => { resolve = done; }));
  const confirm = page.button(page.render(), "Yes, Disband Team").props.onClick;
  const pending = confirm();
  await confirm();
  assert.equal(page.requests(), 1);
  assert.equal(page.button(page.render(), "Disbanding...").props.disabled, true);
  assert.equal(page.done(), 0);
  resolve({ error: null });
  await pending;
  const success = page.render();
  assert.ok(page.find(success, (node) => node.props?.children === "This team has been successfully disbanded."));
  assert.equal(page.done(), 0);
  page.button(success, "OK").props.onClick();
  assert.equal(page.done(), 1);
});

test("disband errors remain visible and do not redirect", async () => {
  const page = harness(Promise.resolve({ error: { message: "Roster is locked by an active match." } }));
  await page.button(page.render(), "Yes, Disband Team").props.onClick();
  const failure = page.render();
  const alert = page.find(failure, (node) => node.props?.role === "alert");
  assert.ok(alert);
  assert.match(alert.props.children.join(""), /Roster is locked/);
  assert.equal(page.done(), 0);
  assert.equal(page.button(failure, "Yes, Disband Team").props.disabled, false);
});
