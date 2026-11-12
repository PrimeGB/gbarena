import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const optionsSource = readFileSync(join(root, "lib", "feedbackOptions.ts"), "utf8");
const optionsCompiled = ts.transpileModule(optionsSource, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const feedbackOptions = {};
new Function("exports", optionsCompiled)(feedbackOptions);

function renderPage(path, signedIn) {
  const source = readFileSync(join(root, path), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const exports = {};
  const mockRequire = (name) => {
    if (name === "next/link") {
      return { __esModule: true, default: ({ children, ...props }) => React.createElement("a", props, children) };
    }
    if (name.endsWith("/useUser")) return { useUser: () => ({ user: signedIn ? { id: "player" } : null, loading: false }) };
    if (name.endsWith("/supabase")) return { supabase: {} };
    if (name.endsWith("/ladderCatalog")) return {};
    if (name.endsWith("/ladderStandings")) return {};
    if (name === "../../lib/feedbackOptions") return feedbackOptions;
    if (name === "../components/CompactTopBar") return { __esModule: true, default: () => null };
    return require(name);
  };
  new Function("require", "exports", compiled)(mockRequire, exports);
  return renderToStaticMarkup(React.createElement(exports.default));
}

test("forums remain browseable while posting requires sign-in", () => {
  const guest = renderPage("app/forums/page.tsx", false);
  assert.match(guest, /News &amp; Updates/);
  assert.match(guest, /href="\/login\?next=%2Fforums"[^>]*>Sign in to post/);
  assert.doesNotMatch(guest, />New Post<\/button>/);
  const member = renderPage("app/forums/page.tsx", true);
  assert.match(member, />New Post<\/button>/);
  assert.doesNotMatch(member, /Sign in to post/);
});

test("feedback requires sign-in to submit", () => {
  const guest = renderPage("app/suggestions/page.tsx", false);
  assert.match(guest, /href="\/login\?next=%2Fsuggestions"/);
  assert.match(guest, /disabled="">Submit Suggestion/);
  const member = renderPage("app/suggestions/page.tsx", true);
  assert.match(member, /type="submit">Submit Suggestion/);
  assert.doesNotMatch(member, /href="\/login\?next=%2Fsuggestions"/);
});

test("guests are prompted to sign in instead of seeing an empty team list", () => {
  const guest = renderPage("app/profile/teams/page.tsx", false);
  assert.match(guest, /href="\/login\?next=%2Fprofile%2Fteams"/);
  assert.doesNotMatch(guest, /Looks lonely in here/);
});
