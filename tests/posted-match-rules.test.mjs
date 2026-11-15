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

test("BF6 Solos uses ladder-specific timed rules without changing other Battlefield ladders", () => {
  const catalog = loadModule("../lib/ladderCatalog.ts", { "./gamingAccounts": { gamingCategories: [], gamingGames: [] } });
  assert.deepEqual(catalog.laddersForGame("battlefield", "battlefield-6").map((ladder) => ladder.slug),
    ["singles", "rapid-royal-duos", "redsec"]);
  const solos = gameRules.getGameRules("battlefield", "battlefield-6", "singles");
  assert.deepEqual(solos.teamSizes, ["1v1"]);
  assert.deepEqual(solos.modes.map((mode) => mode.value), ["Team Deathmatch"]);
  assert.deepEqual(solos.modes[0].fields.find((field) => field.slot === "round_length").options, ["10 Minutes"]);
  assert.deepEqual(solos.modes[0].fields.find((field) => field.slot === "score_limit").options, ["Time Limit Only"]);
  assert.ok(gameRules.getGameRules("battlefield", "battlefield-6", "rapid-royal-duos").modes.some((mode) => mode.value === "Conquest"));
  assert.ok(gameRules.getGameRules("battlefield", "battlefield-2042", "singles").modes.length > 1);
  assert.deepEqual(postedRuleSettings({
    category: "battlefield", game: "battlefield-6", ladder: "singles", game_mode: "Team Deathmatch",
    score_limit: "Time Limit Only", round_length: "10 Minutes", killstreaks: "Infantry Only",
    additional_rules: { settings: { "Map Selection": "Empire State", Tiebreak: "Next Kill Wins", "AI Soldiers": "Off" }, restrictions: [] },
  }), [
    { label: "Time Limit", value: "10 Minutes" },
    { label: "Kill Limit", value: "Time Limit Only" },
    { label: "Vehicles", value: "Infantry Only" },
    { label: "Map Selection", value: "Empire State" },
    { label: "Tiebreak", value: "Next Kill Wins" },
    { label: "AI Soldiers", value: "Off" },
  ]);
});
