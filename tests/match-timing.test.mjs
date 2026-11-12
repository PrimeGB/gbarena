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
  assert.equal(new Date(exports.matchReportingOpensAt(start)).toISOString(), "2026-11-10T12:00:00.000Z");
  assert.equal(new Date(exports.matchTicketDeadline(start)).toISOString(), "2026-11-10T14:00:00.000Z");
  for (const invalid of [null, "", "not a date", "10:00 AM", "2026-11-10T12:00:00"]) {
    assert.equal(exports.matchReportingOpensAt(invalid), null);
    assert.equal(exports.matchTicketDeadline(invalid), null);
  }
});

test("match list dates never treat legacy time-only values as dates", () => {
  const scheduled = "2026-11-10T12:00:00Z";
  const expected = new Date(scheduled).toLocaleDateString(undefined, { year: "numeric", month: "numeric", day: "numeric" });
  assert.deepEqual(exports.matchListDate(scheduled, "2026-11-11T12:00:00Z"), { text: expected, completed: false });
  assert.deepEqual(exports.matchListDate("10:00 AM", scheduled), { text: expected, completed: true });
  assert.deepEqual(exports.matchListDate("10:00 AM", null), { text: "TBD", completed: false });
  assert.deepEqual(exports.matchListDate(null, "invalid"), { text: "TBD", completed: false });
});
