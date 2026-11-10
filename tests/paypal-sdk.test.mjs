import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const source = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "app", "components", "GetCreditsBox.tsx"), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;

function createLoader() {
  const scripts = [];
  const window = {};
  const document = {
    createElement() {
      return { removed: false, remove() { this.removed = true; } };
    },
    body: { appendChild(script) { scripts.push(script); } },
  };
  const exports = {};
  const require = () => ({});
  new Function("require", "exports", "window", "document", `${compiled}\nexports.loadSdk = loadPayPalSdk;`)(
    require, exports, window, document,
  );
  return { load: exports.loadSdk, scripts, window };
}

test("SDK requests share one script and reuse an already loaded SDK", async () => {
  const { load, scripts, window } = createLoader();
  const first = load("client id");
  const second = load("client id");
  assert.equal(first, second);
  assert.equal(scripts.length, 1);
  assert.match(scripts[0].src, /client-id=client%20id/);
  window.paypal = { Buttons() {} };
  scripts[0].onload();
  await Promise.all([first, second]);
  await load("client id");
  assert.equal(scripts.length, 1);
});

test("failed or incomplete SDK loads surface errors and can be retried", async () => {
  const { load, scripts, window } = createLoader();
  const failed = load("client");
  scripts[0].onerror();
  await assert.rejects(failed, /Could not load PayPal/);
  assert.equal(scripts[0].removed, true);

  const incomplete = load("client");
  scripts[1].onload();
  await assert.rejects(incomplete, /without its payment controls/);
  assert.equal(scripts[1].removed, true);

  const retry = load("client");
  window.paypal = { Buttons() {} };
  scripts[2].onload();
  await retry;
});
