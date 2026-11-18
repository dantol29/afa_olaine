import assert from "node:assert/strict";
import { afterEach, before, beforeEach, describe, mock, test } from "node:test";

import { adminLoginLimits } from "@/db/schema";
import { checkRateLimit, resetRateLimit } from "@/lib/rate-limit";
import { applySchema, db } from "../../test/db";

// The limits as the login form promises them ("Mēģini vēlreiz pēc 10 minūtēm"), restated independently of the code.
const WINDOW_MS = 10 * 60 * 1000;
const IP_ATTEMPTS = 3;
const ACCOUNT_ATTEMPTS = 12;

async function attempts(ip: string, count: number): Promise<boolean[]> {
  const results: boolean[] = [];
  for (let index = 0; index < count; index++) results.push(await checkRateLimit(ip));
  return results;
}

before(() => applySchema());

beforeEach(async () => {
  await db.delete(adminLoginLimits);
  mock.timers.enable({ apis: ["Date"], now: Date.UTC(2026, 10, 1, 12) });
});

afterEach(() => mock.timers.reset());

describe("login rate limit", () => {
  test(`allows ${IP_ATTEMPTS} attempts per IP in the window and refuses the next`, async () => {
    assert.deepEqual(await attempts("ip-a", IP_ATTEMPTS + 1), [true, true, true, false]);
    assert.equal(await checkRateLimit("ip-b"), true, "another IP has its own bucket");
  });

  test(`allows ${ACCOUNT_ATTEMPTS} attempts in total, whatever the IP`, async () => {
    for (let index = 0; index < ACCOUNT_ATTEMPTS; index++) {
      assert.equal(await checkRateLimit(`ip-${index}`), true, `attempt ${index + 1}`);
    }
    assert.equal(await checkRateLimit("fresh-ip"), false);
  });

  test("opens again once the window has passed, counted from the first attempt", async () => {
    await attempts("ip-a", IP_ATTEMPTS);
    mock.timers.tick(WINDOW_MS / 2);
    assert.equal(await checkRateLimit("ip-a"), false, "a refused attempt must not extend the window");
    mock.timers.tick(WINDOW_MS / 2 - 1);
    assert.equal(await checkRateLimit("ip-a"), false);
    mock.timers.tick(1);
    assert.deepEqual(await attempts("ip-a", IP_ATTEMPTS + 1), [true, true, true, false]);
  });

  test("a successful login clears the IP and the account counters", async () => {
    await attempts("ip-a", IP_ATTEMPTS + 1);
    await resetRateLimit("ip-a");
    assert.deepEqual(await attempts("ip-a", IP_ATTEMPTS + 1), [true, true, true, false]);
  });

  test("a successful login also reopens the account-wide limit", async () => {
    for (let index = 0; index < ACCOUNT_ATTEMPTS; index++) await checkRateLimit(`ip-${index}`);
    await resetRateLimit("ip-0");
    assert.equal(await checkRateLimit("fresh-ip"), true);
  });

  test("resetting one IP leaves other IPs blocked", async () => {
    await attempts("ip-a", IP_ATTEMPTS);
    await attempts("ip-b", IP_ATTEMPTS);
    await resetRateLimit("ip-a");
    assert.equal(await checkRateLimit("ip-b"), false);
  });

  test("removes expired rows so the table does not grow with every IP", async () => {
    await attempts("ip-a", 1);
    mock.timers.tick(WINDOW_MS);
    await attempts("ip-b", 1);
    const keys = (await db.select({ key: adminLoginLimits.key }).from(adminLoginLimits)).map((row) => row.key).sort();
    assert.deepEqual(keys, ["admin-account", "ip:ip-b"]);
  });
});
