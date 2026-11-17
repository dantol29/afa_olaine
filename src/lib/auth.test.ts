import assert from "node:assert/strict";
import { afterEach, describe, mock, test } from "node:test";

import { createSessionToken, SESSION_MAX_AGE_SECONDS, verifySessionToken } from "@/lib/auth";

const NOW = Date.UTC(2026, 9, 1, 12);

afterEach(() => mock.timers.reset());

/** Runs `action` with SESSION_SECRET set to `secret` (or unset), restoring the test value afterwards. */
async function withSecret<T>(secret: string | undefined, action: () => Promise<T>): Promise<T> {
  const original = process.env.SESSION_SECRET;
  if (secret === undefined) delete process.env.SESSION_SECRET;
  else process.env.SESSION_SECRET = secret;
  try {
    return await action();
  } finally {
    process.env.SESSION_SECRET = original;
  }
}

describe("session tokens", () => {
  test("a fresh token is valid until it expires", async () => {
    mock.timers.enable({ apis: ["Date"], now: NOW });
    const token = await createSessionToken();
    assert.equal(token.split(".")[0], String(NOW + SESSION_MAX_AGE_SECONDS * 1000));
    assert.equal(await verifySessionToken(token), true);

    mock.timers.tick(SESSION_MAX_AGE_SECONDS * 1000);
    assert.equal(await verifySessionToken(token), true);
    mock.timers.tick(1);
    assert.equal(await verifySessionToken(token), false);
  });

  test("a token with a changed expiry or signature is rejected", async () => {
    const token = await createSessionToken();
    const [payload, signature] = token.split(".");
    assert.equal(await verifySessionToken(`${Number(payload) + 1000}.${signature}`), false);
    const flipped = signature.startsWith("A") ? `B${signature.slice(1)}` : `A${signature.slice(1)}`;
    assert.equal(await verifySessionToken(`${payload}.${flipped}`), false);
  });

  test("a token signed with another secret is rejected", async () => {
    const token = await withSecret("another-secret", createSessionToken);
    assert.equal(await verifySessionToken(token), false);
  });

  test("garbage and missing tokens are rejected without throwing", async () => {
    const future = String(Date.now() + 60_000);
    for (const token of [undefined, "", ".", "abc", `${future}.`, `.${future}`, "NaN.abc", `${future}.!!!`, `${future}.abc.def`]) {
      assert.equal(await verifySessionToken(token), false, String(token));
    }
  });

  test("without SESSION_SECRET no token is issued and none is accepted", async () => {
    const token = await createSessionToken();
    await withSecret(undefined, async () => {
      await assert.rejects(createSessionToken(), /SESSION_SECRET/);
      assert.equal(await verifySessionToken(token), false);
    });
  });
});
