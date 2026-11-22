import assert from "node:assert/strict";
import { describe, test } from "node:test";

import type { ExistingPlayer } from "@/lib/player-import";
import { buildImportRows, importPayload, retarget, rowProblem, teamFromHint } from "@/lib/player-import-rows";

const players: ExistingPlayer[] = [
  { id: 1, name: "Toms Egle", birthdate: "13.02.2009.", number: 3, position: "Aizsargs", teamIds: [10] },
  { id: 2, name: "Anna Ozola", birthdate: "04.04.2015.", number: null, position: null, teamIds: [20] },
  { id: 3, name: "Anna Ozola", birthdate: "01.01.2012.", number: null, position: null, teamIds: [21] },
];

describe("buildImportRows", () => {
  test("proposes only the fields that change, and joining the team", () => {
    const [row] = buildImportRows("AIZSARGI\nEgle Toms Nr 30", players, 11);
    assert.equal(row.target, 1);
    assert.deepEqual(row.apply, { name: false, birthdate: false, number: true, position: false });
    assert.equal(row.addToTeam, true);
    assert.equal(row.include, true);
    assert.deepEqual(importPayload([row], players), [{ kind: "update", lineNumber: 2, playerId: 1, changes: { number: "30" }, addToTeam: true }]);
  });

  test("leaves out a player already in the team with nothing new", () => {
    const [row] = buildImportRows("Toms Egle Nr 3", players, 10);
    assert.equal(row.include, false);
  });

  test("a new player without a full date is not included and says why", () => {
    const [row] = buildImportRows("Ieva Lapa — 2015", players, 10);
    assert.equal(row.target, "new");
    assert.equal(row.include, false);
    assert.equal(row.note, "Tikai gads: 2015");
    assert.equal(rowProblem({ ...row, include: true }), "Vajag pilnu dzimšanas datumu");
    const fixed = { ...row, values: { ...row.values, birthdate: "05.06.2015" }, include: true };
    assert.equal(rowProblem(fixed), null);
    assert.deepEqual(importPayload([fixed], players), [{ kind: "new", lineNumber: 1, values: { name: "Ieva Lapa", birthdate: "05.06.2015", number: "", position: "" } }]);
  });

  test("namesakes wait for a choice; choosing one proposes its changes", () => {
    const [row] = buildImportRows("Anna Ozola #8", players, 20);
    assert.equal(row.target, null);
    assert.deepEqual(row.candidates, [2, 3]);
    assert.equal(rowProblem({ ...row, include: true }), "Izvēlies spēlētāju");
    const chosen = retarget(row, 2, players, 20);
    assert.deepEqual([chosen.apply.number, chosen.addToTeam, chosen.include], [true, false, true]);
  });

  test("offers every value a field was given", () => {
    const [row] = buildImportRows("Toms Egle Nr 3\nToms Egle Nr 30", players, 10);
    assert.deepEqual(row.variants.number, ["3", "30"]);
  });
});

describe("teamFromHint", () => {
  test("picks the team named in a heading", () => {
    assert.equal(teamFromHint("U12\nAnna Ozola — 2015", [{ id: 4, name: "U12" }, { id: 5, name: "U13" }]), 4);
    assert.equal(teamFromHint("Anna Ozola", [{ id: 4, name: "U12" }]), null);
  });
});
