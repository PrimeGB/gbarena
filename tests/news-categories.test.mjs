import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import ts from "typescript";

test("news menu hides removed options without deleting their existing pages", () => {
  const source = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "app", "latest-news", "categoryData.ts"), "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const exports = {};
  new Function("exports", compiled)(exports);

  assert.deepEqual(exports.newsMenuCategories.map((category) => category.slug), [
    "upcoming-updates", "accepted-suggestions", "rule-changes",
  ]);
  for (const slug of ["new-ladders", "tournaments", "top-clips"]) {
    assert.ok(exports.newsCategories.some((category) => category.slug === slug), `${slug} remains accessible`);
  }
});
