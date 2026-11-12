import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const require = createRequire(import.meta.url);
const source = readFileSync(new URL("../app/staff/role-guide/page.tsx", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
const exports = {};
new Function("require", "exports", compiled)((name) => {
  if (name === "../StaffToolShell") return { __esModule: true, default: ({ children }) => children };
  if (name.endsWith(".css")) return {};
  return require(name);
}, exports);
const markup = renderToStaticMarkup(React.createElement(exports.default));

test("role guide clearly describes current access and expandable details", () => {
  for (const role of ["Founder", "Administrator", "Moderator / Senior Staff", "Referee"]) {
    assert.ok(markup.includes(role), `Missing ${role}`);
  }
  assert.match(markup, /<details><summary>Disputed match tickets<\/summary>/);
  assert.match(markup, /Cannot assign staff, suspend accounts, finalize disputed matches/);
  assert.match(markup, /Credit changes and prize payouts require a separate Founder grant/);
});

test("staff conduct explains unpaid, revocable access and the ban on profiting", () => {
  assert.match(markup, /changed or revoked at any time/);
  assert.match(markup, /not a paid service/);
  assert.match(markup, /positive example for the community/);
  assert.match(markup, /personal profit/);
  assert.match(markup, /Do not sell access, favors, decisions or benefits/);
});
