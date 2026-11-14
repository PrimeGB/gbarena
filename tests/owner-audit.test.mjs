import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import ts from "typescript";

const require = createRequire(import.meta.url);
const compiled = ts.transpileModule(readFileSync("lib/ownerAudit.ts", "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const exports = {};
new Function("require", "exports", compiled)(require, exports);
const { auditSearchParams, auditChanges, emptyAuditFilters } = exports;

test("date filters include the full end date in UTC and reject invalid or reversed dates", () => {
  const params = auditSearchParams({ ...emptyAuditFilters, from: "2026-11-14", to: "2026-11-14" });
  assert.equal(params.p_from, "2026-11-14T00:00:00.000Z");
  assert.equal(params.p_to, "2026-11-15T00:00:00.000Z");
  assert.throws(() => auditSearchParams({ ...emptyAuditFilters, from: "2026-02-30" }), /valid date/);
  assert.throws(() => auditSearchParams({ ...emptyAuditFilters, from: "2026-11-15", to: "2026-11-14" }), /end date/);
  const cursor = { at: "2026-11-14T10:00:00Z", id: "event:123" };
  assert.equal(auditSearchParams(emptyAuditFilters, cursor).p_before_id, "event:123");
});

test("changed fields distinguish private content markers from recorded values and omit unchanged context", () => {
  const event = {
    changed_fields: ["status", "message"], private_fields: ["message"],
    previous_values: { status: "open", user_id: "user" },
    new_values: { status: "closed", user_id: "user" },
  };
  const changes = auditChanges(event);
  assert.deepEqual(changes.map((change) => change.field), ["status", "message"]);
  assert.equal(changes[0].before, "open");
  assert.equal(changes[0].after, "closed");
  assert.equal(changes[1].private, true);
});

test("historical logs compare before and after keys instead of displaying unchanged fields", () => {
  const changes = auditChanges({
    changed_fields: [], private_fields: [],
    previous_values: { status: "new", priority: "normal" },
    new_values: { status: "resolved", priority: "normal" },
  });
  assert.deepEqual(changes.map((change) => change.field), ["status"]);
});
