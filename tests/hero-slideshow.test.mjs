import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";

const source = readFileSync("lib/heroSlides.ts", "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const exports = {};
new Function("exports", compiled)(exports);

test("rotation preserves images and includes each new promotion once", () => {
  const images = Array.from({ length: 9 }, (_, index) => `image-${index}`);
  const slides = exports.buildHeroRotation(images);
  assert.deepEqual(slides.filter((slide) => slide.kind === "image").map((slide) => slide.src), images);
  for (const kind of exports.NEW_PROMO_KINDS) {
    assert.equal(slides.filter((slide) => slide.kind === kind).length, 1);
    assert.ok(exports.NEW_PROMOS[kind].href);
  }
});

test("manual and automatic navigation skip failed images in both directions", () => {
  const slides = [{ kind: "rivalry" }, { kind: "image", src: "broken" }, { kind: "friends" }, { kind: "image", src: "loaded" }];
  const loaded = new Set(["loaded"]);
  assert.equal(exports.nextHeroSlideIndex(slides, 0, loaded), 2);
  assert.equal(exports.nextHeroSlideIndex(slides, 2, loaded, -1), 0);
  assert.equal(exports.nextHeroSlideIndex(slides, 0, loaded, -1), 3);
});
