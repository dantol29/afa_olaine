import { sql } from "drizzle-orm";
import { generateSQLiteDrizzleJson, generateSQLiteMigration } from "drizzle-kit/api";

import { db } from "@/db/client";
import * as schema from "@/db/schema";

// Each test file runs in its own process with a fresh in-memory database (see test/setup.ts).
export { db };

/** Creates every table of the shared schema in the in-memory database, the way `drizzle-kit push` would. */
export async function applySchema(database: typeof db = db): Promise<void> {
  const statements = await generateSQLiteMigration(
    await generateSQLiteDrizzleJson({}),
    await generateSQLiteDrizzleJson(schema),
  );
  for (const statement of statements) await database.run(sql.raw(statement));
}

const CREATED_AT = Date.UTC(2026, 0, 1);

export async function insertTeam(values: Partial<typeof schema.teams.$inferInsert> = {}) {
  const [team] = await db
    .insert(schema.teams)
    .values({ name: "U11", createdAt: CREATED_AT, ...values })
    .returning();
  return team;
}

export async function insertGame(teamId: number, values: Partial<typeof schema.games.$inferInsert> = {}) {
  const [game] = await db
    .insert(schema.games)
    .values({
      teamId,
      homeTeam: "AFA Olaine",
      awayTeam: "FK Rīga",
      date: "2026-10-10",
      startTime: "12:00",
      endTime: "13:30",
      location: "Olaines pilsētas stadions",
      createdAt: CREATED_AT,
      ...values,
    })
    .returning();
  return game;
}

export async function insertTraining(teamIds: number[], values: Partial<typeof schema.trainings.$inferInsert> = {}) {
  const [training] = await db
    .insert(schema.trainings)
    .values({
      date: "2026-10-12",
      startTime: "17:00",
      endTime: "18:30",
      location: "Olaines sporta nams",
      createdAt: CREATED_AT,
      ...values,
    })
    .returning();
  if (teamIds.length > 0) {
    await db.insert(schema.trainingTeams).values(teamIds.map((teamId) => ({ trainingId: training.id, teamId })));
  }
  return training;
}

export async function insertEvent(values: Partial<typeof schema.events.$inferInsert> = {}) {
  const [event] = await db
    .insert(schema.events)
    .values({
      title: "Kluba sapulce",
      date: "2026-10-14",
      startTime: "18:00",
      endTime: "19:00",
      location: "Olaines pilsētas stadions",
      createdAt: CREATED_AT,
      ...values,
    })
    .returning();
  return event;
}

/** A club logo known by one or more exact names, as the calendar resolves them for games. */
export async function insertClubLogo(logoUrl: string, names: string[]) {
  const [logo] = await db.insert(schema.clubLogos).values({ logoUrl, createdAt: CREATED_AT }).returning();
  await db.insert(schema.clubLogoNames).values(names.map((name) => ({ clubLogoId: logo.id, name })));
  return logo;
}
