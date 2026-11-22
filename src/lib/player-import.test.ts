import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { groupPeople, matchPerson, nameKey, parseRoster, type ExistingPlayer } from "@/lib/player-import";

// Made-up names in the shapes coaches send.
const YEARS_LIST = `U12
Anna Ozola — 2015
Līga Kalniņa — 2016`;

const DATES_LIST = `Anna Ozola — 04.04.2015
Līga Kalniņa — 22.03.2016`;

const WHATSAPP_LIST = `[08/11/2026, 13:52:38] Jānis Treneris AFA Olaine: VĀRTSARGI
Pēteris Liepa Nr 1
Kārlis Andris Bērzs Nr 35
[08/11/2026, 13:56:52] Jānis Treneris AFA Olaine: AIZSARGI

Toms Egle Nr 3
Kristians Sergejs Ozols
Rihards Kļava

Ozols Nr 30   27.06.2006
Kļava.  24.01.2008
Edgars Priede - pussargs Nr 6`;

describe("parseRoster", () => {
  test("reads names with a year and finds the team heading", () => {
    const { lines, teamHint } = parseRoster(YEARS_LIST);
    assert.equal(teamHint, "U12");
    assert.deepEqual(lines.map((line) => [line.name, line.birthYear, line.birthdate]), [
      ["Anna Ozola", "2015", null],
      ["Līga Kalniņa", "2016", null],
    ]);
  });

  test("reads full dates into the stored form", () => {
    const { lines } = parseRoster(DATES_LIST);
    assert.deepEqual(lines.map((line) => [line.name, line.birthdate]), [
      ["Anna Ozola", "04.04.2015."],
      ["Līga Kalniņa", "22.03.2016."],
    ]);
  });

  test("drops the WhatsApp prefix, uses headings as positions and reads numbers", () => {
    const { lines } = parseRoster(WHATSAPP_LIST);
    const byName = new Map(lines.map((line) => [line.name, line]));
    assert.deepEqual(
      ["Pēteris Liepa", "Kārlis Andris Bērzs", "Toms Egle"].map((name) => [byName.get(name)?.position, byName.get(name)?.number]),
      [["Vārtsargs", 1], ["Vārtsargs", 35], ["Aizsargs", 3]],
    );
    // The message time is not a birthdate.
    assert.ok(lines.every((line) => line.birthdate !== "08.11.2026."));
    assert.equal(byName.get("Kristians Sergejs Ozols")?.number, null);
    assert.equal(byName.get("Ozols")?.birthdate, "27.06.2006.");
    assert.equal(byName.get("Ozols")?.number, 30);
    assert.equal(byName.get("Kļava")?.birthdate, "24.01.2008.");
  });

  test("reads a position written in the line", () => {
    const line = parseRoster(WHATSAPP_LIST).lines.find((item) => item.name === "Edgars Priede");
    assert.deepEqual([line?.position, line?.number], ["Pussargs", 6]);
  });

  test("accepts other date shapes and list numbering, and flags a date that does not exist", () => {
    const { lines } = parseRoster("1. Anna Ozola 2015-04-04\n2) Līga Kalniņa 27/06/2015\n🙂 Ieva Lapa #9 31.02.2015");
    assert.deepEqual(lines.map((line) => [line.name, line.birthdate, line.invalidDate, line.number]), [
      ["Anna Ozola", "04.04.2015.", null, null],
      ["Līga Kalniņa", "27.06.2015.", null, null],
      ["Ieva Lapa", null, "31.02.2015", 9],
    ]);
  });
});

describe("groupPeople", () => {
  test("merges a follow-up surname line into the only full name holding it", () => {
    const people = groupPeople(parseRoster(WHATSAPP_LIST).lines);
    const ozols = people.find((person) => person.name === "Kristians Sergejs Ozols");
    assert.ok(ozols);
    assert.equal(ozols.lines.length, 2);
    assert.deepEqual([ozols.birthdates, ozols.numbers, ozols.positions], [["27.06.2006."], [30], ["Aizsargs"]]);
    assert.equal(people.some((person) => person.name === "Ozols"), false);
  });

  test("merges the same person from two lists, in any word order", () => {
    const people = groupPeople(parseRoster(`${YEARS_LIST}\n${DATES_LIST}\nOzola Anna #7`).lines);
    assert.equal(people.length, 2);
    assert.deepEqual([people[0].name, people[0].birthYears, people[0].birthdates, people[0].numbers], ["Anna Ozola", ["2015"], ["04.04.2015."], [7]]);
  });

  test("keeps every differing value for the admin to choose", () => {
    const [person] = groupPeople(parseRoster("Toms Egle Nr 3\nToms Egle Nr 30").lines);
    assert.deepEqual(person.numbers, [3, 30]);
  });

  test("leaves a surname that fits two people on its own", () => {
    const people = groupPeople(parseRoster("Anna Ozola\nMarta Ozola\nOzola #5").lines);
    assert.equal(people.length, 3);
  });
});

describe("matchPerson", () => {
  const players: ExistingPlayer[] = [
    { id: 1, name: "Toms Egle", birthdate: "13.02.2009.", number: 3, position: "Aizsargs", teamIds: [10] },
    { id: 2, name: "Anna Ozola", birthdate: "04.04.2015.", number: null, position: null, teamIds: [20] },
    { id: 3, name: "Anna Ozola", birthdate: "01.01.2012.", number: null, position: null, teamIds: [21] },
    { id: 4, name: "Kristians Ozols", birthdate: "27.06.2006.", number: 30, position: null, teamIds: [10] },
  ];
  const personOf = (text: string) => groupPeople(parseRoster(text).lines)[0];

  test("finds a player by name alone when only one has it", () => {
    assert.deepEqual(matchPerson(personOf("Egle Toms Nr 4"), players, 10), { match: 1, candidates: [1] });
  });

  test("uses the birthdate to tell players with the same name apart", () => {
    assert.deepEqual(matchPerson(personOf("Anna Ozola 04.04.2015"), players, 20), { match: 2, candidates: [2] });
    assert.deepEqual(matchPerson(personOf("Anna Ozola"), players, 20), { match: null, candidates: [2, 3] });
    assert.deepEqual(matchPerson(personOf("Anna Ozola — 2012"), players, 20), { match: 3, candidates: [2, 3] });
  });

  test("does not pick a namesake with another birthdate", () => {
    assert.deepEqual(matchPerson(personOf("Toms Egle 01.01.2010"), players, 10), { match: null, candidates: [1] });
  });

  test("looks a surname up in the chosen team only", () => {
    assert.deepEqual(matchPerson(personOf("Ozols Nr 30"), players, 10), { match: 4, candidates: [4] });
    assert.deepEqual(matchPerson(personOf("Ozols Nr 30"), players, 20), { match: null, candidates: [] });
  });

  test("reports a new person", () => {
    assert.deepEqual(matchPerson(personOf("Ieva Lapa 01.02.2015"), players, 10), { match: null, candidates: [] });
  });

  test("builds the same name key in any order", () => {
    assert.equal(nameKey("Černovs Kristians"), nameKey("kristians cernovs"));
  });
});
