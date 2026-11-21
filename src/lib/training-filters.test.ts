import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { filterTrainingsByTeam, parseDateKeyParam, parseTeamIdParam, trainingTeamOptions } from "@/lib/training-filters";

// WU12 is placed before 2. liga in the admin team order, against both name and id order.
const liga = { id: 1, name: "2. liga", sort: 1 };
const wu12 = { id: 3, name: "WU12", sort: 0 };
const trainings = [
  { rawDate: "2026-11-11", teams: [liga] },
  { rawDate: "2026-11-12", teams: [wu12, liga] },
  { rawDate: "2026-11-13", teams: [wu12] },
];

describe("trainingTeamOptions", () => {
  test("lists each team once, in the admin team order, including teams that share a training", () => {
    assert.deepEqual(trainingTeamOptions(trainings), [{ id: 3, name: "WU12" }, { id: 1, name: "2. liga" }]);
  });

  test("is empty without trainings", () => {
    assert.deepEqual(trainingTeamOptions([]), []);
  });
});

describe("parseTeamIdParam", () => {
  const options = trainingTeamOptions(trainings);

  test("accepts the id of a listed team", () => {
    assert.equal(parseTeamIdParam("3", options), 3);
  });

  test("ignores a missing, empty, unknown or malformed value", () => {
    for (const value of [undefined, null, "", "99", "abc", "3.5", "-1", " 3", "3abc", "03x", "1e1"]) {
      assert.equal(parseTeamIdParam(value, options), null, String(value));
    }
  });
});

describe("parseDateKeyParam", () => {
  test("accepts a real date", () => {
    assert.equal(parseDateKeyParam("2026-11-11"), "2026-11-11");
    assert.equal(parseDateKeyParam("2028-02-29"), "2028-02-29");
  });

  test("ignores dates that do not exist or have another format", () => {
    for (const value of [undefined, null, "", "2026-02-30", "2026-13-01", "2027-02-29", "2026-2-3", "20261111", "11-11-2026", "2026-11-11x"]) {
      assert.equal(parseDateKeyParam(value), null, String(value));
    }
  });
});

describe("filterTrainingsByTeam", () => {
  test("returns everything without a team", () => {
    assert.equal(filterTrainingsByTeam(trainings, null).length, 3);
  });

  test("shows a training with several teams under each of them", () => {
    assert.deepEqual(filterTrainingsByTeam(trainings, 1).map((training) => training.rawDate), ["2026-11-11", "2026-11-12"]);
    assert.deepEqual(filterTrainingsByTeam(trainings, 3).map((training) => training.rawDate), ["2026-11-12", "2026-11-13"]);
  });
});
