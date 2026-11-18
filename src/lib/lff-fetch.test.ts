import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { absoluteLffUrl, fetchLffHtml, normalizeLffText } from "@/lib/lff-fetch";
import { mockFetch, OTRA_LIGA_FIXTURES_URL, readLffFixture } from "../../test/lff";

const page = readLffFixture("otra-liga-2026.html");
const FETCH_TIMEOUT_MS = 12_000;
const RETRY_DELAY_MS = 250;

describe("fetchLffHtml", () => {
  test("returns the page HTML for an https URL on lff.lv or its subdomain", async (t) => {
    const calls = mockFetch(t, page);
    assert.equal(await fetchLffHtml(OTRA_LIGA_FIXTURES_URL, "fixtures"), page);
    assert.equal(await fetchLffHtml("https://www.lff.lv/sacensibas/", "fixtures"), page);
    assert.deepEqual(calls, [OTRA_LIGA_FIXTURES_URL, "https://www.lff.lv/sacensibas/"]);
  });

  test("rejects other hosts and schemes without making a request", async (t) => {
    const calls = mockFetch(t, page);
    for (const url of [
      "http://lff.lv/sacensibas/",
      "https://example.com/sacensibas/",
      "https://lff.lv.example.com/",
      "https://notlff.lv/",
      "https://lff.lv@example.com/",
      "javascript:alert(1)",
      "file:///etc/passwd",
      "data:text/html,<html></html>",
    ]) {
      await assert.rejects(fetchLffHtml(url, "standings"), /^Error: Invalid LFF standings URL: /, url);
    }
    await assert.rejects(fetchLffHtml("lff.lv/sacensibas/", "fixtures"), TypeError, "a URL without a scheme does not parse");
    assert.deepEqual(calls, []);
  });

  test("a non-200 response is retried once, then reported with the status", async (t) => {
    const calls = mockFetch(t, new Response("Service Unavailable", { status: 503 }));
    await assert.rejects(fetchLffHtml(OTRA_LIGA_FIXTURES_URL, "fixtures"), /^Error: Failed to fetch LFF fixtures: HTTP 503$/);
    assert.equal(calls.length, 2);
  });

  test("a failed first attempt is recovered by the retry", async (t) => {
    let attempt = 0;
    const calls = mockFetch(t, () => (++attempt === 1 ? new Response("", { status: 502 }) : page));
    assert.equal(await fetchLffHtml(OTRA_LIGA_FIXTURES_URL, "fixtures"), page);
    assert.equal(calls.length, 2);
  });

  test("rejects a response that is not an HTML page", async (t) => {
    const cases: [Response, RegExp][] = [
      [new Response(page, { headers: { "content-type": "application/json" } }), /unexpected content type application\/json/],
      [new Response("<html></html>", { headers: { "content-type": "text/html" } }), /response was unexpectedly short/],
      [new Response("x".repeat(600), { headers: { "content-type": "text/html" } }), /response was not HTML/],
      [new Response("<html>" + "x".repeat(5_000_001), { headers: { "content-type": "text/html" } }), /response was unexpectedly large/],
    ];
    for (const [response, message] of cases) {
      const calls = mockFetch(t, response);
      await assert.rejects(fetchLffHtml(OTRA_LIGA_FIXTURES_URL, "fixtures"), message);
      assert.equal(calls.length, 2);
      t.mock.restoreAll();
    }
  });

  test("a request that hangs is aborted after the timeout, on both attempts", async (t) => {
    t.mock.timers.enable({ apis: ["setTimeout"] });
    const signals: AbortSignal[] = [];
    t.mock.method(globalThis, "fetch", (_url: URL, init: RequestInit) => {
      const signal = init.signal as AbortSignal;
      signals.push(signal);
      return new Promise((_, reject) => signal.addEventListener("abort", () => reject(signal.reason)));
    });

    const result = fetchLffHtml(OTRA_LIGA_FIXTURES_URL, "fixtures");
    let settled = false;
    // Handled by assert.rejects below; also avoids an unhandled rejection while time is advanced.
    result.catch(() => {}).finally(() => { settled = true; });
    const settle = () => new Promise((resolve) => setImmediate(resolve));
    await settle();
    t.mock.timers.tick(FETCH_TIMEOUT_MS - 1);
    await settle();
    assert.equal(signals[0].aborted, false);
    t.mock.timers.tick(1);
    await settle();
    t.mock.timers.tick(RETRY_DELAY_MS);
    await settle();
    t.mock.timers.tick(FETCH_TIMEOUT_MS);
    await settle();

    // Checked before awaiting, so a timeout that no longer fires fails here instead of hanging the run.
    assert.equal(settled, true, "the request must give up once both attempts time out");
    await assert.rejects(result, /^Error: Failed to fetch LFF fixtures: This operation was aborted$/);
    assert.equal(signals.length, 2);
    assert.ok(signals.every((signal) => signal.aborted));
  });

  test("a network error is reported with its message", async (t) => {
    mockFetch(t, new TypeError("fetch failed"));
    await assert.rejects(fetchLffHtml(OTRA_LIGA_FIXTURES_URL, "top scorers"), /^Error: Failed to fetch LFF top scorers: fetch failed$/);
  });
});

describe("LFF text and URL helpers", () => {
  test("normalizeLffText collapses non-breaking spaces and whitespace", () => {
    assert.equal(normalizeLffText("  FK  Ķekava /\n Auda  "), "FK Ķekava / Auda");
  });

  test("absoluteLffUrl resolves relative paths and keeps absolute ones", () => {
    assert.equal(absoluteLffUrl("/files/logo.png", OTRA_LIGA_FIXTURES_URL), "https://lff.lv/files/logo.png");
    assert.equal(absoluteLffUrl("https://cdn.example.com/a.png", OTRA_LIGA_FIXTURES_URL), "https://cdn.example.com/a.png");
    assert.equal(absoluteLffUrl(undefined, OTRA_LIGA_FIXTURES_URL), null);
    assert.equal(absoluteLffUrl("", OTRA_LIGA_FIXTURES_URL), null);
  });
});
