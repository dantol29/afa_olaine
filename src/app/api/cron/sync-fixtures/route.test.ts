import assert from "node:assert/strict";
import { afterEach, before, beforeEach, describe, test, type TestContext } from "node:test";

import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import nodemailer from "nodemailer";

import { POST } from "@/app/api/cron/sync-fixtures/route";
import { cronJobStatuses, games, leagueSources } from "@/db/schema";
import { applySchema, db, insertTeam } from "../../../../../test/db";
import { mockFetch, OTRA_LIGA_FIXTURES_URL, OTRA_LIGA_STANDINGS_URL, readLffFixture } from "../../../../../test/lff";

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
async function addSource(label: string, url: string, standingsUrl: string | null = null) {
  const team = await insertTeam({ name: `Komanda ${++teamCount}` });
  await db.insert(leagueSources).values({ teamId: team.id, label, url, standingsUrl, createdAt: 1 });
  return team.id;
}

const SMTP_ENV = { SMTP_HOST: "smtp.test", SMTP_PORT: "587", SMTP_USER: "sync@afaolaine.test", SMTP_PASSWORD: "test-password" };
type SentMail = { to: string; subject: string; text: string };

/** Replaces the SMTP transport for the current test and returns the mails "sent" through it. */
function mockMailer(t: TestContext): SentMail[] {
  const sent: SentMail[] = [];
  t.mock.method(nodemailer, "createTransport", () => ({
    sendMail: async (mail: SentMail) => {
      sent.push(mail);
      return {};
    },
  }));
  return sent;
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

describe("POST /api/cron/sync-fixtures when the LFF layout may have changed", () => {
  afterEach(() => {
    for (const name of Object.keys(SMTP_ENV)) delete process.env[name];
  });

  test("a source whose fixtures and table parse fully is a success and sends no e-mail", async (t) => {
    Object.assign(process.env, SMTP_ENV);
    mockFetch(t, page);
    const sent = mockMailer(t);
    await addSource("2. līga", OTRA_LIGA_FIXTURES_URL, OTRA_LIGA_STANDINGS_URL);

    assert.equal((await (await runCron()).json()).status, "success");
    const status = await cronStatus();
    assert.deepEqual([status.status, status.message, status.lastEmailError], ["success", null, null]);
    assert.deepEqual(sent, []);
  });

  test("unrecognised match rows and a table without AFA Olaine mark the run partial and e-mail the admin", async (t) => {
    Object.assign(process.env, SMTP_ENV);
    // Unknown month in the fixtures tab, and AFA Olaine missing from every standings table.
    const changed = page
      .replace(/<h6>apr<\/h6>/g, "<h6>xyz</h6>")
      .replace(/(<div class="tr row"><div><span>7<\/span><\/div>.*?)AFA Olaine/, "$1AFA Riga");
    mockFetch(t, changed);
    const sent = mockMailer(t);
    await addSource("2. līga", OTRA_LIGA_FIXTURES_URL, OTRA_LIGA_STANDINGS_URL);
    const lastSuccessAt = (await cronStatus())?.lastSuccessAt ?? null;

    const body = await (await runCron()).json();
    assert.equal(body.status, "partial");
    assert.equal(body.importedCount, 2, "the rows that did parse are still imported");

    const status = await cronStatus();
    assert.equal(status.status, "partial");
    assert.equal(status.lastSuccessAt, lastSuccessAt, "a partial run keeps the last success time");
    assert.equal(status.lastEmailError, null);
    const lines = status.message?.split("\n") ?? [];
    assert.equal(lines.length, 2);
    assert.match(lines[0], /^2\. līga: 4 LFF spēļu rindas netika atpazītas un nav importētas \(piemēri: "/);
    assert.match(lines[1], /^2\. līga: tabulu neizdevās nolasīt: LFF standings: none of the 2 tables contains AFA Olaine/);

    assert.equal(sent.length, 1);
    assert.equal(sent[0].to, "info@afaolaine.lv");
    assert.equal(sent[0].subject, "AFA Olaine: LFF sinhronizācijai vajadzīga uzmanība");
    assert.ok(sent[0].text.includes(lines[0]) && sent[0].text.includes(lines[1]));
    assert.match(sent[0].text, /http:\/\/localhost:3000\/admin\/league-sources/);
  });

  test("without SMTP the run is still recorded and the mail problem is shown", async (t) => {
    mockFetch(t, page.replace(/<h6>apr<\/h6>/g, "<h6>xyz</h6>"));
    const sent = mockMailer(t);
    t.mock.method(console, "warn", () => {}); // The mailer warns that SMTP is not configured.
    await addSource("2. līga", OTRA_LIGA_FIXTURES_URL);

    assert.equal((await runCron()).status, 200);
    const status = await cronStatus();
    assert.equal(status.status, "partial");
    assert.match(status.lastEmailError ?? "", /SMTP nav konfigurēts/);
    assert.deepEqual(sent, []);
  });

  test("a failed fetch stays an error, and the unreadable table is still e-mailed", async (t) => {
    Object.assign(process.env, SMTP_ENV);
    mockFetch(t, new Response("", { status: 500 }));
    const sent = mockMailer(t);
    await addSource("2. līga", OTRA_LIGA_FIXTURES_URL, OTRA_LIGA_STANDINGS_URL);

    await runCron();
    const status = await cronStatus();
    assert.equal(status.status, "error");
    assert.equal(
      status.message,
      "2. līga: Failed to fetch LFF fixtures: HTTP 500\n2. līga: tabulu neizdevās nolasīt: Failed to fetch LFF standings: HTTP 500",
    );
    // The home page now hides this league's table, so the admin hears about it.
    assert.equal(sent.length, 1);
  });
});
