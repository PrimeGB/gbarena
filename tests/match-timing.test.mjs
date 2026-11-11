import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import ts from "typescript";

const require = createRequire(import.meta.url);
const source = readFileSync(new URL("../lib/matchTiming.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const exports = {};
new Function("require", "exports", compiled)(require, exports);

test("reporting and ticket windows are based on the scheduled match time", () => {
  const start = "2026-11-10T12:00:00Z";
  assert.equal(new Date(exports.matchReportingOpensAt(start)).toISOString(), "2026-11-10T12:15:00.000Z");
  assert.equal(new Date(exports.matchTicketDeadline(start)).toISOString(), "2026-11-10T14:00:00.000Z");
  for (const invalid of [null, "", "not a date", "10:00 AM", "2026-11-10T12:00:00"]) {
    assert.equal(exports.matchReportingOpensAt(invalid), null);
    assert.equal(exports.matchTicketDeadline(invalid), null);
  }
});
