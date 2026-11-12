import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const require = createRequire(import.meta.url);
const source = readFileSync(new URL("../app/staff/dashboard/page.tsx", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;

function renderDashboard(hash, role = "owner", permissions = ["staff_reports"]) {
  const previousWindow = globalThis.window;
  const listeners = new Set();
  globalThis.window = {
    location: { hash },
    addEventListener: (event, listener) => {
      if (event === "hashchange") listeners.add(listener);
    },
    removeEventListener: (event, listener) => {
      if (event === "hashchange") listeners.delete(listener);
    },
  };
  const user = { id: "owner", email: "owner@example.test" };
  const states = [
    role, permissions, [], { recent_actions: [{ action: "example_action", target_type: "example", actor_username: "Staff", created_at: "2026-01-01", reason: "Example" }] },
    [], true, false, "owner:owner@example.test",
  ];
  let stateIndex = 0;
  let notifications = 0;
  let unsubscribe;
  const mockReact = {
    ...React,
    useState: (initial) => [stateIndex < states.length ? states[stateIndex++] : initial, () => {}],
    useCallback: (callback) => callback,
    useEffect: () => {},
    useSyncExternalStore: (subscribe, getSnapshot) => {
      unsubscribe = subscribe(() => notifications++);
      return getSnapshot();
    },
  };
  const mockRequire = (name) => {
    if (name === "react") return mockReact;
    if (name === "next/link") {
      return { __esModule: true, default: ({ children, ...props }) => React.createElement("a", props, children) };
    }
    if (name.endsWith("/useUser")) return { useUser: () => ({ user, loading: false }) };
    if (name.endsWith("/supabase")) return { supabase: {} };
    if (name.endsWith(".css")) return {};
    return require(name);
  };
  try {
    const exports = {};
    new Function("require", "exports", compiled)(mockRequire, exports);
    const markup = renderToStaticMarkup(React.createElement(exports.default));
    for (const listener of listeners) listener();
    unsubscribe();
    return { markup, notifications, remainingListeners: listeners.size };
  } finally {
    globalThis.window = previousWindow;
  }
}

test("staff work areas use browser history links and restore views from the URL", () => {
  const home = renderDashboard("");
  assert.match(home.markup, /href="#staff-access"/);
  assert.match(home.markup, /href="#reports-inbox"/);
  assert.match(home.markup, /Staff management/);
  assert.match(home.markup, /href="\/staff\/moderation"/);
  assert.match(home.markup, /href="\/staff\/forum-reports"/);
  assert.match(home.markup, /href="\/home"[^>]*>Leave staff area/);
  assert.doesNotMatch(home.markup, /staff-mobile-nav/);
  assert.doesNotMatch(home.markup, /<h3[^>]*>Trusted staff roster<\/h3>/);
  assert.match(home.markup, /href="#staff-audit"/);
  assert.equal(home.notifications, 1);
  assert.equal(home.remainingListeners, 0);

  for (const [hash, heading] of [
    ["#staff-access", "Assign staff access"],
    ["#reports-inbox", "Reports and enforcement inbox"],
    ["#staff-directory", "Trusted staff roster"],
    ["#staff-audit", "Recent staff actions"],
    ["#staff-work-areas", "Staff work areas"],
    ["#unknown", "Staff work areas"],
  ]) {
    const { markup } = renderDashboard(hash);
    assert.match(markup, new RegExp(`<h2[^>]*>${heading}</h2>`));
    if (hash !== "#staff-work-areas" && hash !== "#unknown") {
      assert.match(markup, /href="#staff-work-areas"[^>]*>← Back to work areas/);
    }
  }

  for (const hash of ["#staff-access", "#staff-directory"]) {
    const { markup } = renderDashboard(hash);
    assert.match(markup, /<h2[^>]*>Assign staff access<\/h2>/);
    assert.match(markup, /<h2[^>]*>Trusted staff roster<\/h2>/);
  }
});

test("administrators grant awards directly while other staff can recommend them", () => {
  const owner = renderDashboard("").markup;
  assert.match(owner, /Recommended awards/);
  assert.match(owner, /Review site changes proposed by staff/);
  assert.doesNotMatch(owner, /Recommend an award|Propose site changes for Owner review/);
  const admin = renderDashboard("", "admin", ["awards", "award_recommendation"]).markup;
  assert.match(admin, /Awards management/);
  assert.doesNotMatch(admin, /Recommend an award/);

  for (const role of ["staff", "referee"]) {
    const markup = renderDashboard("", role, ["award_recommendation"]).markup;
    assert.match(markup, /Recommend an award/);
    assert.doesNotMatch(markup, /Awards management/);
  }
});

test("credit management appears for administrators only when granted", () => {
  const permissions = ["awards", "award_recommendation"];
  assert.doesNotMatch(renderDashboard("", "admin", permissions).markup, /<h3[^>]*>Credits<\/h3>/);
  assert.match(renderDashboard("", "admin", [...permissions, "credit_management"]).markup, /<h3[^>]*>Credits<\/h3>/);
});

test("forum reports return to the staff dashboard", () => {
  const forumReports = readFileSync(new URL("../app/staff/forum-reports/page.tsx", import.meta.url), "utf8");
  assert.match(forumReports, /href="\/staff\/dashboard"[^>]*>Back to staff dashboard/);
});
