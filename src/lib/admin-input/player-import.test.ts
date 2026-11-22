import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { parsePlayerImport, type ImportRowPayload } from "@/lib/admin-input/player-import";

const NOW = new Date("2026-11-22T12:00:00Z");
const parse = (rows: unknown, teamId: unknown = "5") => parsePlayerImport(teamId, JSON.stringify(rows), NOW);

const newRow: ImportRowPayload = { kind: "new", lineNumber: 2, values: { name: " Anna  Ozola ", birthdate: "4.4.2015", number: "7", position: "Pussargs" } };

describe("parsePlayerImport", () => {
  test("normalises new players and keeps only real changes", () => {
    assert.deepEqual(
      parse([
        newRow,
        { kind: "update", lineNumber: 3, playerId: 9, changes: { number: "30", position: "" }, addToTeam: true },
        { kind: "update", lineNumber: 4, playerId: 10, changes: {}, addToTeam: false },
      ]),
      {
        teamId: 5,
        creates: [{ name: "Anna Ozola", birthdate: "04.04.2015.", number: 7, position: "Pussargs" }],
        updates: [{ playerId: 9, changes: { number: 30, position: null }, addToTeam: true }],
      },
    );
  });

  test("names the line of a bad value", () => {
    assert.deepEqual(parse([{ ...newRow, values: { ...newRow.values, birthdate: "2015" } }]), { error: "2. rinda: Nederīgs datums. Formāts: DD.MM.GGGG." });
    assert.deepEqual(parse([{ ...newRow, values: { ...newRow.values, birthdate: "" } }]), { error: "2. rinda: Dzimšanas datums ir obligāts." });
    assert.deepEqual(parse([{ ...newRow, values: { ...newRow.values, number: "0" } }]), { error: "2. rinda: Numuram jābūt pozitīvam veselam skaitlim." });
    assert.deepEqual(parse([{ kind: "update", lineNumber: 6, playerId: 9, changes: { name: " " }, addToTeam: false }]), { error: "6. rinda: Vārds, uzvārds ir obligāts." });
  });

  test("needs a team, readable rows and something to save", () => {
    assert.deepEqual(parse([newRow], ""), { error: "Jāizvēlas komanda." });
    assert.deepEqual(parsePlayerImport("5", "{", NOW), { error: "Neizdevās nolasīt importa datus." });
    assert.deepEqual(parse([{ kind: "other" }]), { error: "Neizdevās nolasīt importa datus." });
    assert.deepEqual(parse([]), { error: "Nav nekā, ko saglabāt." });
  });
});
