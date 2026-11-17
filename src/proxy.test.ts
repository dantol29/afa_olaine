import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { NextRequest } from "next/server";

import { createSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import { config, proxy } from "@/proxy";

function adminRequest(pathname: string, sessionToken?: string) {
  const headers = new Headers();
  if (sessionToken !== undefined) headers.set("cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);
  return new NextRequest(`http://localhost:3000${pathname}`, { headers });
}

function isPassedThrough(response: Response) {
  return response.headers.get("x-middleware-next") === "1";
}

describe("admin proxy", () => {
  test("runs for every admin path", () => {
    assert.deepEqual(config.matcher, ["/admin/:path*"]);
  });

  test("sends visitors without a valid session to the login page", async () => {
    for (const token of [undefined, "", "garbage", `${Date.now() + 60_000}.forged`]) {
      for (const pathname of ["/admin", "/admin/teams", "/admin/jaunumi/1/edit"]) {
        const response = await proxy(adminRequest(pathname, token));
        assert.equal(response.status, 307, `${pathname} with ${token}`);
        assert.equal(response.headers.get("location"), "http://localhost:3000/admin/login");
      }
    }
  });

  test("lets the login page through without a session", async () => {
    assert.ok(isPassedThrough(await proxy(adminRequest("/admin/login"))));
  });

  test("lets a valid session through", async () => {
    const response = await proxy(adminRequest("/admin/teams", await createSessionToken()));
    assert.ok(isPassedThrough(response));
  });
});
