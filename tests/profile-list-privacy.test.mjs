import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const require = createRequire(import.meta.url);
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

function harness(path, list, target, visibility) {
  const states = [];
  const effects = [];
  const calls = [];
  let index = 0;
  const react = {
    ...React,
    useState(initial) {
      const position = index++;
      if (!(position in states)) states[position] = typeof initial === "function" ? initial() : initial;
      return [states[position], (next) => { states[position] = typeof next === "function" ? next(states[position]) : next; }];
    },
    useCallback(fn) { return fn; },
    useEffect(fn, deps) {
      const position = index++;
      const previous = effects[position];
      if (!previous || deps.some((value, i) => value !== previous.deps[i])) {
        previous?.cleanup?.();
        effects[position] = { deps, cleanup: fn() };
      }
    },
  };
  const supabase = {
    from(table) {
      const builder = {
        select() { return builder; },
        eq() { return builder; },
        maybeSingle: async () => ({ data: { username: "Player" }, error: null }),
        order: async () => ({ data: [], error: null }),
      };
      calls.push(table);
      return builder;
    },
    async rpc(name) {
      calls.push(name);
      if (name === "gb_profile_friends") return { data: { username: "Player", private: false, friends: [] }, error: null };
      return { data: [], error: null };
    },
  };
  const compiled = ts.transpileModule(readFileSync(path, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const exports = {};
  new Function("require", "exports", compiled)((name) => {
    if (name === "react") return react;
    if (name === "next/link") return { __esModule: true, default: ({ children, ...props }) => React.createElement("a", props, children) };
    if (name === "next/navigation") return { useSearchParams: () => new URLSearchParams(target ? `userId=${target}` : "") };
    if (name.endsWith("/useUser")) return { useUser: () => ({ user: { id: "me" }, loading: false }) };
    if (name.endsWith("/supabase")) return { supabase };
    if (name.endsWith("/profileListVisibility")) return { getProfileListVisibility: async () => {
      if (visibility === "error") throw new Error("visibility unavailable");
      return { awards: list === "awards" ? visibility : true, friends: list === "friends" ? visibility : true, teams: true };
    } };
    if (name.endsWith("/AwardArt")) return { __esModule: true, default: () => null, AWARD_CSS: "", awardAccent: () => "" };
    if (name.endsWith("/AwardDetailsDialog") || name.endsWith("/SeasonHonours")) return { __esModule: true, default: () => null };
    return require(name);
  }, exports);
  return {
    calls,
    render() { index = 0; const child = exports.default().props.children; return child.type(); },
  };
}

for (const [list, path, rpc] of [
  ["awards", "app/profile/awards/page.tsx", "staff_player_award_history"],
  ["friends", "app/profile/friends/page.tsx", "gb_profile_friends"],
]) {
  test(`locked ${list} pages stop before loading the full list`, async () => {
    const page = harness(path, list, "other", false);
    page.render();
    await flush();
    assert.match(renderToStaticMarkup(page.render()), /private/);
    assert.equal(page.calls.includes(rpc), false);
  });
  test(`${list} visibility errors fail closed`, async () => {
    const page = harness(path, list, "other", "error");
    page.render();
    await flush();
    assert.match(renderToStaticMarkup(page.render()), /visibility could not be loaded: visibility unavailable/i);
    assert.equal(page.calls.includes(rpc), false);
  });
}
