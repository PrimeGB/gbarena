import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import ts from "typescript";

function loadStandings(supabase) {
  const source = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "lib", "ladderStandings.ts"), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const exports = {};
  new Function("require", "exports", compiled)((name) => {
    assert.equal(name, "./supabase");
    return { supabase };
  }, exports);
  return exports;
}

test("all-system standings rank teams separately and deterministically", () => {
  const { systemRankings } = loadStandings({});
  const team = (id, platform, rating, wins = 1) => ({
    id, platform, rating_points: rating, wins, losses: 0, created_at: "2026-01-01",
  });
  const teams = [
    team("x2", "xbox", 120), team("p2", "pc", 110),
    team("x1", "xbox", 180), team("p1", "pc", 150),
    team("p3", "pc", 110, 2),
  ];
  assert.deepEqual(systemRankings(teams).map(({ id, systemRank }) => [id, systemRank]), [
    ["p1", 1], ["p3", 2], ["p2", 3], ["x1", 1], ["x2", 2],
  ]);
  assert.deepEqual(teams.map(({ id }) => id), ["x2", "p2", "x1", "p1", "p3"]);
});

test("individual team rankings query only the team's own system and format", async () => {
  const filters = [];
  const rows = [
    { id: "b", platform: "xbox", rating_points: 110, wins: 1, losses: 1, created_at: "2026-01-01" },
    { id: "a", platform: "xbox", rating_points: 130, wins: 2, losses: 0, created_at: "2026-01-01" },
  ];
  const query = {
    select() { return this; },
    eq(field, value) { filters.push([field, value]); return this; },
    or(value) { filters.push(["or", value]); return Promise.resolve({ data: rows, error: null }); },
  };
  const { rankedLadderTeams } = loadStandings({ from(table) { assert.equal(table, "teams"); return query; } });
  const result = await rankedLadderTeams("call-of-duty", "modern-warfare-4", "singles", "xbox");
  assert.deepEqual(result.map(({ id }) => id), ["a", "b"]);
  assert.deepEqual(filters, [
    ["platform", "xbox"], ["category", "call-of-duty"], ["game", "modern-warfare-4"],
    ["ladder", "singles"], ["or", "wins.gt.0,losses.gt.0"],
  ]);
});
