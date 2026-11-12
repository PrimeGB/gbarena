import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const require = createRequire(import.meta.url);
const source = readFileSync(new URL("../app/awards/EarlyCommunityArt.tsx", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
const exports = {};
new Function("require", "exports", compiled)(require, exports);

test("community award tiers render distinct labelled art with unique gradients", () => {
  const names = ["Community Origin", "Community Pioneer", "Community Trailblazer"];
  for (const name of names) assert.equal(exports.hasEarlyCommunityArt(name), true);
  assert.equal(exports.hasEarlyCommunityArt("Other award"), false);
  const markup = renderToStaticMarkup(React.createElement(React.Fragment, null,
    ...names.map((name) => React.createElement(exports.default, { name, key: name })),
  ));
  for (const name of names) assert.ok(markup.includes(`aria-label="${name}"`));
  const gradients = [...markup.matchAll(/id="(community-metal-[^"]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(gradients).size, 3);
  assert.equal(new Set(names.map(exports.earlyCommunityAccent)).size, 3);
});
