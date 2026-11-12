import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import ts from "typescript";

const require = createRequire(import.meta.url);
function loadModule(path) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const exports = {};
  new Function("require", "exports", compiled)(require, exports);
  return exports;
}

const { getPlayerOptions, getRequiredRosterSize } = loadModule("../lib/matchCreationRoster.ts");
const { rapidRoyalDisplayName, rapidRoyalRules } = loadModule("../lib/rapidRoyal.ts");

test("Rapid Royal offers 2v2 and 3v3 with the correct lineup sizes", () => {
  assert.deepEqual(getPlayerOptions("rapid-royal-duos", false), ["2v2", "3v3"]);
  assert.equal(getRequiredRosterSize("rapid-royal-duos", "2v2"), 2);
  assert.equal(getRequiredRosterSize("rapid-royal-duos", "3v3"), 3);
  assert.deepEqual(getPlayerOptions("duos", false), ["2v2"]);
});

test("legacy names display correctly while the ladder identifier remains usable", () => {
  assert.equal(rapidRoyalDisplayName("rapid-royal-duos"), "Rapid Royal");
  assert.equal(rapidRoyalDisplayName("Rapid Royal Duos Rules"), "Rapid Royal Rules");
  assert.equal(rapidRoyalDisplayName("Duos"), "Duos");
});

test("Rapid Royal distinguishes spectator and stream proof formats", () => {
  assert.match(rapidRoyalRules.duos, /opponent.*spectates/i);
  assert.match(rapidRoyalRules.trios, /each team.*own lobby/i);
  assert.match(rapidRoyalRules.trios, /each team.*stream.*entire run/i);
  assert.match(rapidRoyalRules.trios, /final kill count/i);
  assert.match(rapidRoyalRules.winning, /higher total kills/i);
});
