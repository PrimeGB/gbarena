import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import ts from "typescript";

const require = createRequire(import.meta.url);
const source = readFileSync(new URL("../app/components/UnscannedEvidenceLink.tsx", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
const exports = {};
new Function("require", "exports", compiled)(require, exports);

test("evidence links disclose their scan status and require confirmation", () => {
  const link = exports.UnscannedEvidenceLink({ href: "https://example.invalid/evidence", children: "Evidence" });
  assert.equal(link.props.href, "https://example.invalid/evidence");
  assert.equal(link.props.rel, "noopener noreferrer");
  assert.match(link.props.children.join(""), /unscanned/);
  const previousWindow = globalThis.window;
  try {
    let prevented = false;
    globalThis.window = { confirm: () => false };
    link.props.onClick({ preventDefault: () => { prevented = true; } });
    assert.equal(prevented, true);
    globalThis.window = { confirm: () => true };
    prevented = false;
    link.props.onClick({ preventDefault: () => { prevented = true; } });
    assert.equal(prevented, false);
  } finally {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  }
});

test("staff and match proof surfaces use unscanned evidence warnings", () => {
  for (const path of ["../app/staff/matches/page.tsx", "../app/matches/[matchId]/page.tsx"]) {
    const page = readFileSync(new URL(path, import.meta.url), "utf8");
    assert.match(page, /have not been scanned for malware/);
    assert.match(page, /<UnscannedEvidenceLink/);
  }
});
