import "dotenv/config";

import { readFile } from "node:fs/promises";

import { and, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { playerTeams, players, teams } from "@/db/schema";
import { parseLffRosterHtml } from "@/lib/lff-roster";

async function main() {
  const sourcePath = process.argv[2];
  const sourceUrl = process.argv[3];
  if (!sourcePath || !sourceUrl) throw new Error("Usage: tsx src/scripts/import-lff-roster.ts <html-file> <source-url>");

  const html = await readFile(sourcePath, "utf8");
  const roster = parseLffRosterHtml(html, sourceUrl);
  const team = await db.query.teams.findFirst({ where: eq(teams.name, "2. liga") });
  if (!team) throw new Error('The existing "2. liga" team was not found');

  let added = 0;
  let linked = 0;
  for (const row of roster) {
    let player = await db.query.players.findFirst({ where: eq(players.name, row.name) });
    if (!player) {
      const [inserted] = await db.insert(players).values({
        name: row.name,
        birthdate: row.birthdate,
        photoUrl: row.photoUrl,
        number: null,
        position: row.position,
        createdAt: Date.now(),
      }).returning();
      player = inserted;
      added += 1;
    } else if (row.position !== null && player.position !== row.position) {
      await db.update(players).set({ position: row.position }).where(eq(players.id, player.id));
    }

    const membership = await db.query.playerTeams.findFirst({
      where: and(eq(playerTeams.playerId, player.id), eq(playerTeams.teamId, team.id)),
    });
    if (!membership) {
      await db.insert(playerTeams).values({ playerId: player.id, teamId: team.id, goals: 0 });
      linked += 1;
    }
  }

  console.log(`Imported ${roster.length} LFF roster entries; added ${added} players and linked ${linked} players to ${team.name}.`);
}

void main();
