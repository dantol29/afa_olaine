import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { clientIpFromForwardedFor } from "@/lib/client-ip";

describe("clientIpFromForwardedFor", () => {
  test("uses the last entry, which the reverse proxy appends", () => {
    assert.equal(clientIpFromForwardedFor("203.0.113.9"), "203.0.113.9");
    assert.equal(clientIpFromForwardedFor("1.1.1.1, 2.2.2.2 ,  203.0.113.9 "), "203.0.113.9");
  });

  test("ignores empty entries", () => {
    assert.equal(clientIpFromForwardedFor("203.0.113.9, ,"), "203.0.113.9");
  });

  test("falls back to one shared bucket without a usable header", () => {
    assert.equal(clientIpFromForwardedFor(null), "unknown");
    assert.equal(clientIpFromForwardedFor(""), "unknown");
    assert.equal(clientIpFromForwardedFor(" , "), "unknown");
  });
});
