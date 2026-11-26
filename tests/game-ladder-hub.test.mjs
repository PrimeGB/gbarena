import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const require = createRequire(import.meta.url);

function load(path, mocks = {}) {
  const compiled = ts.transpileModule(readFileSync(path, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const exports = {};
  new Function("require", "exports", compiled)((name) => mocks[name] || require(name), exports);
  return exports;
}

const accounts = load("lib/gamingAccounts.ts");
const bf6 = load("lib/bf6TeamLadders.ts");
const catalog = load("lib/ladderCatalog.ts", { "./gamingAccounts": accounts, "./bf6TeamLadders": bf6 });
const rules = load("lib/matchRules.ts", { "./bf6TeamLadders": bf6 });
const roster = load("lib/matchCreationRoster.ts");
const hubModule = load("app/components/GameLadderHub.tsx", {
  "../../lib/ladderCatalog": catalog,
  "../../lib/matchRules": rules,
  "../../lib/matchCreationRoster": roster,
  "./GameLadderHub.module.css": { default: {} },
});
const Hub = hubModule.default;
const DetailHeader = load("app/components/LadderDetailHeader.tsx", {
  "../../lib/ladderCatalog": catalog,
  "./GameLadderHub": hubModule,
  "./LadderDetailHeader.module.css": { default: {} },
}).default;

function render(platform, category, game, showTournaments = true) {
  return renderToStaticMarkup(React.createElement(Hub, {
    platform,
    platformName: catalog.ladderPlatformLabel(platform),
    category,
    categoryName: catalog.ladderCategoryLabel(category),
    game,
    gameName: catalog.ladderGameLabel(category, game),
    showTournaments,
  }));
}

test("each supported game retains its ladders, team links, rankings and rules", () => {
  for (const platform of catalog.ladderPlatforms) {
    for (const category of catalog.categoriesForPlatform(platform.value)) {
      for (const game of catalog.gamesForCategory(category.value, platform.value)) {
        const markup = render(platform.value, category.value, game.value);
        assert.ok(markup.includes(catalog.ladderGameImage(category.value, game.value).replaceAll("&", "&amp;")), game.label);
        for (const ladder of catalog.laddersForGame(category.value, game.value)) {
          const base = `/ladders/${platform.value}/${category.value}/${game.value}/${ladder.slug}`;
          assert.ok(markup.includes(`href="${base}/rankings"`), base);
          assert.ok(markup.includes(`href="${base}/rules"`), base);
          assert.ok(markup.includes(`game=${game.value}&amp;ladder=${ladder.slug}`), base);
        }
      }
    }
  }
});

test("game identity, formats and tournament links match the selected ladder", () => {
  const box = render("nintendo", "fortnite", "box-fights");
  assert.match(box, /Build\. Edit\. Compete\./);
  assert.match(box, /1v1 · Ladder competition/);
  assert.match(box, /\/games\/fn-2\.jpg/);
  assert.match(box, /tournaments\?platform=nintendo&amp;category=fortnite&amp;game=box-fights/);

  const nba = render("playstation", "sports-games", "nba-2k27");
  assert.match(nba, /Own the court/);
  assert.match(nba, /3v3 · Ladder competition/);
  assert.match(nba, /5v5 · Ladder competition/);
  assert.notEqual(box.match(/--game-accent:([^;"]+)/)[1], nba.match(/--game-accent:([^;"]+)/)[1]);

  const battlefield = render("xbox", "battlefield", "battlefield-6", false);
  assert.match(battlefield, /Solo TDM/);
  assert.match(battlefield, /Rapid Royal/);
  assert.match(battlefield, /RedSec/);
  assert.doesNotMatch(battlefield, /\/tournaments\?/);
});

test("rules use game art and avoid repeating a game name in the ladder title", async () => {
  const Page = load("app/ladders/[platform]/[category]/[game]/[ladder]/rules/page.tsx", {
    "../../../../../../../lib/matchRules": rules,
    "../../../../../../../lib/bf6TeamLadders": bf6,
    "../../../../../../../lib/ladderCatalog": catalog,
    "../../../../../../components/RapidRoyalRules": { default: () => null },
    "../../../../../../components/LadderDetailHeader": { default: DetailHeader },
  }).default;
  const markup = renderToStaticMarkup(await Page({
    params: Promise.resolve({ platform: "nintendo", category: "fortnite", game: "box-fights", ladder: "singles" }),
  }));
  assert.match(markup, /Nintendo Switch · Rules/);
  assert.match(markup, />Box Fights 1v1 Ladder<\/h1>/);
  assert.doesNotMatch(markup, /Box Fights Box Fights/);
  assert.match(markup, /\/games\/fn-2\.jpg/);
  assert.match(markup, /href="\/ladders\/nintendo\/fortnite\/box-fights\/singles\/rankings"/);
  assert.equal(catalog.fullLadderTitle("NBA 2K27", "3v3"), "NBA 2K27 3v3");
});

test("BF6 team ranking routes recognize each new ladder", () => {
  for (const slug of Object.keys(bf6.bf6TeamLadders)) {
    const Page = load("app/ladders/[platform]/battlefield/[game]/[ladder]/rankings/page.tsx", {
      "next/navigation": { useParams: () => ({ platform: "pc", game: "battlefield-6", ladder: slug }) },
      "../../../../../../../lib/supabase": { supabase: {} },
      "../../../../../../../lib/ladderStandings": { systemRankings: (teams) => teams },
      "../../../../../../../lib/ladderCatalog": catalog,
      "../../../../../../components/RankingSystemFilter": { default: () => null },
      "../../../../../../components/LadderDetailHeader": { default: () => null },
    }).default;
    const markup = renderToStaticMarkup(React.createElement(Page));
    assert.doesNotMatch(markup, /Battlefield ladder not found/);
    assert.match(markup, /Loading standings/);
  }
});
