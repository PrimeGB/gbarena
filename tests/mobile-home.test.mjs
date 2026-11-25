import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const require = createRequire(import.meta.url);
const source = readFileSync("app/components/MobileHome.tsx", "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
const exports = {};
new Function("require", "exports", compiled)((name) =>
  name === "./MobileHome.module.css" ? { __esModule: true, default: {} } : require(name), exports);

test("mobile home keeps platform navigation without the extra match prompt", () => {
  const markup = renderToStaticMarkup(React.createElement(exports.default));
  assert.match(markup, /GAMEBATTLES/);
  assert.match(markup, /logo-emblem\.png/);
  assert.doesNotMatch(markup, /YOUR NEXT MATCH STARTS HERE|Find a match|\/matches\/finder/i);
  for (const platform of ["playstation", "xbox", "nintendo", "pc", "mobile"]) {
    assert.match(markup, new RegExp(`href="/ladders/${platform}"`));
  }
});
