import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import ts from "typescript";

const require = createRequire(import.meta.url);
const source = readFileSync(new URL("../next.config.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const exports = {};
new Function("require", "exports", compiled)(require, exports);
const { PHASE_DEVELOPMENT_SERVER, PHASE_PRODUCTION_BUILD } = require("next/constants");

test("local builds do not lock the dev server and Vercel builds use its expected output", () => {
  const previous = process.env.VERCEL;
  try {
    delete process.env.VERCEL;
    assert.equal(exports.default(PHASE_DEVELOPMENT_SERVER).distDir, ".next");
    assert.equal(exports.default(PHASE_PRODUCTION_BUILD).distDir, ".next-build");
    process.env.VERCEL = "1";
    assert.equal(exports.default(PHASE_PRODUCTION_BUILD).distDir, ".next");
  } finally {
    if (previous === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = previous;
  }
});
