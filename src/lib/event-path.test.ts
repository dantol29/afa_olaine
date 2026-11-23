import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { eventIdFromSlug, eventPath, eventSlug } from "@/lib/event-path";

describe("event addresses", () => {
  test("put the title in Latin letters before the id", () => {
    assert.equal(eventPath(12, "Ziemas nometne — Ķekava 2026"), "/notikumi/ziemas-nometne-kekava-2026-12");
    assert.equal(eventSlug(5, "!!!"), "notikums-5");
  });

  test("read the id from the end, whatever the title part says", () => {
    assert.equal(eventIdFromSlug("ziemas-nometne-kekava-2026-12"), 12);
    assert.equal(eventIdFromSlug("vecs-nosaukums-12"), 12);
    assert.equal(eventIdFromSlug("12"), 12);
    assert.equal(eventIdFromSlug("ziemas-nometne"), null);
    assert.equal(eventIdFromSlug("nometne-0"), null);
  });
});
