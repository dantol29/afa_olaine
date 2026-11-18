import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { findPossibleDuplicate } from "@/lib/lff-duplicates";

const FIXTURE = { date: "2026-05-24", home: "AFA Olaine", away: "FK Ķekava / Auda" };

function game(date: string, source: "manual" | "lff", teams: Partial<{ homeTeam: string; awayTeam: string }> = {}) {
  return { date, source, homeTeam: "AFA Olaine", awayTeam: "FK Ķekava / Auda", ...teams };
}

describe("findPossibleDuplicate", () => {
  test("finds a game entered by hand on the same date with the same teams", () => {
    const manual = game("2026-05-24", "manual");
    assert.equal(findPossibleDuplicate(FIXTURE, [manual]), manual);
  });

  test("finds a match imported from LFF earlier on another date (LFF moved it)", () => {
    const moved = game("2026-05-23", "lff");
    assert.equal(findPossibleDuplicate(FIXTURE, [moved]), moved);
  });

  test("an already imported fixture is not a copy, even next to an older date of the same pairing", () => {
    assert.equal(findPossibleDuplicate(FIXTURE, [game("2026-05-23", "lff"), game("2026-05-24", "lff")]), undefined);
  });

  test("a manual game on another date is not a copy", () => {
    assert.equal(findPossibleDuplicate(FIXTURE, [game("2026-05-23", "manual")]), undefined);
  });

  test("the reversed pairing or another opponent is not a copy", () => {
    assert.equal(
      findPossibleDuplicate(FIXTURE, [
        game("2026-05-24", "manual", { homeTeam: "FK Ķekava / Auda", awayTeam: "AFA Olaine" }),
        game("2026-05-23", "lff", { awayTeam: "FK Iecava" }),
      ]),
      undefined,
    );
  });

  test("team names must match exactly", () => {
    assert.equal(findPossibleDuplicate(FIXTURE, [game("2026-05-24", "manual", { homeTeam: "afa olaine" })]), undefined);
  });
});
