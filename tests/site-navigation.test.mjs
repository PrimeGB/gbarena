import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createRequire } from "node:module";
import { test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const require = createRequire(import.meta.url);

function load(path, mocks = {}) {
  const source = readFileSync(path, "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const exports = {};
  new Function("require", "exports", compiled)((name) => mocks[name] || require(name), exports);
  return exports.default;
}

test("the red quick links appear once away from the homepage", () => {
  const CompactTopBar = load("app/components/CompactTopBar.tsx");
  for (const [pathname, shown] of [["/", false], ["/home", false], ["/profile", true], ["/staff/dashboard", true], ["/ladders", true], ["/ladders/nintendo/fortnite", true], ["/ladders/pc/battlefield/battlefield-6/rapid-royal-duos/rankings", true], ["/team-hub", true]]) {
    const TopHomeBar = load("app/components/TopHomeBar.tsx", {
      "next/navigation": { usePathname: () => pathname },
      "./CompactTopBar": { __esModule: true, default: CompactTopBar },
    });
    const markup = renderToStaticMarkup(React.createElement(TopHomeBar));
    if (!shown) assert.equal(markup, "");
    else {
      assert.equal((markup.match(/aria-label="Quick links"/g) || []).length, 1);
      assert.match(markup, /href="\/home">Home/);
      assert.match(markup, /href="\/profile">Profile/);
      assert.match(markup, /href="\/forums">Forums/);
    }
  }
});

test("secondary profile and team navigation keeps its links without a duplicate Home option", () => {
  const SiteNav = load("app/components/SiteNav.tsx");
  for (const props of [{}, { profileFriendsHref: "/profile/friends" }]) {
    const markup = renderToStaticMarkup(React.createElement(SiteNav, props));
    assert.doesNotMatch(markup, />Home<\/a>/);
    assert.match(markup, />Forums<\/a>/);
    assert.match(markup, />Support<\/a>/);
  }
  const profile = renderToStaticMarkup(React.createElement(SiteNav, { profileFriendsHref: "/profile/friends" }));
  assert.match(profile, />Friends<\/a>/);
  assert.match(profile, />Awards<\/a>/);
});

test("the PC Battlefield ladder list has no secondary navigation bar", () => {
  const Page = load("app/ladders/pc/battlefield/page.tsx", {
    "../../../../lib/ladderCatalog": { ladderGameImage: () => "/game.jpg" },
  });
  const markup = renderToStaticMarkup(React.createElement(Page));
  assert.doesNotMatch(markup, /<nav\b/);
  assert.match(markup, /PC Battlefield Ladders/);
  assert.match(markup, /Rapid Royal/);
  assert.match(markup, /Current Ladder Rankings/);
});

test("game and ladder pages do not render the old members and top rankings bar", () => {
  const filesIn = (directory) => readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => entry.isDirectory() ? filesIn(join(directory, entry.name)) : [join(directory, entry.name)]);
  const files = [...filesIn("app/ladders"), ...filesIn("app/components/ladders"), "app/team-hub/page.tsx"];
  for (const file of files.filter((name) => name.endsWith(".tsx"))) {
    const source = readFileSync(file, "utf8");
    assert.doesNotMatch(source, /href=["']\/teams\/top["']/, file);
    assert.doesNotMatch(source, /href=["']\/players\/top["']/, file);
  }
  const Fortnite = load("app/components/ladders/FortniteLaddersPage.tsx", {
    "next/navigation": { usePathname: () => "/ladders/nintendo/fortnite" },
    "../../../lib/ladderCatalog": { ladderGameImage: () => "/game.jpg" },
  });
  const markup = renderToStaticMarkup(React.createElement(Fortnite));
  assert.doesNotMatch(markup, /<nav\b/);
  assert.match(markup, /Nintendo Fortnite Ladders/);
  assert.match(markup, /Current Ladder Rankings/);
});
