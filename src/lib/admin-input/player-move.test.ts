import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { parsePlayerMoveInput } from "@/lib/admin-input/player-move";

function form(entries: [string, string][]) {
  const data = new FormData();
  for (const [key, value] of entries) data.append(key, value);
  return data;
}

const base: [string, string][] = [["fromTeamId", "1"], ["toTeamId", "2"], ["mode", "move"]];

describe("parsePlayerMoveInput", () => {
  test("reads the teams, the action and the ticked players once each", () => {
    assert.deepEqual(parsePlayerMoveInput(form([...base, ["playerIds", "5"], ["playerIds", "5"], ["playerIds", "6"]])), {
      fromTeamId: 1,
      toTeamId: 2,
      mode: "move",
      playerIds: [5, 6],
    });
  });

  test("refuses the same team, a missing action or no players", () => {
    assert.deepEqual(parsePlayerMoveInput(form([["fromTeamId", "1"], ["toTeamId", "1"], ["mode", "add"], ["playerIds", "5"]])), { error: "Komandām jābūt dažādām." });
    assert.deepEqual(parsePlayerMoveInput(form([["fromTeamId", "1"], ["toTeamId", "2"], ["playerIds", "5"]])), { error: "Jāizvēlas darbība." });
    assert.deepEqual(parsePlayerMoveInput(form(base)), { error: "Nav atzīmēts neviens spēlētājs." });
    assert.deepEqual(parsePlayerMoveInput(form([["toTeamId", "2"], ["mode", "add"], ["playerIds", "5"]])), { error: "Jāizvēlas komanda, no kuras." });
  });
});
