import assert from "node:assert/strict";
import { before, describe, test } from "node:test";

import { eq } from "drizzle-orm";

import { players, playerTeams } from "@/db/schema";
import { syncTopScorersForSource } from "@/lib/top-scorers-sync";
import { applySchema, db, insertTeam } from "../../test/db";
import { mockFetch, OTRA_LIGA_SCORERS_URL, readLffFixture } from "../../test/lff";

const page = readLffFixture("otra-liga-2026.html");

let teamCount = 0;
async function teamWithPlayers(roster: { name: string; goals: number }[]) {
  const team = await insertTeam({ name: `Pieaugušie ${++teamCount}` });
  for (const { name, goals } of roster) {
    const [player] = await db.insert(players).values({ name, birthdate: "2000-01-01", createdAt: 1 }).returning();
    await db.insert(playerTeams).values({ playerId: player.id, teamId: team.id, goals });
  }
  return team.id;
}

async function goalsByName(teamId: number) {
  const rows = await db
    .select({ name: players.name, goals: playerTeams.goals })
    .from(playerTeams)
    .innerJoin(players, eq(playerTeams.playerId, players.id))
    .where(eq(playerTeams.teamId, teamId));
  return Object.fromEntries(rows.map((row) => [row.name, row.goals]));
}

before(async () => {
  await applySchema();
});

describe("syncTopScorersForSource", () => {
  test("updates goals of AFA Olaine players matched by name, ignoring case and keeping Latvian letters", async (t) => {
    mockFetch(t, page);
    const teamId = await teamWithPlayers([
      { name: "Konstantīns Fjodorovs", goals: 6 },
      { name: "ELMĀRS ĢĒĢERS", goals: 1 },
      { name: " ņikita ponomarjovs ", goals: 0 },
      { name: "Kārlis Pūriņš", goals: 0 }, // Same name as an FK Ķekava / Auda scorer: must stay untouched.
    ]);

    const result = await syncTopScorersForSource({ teamId, topScorersUrl: OTRA_LIGA_SCORERS_URL });
    assert.equal(result.updated, 2, "an unchanged count is not an update");
    assert.deepEqual(result.unmatched, []);
    assert.deepEqual(result.details.map((row) => [row.name, row.goals, row.previousGoals]), [
      ["Konstantīns Fjodorovs", 6, 6],
      ["Elmārs Ģēģers", 4, 1],
      ["Ņikita Ponomarjovs", 2, 0],
    ]);
    assert.deepEqual(await goalsByName(teamId), {
      "Konstantīns Fjodorovs": 6,
      "ELMĀRS ĢĒĢERS": 4,
      " ņikita ponomarjovs ": 2,
      "Kārlis Pūriņš": 0,
    });
  });

  test("reports AFA Olaine scorers missing from the team without creating players", async (t) => {
    mockFetch(t, page);
    const teamId = await teamWithPlayers([{ name: "Konstantīns Fjodorovs", goals: 0 }]);
    const playersBefore = (await db.select().from(players)).length;

    const result = await syncTopScorersForSource({ teamId, topScorersUrl: OTRA_LIGA_SCORERS_URL });
    assert.equal(result.updated, 1);
    assert.deepEqual(result.unmatched, ["Elmārs Ģēģers", "Ņikita Ponomarjovs"]);
    assert.equal((await db.select().from(players)).length, playersBefore);
  });

  test("only changes the given team's tally when a player is on several teams", async (t) => {
    mockFetch(t, page);
    const teamId = await teamWithPlayers([{ name: "Konstantīns Fjodorovs", goals: 0 }]);
    const otherTeam = await insertTeam({ name: `U19 ${++teamCount}` });
    const [{ playerId }] = await db.select().from(playerTeams).where(eq(playerTeams.teamId, teamId));
    await db.insert(playerTeams).values({ playerId, teamId: otherTeam.id, goals: 9 });

    await syncTopScorersForSource({ teamId, topScorersUrl: OTRA_LIGA_SCORERS_URL });
    assert.deepEqual(await goalsByName(teamId), { "Konstantīns Fjodorovs": 6 });
    assert.deepEqual(await goalsByName(otherTeam.id), { "Konstantīns Fjodorovs": 9 });
  });

  test("a failed fetch is returned as an error and changes nothing", async (t) => {
    mockFetch(t, new Response("", { status: 404 }));
    const teamId = await teamWithPlayers([{ name: "Konstantīns Fjodorovs", goals: 1 }]);
    assert.deepEqual(await syncTopScorersForSource({ teamId, topScorersUrl: OTRA_LIGA_SCORERS_URL }), {
      updated: 0,
      unmatched: [],
      details: [],
      error: "Failed to fetch LFF top scorers: HTTP 404",
    });
    assert.deepEqual(await goalsByName(teamId), { "Konstantīns Fjodorovs": 1 });
  });
});
