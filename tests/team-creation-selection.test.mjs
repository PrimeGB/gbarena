import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const require = createRequire(import.meta.url);

function load(path, mocks = {}) {
  const source = readFileSync(path, "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const exports = {};
  new Function("require", "exports", compiled)((name) => mocks[name] || require(name), exports);
  return exports;
}

const accounts = load("lib/gamingAccounts.ts");
const catalog = load("lib/ladderCatalog.ts", { "./gamingAccounts": accounts });

function renderSelection(platform, game, ladder, user = null, availability = null, loading = false) {
  const state = ["", "", "", false, platform, game, ladder, availability, 0];
  const Page = load("app/teams/create/page.tsx", {
    react: { ...React, useState: () => [state.shift(), () => {}] },
    "next/link": { __esModule: true, default: ({ children, ...props }) => React.createElement("a", props, children) },
    "next/navigation": { useRouter: () => ({}), useSearchParams: () => new URLSearchParams() },
    "../../../lib/supabase": { supabase: {} },
    "../../../lib/useUser": { useUser: () => ({ user, loading }) },
    "../../../lib/gamingAccounts": accounts,
    "../../../lib/ladderCatalog": catalog,
    "../../../lib/rapidRoyal": { rapidRoyalDisplayName: (value) => value },
  }).default;
  return renderToStaticMarkup(React.createElement(Page));
}

test("a system and ladder select the correct existing team setup route", () => {
  const html = renderSelection("pc", "battlefield/battlefield-6", "singles");
  assert.match(html, />Solos<\/button>/);
  assert.match(html, />Rapid Royal<\/button>/);
  assert.doesNotMatch(html, /Solo TDM|<input|<select/);
  assert.match(html, /href="\/team-hub\?platform=pc&amp;category=battlefield&amp;game=battlefield-6&amp;ladder=singles"/);
  assert.doesNotMatch(html, /Game Category|Game \/ Mode/);
});

test("games are restricted to the selected system and require a ladder to continue", () => {
  const mobile = renderSelection("mobile", "", "");
  assert.match(mobile, /Clash Royale/);
  assert.doesNotMatch(mobile, /Battlefield 6/);
  assert.doesNotMatch(mobile, /href="\/team-hub\?/);
  const gameOnly = renderSelection("pc", "battlefield/battlefield-6", "");
  assert.match(gameOnly, />Solos<\/button>/);
  assert.doesNotMatch(gameOnly, /href="\/team-hub\?/);
});

test("an existing team or an unavailable team check prevents continuation", () => {
  const user = { id: "player" };
  const key = "player/pc/battlefield/battlefield-6/singles";
  const existing = renderSelection("pc", "battlefield/battlefield-6", "singles", user, {
    key, team: { id: "team-1", name: "Existing Team" },
  });
  assert.match(existing, /href="\/teams\/team-1">Existing Team/);
  assert.doesNotMatch(existing, /href="\/team-hub\?/);
  const error = renderSelection("pc", "battlefield/battlefield-6", "singles", user, {
    key, error: "Connection failed",
  });
  assert.match(error, /Could not check your teams: Connection failed/);
  assert.doesNotMatch(error, /href="\/team-hub\?/);
});
