import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import React from "react";
import { createRequire } from "node:module";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

test("every new trophy in the catalog has its own artwork", () => {
  const migration = readFileSync("supabase/migrations/20261113010000_new_community_trophies.sql", "utf8");
  const catalog = migration.split("create index")[0];
  const names = [...catalog.matchAll(/\('([^']+ Trophy)', '[^']+', '[^']+', false, (true|false)\)/g)];
  assert.equal(names.length, 40);
  assert.equal(new Set(names.map((match) => match[1])).size, 40);
  assert.equal(names.filter((match) => match[2] === "true").length, 28);
  assert.doesNotMatch(catalog, /ranked matches?/i);

  const source = readFileSync("app/awards/NewTrophyArt.tsx", "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const exports = {};
  new Function("exports", "require", compiled)(exports, (module) => {
    if (module === "react" || module === "react/jsx-runtime") return {};
    throw new Error(`Unexpected dependency: ${module}`);
  });

  for (const [, name] of names) assert.ok(exports.hasNewTrophy(name), `Missing artwork for ${name}`);
  assert.equal(exports.hasNewTrophy("Not a trophy"), false);
});

test("new trophies use distinct artwork without printed numbers", () => {
  const migration = readFileSync("supabase/migrations/20261113010000_new_community_trophies.sql", "utf8");
  const names = [...migration.split("create index")[0].matchAll(/\('([^']+ Trophy)'/g)].map((match) => match[1]);
  const source = readFileSync("app/awards/NewTrophyArt.tsx", "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const exports = {};
  new Function("exports", "require", compiled)(exports, createRequire(import.meta.url));
  const artwork = names.map((name) => {
    const markup = renderToStaticMarkup(React.createElement(exports.default, { name }));
    assert.doesNotMatch(markup, /<text[^>]*>[^<]*\d/);
    if (!/^(Spring Bloom|Summer Heat|Autumn Harvest|Winter Frost)/.test(name)) {
      assert.match(markup, /<path d="[^"]+" fill="none" stroke="#fff4d5" stroke-width="3"/);
    }
    return [...markup.matchAll(/<path[^>]* d="([^"]+)"/g)].map((match) => match[1]).join("|");
  });
  assert.equal(new Set(artwork).size, 40);
});
