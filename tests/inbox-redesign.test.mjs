import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const require = createRequire(import.meta.url);
const source = readFileSync("app/profile/inbox/page.tsx", "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020 },
}).outputText;

function harness({ preview = false, inboxError = null, actionError = null } = {}) {
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
  const incoming = [
    { id: "1", sender_id: "alex", recipient_id: "me", sender_type: "player", subject: "First", body: "First body", is_read: false, is_saved: false, created_at: new Date().toISOString() },
    { id: "2", sender_id: "jordan", recipient_id: "me", sender_type: "staff", subject: "Second", body: "Second body", is_read: true, is_saved: false, created_at: new Date().toISOString() },
  ];
  const outgoing = [{ ...incoming[0], id: "3", sender_id: "me", recipient_id: "alex", subject: "Sent subject", is_archived: true }];
  let finishRead;
  const readPending = new Promise((resolve) => { finishRead = resolve; });
  const supabase = {
    rpc(method, args) {
      calls.push({ method, args });
      return Promise.resolve({ data: { saved: args.p_saved, removed: false }, error: actionError });
    },
    from(table) {
      const query = { table, filters: {}, action: "select" };
      const builder = {
        select() { return builder; },
        update(values) { query.action = "update"; query.values = values; return builder; },
        insert(values) { query.action = "insert"; query.values = values; return builder; },
        eq(key, value) { query.filters[key] = value; return builder; },
        ilike(key, value) { query.filters[key] = value; return builder; },
        in() { return builder; },
        order() { return builder; },
        maybeSingle() { calls.push(query); return Promise.resolve({ data: { id: "alex", username: "Alex" }, error: null }); },
        single() { calls.push(query); return Promise.resolve({ data: { ...query.values, id: "saved-reply", created_at: "2026-01-03T00:00:00Z" }, error: null }); },
        then(resolve, reject) {
          calls.push(query);
          let result;
          if (table === "profiles") result = Promise.resolve({ data: [{ id: "alex", username: "Alex" }, { id: "jordan", username: "Jordan" }], error: null });
          else if (query.action === "update") result = readPending;
          else if (query.action === "insert") result = Promise.resolve({ error: null });
          else if (query.filters.recipient_id) result = Promise.resolve({ data: inboxError ? null : incoming, error: inboxError });
          else result = Promise.resolve({ data: outgoing, error: null });
          return result.then(resolve, reject);
        },
      };
      return builder;
    },
  };
  const exports = {};
  new Function("require", "exports", compiled)((name) => {
    if (name === "react") return react;
    if (name === "next/link") return { __esModule: true, default: ({ children, ...props }) => React.createElement("a", props, children) };
    if (name.endsWith("/useUser")) return { useUser: () => ({ user: preview ? null : { id: "me" }, loading: false }) };
    if (name.endsWith("/supabase")) return { supabase };
    if (name.endsWith("/CompactTopBar")) return { __esModule: true, default: () => React.createElement("nav", null, "Quick links") };
    if (name.endsWith(".css")) return {};
    return require(name);
  }, exports);
  return { calls, finishRead, render() { index = 0; return exports.default(); } };
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

const button = (view, text) => find(view, (element) => element.type === "button" && renderToStaticMarkup(element).includes(text));
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

test("inbox names, folders, and delayed read updates keep the selected message", async () => {
  const page = harness();
  page.render();
  await flush();
  let view = page.render();
  assert.match(renderToStaticMarkup(view), /From: Alex/);
  assert.match(renderToStaticMarkup(view), /From: Jordan \(Staff\)/);
  const pending = button(view, "First body").props.onClick();
  button(page.render(), "Second body").props.onClick();
  page.finishRead({ error: null });
  await pending;
  view = page.render();
  assert.match(renderToStaticMarkup(find(view, (element) => element.type === "h2")), /Second/);
  button(view, "Sent").props.onClick();
  view = page.render();
  assert.match(renderToStaticMarkup(view), /To: Alex/);
  assert.match(renderToStaticMarkup(view), /Sent subject/);
  assert.equal(page.calls.find((call) => call.filters?.sender_id === "me").filters.is_archived, undefined);
});

test("reply sends the selected message and displays the saved reply in Sent", async () => {
  const page = harness();
  page.render();
  await flush();
  button(page.render(), "Second body").props.onClick();
  button(page.render(), "Reply").props.onClick();
  find(page.render(), (element) => element.type === "textarea").props.onChange({ target: { value: "Thanks!" } });
  await button(page.render(), "Send Reply").props.onClick();
  assert.deepEqual(page.calls.find((call) => call.action === "insert").values.subject, "Re: Second");
  button(page.render(), "Sent").props.onClick();
  assert.match(renderToStaticMarkup(page.render()), /Thanks!/);
});

test("composing sends to the resolved player and opens Sent", async () => {
  const page = harness();
  page.render();
  await flush();
  button(page.render(), "New message").props.onClick();
  let view = page.render();
  find(view, (element) => element.props?.placeholder === "Enter the recipient's username").props.onChange({ target: { value: "Alex" } });
  find(view, (element) => element.props?.placeholder === "Message subject").props.onChange({ target: { value: "Hello" } });
  find(view, (element) => element.props?.placeholder === "Write your message...").props.onChange({ target: { value: "Good game!" } });
  view = page.render();
  find(view, (element) => element.type === "form").props.onSubmit({ preventDefault() {} });
  await flush();
  const sent = page.calls.find((call) => call.action === "insert");
  assert.equal(sent.values.recipient_id, "alex");
  assert.equal(sent.values.body, "Good game!");
  assert.match(renderToStaticMarkup(page.render()), /Message sent\./);
  assert.equal(button(page.render(), "Sent").props["aria-pressed"], true);
});

test("saved messages can be found and read messages deleted without changing sent messages", async () => {
  const page = harness();
  page.render();
  await flush();
  button(page.render(), "Second body").props.onClick();
  button(page.render(), "Save message").props.onClick();
  await flush();
  assert.deepEqual(page.calls.find((call) => call.method === "gb_save_inbox_message").args, { p_message_id: "2", p_saved: true });
  button(page.render(), "Saved").props.onClick();
  let view = page.render();
  assert.match(renderToStaticMarkup(view), /Second body/);
  assert.doesNotMatch(renderToStaticMarkup(find(view, (element) => element.props?.className === "message-list")), /First body/);
  button(view, "Second body").props.onClick();
  const previousWindow = globalThis.window;
  globalThis.window = { confirm: () => true };
  try {
    button(page.render(), "Delete message").props.onClick();
    await flush();
  } finally {
    globalThis.window = previousWindow;
  }
  assert.equal(page.calls.find((call) => call.method === "gb_delete_inbox_message").args.p_message_id, "2");
  assert.match(renderToStaticMarkup(page.render()), /No saved messages yet/);
  button(page.render(), "Sent").props.onClick();
  assert.match(renderToStaticMarkup(page.render()), /Sent subject/);
});

test("delayed read updates do not undo a saved message", async () => {
  const page = harness();
  page.render();
  await flush();
  const pending = button(page.render(), "First body").props.onClick();
  button(page.render(), "Save message").props.onClick();
  await flush();
  page.finishRead({ error: null });
  await pending;
  assert.ok(button(page.render(), "Unsave message"));
  button(page.render(), "Saved").props.onClick();
  assert.match(renderToStaticMarkup(page.render()), /First body/);
});

test("unread messages cannot be deleted and deletion failures stay visible", async () => {
  const page = harness({ actionError: { message: "offline" } });
  page.render();
  await flush();
  const pending = button(page.render(), "First body").props.onClick();
  assert.equal(button(page.render(), "Delete message").props.disabled, true);
  page.finishRead({ error: null });
  await pending;
  const previousWindow = globalThis.window;
  globalThis.window = { confirm: () => true };
  try {
    button(page.render(), "Delete message").props.onClick();
    await flush();
  } finally {
    globalThis.window = previousWindow;
  }
  assert.match(renderToStaticMarkup(page.render()), /Message could not be deleted: offline/);
  assert.match(renderToStaticMarkup(page.render()), /First body/);
});

test("load errors are visible and sample mode never accesses the database", async () => {
  const broken = harness({ inboxError: { message: "offline" } });
  broken.render();
  await flush();
  assert.match(renderToStaticMarkup(broken.render()), /Messages could not be loaded: offline/);
  const preview = harness({ preview: true });
  preview.render();
  let view = preview.render();
  button(view, "Great games").props.onClick();
  button(preview.render(), "Reply").props.onClick();
  find(preview.render(), (element) => element.type === "textarea").props.onChange({ target: { value: "Hello" } });
  await button(preview.render(), "Send Reply").props.onClick();
  assert.match(renderToStaticMarkup(preview.render()), /Preview only: no reply was sent/);
  button(preview.render(), "New message").props.onClick();
  view = preview.render();
  find(view, (element) => element.type === "form").props.onSubmit({ preventDefault() {} });
  assert.match(renderToStaticMarkup(preview.render()), /Preview only: no message was sent/);
  assert.deepEqual(preview.calls, []);
});
