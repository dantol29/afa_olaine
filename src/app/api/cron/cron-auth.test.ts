import assert from "node:assert/strict";
import { after, before, beforeEach, describe, mock, test } from "node:test";

import { NextRequest } from "next/server";

import { cronJobStatuses } from "@/db/schema";
import * as syncFixtures from "@/app/api/cron/sync-fixtures/route";
import * as syncTopScorers from "@/app/api/cron/sync-top-scorers/route";
import { applySchema, db } from "../../../../test/db";

const SECRET = process.env.CRON_SECRET;

// No league sources exist, so an authorised run has nothing to fetch; any network call is a test failure.
const fetchMock = mock.method(globalThis, "fetch", async () => {
  throw new Error("cron tests must not reach the network");
});

before(() => applySchema());
beforeEach(() => db.delete(cronJobStatuses));
after(() => fetchMock.mock.restore());

const ROUTES = [
  { job: "sync-fixtures", handlers: syncFixtures },
  { job: "sync-top-scorers", handlers: syncTopScorers },
] as const;

for (const { job, handlers } of ROUTES) {
  function call(method: "GET" | "POST", { authorization, query = "" }: { authorization?: string; query?: string } = {}) {
    const headers = new Headers();
    if (authorization !== undefined) headers.set("authorization", authorization);
    const request = new NextRequest(`http://localhost:3000/api/cron/${job}${query}`, { method, headers });
    return handlers[method](request);
  }

  async function assertUnauthorized(response: Response) {
    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { error: "Unauthorized" });
    assert.match(response.headers.get("cache-control") ?? "", /no-store/);
    assert.deepEqual(await db.select().from(cronJobStatuses), [], "a refused request must not record a run");
  }

  describe(`/api/cron/${job}`, () => {
    test("refuses a request without credentials", async () => {
      await assertUnauthorized(await call("POST"));
      await assertUnauthorized(await call("GET"));
    });

    test("refuses a wrong or malformed Bearer token", async () => {
      await assertUnauthorized(await call("POST", { authorization: "Bearer wrong" }));
      await assertUnauthorized(await call("POST", { authorization: `Basic ${SECRET}` }));
      await assertUnauthorized(await call("POST", { authorization: SECRET }));
    });

    test("ignores ?secret= when a Bearer header is sent", async () => {
      await assertUnauthorized(await call("POST", { authorization: "Bearer wrong", query: `?secret=${SECRET}` }));
    });

    test("refuses everything while CRON_SECRET is not set", async () => {
      delete process.env.CRON_SECRET;
      try {
        await assertUnauthorized(await call("POST", { authorization: "Bearer " }));
        await assertUnauthorized(await call("POST", { authorization: "Bearer undefined" }));
        await assertUnauthorized(await call("GET", { query: "?secret=" }));
      } finally {
        process.env.CRON_SECRET = SECRET;
      }
    });

    test("runs with the right Bearer token, or the legacy ?secret= parameter", async () => {
      for (const response of [
        await call("POST", { authorization: `Bearer ${SECRET}` }),
        await call("GET", { query: `?secret=${SECRET}` }),
      ]) {
        assert.equal(response.status, 200);
        assert.equal((await response.json()).status, "success");
      }
      const [status] = await db.select().from(cronJobStatuses);
      assert.equal(status.job, job);
      assert.equal(status.status, "success");
      assert.equal(fetchMock.mock.callCount(), 0);
    });
  });
}
