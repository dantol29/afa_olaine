import assert from "node:assert/strict";
import { before, beforeEach, describe, test } from "node:test";

import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";

import { POST } from "@/app/api/cron/sync-fixtures/route";
import { cronJobStatuses, games, leagueSources } from "@/db/schema";
import { applySchema, db, insertTeam } from "../../../../../test/db";
import { mockFetch, OTRA_LIGA_FIXTURES_URL, readLffFixture } from "../../../../../test/lff";

const page = readLffFixture("otra-liga-2026.html");

function runCron() {
  const headers = new Headers({ authorization: `Bearer ${process.env.CRON_SECRET}` });
  return POST(new NextRequest("http://localhost:3000/api/cron/sync-fixtures", { method: "POST", headers }));
}

async function cronStatus() {
  const [row] = await db.select().from(cronJobStatuses).where(eq(cronJobStatuses.job, "sync-fixtures"));
  return row;
}

let teamCount = 0;
async function addSource(label: string, url: string) {
  const team = await insertTeam({ name: `Komanda ${++teamCount}` });
  await db.insert(leagueSources).values({ teamId: team.id, label, url, createdAt: 1 });
  return team.id;
}

before(async () => {
  await applySchema();
});

beforeEach(async () => {
  await db.delete(games);
  await db.delete(leagueSources);
});

describe("POST /api/cron/sync-fixtures", () => {
  test("records success with the imported count", async (t) => {
    mockFetch(t, page);
    await addSource("2. līga", OTRA_LIGA_FIXTURES_URL);

    const response = await runCron();
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.status, "success");
    assert.equal(body.importedCount, 4);

    const status = await cronStatus();
    assert.equal(status.status, "success");
    assert.equal(status.importedCount, 4);
    assert.equal(status.needsReviewCount, 0);
    assert.equal(status.message, null);
    assert.equal(status.lastEmailError, null);
    assert.equal(status.lastSuccessAt, status.finishedAt);
  });

  test("records partial when one source fails, naming it, and error when all fail", async (t) => {
    mockFetch(t, page);
    await addSource("2. līga", OTRA_LIGA_FIXTURES_URL);
    await addSource("Nepareizs avots", "https://example.com/speles");

    let body = await (await runCron()).json();
    assert.equal(body.status, "partial");
    let status = await cronStatus();
    assert.equal(status.status, "partial");
    assert.equal(status.message, "Nepareizs avots: Invalid LFF fixtures URL: https://example.com/speles");
    const lastSuccessAt = status.lastSuccessAt;

    await db.delete(leagueSources).where(eq(leagueSources.label, "2. līga"));
    body = await (await runCron()).json();
    assert.equal(body.status, "error");
    status = await cronStatus();
    assert.equal(status.status, "error");
    assert.equal(status.lastSuccessAt, lastSuccessAt, "a failed run keeps the last success time");
  });

  test("counts games whose time changed on LFF and records why the notification email was not sent", async (t) => {
    mockFetch(t, page);
    const teamId = await addSource("2. līga", OTRA_LIGA_FIXTURES_URL);
    await runCron();
    await db.update(games).set({ startTime: "12:00" }).where(eq(games.teamId, teamId));
    t.mock.method(console, "warn", () => {}); // The mailer warns that SMTP is not configured.

    const body = await (await runCron()).json();
    assert.equal(body.status, "success");
    assert.equal(body.importedCount, 0);
    const status = await cronStatus();
    assert.equal(status.needsReviewCount, 4);
    // Tests run without SMTP settings, so the email is skipped and the reason is stored for the admin.
    assert.match(status.lastEmailError ?? "", /SMTP nav konfigurēts/);
  });
});
