import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const require = createRequire(import.meta.url);
const source = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "app", "teams", "[teamId]", "roster", "page.tsx"), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;

function harness({ role = "member", owner = "owner", roleError = null, delayedTeam = null } = {}) {
  const states = [];
  const effects = [];
  let index = 0;
  const auth = { user: null, loading: true };
  let queries = 0;
  const mockReact = {
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
    useMemo(fn) { index++; return fn(); },
    useCallback(fn, deps) {
      const position = index++;
      const previous = states[position];
      if (!previous || deps.some((value, i) => value !== previous.deps[i])) {
        states[position] = { deps, fn };
      }
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
  const team = { id: "team", owner_id: owner, name: "Team", ladder: "singles" };
  const supabase = {
    from(table) {
      let columns = "";
      const query = {
        select(value) { columns = value; return this; },
        eq() { return this; },
        maybeSingle() {
          queries++;
          if (table === "teams" && delayedTeam && queries === 1) return delayedTeam;
          return Promise.resolve(table === "teams"
            ? { data: team, error: null }
            : { data: roleError ? null : { role }, error: roleError });
        },
        then(resolve) {
          queries++;
          assert.equal(table, "team_members");
          assert.equal(columns, "*");
          return Promise.resolve({ data: [], error: null }).then(resolve);
        },
      };
      return query;
    },
  };
  const exports = {};
  const mockRequire = (name) => {
    if (name === "react") return mockReact;
    if (name === "next/navigation") return { useParams: () => ({ teamId: "team" }), useRouter: () => ({ push() {} }) };
    if (name.endsWith("/useUser")) return { useUser: () => auth };
    if (name.endsWith("/supabase")) return { supabase };
    if (name.endsWith("/ladderCatalog")) return { ladderPlatformLabel: () => "" };
    if (name.endsWith("/gamingAccounts")) return { resolveGamingAccountId: () => null };
    if (name.endsWith("/rapidRoyal")) return { rapidRoyalDisplayName: (value) => value };
    if (name.endsWith("/SiteNav") || name.endsWith("/TeamTabs")) return { __esModule: true, default: () => null };
    return require(name);
  };
  new Function("require", "exports", compiled)(mockRequire, exports);
  function render() {
    index = 0;
    return renderToStaticMarkup(exports.default());
  }
  return { auth, render, queryCount: () => queries };
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

test("waits for sign-in before checking roster permissions", async () => {
  const page = harness();
  assert.match(page.render(), /Loading roster/);
  assert.equal(page.queryCount(), 0);
  page.auth.user = { id: "owner" };
  page.auth.loading = false;
  assert.match(page.render(), /Loading roster/);
  await flush();
  const result = page.render();
  assert.doesNotMatch(result, /ACCESS DENIED/);
  assert.match(result, /TEAM ROSTER/i);
});

test("denies a real non-manager and reports lookup failures separately", async () => {
  const member = harness();
  member.auth.user = { id: "other" };
  member.auth.loading = false;
  member.render();
  await flush();
  assert.match(member.render(), /ACCESS DENIED/);

  const failed = harness({ roleError: { message: "Connection problem" } });
  failed.auth.user = { id: "owner" };
  failed.auth.loading = false;
  failed.render();
  await flush();
  assert.match(failed.render(), /Could not check roster permissions: Connection problem/);
  assert.doesNotMatch(failed.render(), /ACCESS DENIED/);
});

test("ignores an earlier team's response after the signed-in user changes", async () => {
  let release;
  const delayedTeam = new Promise((resolve) => { release = resolve; });
  const page = harness({ delayedTeam });
  page.auth.user = { id: "other" };
  page.auth.loading = false;
  page.render();
  await Promise.resolve();
  page.auth.user = { id: "owner" };
  assert.match(page.render(), /Loading roster/);
  await flush();
  assert.doesNotMatch(page.render(), /ACCESS DENIED/);
  release({ data: { id: "team", owner_id: "owner", name: "Team", ladder: "singles" }, error: null });
  await flush();
  const result = page.render();
  assert.doesNotMatch(result, /ACCESS DENIED/);
  assert.match(result, /TEAM ROSTER/i);
});

test("co-leaders retain roster access", async () => {
  const page = harness({ role: "co-leader" });
  page.auth.user = { id: "other" };
  page.auth.loading = false;
  page.render();
  await flush();
  assert.doesNotMatch(page.render(), /ACCESS DENIED/);
  assert.match(page.render(), /TEAM ROSTER/i);
});
