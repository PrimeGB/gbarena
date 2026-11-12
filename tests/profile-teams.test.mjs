import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const require = createRequire(import.meta.url);
const source = readFileSync("app/profile/teams/page.tsx", "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020 },
}).outputText;

function harness(initialTarget) {
  const states = [];
  const effects = [];
  const calls = [];
  let index = 0;
  let target = initialTarget;
  const team = (id, name, wins) => ({ id, name, tag: "TAG", platform: "pc", category: "battlefield", game: "battlefield-6", ladder: "team", wins, losses: 0, rating_points: 275, logo_url: "/logo.png" });
  const otherTeam = team("other-team", "Winning Team", 7);
  const ownTeam = team("own-team", "My Team", 0);
  const react = {
    Suspense: ({ children }) => children,
    useState(initial) {
      const position = index++;
      if (!(position in states)) states[position] = initial;
      return [states[position], (next) => { states[position] = typeof next === "function" ? next(states[position]) : next; }];
    },
    useRef(initial) {
      const position = index++;
      if (!(position in states)) states[position] = { current: initial };
      return states[position];
    },
    useCallback(fn, deps) {
      const position = index++;
      const previous = states[position];
      if (!previous || deps.some((value, i) => value !== previous.deps[i])) states[position] = { fn, deps };
      return states[position].fn;
    },
    useEffect(fn, deps) {
      const position = index++;
      const previous = effects[position];
      if (!previous || deps.some((value, i) => value !== previous.deps[i])) {
        previous?.cleanup?.();
        effects[position] = { deps, cleanup: fn() };
      }
    },
  };
  const supabase = {
    auth: { getUser: async () => ({ data: { user: { id: "me" } }, error: null }) },
    from(table) {
      const query = { table, filters: {} };
      const result = () => {
        calls.push(query);
        const id = query.filters.id || query.filters.owner_id || query.filters.user_id;
        if (table === "profiles") return { data: { username: id === "me" ? "Me" : "Other Player" }, error: null };
        if (table === "teams") return { data: id === "me" ? [ownTeam] : [otherTeam], error: null };
        if (table === "team_members") return { data: [{ teams: id === "me" ? ownTeam : otherTeam }], error: null };
        return { data: [], error: null };
      };
      const builder = {
        select() { return builder; },
        eq(key, value) { query.filters[key] = value; return builder; },
        maybeSingle() { return Promise.resolve(result()); },
        returns() { return Promise.resolve(result()); },
      };
      return builder;
    },
  };
  const exports = {};
  new Function("require", "exports", compiled)((name) => {
    if (name === "react") return react;
    if (name === "next/navigation") return { useSearchParams: () => new URLSearchParams(target ? `userId=${target}` : "") };
    if (name.endsWith("/useUser")) return { useUser: () => ({ user: { id: "me" }, loading: false }) };
    if (name.endsWith("/supabase")) return { supabase };
    if (name.endsWith("/ladderCatalog")) return { ladderGameLabel: () => "Battlefield 6", ladderPlatformLabel: () => "PC" };
    if (name.endsWith("/ladderStandings")) return { rankedLadderTeams: async () => [{ id: "other-team" }] };
    if (name.endsWith("/rapidRoyal")) return { rapidRoyalDisplayName: (value) => value };
    return require(name);
  }, exports);
  return {
    calls,
    setTarget(value) { target = value; },
    render() { index = 0; const child = exports.default().props.children; return child.type(); },
  };
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

test("viewing another player loads their owned and member teams without exposing invitations", async () => {
  const page = harness("other");
  page.render();
  await flush();
  const markup = renderToStaticMarkup(page.render());
  assert.match(markup, /Other Player&#x27;s Teams/);
  assert.match(markup, /Winning Team/);
  assert.match(markup, /7<\/b>-<b class="l">0/);
  assert.match(markup, /src="\/logo.png"/);
  assert.equal((markup.match(/href="\/teams\/other-team"/g) || []).length, 1);
  assert.doesNotMatch(markup, /My Team|Pending Team Invites/);
  assert.equal(page.calls.some((call) => call.table === "team_invites"), false);
  assert.equal(page.calls.find((call) => call.table === "team_members").filters.user_id, "other");
});

test("switching from another player to your teams loads your own invitations and teams", async () => {
  const page = harness("other");
  page.render();
  await flush();
  page.render();
  page.setTarget("");
  assert.doesNotMatch(renderToStaticMarkup(page.render()), /Winning Team/);
  await flush();
  const markup = renderToStaticMarkup(page.render());
  assert.match(markup, /My Teams/);
  assert.match(markup, /My Team/);
  assert.equal(page.calls.find((call) => call.table === "team_invites").filters.user_id, "me");
});
