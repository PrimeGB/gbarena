import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import ts from "typescript";

const require = createRequire(import.meta.url);
const source = readFileSync(new URL("../lib/matchAcceptanceRoster.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
const roster = {};
new Function("require", "exports", compiled)(require, roster);

test("selects the sole eligible player for a 1v1 without selecting insufficient rosters", () => {
  assert.deepEqual(roster.initialAcceptanceRoster(["one"], 1), ["one"]);
  assert.deepEqual(roster.initialAcceptanceRoster([], 1), []);
  assert.deepEqual(roster.initialAcceptanceRoster(["one", "two"], 1), []);
  assert.deepEqual(roster.initialAcceptanceRoster(["one"], 2), []);
});

test("players can choose a 1v1 player or a correctly sized team lineup", () => {
  assert.deepEqual(roster.toggleAcceptancePlayer(["one"], "two", 1), ["two"]);
  assert.deepEqual(roster.toggleAcceptancePlayer(["one"], "two", 2), ["one", "two"]);
  assert.deepEqual(roster.toggleAcceptancePlayer(["one", "two"], "three", 2), ["one", "two"]);
  assert.deepEqual(roster.toggleAcceptancePlayer(["one", "two"], "one", 2), ["two"]);
});

test("a 3v3 lineup accepts exactly three selected players", () => {
  let selected = [];
  for (const player of ["one", "two", "three", "four"]) {
    selected = roster.toggleAcceptancePlayer(selected, player, 3);
  }
  assert.deepEqual(selected, ["one", "two", "three"]);
  assert.deepEqual(roster.toggleAcceptancePlayer(selected, "two", 3), ["one", "three"]);
});

test("confirmation has no checkboxes and displays acceptance errors", () => {
  const page = readFileSync(new URL("../app/matches/finder/page.tsx", import.meta.url), "utf8");
  const confirmation = page.slice(page.indexOf("{confirmMatch && ("), page.indexOf("{viewMatch && ("));
  assert.doesNotMatch(confirmation, /type="checkbox"/);
  assert.match(confirmation, /aria-pressed=\{selected\}/);
  assert.match(confirmation, /role="alert"/);
  assert.doesNotMatch(confirmation, /confirmCompatibility/);
});
