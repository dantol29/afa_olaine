import { readFileSync } from "node:fs";
import path from "node:path";
import type { TestContext } from "node:test";

// Trimmed copies of real lff.lv pages; see test/fixtures/lff/README.md for where they come from.
const FIXTURE_DIR = path.join(process.cwd(), "test/fixtures/lff");

export const OTRA_LIGA_PAGE = "https://lff.lv/sacensibas/viriesi/otra-liga/";
/** The tabs of the same page that the league source in the admin points at, as stored in league_sources. */
export const OTRA_LIGA_FIXTURES_URL = `${OTRA_LIGA_PAGE}?tab=content_1_2`;
export const OTRA_LIGA_STANDINGS_URL = `${OTRA_LIGA_PAGE}?tab=content_1_4`;
export const OTRA_LIGA_SCORERS_URL = `${OTRA_LIGA_PAGE}?tab=content_1_5`;
export const FUTSAL_UPCOMING_URL = "https://lff.lv/sacensibas/telpu-futbols/virsliga/?tab=content_1_1";

export function readLffFixture(name: "otra-liga-2026.html" | "telpu-futbols-virsliga-2026.html"): string {
  return readFileSync(path.join(FIXTURE_DIR, name), "utf8");
}

type FetchReply = string | Response | Error | ((url: string) => string | Response | Promise<Response>);

function toResponse(reply: string | Response): Response {
  return typeof reply === "string"
    ? new Response(reply, { status: 200, headers: { "content-type": "text/html; charset=utf-8" } })
    : reply;
}

/** Replaces global fetch until the end of the current test, answering every request with `reply`, so no test
 *  reaches the real network. Returns the requested URLs in order. */
export function mockFetch(t: TestContext, reply: FetchReply): string[] {
  const calls: string[] = [];
  t.mock.method(globalThis, "fetch", async (input: string | URL | Request) => {
    const url = input instanceof Request ? input.url : String(input);
    calls.push(url);
    if (reply instanceof Error) throw reply;
    if (typeof reply === "function") return toResponse(await reply(url));
    // A Response body can be read once, so hand out a copy each time.
    return reply instanceof Response ? reply.clone() : toResponse(reply);
  });
  return calls;
}
