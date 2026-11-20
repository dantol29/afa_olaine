import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { teamTabFromSearchParam } from "@/lib/team-page";

describe("teamTabFromSearchParam", () => {
  test("opens the staff tab only for ?skats=treneri", () => {
    assert.equal(teamTabFromSearchParam("treneri"), "staff");
  });

  test("falls back to players for a missing or unknown value", () => {
    assert.equal(teamTabFromSearchParam(undefined), "players");
    assert.equal(teamTabFromSearchParam(""), "players");
    assert.equal(teamTabFromSearchParam("speletaji"), "players");
    assert.equal(teamTabFromSearchParam("xyz"), "players");
  });

  test("uses the first value of a repeated param", () => {
    assert.equal(teamTabFromSearchParam(["treneri"]), "staff");
    assert.equal(teamTabFromSearchParam(["treneri", "speletaji"]), "staff");
    assert.equal(teamTabFromSearchParam(["speletaji", "treneri"]), "players");
  });
});
