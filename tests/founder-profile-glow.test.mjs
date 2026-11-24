import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";

const source = ts.transpileModule(readFileSync("lib/profileGlow.ts", "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
const glow = {};
new Function("exports", source)(glow);

test("RGB is enabled only for Prime's Founder profile when selected", () => {
  assert.equal(glow.hasFounderRgbGlow("owner", "Prime", "RGB"), true);
  assert.equal(glow.hasFounderRgbGlow("OWNER", "PRIME", "RGB"), true);
  assert.equal(glow.hasFounderRgbGlow("owner", "Prime", "On"), false);
  assert.equal(glow.hasFounderRgbGlow("owner", "Prime", "Off"), false);
  assert.equal(glow.hasFounderRgbGlow("member", "Prime", "RGB"), false);
  assert.equal(glow.hasFounderRgbGlow("owner", "Other", "RGB"), false);
  assert.equal(glow.hasFounderRgbGlow(null, null, "RGB"), false);
});

test("Founder RGB keeps the animated full border and glow treatment", () => {
  const css = readFileSync("app/profile/founder-glow.css", "utf8");
  assert.match(css, /\.profile-page\.founder-rgb \.wrapper::before\s*\{/);
  assert.match(css, /animation:\s*founder-rgb-flow 8s linear infinite/);
  assert.match(css, /@keyframes founder-glow/);
  assert.doesNotMatch(css, /founder-rgb-fade/);
});
