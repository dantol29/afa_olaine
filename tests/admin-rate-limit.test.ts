import assert from "node:assert/strict";

// server-only is a Next.js bundling guard; the limiter itself runs in Node.
require.cache[require.resolve("server-only")] = { exports: {} } as NodeModule;
// eslint-disable-next-line @typescript-eslint/no-require-imports -- load after stubbing Next's server-only guard
const { checkRateLimit } = require("../src/lib/rate-limit.ts") as typeof import("../src/lib/rate-limit");

const firstIp = "test-admin-ip-1";
assert.equal(checkRateLimit(firstIp), true, "first login attempt is allowed");
assert.equal(checkRateLimit(firstIp), true, "second login attempt is allowed");
assert.equal(checkRateLimit(firstIp), true, "third login attempt is allowed");
assert.equal(checkRateLimit(firstIp), false, "fourth login attempt from the same IP is blocked");
assert.equal(checkRateLimit("test-admin-ip-2"), true, "another IP has its own limit");

console.log("admin login allows three attempts per IP per window");
