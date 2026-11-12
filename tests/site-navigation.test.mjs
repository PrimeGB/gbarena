import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
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
  for (const [pathname, shown] of [["/", false], ["/home", false], ["/profile", true], ["/staff/dashboard", true]]) {
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
