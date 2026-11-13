import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import ts from "typescript";

const require = createRequire(import.meta.url);
const cache = new Map();
function loadModule(path) {
  const file = resolve(dirname(fileURLToPath(import.meta.url)), path);
  if (cache.has(file)) return cache.get(file);
  const source = readFileSync(file, "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const exports = {};
  cache.set(file, exports);
  new Function("require", "exports", compiled)((name) =>
    name.startsWith(".") ? loadModule(resolve(dirname(file), `${name}.ts`)) : require(name), exports);
  return exports;
}

const { searchFilter, rankSiteResults } = loadModule("../lib/searchRanking.ts");
const { siteSearchIndex } = loadModule("../lib/siteSearch.ts");

test("exact and keyword matches rank ahead of unrelated results and tolerate a typo", () => {
  const results = [
    { id: "other", title: "Teams", description: "Find players", type: "Page", href: "/teams" },
    { id: "fortnite", title: "Fortnite - Xbox", description: "Fortnite ladders", type: "Game", href: "/fortnite" },
    { id: "exact", title: "Fortnite", description: "Game", type: "Game", href: "/exact" },
  ];
  assert.equal(rankSiteResults("fortnite", results)[0].id, "exact");
  assert.equal(rankSiteResults("fornite", results)[0].id, "exact");
  assert.equal(rankSiteResults("forntite", results)[0].id, "exact");
  assert.equal(rankSiteResults("unknownxyz", results).length, 0);
  assert.equal(rankSiteResults("ortni", results)[0].id, "exact");
});

test("search filter restricts user input to safe, bounded literal terms", () => {
  const filter = searchFilter('test%),hidden.eq.true,username.ilike.*', ["username"]);
  assert.equal(filter, "username.ilike.%test%,username.ilike.%hidden%,username.ilike.%hid%,username.ilike.%den%,username.ilike.%eq%,username.ilike.%true%");
  assert.equal(searchFilter("%_,()", ["name"]), "");
});

test("catalog searches key pages, news, games and valid Rapid Royal ladder links", () => {
  assert.equal(rankSiteResults("inbox", siteSearchIndex)[0].href, "/profile/inbox");
  assert.ok(rankSiteResults("weekly cups", siteSearchIndex).some((item) => item.type === "News"));
  assert.ok(rankSiteResults("fornite", siteSearchIndex).some((item) => item.type === "Game"));
  const rapid = rankSiteResults("battlefield rapid royal xbox", siteSearchIndex);
  assert.ok(rapid.some((item) => item.href === "/ladders/xbox/battlefield/battlefield-6/rapid-royal-duos/rankings"));
  assert.ok(rankSiteResults("rapid royal rules xbox", siteSearchIndex).some((item) => item.href === "/ladders/xbox/battlefield/battlefield-6/rapid-royal-duos/rules"));
  assert.equal(rankSiteResults("no-such-thing-zzzz", siteSearchIndex).length, 0);
});
