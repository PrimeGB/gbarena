import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const require = createRequire(import.meta.url);
const compiled = ts.transpileModule(readFileSync("app/awards/page.tsx", "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;

test("the awards page shows the original catalog with season and challenge links", () => {
  const mocks = {
    "@/lib/supabase": { supabase: {} },
    "./AwardArt": { default: () => null, AWARD_CSS: "", awardAccent: () => "#fff" },
    "./NewTrophyArt": { hasNewTrophy: () => false },
    "../challenges/challengeTrophies": { hasChallengeTrophy: () => false },
    "../components/SeasonHonours": { SeasonBadge: () => null },
  };
  const exports = {};
  new Function("require", "exports", compiled)((name) => mocks[name] || require(name), exports);
  const markup = renderToStaticMarkup(React.createElement(exports.default));
  assert.match(markup, /Awards &amp; Achievements/);
  assert.match(markup, /Season honours &amp; Hall of Fame/);
  assert.match(markup, /Player Challenges/);
  assert.match(markup, /More awards/);
  assert.match(markup, /href="\/champions"/);
  assert.match(markup, /href="\/challenges"/);
  assert.doesNotMatch(markup, /awards-hall/);
});

test("home and support links use the same name as the awards page", () => {
  for (const path of ["app/page.tsx", "app/home/page.tsx", "app/components/MobileHome.tsx", "app/support/page.tsx"]) {
    const source = readFileSync(path, "utf8");
    assert.match(source, /href="\/awards"[^>]*>\s*Awards &amp; Achievements/, path);
    assert.doesNotMatch(source, /Awards &amp; Trophies/, path);
  }
});
