import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import ts from "typescript";
const require = createRequire(import.meta.url);
const compiled = ts.transpileModule(readFileSync("lib/seasonCompetition.ts", "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const exports = {};
new Function("require", "exports", compiled)(require, exports);
const { seasonBoardHref, seasonPreviewHonours, competitionActivityLabel } = exports;

test("archive drilldowns preserve season, competitor type and category", () => {
  const url = new URL(seasonBoardHref("season-id", "teams", "ladder:game:team"), "https://example.test");
  assert.equal(url.searchParams.get("board"), "season");
  assert.equal(url.searchParams.get("season"), "season-id");
  assert.equal(url.searchParams.get("kind"), "teams");
  assert.equal(url.searchParams.get("scope"), "ladder:game:team");
});
test("empty Hall of Fame previews use only clearly fictional competitors and example IDs", () => {
  for (const kind of ["teams", "players"]) {
    const rows = seasonPreviewHonours("Example Season", kind);
    assert.ok(rows.some(row => row.honour === "champion"));
    assert.ok(rows.some(row => row.honour === "top10"));
    assert.ok(rows.some(row => row.honour === "undefeated"));
    assert.ok(rows.every(row => row.name.startsWith("Example") && row.id.startsWith("preview-") && row.kind === kind));
  }
});
test("all new feed moments have meaningful labels instead of a generic update label", () => {
  for (const kind of ["friend", "rank", "rival", "tournament", "season"]) {
    assert.notEqual(competitionActivityLabel(kind), "Community update");
  }
});
