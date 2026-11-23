import assert from "node:assert/strict";
import { test } from "node:test";

import { formatDate, formatDayMonth } from "./date-display";

test("date keys are shown day first", () => {
  assert.equal(formatDate("2026-12-05"), "05.12.2026");
  assert.equal(formatDayMonth("2026-12-05"), "05.12.");
});

test("anything else is shown as it is", () => {
  assert.equal(formatDate(""), "");
  assert.equal(formatDate("05.12.2026"), "05.12.2026");
  assert.equal(formatDayMonth("nonsense"), "nonsense");
});
