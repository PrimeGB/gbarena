import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { test } from "node:test";
import ts from "typescript";

const require = createRequire(import.meta.url);

function loadModule(path, dependencies = {}) {
  const source = require("node:fs").readFileSync(new URL(path, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const exports = {};
  new Function("require", "exports", compiled)(
    (name) => dependencies[name] || require(name),
    exports,
  );
  return exports;
}

const accounts = loadModule("../lib/gamingAccounts.ts");
const catalog = loadModule("../lib/ladderCatalog.ts", { "./gamingAccounts": accounts });
const rules = loadModule("../lib/matchRules.ts");
const roster = loadModule("../lib/matchCreationRoster.ts");

const gameCases = [
  ["fighting-games", "street-fighter-6", "singles", "Street Fighter 6 Ranked", "Solo"],
  ["fighting-games", "brawlhalla", "duos", "Brawlhalla 2v2", "Duos"],
  ["fighting-games", "tekken-8", "singles", "Tekken 8 Ranked", "Solo"],
  ["fighting-games", "mortal-kombat-1", "singles", "Mortal Kombat 1 Ranked", "Solo"],
  ["fighting-games", "super-smash-bros-ultimate", "singles", "Smash Ultimate 1v1", "Solo"],
  ["sports-games", "ea-sports-fc-27", "team", "FC 27 Clubs", "Clubs"],
  ["sports-games", "nba-2k27", "team-3v3", "NBA 2K27 3v3", "3v3"],
  ["sports-games", "efootball", "co-op-3v3", "eFootball Co-op 3v3", "Co-op 3v3"],
  ["tactical-shooters", "counter-strike-2", "team", "Counter-Strike 2 5v5", "5v5 Competitive"],
  ["tactical-shooters", "valorant", "team", "VALORANT 5v5", "5v5 Competitive"],
  ["hero-shooters", "marvel-rivals", "team-6v6", "Marvel Rivals 6v6", "6v6 Competitive"],
  ["hero-shooters", "overwatch-2", "team-5v5", "Overwatch 2 5v5", "5v5 Competitive"],
  ["strategy-games", "chess", "singles", "Chess Blitz", "Solo"],
  ["fortnite", "box-fights", "singles", "Box Fights", "Box Fights 1v1"],
];

test("new games expose their dedicated ladders and matching match rules", () => {
  for (const [category, game, ladder, mode, title] of gameCases) {
    assert.ok(
      catalog.laddersForGame(category, game).some((item) => item.slug === ladder && item.title === title),
      `${category}/${game} should expose ${title}`,
    );
    const config = rules.getGameRules(category, game, ladder);
    assert.ok(config, `${category}/${game}/${ladder} should have match settings`);
    assert.ok(config.modes.some((item) => item.value === mode));
    if (category !== "strategy-games") assert.deepEqual(config.modes.map((item) => item.value), [mode]);
  }
});

test("custom team ladders lock match roster sizes to their format", () => {
  assert.deepEqual(roster.getPlayerOptions("team-3v3", false, ["3v3", "5v5"]), ["3v3"]);
  assert.deepEqual(roster.getPlayerOptions("team-5v5", false, ["3v3", "5v5"]), ["5v5"]);
  assert.deepEqual(roster.getPlayerOptions("team-6v6", false, ["5v5", "6v6"]), ["6v6"]);
  assert.deepEqual(roster.getPlayerOptions("co-op-2v2", false, ["2v2", "3v3"]), ["2v2"]);
  assert.deepEqual(roster.getPlayerOptions("co-op-3v3", false, ["2v2", "3v3"]), ["3v3"]);
  assert.deepEqual(roster.getPlayerOptions("team", false, ["3v3", "5v5"]), ["3v3", "5v5"]);
});

test("game choices honor platform availability in ladder and account selectors", () => {
  assert.ok(catalog.gamesForCategory("fighting-games", "nintendo").some((game) => game.value === "super-smash-bros-ultimate"));
  assert.ok(catalog.gamesForCategory("fighting-games", "nintendo").some((game) => game.value === "street-fighter-6"));
  assert.ok(!catalog.gamesForCategory("fighting-games", "nintendo").some((game) => game.value === "tekken-8"));
  assert.ok(catalog.gamesForCategory("tactical-shooters", "pc").some((game) => game.value === "counter-strike-2"));
  assert.ok(!catalog.gamesForCategory("tactical-shooters", "xbox").some((game) => game.value === "counter-strike-2"));
  assert.ok(accounts.gamingGamesForPlatform("mobile").some((game) => game.value === "efootball"));
  assert.ok(!accounts.gamingGamesForPlatform("mobile").some((game) => game.value === "nba-2k27"));
  assert.ok(accounts.gamingGamesForPlatform("ea").some((game) => game.value === "ea-sports-fc-27"));
  assert.ok(!accounts.gamingGamesForPlatform("ea").some((game) => game.value === "valorant"));
});

test("the new game showcase has artwork for every tile", () => {
  assert.ok(catalog.featuredGameArtwork.length >= 6);
  assert.ok(catalog.featuredGameArtwork.every((game) => game.image), "showcase tiles must resolve to artwork");
});
