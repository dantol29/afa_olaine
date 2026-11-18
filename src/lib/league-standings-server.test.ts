import assert from "node:assert/strict";
import { before, describe, test } from "node:test";

import { leagueSources } from "@/db/schema";
import { getLeagueStandingsForDisplay } from "@/lib/league-standings-server";
import { applySchema, db, insertTeam } from "../../test/db";
import { mockFetch, OTRA_LIGA_FIXTURES_URL, OTRA_LIGA_STANDINGS_URL, readLffFixture } from "../../test/lff";

const page = readLffFixture("otra-liga-2026.html");

before(async () => {
  await applySchema();
  const team = await insertTeam({ name: "Pieaugušie" });
  await db.insert(leagueSources).values({
    teamId: team.id,
    label: "2. līga",
    url: OTRA_LIGA_FIXTURES_URL,
    standingsUrl: OTRA_LIGA_STANDINGS_URL,
    isMainLeague: true,
    createdAt: 1,
  });
});

// React's cache() around getLeagueStandingsForDisplay only caches inside a server render, so each call here reads
// again. The home page block (LeagueStandingsSection) renders nothing when the main league has no rows.

describe("getLeagueStandingsForDisplay", () => {
  test("shows the table that contains AFA Olaine", async (t) => {
    mockFetch(t, page);
    const [league] = await getLeagueStandingsForDisplay();
    assert.equal(league.label, "2. līga");
    assert.ok(league.standings.some((row) => row.team === "AFA Olaine"));
  });

  test("shows no rows, never another group's table, when no table contains AFA Olaine", async (t) => {
    mockFetch(t, page.replace(/AFA Olaine/g, "AFA Riga"));
    const [league] = await getLeagueStandingsForDisplay();
    assert.equal(league.label, "2. līga");
    assert.deepEqual(league.standings, []);
  });
});
