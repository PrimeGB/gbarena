import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";

const source = readFileSync("lib/heroSlides.ts", "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const exports = {};
new Function("exports", compiled)(exports);

test("community slides are separated by existing images in the rotation", () => {
  const images = Array.from({ length: 9 }, (_, index) => `image-${index}`);
  const slides = exports.buildHeroRotation(images);
  const discord = slides.findIndex((slide) => slide.kind === "discord");
  const invite = slides.findIndex((slide) => slide.kind === "invite");
  assert.ok(slides.slice(discord + 1, invite).some((slide) => slide.kind === "image"));
  assert.ok(slides.slice(invite + 1).concat(slides.slice(0, discord)).some((slide) => slide.kind === "image"));
  assert.deepEqual(slides.filter((slide) => slide.kind === "image").map((slide) => slide.src), images);
});

test("rotation skips unavailable images but keeps both community slides", () => {
  const slides = exports.buildHeroRotation(["first", "broken", "last"]);
  const loaded = new Set(["first", "last"]);
  let index = 0;
  const visited = [];
  for (let count = 0; count < 4; count += 1) {
    index = exports.nextHeroSlideIndex(slides, index, loaded);
    visited.push(slides[index].kind === "image" ? slides[index].src : slides[index].kind);
  }
  assert.deepEqual(visited, ["discord", "last", "invite", "first"]);
});
