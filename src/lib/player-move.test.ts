import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { moveOutcome, type MovePlayer } from "@/lib/player-move";

const A = 1;
const B = 2;
const C = 3;
const player = (teams: MovePlayer["teams"]): MovePlayer => ({ id: 7, name: "Toms Egle", birthdate: "01.01.2015.", teams });

describe("moveOutcome", () => {
  test("adding joins the target team and keeps the source team", () => {
    assert.deepEqual(moveOutcome(player([{ teamId: A, goals: 4 }]), A, B, "add"), { status: "add", lostGoals: 0, otherTeamIds: [] });
  });

  test("adding a player already in the target team changes nothing", () => {
    assert.equal(moveOutcome(player([{ teamId: A, goals: 0 }, { teamId: B, goals: 0 }]), A, B, "add").status, "none");
  });

  test("moving leaves the source team and loses its goals", () => {
    assert.deepEqual(moveOutcome(player([{ teamId: A, goals: 3 }]), A, B, "move"), { status: "move", lostGoals: 3, otherTeamIds: [] });
  });

  test("moving a player in A, B and C from A to B only leaves A; B and C stay", () => {
    const outcome = moveOutcome(player([{ teamId: A, goals: 2 }, { teamId: B, goals: 5 }, { teamId: C, goals: 1 }]), A, B, "move");
    assert.deepEqual(outcome, { status: "leave", lostGoals: 2, otherTeamIds: [C] });
  });
});
