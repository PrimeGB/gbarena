import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

test("team header omits rank without shifting match actions; stats retain place and errors", () => {
  const source = readFileSync(new URL("../app/teams/[teamId]/page.tsx", import.meta.url), "utf8");
  const header = source.slice(source.indexOf('<div className="team-info">'), source.indexOf('<div className="panel-title">Team Stats</div>'));
  const stats = source.slice(source.indexOf('<div className="panel-title">Team Stats</div>'));
  assert.doesNotMatch(header, /Team Rank:/);
  assert.match(header, /className="team-header-spacer" aria-hidden="true"/);
  assert.match(source, /\.team-header-spacer\{height:23px;\}/);
  assert.match(header, /Achievements: None/);
  assert.match(header, /Create Match/);
  assert.match(header, /Match Finder/);
  assert.match(stats, /teamRankError/);
  assert.match(stats, /<td>\{cleanTeamPlace\}<\/td>/);
});
