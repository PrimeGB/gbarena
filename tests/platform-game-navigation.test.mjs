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

test("both homepage dropdowns show each new game only on supported platforms", () => {
  const accounts = load("lib/gamingAccounts.ts");
  const catalog = load("lib/ladderCatalog.ts", { "./gamingAccounts": accounts });
  const GameLinks = load("app/components/PlatformGameLinks.tsx", { "../../lib/ladderCatalog": catalog }).default;
  const expected = {
    xbox: ["fortnite/box-fights", "fighting-games/street-fighter-6", "fighting-games/brawlhalla", "fighting-games/tekken-8", "fighting-games/mortal-kombat-1", "sports-games/ea-sports-fc-27", "sports-games/nba-2k27", "sports-games/efootball", "tactical-shooters/valorant", "hero-shooters/marvel-rivals", "hero-shooters/overwatch-2"],
    playstation: ["fortnite/box-fights", "fighting-games/street-fighter-6", "fighting-games/brawlhalla", "fighting-games/tekken-8", "fighting-games/mortal-kombat-1", "sports-games/ea-sports-fc-27", "sports-games/nba-2k27", "sports-games/efootball", "tactical-shooters/valorant", "hero-shooters/marvel-rivals", "hero-shooters/overwatch-2"],
    nintendo: ["fortnite/box-fights", "fighting-games/street-fighter-6", "fighting-games/brawlhalla", "fighting-games/mortal-kombat-1", "fighting-games/super-smash-bros-ultimate", "hero-shooters/overwatch-2"],
    pc: ["fortnite/box-fights", "fighting-games/street-fighter-6", "fighting-games/brawlhalla", "fighting-games/tekken-8", "fighting-games/mortal-kombat-1", "sports-games/ea-sports-fc-27", "sports-games/nba-2k27", "sports-games/efootball", "tactical-shooters/counter-strike-2", "tactical-shooters/valorant", "hero-shooters/marvel-rivals", "hero-shooters/overwatch-2", "strategy-games/chess"],
    mobile: ["fighting-games/brawlhalla", "sports-games/efootball", "strategy-games/chess"],
  };
  for (const [platform, games] of Object.entries(expected)) {
    const markup = renderToStaticMarkup(React.createElement(GameLinks, { platform }));
    const hrefs = [...markup.matchAll(/href="([^"]+)"/g)].map((match) => match[1]);
    assert.deepEqual(hrefs.sort(), games.map((game) => `/ladders/${platform}/${game}`).sort());
  }
  for (const path of ["app/page.tsx", "app/home/page.tsx"]) {
    const source = readFileSync(path, "utf8");
    for (const platform of Object.keys(expected)) {
      assert.match(source, new RegExp(`<PlatformGameLinks platform="${platform}"\\s*/>`), path);
    }
    assert.match(source, /overflow-y:auto/, path);
    assert.match(source, /\.drop-wrap:focus-within \.dropdown/, path);
  }
});

test("platform pages expose game names directly for mobile browsing", () => {
  const accounts = load("lib/gamingAccounts.ts");
  const catalog = load("lib/ladderCatalog.ts", { "./gamingAccounts": accounts });
  for (const [platform, expected, absent] of [
    ["mobile", "sports-games/efootball", "sports-games/nba-2k27"],
    ["nintendo", "fighting-games/super-smash-bros-ultimate", "tactical-shooters/counter-strike-2"],
    ["pc", "strategy-games/chess", "fighting-games/super-smash-bros-ultimate"],
  ]) {
    const Page = load("app/ladders/[platform]/page.tsx", {
      "next/navigation": { useParams: () => ({ platform }) },
      "../../../lib/ladderCatalog": catalog,
    }).default;
    const markup = renderToStaticMarkup(React.createElement(Page));
    assert.ok(markup.includes(`href="/ladders/${platform}/${expected}"`));
    assert.ok(!markup.includes(`href="/ladders/${platform}/${absent}"`));
    assert.match(markup, /View Ladders/);
  }
});
