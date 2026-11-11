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
  assert.match(stats, /<td>\{cleanTeamPlace\}/);
  assert.match(stats, /rankMovement > 0 \? "▲" : "▼"/);
  assert.match(stats, /rankMovement !== null && rankMovement !== 0/);
  assert.match(stats, /<td>\{teamStreak\}<\/td>\s*<td>\{teamBestStreak\}<\/td>/);
});

test("team page combines upcoming and recent matches into an accessible table", () => {
  const source = readFileSync(new URL("../app/teams/[teamId]/page.tsx", import.meta.url), "utf8");
  assert.match(source, /Upcoming & Recent Matches/);
  assert.doesNotMatch(source, /panel-title">Challenges/);
  for (const heading of ["Date", "Time", "Opponent", "Result", "Match Details"]) {
    assert.match(source, new RegExp(`<th>${heading}</th>`));
  }
  assert.match(source, /className="match-table"/);
  assert.match(source, /\.match-scroll\{max-height:166px;overflow:auto/);
  assert.match(source, /matchListDate\(match\.match_time, match\.completed_at\)/);
  assert.match(source, /\.match-table\{width:100%;min-width:620px;table-layout:fixed;/);
  assert.match(source, /\.match-table th,\.match-table td\{width:20%;/);
  assert.match(source, />\{date\.text\}<\/td>/);
  assert.doesNotMatch(source, /\(completed\)/);
  assert.match(source, /role="alert">\{matchesError\}/);
});
