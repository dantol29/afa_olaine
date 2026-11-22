import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { copyHref, copySourceId } from "@/lib/admin-copy";

describe("copySourceId", () => {
  test("reads the id to copy from", () => {
    assert.equal(copySourceId({ kopija: "12" }), 12);
    assert.equal(copySourceId({ kopija: ["7", "8"] }), 7);
  });

  test("ignores a missing or malformed id", () => {
    for (const value of [undefined, "", "0", "-1", "1.5", "abc", "12x"]) {
      assert.equal(copySourceId({ kopija: value }), null, String(value));
    }
  });
});

test("copyHref links to the new-record form with the source id", () => {
  assert.equal(copyHref("games", 5), "/admin/games/new?kopija=5");
});
