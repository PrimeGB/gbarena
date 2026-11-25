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

test("top friend rings follow the friend's profile frame, not the viewed profile", () => {
  const member = { username: "Player", role: "member", profile_glow: "On", favorite_system: "Xbox" };
  assert.equal(glow.friendProfileFrameClass(member, null), "favorite-xbox");
  assert.equal(glow.friendProfileFrameClass({ ...member, favorite_system: "PlayStation" }, null), "favorite-playstation");
  assert.equal(glow.friendProfileFrameClass({ ...member, favorite_system: "Nintendo Switch" }, null), "favorite-nintendo");
  assert.equal(glow.friendProfileFrameClass({ ...member, favorite_system: "PC" }, null), "favorite-pc");
  assert.equal(glow.friendProfileFrameClass({ ...member, favorite_system: null }, null), "favorite-playstation");
  assert.equal(glow.friendProfileFrameClass(member, { tier: "affiliate", theme: "ice" }), "friend-gold");
  assert.equal(glow.friendProfileFrameClass(member, { tier: "ambassador", theme: "ice" }), "creator-style-ice");
  assert.equal(glow.friendProfileFrameClass(member, { tier: "ambassador", theme: "classic" }), "friend-gold");
  assert.equal(glow.friendProfileFrameClass({ ...member, username: "Prime", role: "owner", profile_glow: "RGB" }, { tier: "ambassador", theme: "ice" }), "friend-rgb");
  assert.equal(glow.friendProfileFrameClass({ ...member, profile_glow: "RGB" }, null), "favorite-xbox");
});

test("Founder RGB keeps the animated full border and glow treatment", () => {
  const css = readFileSync("app/profile/founder-glow.css", "utf8");
  assert.match(css, /\.profile-page\.founder-rgb \.wrapper::before\s*\{/);
  assert.match(css, /animation:\s*founder-rgb-flow 8s linear infinite/);
  assert.match(css, /@keyframes founder-glow/);
  assert.doesNotMatch(css, /founder-rgb-fade/);
});
