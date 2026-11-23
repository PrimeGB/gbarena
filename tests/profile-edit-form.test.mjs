import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import React from "react";
import ts from "typescript";

const require = createRequire(import.meta.url);

function compile(path, extra = "") {
  return ts.transpileModule(readFileSync(path, "utf8") + extra, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
}

const accountExports = {};
new Function("require", "exports", compile("lib/gamingAccounts.ts"))(require, accountExports);
const source = compile("app/profile/edit/page.tsx", "\nexport { EditProfileForm };\n");

function harness(params, savedSteamGame = null, saveError = null) {
  const states = [];
  let index = 0;
  const react = {
    ...React,
    useState(initial) {
      const position = index++;
      if (!(position in states)) states[position] = typeof initial === "function" ? initial() : initial;
      return [states[position], (next) => {
        states[position] = typeof next === "function" ? next(states[position]) : next;
      }];
    },
    useRef(initial) {
      const position = index++;
      if (!(position in states)) states[position] = { current: initial };
      return states[position];
    },
    useEffect() {},
  };
  const exports = {};
  const mocks = {
    react,
    "next/link": { __esModule: true, default: () => null },
    "next/image": { __esModule: true, default: () => null },
    "next/navigation": { useSearchParams: () => new URLSearchParams(params) },
    "../../../lib/useUser": { useUser: () => ({ user: { id: "player" }, loading: false }) },
    "../../../lib/supabase": { supabase: { from: () => ({ upsert: async () => ({ error: saveError }) }) } },
    "../../../lib/gamingAccounts": accountExports,
    "../../awards/AwardArt": { __esModule: true, default: () => null, AWARD_CSS: "" },
  };
  new Function("require", "exports", source)((name) => mocks[name] || require(name), exports);
  return () => {
    index = 0;
    return exports.EditProfileForm({ savedSteamGame });
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

test("Steam return restores the selected game and account ID while allowing edits", () => {
  const render = harness("platform=pc&steam_id=1234", JSON.stringify({ category: "fighting-games", game: "street-fighter-6" }));
  const input = (tree) => find(tree, (element) => element.type === "input" && element.props.placeholder === "Steam, Battle.net, Epic or EA ID");
  let tree = render();
  assert.equal(input(tree).props.value, "1234");
  assert.ok(find(tree, (element) => element.type === "select" && element.props.value === "street-fighter-6"));
  input(tree).props.onChange({ target: { value: "edited-id" } });
  tree = render();
  assert.equal(input(tree).props.value, "edited-id");
  find(tree, (element) => element.type === "select" && element.props.value === "street-fighter-6")
    .props.onChange({ target: { value: "brawlhalla" } });
  assert.equal(input(render()).props.value, "1234");
});

test("profile save failures are reported rather than presented as saved", async () => {
  const render = harness("", null, { message: "Database unavailable" });
  const originalError = console.error;
  console.error = () => {};
  try {
    find(render(), (element) => element.type === "button" && element.props.children === "Save Changes").props.onClick();
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.ok(find(render(), (element) => element.props?.role === "alert" && element.props.children === "Save failed: Database unavailable"));
  } finally {
    console.error = originalError;
  }
});
