import "server-only";

import { lte, sql } from "drizzle-orm";

import { db } from "@/db/client";
import { adminLoginLimits } from "@/db/schema";

const WINDOW_MS = 10 * 60 * 1000;
const MAX_IP_ATTEMPTS = 3;
const MAX_ACCOUNT_ATTEMPTS = 12;

let tableReady: Promise<unknown> | undefined;

/** Existing installations do not run schema migrations during deployment. */
function ensureTable() {
  tableReady ??= db.run(sql`
    CREATE TABLE IF NOT EXISTS admin_login_limits (
      key TEXT PRIMARY KEY NOT NULL,
      count INTEGER NOT NULL,
      reset_at INTEGER NOT NULL
    )
  `).catch((error) => {
    tableReady = undefined;
    throw error;
  });
  return tableReady;
}

async function recordAttempt(key: string): Promise<number> {
  const now = Date.now();
  const resetAt = now + WINDOW_MS;
  const [row] = await db.insert(adminLoginLimits)
    .values({ key, count: 1, resetAt })
    .onConflictDoUpdate({
      target: adminLoginLimits.key,
      set: {
        count: sql`CASE WHEN ${adminLoginLimits.resetAt} <= ${now} THEN 1 ELSE ${adminLoginLimits.count} + 1 END`,
        resetAt: sql`CASE WHEN ${adminLoginLimits.resetAt} <= ${now} THEN ${resetAt} ELSE ${adminLoginLimits.resetAt} END`,
      },
    })
    .returning({ count: adminLoginLimits.count });
  return row.count;
}

/** Reserve an attempt before comparing the password, so concurrent requests
 * cannot all pass a separate read-then-write check. The account-wide bucket
 * runs first, limiting distributed guesses and bounding IP-row growth. */
export async function checkRateLimit(ip: string): Promise<boolean> {
  await ensureTable();
  const accountCount = await recordAttempt("admin-account");
  if (accountCount > MAX_ACCOUNT_ATTEMPTS) return false;

  await db.delete(adminLoginLimits).where(lte(adminLoginLimits.resetAt, Date.now()));
  const ipCount = await recordAttempt(`ip:${ip}`);
  return ipCount <= MAX_IP_ATTEMPTS;
}

export async function resetRateLimit(ip: string): Promise<void> {
  await db.delete(adminLoginLimits).where(sql`${adminLoginLimits.key} IN ('admin-account', ${`ip:${ip}`})`);
}
