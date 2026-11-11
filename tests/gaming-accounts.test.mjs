import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { test } from "node:test";
import ts from "typescript";

const require = createRequire(import.meta.url);
const source = require("node:fs").readFileSync(
  new URL("../lib/gamingAccounts.ts", import.meta.url),
  "utf8",
);
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
const gamingAccounts = {};
new Function("require", "exports", compiled)(require, gamingAccounts);

test("a profile system ID is eligible across games on its platform", () => {
  assert.equal(
    gamingAccounts.resolveGamingAccountId(null, { gt_xbox: "PlayerOne" }, "xbox"),
    "PlayerOne",
  );
  assert.equal(
    gamingAccounts.resolveGamingAccountId(null, { psn_gt: "PS-Player" }, "playstation"),
    "PS-Player",
  );
});

test("game-specific ID takes precedence over the profile system ID", () => {
  assert.equal(
    gamingAccounts.resolveGamingAccountId(
      "GameSpecific",
      { gt_xbox: "PlatformWide" },
      "xbox",
    ),
    "GameSpecific",
  );
});

test("unknown platforms and blank IDs remain unlinked", () => {
  assert.equal(
    gamingAccounts.resolveGamingAccountId("  ", { gt_xbox: " " }, "mobile"),
    null,
  );
});

test("only players with a non-blank linked platform ID are match eligible", () => {
  assert.equal(gamingAccounts.isMatchEligibleGamingId("PlayerOne"), true);
  assert.equal(gamingAccounts.isMatchEligibleGamingId("  "), false);
  assert.equal(gamingAccounts.isMatchEligibleGamingId(null), false);
});
