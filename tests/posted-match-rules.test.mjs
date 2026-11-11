import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import ts from "typescript";

const require = createRequire(import.meta.url);
function loadModule(path, dependencies = {}) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const exports = {};
  new Function("require", "exports", compiled)((name) => dependencies[name] || require(name), exports);
  return exports;
}

const gameRules = loadModule("../lib/matchRules.ts");
const { postedRuleSettings } = loadModule("../lib/postedMatchRules.ts", { "./matchRules": gameRules });

test("custom settings and named item rules appear alongside stored settings", () => {
  const settings = postedRuleSettings({
    category: "call-of-duty",
    game: "mw2",
    game_mode: "Search and Destroy",
    perks: "On",
    bomb_timer: "45 Seconds",
    additional_rules: {
      settings: { "Time Limit": "5 Minutes", "Lives": "1 Life" },
      restrictions: [
        { category: "Equipment", item: "C4", status: "Banned" },
        { category: "Perk", item: "Cold-Blooded", status: "Allowed" },
      ],
    },
  });
  assert.deepEqual(settings, [
    { label: "Perks", value: "On" },
    { label: "Bomb Timer", value: "45 Seconds" },
    { label: "Time Limit", value: "5 Minutes" },
    { label: "Lives", value: "1 Life" },
    { label: "Equipment: C4", value: "Banned" },
    { label: "Perk: Cold-Blooded", value: "Allowed" },
  ]);
});

test("legacy posts do not fabricate unrecorded equipment rules", () => {
  assert.deepEqual(postedRuleSettings({ perks: "Off", additional_rules: null }), [
    { label: "Perks", value: "Off" },
  ]);
});

test("non-COD games use their configured field labels", () => {
  const config = gameRules.getGameRules("rocket-league", "rocket-league");
  assert.ok(config);
  const mode = config.modes[0];
  const field = mode.fields[0];
  assert.deepEqual(postedRuleSettings({
    category: "rocket-league",
    game: "rocket-league",
    game_mode: mode.value,
    [field.slot]: "Test value",
  }), [{ label: field.label, value: "Test value" }]);
});
