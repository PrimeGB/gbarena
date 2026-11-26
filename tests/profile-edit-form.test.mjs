import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import React from "react";
import ts from "typescript";

const require = createRequire(import.meta.url);

function compile(path, extra = "") {
  return ts.transpileModule(readFileSync(path, "utf8") + extra, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
}

const accountExports = {};
new Function("require", "exports", compile("lib/gamingAccounts.ts"))(require, accountExports);
const glowExports = {};
new Function("require", "exports", compile("lib/profileGlow.ts"))(require, glowExports);
const source = compile("app/profile/edit/page.tsx", "\nexport { EditProfileForm };\n");

function harness(params, savedSteamGame = null, saveError = null, profile = null) {
  const states = [];
  const effects = [];
  const savedProfiles = [];
  const uploads = [];
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
    useRef(initial) {
      const position = index++;
      if (!(position in states)) states[position] = { current: initial };
      return states[position];
    },
    useEffect(effect) {
      if (profile && effect.toString().includes("loadProfileAndRelations") && effects.length === 0) effects.push(effect);
    },
  };
  const supabase = {
    storage: {
      from(bucket) {
        return {
          async upload(path, file) { uploads.push({ bucket, path, file }); return { error: null }; },
          getPublicUrl(path) { return { data: { publicUrl: `https://example.test/${path}` } }; },
        };
      },
    },
    from() {
      let columns = "";
      const builder = {
        select(value) { columns = value; return builder; },
        eq() { return builder; },
        async maybeSingle() {
          if (columns.includes("profile_glow")) return { data: profile, error: null };
          return { data: { friends_public: true }, error: null };
        },
        async upsert(value) { savedProfiles.push(value); return { error: saveError }; },
      };
      return builder;
    },
    async rpc(name) {
      return { data: name === "gb_profile_friends" ? { friends: [] } : [], error: null };
    },
  };
  const exports = {};
  const mocks = {
    react,
    "next/link": { __esModule: true, default: () => null },
    "next/image": { __esModule: true, default: () => null },
    "next/navigation": { useSearchParams: () => new URLSearchParams(params) },
    "../../../lib/useUser": { useUser: () => ({ user: { id: "player" }, loading: false }) },
    "../../../lib/supabase": { supabase },
    "../../../lib/gamingAccounts": accountExports,
    "../../../lib/profileGlow": glowExports,
    "../founder-glow.css": {},
    "../../awards/AwardArt": { __esModule: true, default: () => null, AWARD_CSS: "" },
  };
  new Function("require", "exports", source)((name) => mocks[name] || require(name), exports);
  const render = () => {
    index = 0;
    return exports.EditProfileForm({ savedSteamGame });
  };
  render.load = () => effects[0]();
  render.savedProfiles = savedProfiles;
  render.uploads = uploads;
  return render;
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

test("Steam return restores the selected game and account ID while allowing edits", () => {
  const render = harness("platform=pc&steam_id=1234", JSON.stringify({ category: "fighting-games", game: "street-fighter-6" }));
  const input = (tree) => find(tree, (element) => element.type === "input" && element.props.placeholder === "Steam, Battle.net, Epic or EA ID");
  let tree = render();
  assert.equal(input(tree).props.value, "1234");
  assert.ok(find(tree, (element) => element.type === "select" && element.props.value === "street-fighter-6"));
  input(tree).props.onChange({ target: { value: "edited-id" } });
  tree = render();
  assert.equal(input(tree).props.value, "edited-id");
  find(tree, (element) => element.type === "select" && element.props.value === "street-fighter-6")
    .props.onChange({ target: { value: "brawlhalla" } });
  assert.equal(input(render()).props.value, "1234");
});

test("profile save failures are reported rather than presented as saved", async () => {
  const render = harness("", null, { message: "Database unavailable" });
  const originalError = console.error;
  console.error = () => {};
  try {
    find(render(), (element) => element.type === "button" && element.props.children === "Save Changes").props.onClick();
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.ok(find(render(), (element) => element.props?.role === "alert" && element.props.children === "Save failed: Database unavailable"));
  } finally {
    console.error = originalError;
  }
});

test("existing profile pictures stay until a new avatar replaces them", async () => {
  const render = harness("", null, null, {
    username: "Player", role: "member", profile_glow: "On", location: "set",
    logo_url: "https://example.test/old-logo.png", avatar_url: "https://example.test/old-avatar.png",
  });
  render();
  render.load();
  await new Promise((resolve) => setTimeout(resolve, 0));
  let tree = render();
  assert.equal(find(tree, (element) => element.props?.alt === "Avatar Preview").props.src, "https://example.test/old-logo.png");
  assert.equal(find(tree, (element) => element.props?.children === "Logo Editor"), null);

  find(tree, (element) => element.type === "button" && element.props.children === "Save Changes").props.onClick();
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal("logo_url" in render.savedProfiles[0], false);
  assert.equal("avatar_url" in render.savedProfiles[0], false);

  const file = new Blob(["image"], { type: "image/png" });
  file.name = "avatar.png";
  find(tree, (element) => element.type === "input" && element.props.type === "file").props.onChange({ target: { files: [file] } });
  tree = render();
  const preview = find(tree, (element) => element.props?.alt === "Avatar Preview").props.src;
  find(tree, (element) => element.type === "button" && element.props.children === "Save Changes").props.onClick();
  await new Promise((resolve) => setTimeout(resolve, 0));
  URL.revokeObjectURL(preview);
  assert.equal(render.uploads.length, 1);
  assert.equal(render.uploads[0].bucket, "avatars");
  assert.equal(render.savedProfiles[1].logo_url, null);
  assert.equal(render.savedProfiles[1].avatar_url, `https://example.test/${render.uploads[0].path}`);
});

test("only Prime can choose and save the Founder RGB glow", async () => {
  const founder = harness("", null, null, { username: "Prime", role: "owner", profile_glow: "On", location: "set" });
  founder();
  founder.load();
  await new Promise((resolve) => setTimeout(resolve, 0));
  const select = find(founder(), (element) => element.type === "select" && find(element, (child) => child.type === "option" && child.props.value === "RGB"));
  assert.ok(select);
  select.props.onChange({ target: { value: "RGB" } });
  assert.ok(find(founder(), (element) => element.props?.className === "founder-rgb-preview"));
  find(founder(), (element) => element.type === "button" && element.props.children === "Save Changes").props.onClick();
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(founder.savedProfiles[0].profile_glow, "RGB");

  const member = harness("", null, null, { username: "Other", role: "member", profile_glow: "On" });
  member();
  member.load();
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(find(member(), (element) => element.type === "option" && element.props.value === "RGB"), null);
});
