import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import React from "react";
import ts from "typescript";

const require = createRequire(import.meta.url);
function load(path, mocks = {}, extra = "") {
  const compiled = ts.transpileModule(readFileSync(path, "utf8") + extra, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const exports = {};
  new Function("require", "exports", compiled)((name) => mocks[name] || require(name), exports);
  return exports;
}

function find(element, predicate) {
  if (!element || typeof element !== "object") return null;
  if (predicate(element)) return element;
  for (const child of [element.props?.children].flat(Infinity)) {
    const result = find(child, predicate);
    if (result) return result;
  }
  return null;
}

test("choosing a BF6 game type changes the match size and preset without changing its ladder", () => {
  const bf6 = load("lib/bf6TeamLadders.ts");
  const rules = load("lib/matchRules.ts", { "./bf6TeamLadders": bf6 });
  const roster = load("lib/matchCreationRoster.ts");
  const states = [];
  let index = 0;
  const react = {
    ...React,
    useState(initial) {
      const position = index++;
      if (!(position in states)) states[position] = typeof initial === "function" ? initial() : initial;
      return [states[position], (next) => {
        states[position] = typeof next === "function" ? next(states[position]) : next;
      }];
    },
    useMemo: (fn) => fn(),
    useEffect: () => {},
  };
  const Form = load("app/matches/create/page.tsx", {
    react,
    "next/navigation": { useRouter: () => ({}), useSearchParams: () => new URLSearchParams("platform=pc&category=battlefield&game=battlefield-6&ladder=team") },
    "../../../lib/useUser": { useUser: () => ({ user: null }) },
    "../../../lib/supabase": { supabase: {} },
    "../../../lib/gamingAccounts": { gamingCategoryLabel: () => "Battlefield", gamingGameLabel: () => "Battlefield 6" },
    "../../../lib/bf6TeamLadders": bf6,
    "../../../lib/matchRules": rules,
    "../../../lib/ladderCatalog": { ladderGameImage: () => "/game.jpg", ladderTitleForGame: () => "Team" },
    "../../../lib/ladderStandings": {},
    "../../../lib/rapidRoyal": {},
    "../../components/RapidRoyalRules": { default: () => null },
    "../../../lib/matchCreationRoster": roster,
  }, "\nexport { CreateMatchForm };\n").CreateMatchForm;
  const render = () => { index = 0; return Form(); };
  let tree = render();
  const picker = find(tree, (element) => element.type === "select" && element.props.className === "mode-select");
  assert.deepEqual(picker.props.children.map((option) => option.props.children), Object.values(bf6.bf6TeamLadders).map((format) => format.title));
  picker.props.onChange({ target: { value: "conquest-8v8" } });
  tree = render();
  assert.equal(find(tree, (element) => element.type === "select" && element.props.className === "mode-select").props.value, "conquest-8v8");
  assert.ok(find(tree, (element) => element.props?.children === "8v8"));
  const presets = find(tree, (element) => element.type === "select" && element.props.className === "rules-select");
  assert.deepEqual(presets.props.children.map((option) => option.props.children), ["ESB Conquest Small", "SnP T8 Conquest"]);
  presets.props.onChange({ target: { value: "SnP T8 Conquest" } });
  tree = render();
  assert.ok(find(tree, (element) => element.type === "dd" && element.props.children === "SnP T8 Conquest"));
  find(tree, (element) => element.type === "select" && element.props.className === "mode-select").props.onChange({ target: { value: "conquest-32v32" } });
  tree = render();
  assert.ok(find(tree, (element) => element.props?.children === "32v32"));
  assert.ok(find(tree, (element) => element.type === "dd" && element.props.children === "GB Conquest (Provisional)"));
  assert.ok(find(tree, (element) => typeof element.props?.href === "string" && element.props.href.includes("ladder=team")));
});
