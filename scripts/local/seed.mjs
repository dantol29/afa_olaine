// Fills an empty local database with the minimum the site needs to run: the
// main team, the LFF league source and fake club contacts, so no notification
// ever addresses a real mailbox. Does nothing when the database already has
// teams, so reruns keep your data.
//
// A private fuller dataset can replace this: if .local/seed.mjs exists (the
// folder is git-ignored), it runs instead of the code below.
import { existsSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { createDatabase } from "@olaine/database/client";
import { leagueSources, siteSettings, teams } from "@olaine/database/schema";

const PRIVATE_SEED = path.resolve(".local/seed.mjs");

// Values from the LFF admin form for the men's 2nd league.
const LEAGUE_SOURCE = {
  label: "2. līga",
  isMainLeague: true,
  url: "https://lff.lv/sacensibas/viriesi/otra-liga/?tab=content_1_2",
  standingsUrl: "https://lff.lv/sacensibas/viriesi/otra-liga/?tab=content_1_4",
  topScorersUrl: "https://lff.lv/sacensibas/viriesi/otra-liga/?tab=content_1_5",
  displayOrder: 0,
};

// Reserved .test domain and obviously fake identifiers: never real recipients.
const FAKE_SITE_SETTINGS = {
  id: 1,
  legalName: 'Biedrība "AFA Olaine" (lokālā kopija)',
  legalAddress: "Testa iela 1, Olaine, LV-0000",
  regNr: "00000000000",
  bankName: "Testa banka",
  bankAccount: "LV00TEST0000000000000",
  bankCode: "TESTLV00",
  stadiumAddress: "Testa stadions, Olaine",
  phone: "+371 00000000",
  email: "info@afaolaine.test",
};

async function seedMinimal() {
  const db = createDatabase();
  const existingTeams = await db.select({ id: teams.id }).from(teams).limit(1);
  if (existingTeams.length) {
    console.log("Local database already has data; seed skipped.");
    return;
  }

  const now = Date.now();
  const [mainTeam] = await db
    .insert(teams)
    .values({ name: "2. liga", isMain: true, createdAt: now })
    .returning({ id: teams.id });
  await db.insert(leagueSources).values({ ...LEAGUE_SOURCE, teamId: mainTeam.id, createdAt: now });
  await db
    .insert(siteSettings)
    .values({ ...FAKE_SITE_SETTINGS, updatedAt: now })
    .onConflictDoNothing();
  console.log("Seeded the main team, LFF source and fake contacts (minimal seed).");
}

if (existsSync(PRIVATE_SEED)) {
  console.log("Using private seed .local/seed.mjs");
  await import(pathToFileURL(PRIVATE_SEED).href);
} else {
  await seedMinimal();
}
