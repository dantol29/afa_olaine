import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { compareByStart, compareLatvian, compareTeamOrder, orderRoster, sortByName, teamOptionsInOrder, uniqueSortedLabels } from "@/lib/ordering";

type Person = { name: string; photo: boolean; id: number };

describe("Latvian name order", () => {
  test("places letters with diacritics after their base letter, not after Z", () => {
    assert.deepEqual(
      ["Žanis", "Zane", "Ņikita", "Nauris", "Čaks", "Cēsis", "Šarlote", "Sandis", "Ābele", "Bērziņš"].sort(compareLatvian),
      ["Ābele", "Bērziņš", "Cēsis", "Čaks", "Nauris", "Ņikita", "Sandis", "Šarlote", "Zane", "Žanis"],
    );
  });

  test("compares numbers by value, so U9 comes before U11", () => {
    assert.deepEqual(["U11", "U19", "U9", "U7"].sort(compareLatvian), ["U7", "U9", "U11", "U19"]);
  });

  test("sortByName returns a sorted copy and keeps the input order of equal names", () => {
    const people = [{ name: "Ozols", id: 1 }, { name: "Bērziņš", id: 2 }, { name: "Ozols", id: 3 }];
    assert.deepEqual(sortByName(people, (person) => person.name).map((person) => person.id), [2, 1, 3]);
    assert.deepEqual(people.map((person) => person.id), [1, 2, 3]);
  });
});

describe("orderRoster", () => {
  test("lists people with a photo first, each group in Latvian order", () => {
    const roster: Person[] = [
      { name: "Zariņš", photo: false, id: 1 },
      { name: "Ābols", photo: false, id: 2 },
      { name: "Šteins", photo: true, id: 3 },
      { name: "Bērziņš", photo: true, id: 4 },
    ];
    assert.deepEqual(
      orderRoster(roster, (person) => person.name, (person) => person.photo).map((person) => person.id),
      [4, 3, 2, 1],
    );
  });

  test("keeps the input order of equal names with the same photo state", () => {
    const roster: Person[] = [
      { name: "Liepa", photo: true, id: 1 },
      { name: "Liepa", photo: false, id: 2 },
      { name: "Liepa", photo: true, id: 3 },
    ];
    assert.deepEqual(orderRoster(roster, (person) => person.name, (person) => person.photo).map((person) => person.id), [1, 3, 2]);
  });
});

test("uniqueSortedLabels drops empty values and duplicates", () => {
  assert.deepEqual(uniqueSortedLabels(["U11", null, "U9", "", undefined, "U11", "Ārpus"]), ["Ārpus", "U9", "U11"]);
});

test("compareByStart orders by time and keeps the input order of equal starts", () => {
  const items = [
    { start: new Date("2026-10-02T10:00:00Z"), id: 1 },
    { start: new Date("2026-10-01T10:00:00Z"), id: 2 },
    { start: new Date("2026-10-02T10:00:00Z"), id: 3 },
  ];
  assert.deepEqual([...items].sort(compareByStart).map((item) => item.id), [2, 1, 3]);
});

describe("team order", () => {
  test("follows the admin order, then creation (id) order for equal values", () => {
    const teams = [
      { id: 4, sort: 0 },
      { id: 2, sort: 1 },
      { id: 1, sort: 0 },
    ];
    assert.deepEqual([...teams].sort(compareTeamOrder).map((team) => team.id), [1, 4, 2]);
  });

  test("filter options list each team once without the order field", () => {
    const options = teamOptionsInOrder([
      { id: 5, name: "U9", sort: 2 },
      { id: 3, name: "WU12", sort: 0 },
      { id: 5, name: "U9", sort: 2 },
    ]);
    assert.deepEqual(options, [{ id: 3, name: "WU12" }, { id: 5, name: "U9" }]);
  });
});
