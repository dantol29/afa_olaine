import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { TEAM_ORDER_CHANGED_ERROR, parseTeamOrder } from "@/lib/admin-input/team-order";

describe("parseTeamOrder", () => {
  test("accepts every current team once, in the new order", () => {
    assert.deepEqual(parseTeamOrder([5, 1, 3], [1, 3, 5]), { teamIds: [5, 1, 3] });
  });

  test("refuses an order that misses a team or names an unknown one", () => {
    assert.deepEqual(parseTeamOrder([1, 3], [1, 3, 5]), { error: TEAM_ORDER_CHANGED_ERROR });
    assert.deepEqual(parseTeamOrder([1, 3, 5, 7], [1, 3, 5]), { error: TEAM_ORDER_CHANGED_ERROR });
    assert.deepEqual(parseTeamOrder([1, 3, 7], [1, 3, 5]), { error: TEAM_ORDER_CHANGED_ERROR });
  });

  test("refuses a repeated team", () => {
    assert.deepEqual(parseTeamOrder([1, 1, 3], [1, 3, 5]), { error: TEAM_ORDER_CHANGED_ERROR });
  });

  test("refuses values that are not a list of whole numbers", () => {
    assert.deepEqual(parseTeamOrder("1,3,5", [1, 3, 5]), { error: "Nederīga komandu secība." });
    assert.deepEqual(parseTeamOrder([1, "3", 5], [1, 3, 5]), { error: "Nederīga komandu secība." });
    assert.deepEqual(parseTeamOrder([1, 3.5, 5], [1, 3, 5]), { error: "Nederīga komandu secība." });
  });
});
