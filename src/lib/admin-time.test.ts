import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { defaultEndTime, hourOptions, minuteOptions, splitTime } from "@/lib/admin-time";

describe("splitTime", () => {
  test("splits a saved time", () => {
    assert.deepEqual(splitTime("18:10"), { hour: "18", minute: "10" });
  });

  test("is empty for an empty or malformed value", () => {
    assert.deepEqual(splitTime(""), { hour: "", minute: "" });
    assert.deepEqual(splitTime("8:00"), { hour: "", minute: "" });
  });
});

describe("hourOptions", () => {
  test("offers 06 to 23", () => {
    const hours = hourOptions("");
    assert.equal(hours[0], "06");
    assert.equal(hours.at(-1), "23");
    assert.equal(hours.length, 18);
  });

  test("keeps a saved hour outside the range, in order", () => {
    assert.deepEqual(hourOptions("05").slice(0, 2), ["05", "06"]);
    assert.equal(hourOptions("12").length, 18);
  });
});

describe("minuteOptions", () => {
  test("offers quarter hours", () => {
    assert.deepEqual(minuteOptions(""), ["00", "15", "30", "45"]);
  });

  test("keeps a saved minute off the grid, in order", () => {
    assert.deepEqual(minuteOptions("10"), ["00", "10", "15", "30", "45"]);
  });
});

describe("defaultEndTime", () => {
  test("adds the usual duration", () => {
    assert.equal(defaultEndTime("17:00", 90), "18:30");
    assert.equal(defaultEndTime("11:15", 180), "14:15");
  });

  test("stops at the end of the day", () => {
    assert.equal(defaultEndTime("22:30", 180), "23:59");
  });
});
