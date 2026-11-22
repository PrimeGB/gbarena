import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
const require = createRequire(import.meta.url);
const compiled = ts.transpileModule(readFileSync("lib/seasonCompetition.ts", "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const exports = {};
new Function("require", "exports", compiled)(require, exports);
const { seasonBoardHref, seasonPreviewHonours, competitionActivityLabel, groupSeasonChampions, latestGlobalTeamChampions } = exports;

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

test("champions combine category titles without merging teams, players or seasons", () => {
  const [champion, top10] = seasonPreviewHonours("Example Season", "players");
  const category = { ...champion, id: "category", scope: "game:mw2", scope_label: "MW2" };
  const global = { ...champion, id: "global", entity_id: "same-id" };
  const groups = groupSeasonChampions([
    { ...category, entity_id: "same-id" }, global, { ...category, entity_id: "same-id" },
    { ...global, id: "team", kind: "teams" }, { ...global, id: "older", season_id: "older" }, top10,
  ]);
  assert.equal(groups.length, 3);
  const player = groups.find(group => group.honour.kind === "players" && group.honour.season_id === "preview");
  assert.equal(player.honour.id, "global");
  assert.deepEqual(player.categories.map(category => category.scope), ["game:mw2", "global"]);
});

test("the awards hall selects the latest global team champions including ties", () => {
  const [champion, top10] = seasonPreviewHonours("Example Season", "teams");
  const rows = [
    { ...champion, kind: "players", name: "Player" },
    { ...champion, scope: "game:mw2", name: "Category winner" },
    top10,
    { ...champion, name: "First team" },
    { ...champion, id: "tie", name: "Tied team" },
    { ...champion, season_id: "older", name: "Older champion" },
  ];
  assert.deepEqual(latestGlobalTeamChampions(rows), { seasonId: "preview", season: "Example Season", names: ["First team", "Tied team"] });
  assert.equal(latestGlobalTeamChampions([top10]), null);
});

const artCompiled = ts.transpileModule(readFileSync("app/components/SeasonAwardArt.tsx", "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
const artExports = {};
new Function("require", "exports", artCompiled)(require, artExports);
const Art = artExports.default;
const awardKinds = ["champion", "top10", "undefeated", "iron_competitor", "dynasty"];

test("multiple award illustrations keep every metallic gradient and shadow reference unique and resolved", () => {
  const markup = renderToStaticMarkup(React.createElement(React.Fragment, null,
    ...[...awardKinds, "champion"].map((honour, index) => React.createElement(Art, { honour, key: index }))));
  const ids = [...markup.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length);
  const references = [...markup.matchAll(/url\(#([^)]+)\)/g)].map(match => match[1]);
  assert.ok(references.length > awardKinds.length);
  for (const reference of references) assert.ok(ids.includes(reference), `Unresolved SVG reference: ${reference}`);
});

test("each award has a genuinely different silhouette, not the same recoloured shield", () => {
  const paths = awardKinds.map(honour => {
    const markup = renderToStaticMarkup(React.createElement(Art, { honour })).replace(/<defs>.*?<\/defs>/s, "");
    return new Set([...markup.matchAll(/\bd="([^"]+)"/g)].map(match => match[1]));
  });
  for (let i = 0; i < paths.length; i++) {
    for (let j = i + 1; j < paths.length; j++) {
      assert.ok([...paths[i]].filter(path => !paths[j].has(path)).length >= 3,
        `${awardKinds[i]} and ${awardKinds[j]} must not reuse the same silhouette`);
    }
  }
});
