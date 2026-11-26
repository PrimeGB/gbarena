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
  for (const [pathname, shown] of [["/", false], ["/home", false], ["/profile", true], ["/staff/dashboard", true], ["/ladders", true], ["/ladders/nintendo/fortnite", true], ["/ladders/pc/battlefield/battlefield-6/rapid-royal-duos/rankings", true], ["/team-hub", true], ["/matches/create", true]]) {
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

test("Create Match keeps its form and action links without a secondary navigation bar", () => {
  const Page = load("app/matches/create/page.tsx", {
    "next/navigation": { useRouter: () => ({}), useSearchParams: () => new URLSearchParams("teamId=example&platform=xbox&category=call-of-duty&game=mw2&ladder=singles") },
    "../../../lib/useUser": { useUser: () => ({ user: null }) },
    "../../../lib/supabase": { supabase: {} },
    "../../../lib/gamingAccounts": {},
    "../../../lib/matchRules": { getGameRules: () => null, isBattlefieldSolos: () => false, bf6SolosMaps: [] },
    "../../../lib/bf6TeamLadders": { getBf6TeamLadder: () => null },
    "../../../lib/ladderCatalog": { ladderGameImage: () => "/game.jpg", ladderTitleForGame: () => "Solo" },
    "../../../lib/ladderStandings": {},
    "../../../lib/rapidRoyal": {},
    "../../components/RapidRoyalRules": { __esModule: true, default: () => null },
    "../../../lib/matchCreationRoster": { getPlayerOptions: () => ["1v1"], getRequiredRosterSize: () => 1 },
  });
  const markup = renderToStaticMarkup(React.createElement(Page));
  assert.doesNotMatch(markup, /<nav\b/);
  assert.match(markup, /Match Post Form/);
  assert.match(markup, /href="\/teams\/example"[^>]*>View Team/);
  assert.match(markup, /Match Finder/);
  assert.match(markup, /<aside[^>]*aria-labelledby="match-snapshot-title"/);
  assert.match(markup, /<dl class="snapshot-details">/);
  assert.match(markup, /<dt>Platform<\/dt><dd>Xbox<\/dd>/);
  assert.match(markup, /<dt>Players<\/dt><dd>1v1<\/dd>/);
  assert.match(markup, /<dt>Rules<\/dt><dd>GB Variant<\/dd>/);
  assert.match(markup, /<dt>Cross Play<\/dt><dd>Off<\/dd>/);
});

test("BF6 match snapshot shows the selected custom ruleset", () => {
  const bf6 = { presets: ["ESB Conquest Small", "SnP T8 Conquest"] };
  const Page = load("app/matches/create/page.tsx", {
    react: {
      ...React,
      useState(initial) {
        const value = typeof initial === "function" ? initial() : initial;
        if (value === "ESB Conquest Small") return React.useState("SnP T8 Conquest");
        if (value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length === 0) {
          return React.useState({ friendly_fire: "Off" });
        }
        return React.useState(value);
      },
    },
    "next/navigation": { useRouter: () => ({}), useSearchParams: () => new URLSearchParams("platform=pc&category=battlefield&game=battlefield-6&ladder=conquest-8v8") },
    "../../../lib/useUser": { useUser: () => ({ user: null }) },
    "../../../lib/supabase": { supabase: {} },
    "../../../lib/gamingAccounts": { gamingCategoryLabel: () => "Battlefield", gamingGameLabel: () => "Battlefield 6" },
    "../../../lib/bf6TeamLadders": { getBf6TeamLadder: () => bf6 },
    "../../../lib/matchRules": { isBattlefieldSolos: () => false, getGameRules: () => ({
      presetName: "ESB Conquest Small", teamSizes: ["8v8"], bestOf: ["Best of 3"], notes: [],
      modes: [{ value: "Conquest", fields: [{ slot: "friendly_fire", label: "Friendly Fire", options: ["Follow rules", "Off"], default: "Follow rules" }], rules: [] }],
    }) },
    "../../../lib/ladderCatalog": { ladderGameImage: () => "/game.jpg", ladderTitleForGame: () => "8v8 Conquest" },
    "../../../lib/ladderStandings": {},
    "../../../lib/rapidRoyal": {},
    "../../components/RapidRoyalRules": { __esModule: true, default: () => null },
    "../../../lib/matchCreationRoster": { getPlayerOptions: () => ["8v8"], getRequiredRosterSize: () => 8 },
  });
  const markup = renderToStaticMarkup(React.createElement(Page));
  assert.match(markup, /<dt>Rules<\/dt><dd>Custom based on SnP T8 Conquest<\/dd>/);
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
    "../../../components/Bf6TeamLadderOptions": { default: () => null },
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

test("other player actions omit gaming accounts and home while keeping player links", () => {
  const source = readFileSync("app/profile/page.tsx", "utf8");
  const actions = source.slice(source.indexOf('{isViewingOwnProfile ? "Control Center" : "Player Actions"}'), source.indexOf("{isViewingOwnProfile && <ProfileFollowingFeed />"));
  assert.doesNotMatch(actions, /View Player Gaming Accounts|Back To Home/);
  assert.match(actions, /View Player Awards/);
  assert.match(actions, /View Player Friends/);
  assert.match(actions, /View Player Teams/);
  assert.match(actions, /View Player Stats/);
});
