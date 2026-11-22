import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { buildIcal, escapeText, foldLine, icalTime } from "@/lib/ical";

describe("icalTime and escapeText", () => {
  test("writes UTC times without separators", () => {
    assert.equal(icalTime(new Date("2026-11-24T16:00:00.000Z")), "20261124T160000Z");
  });

  test("escapes backslashes, semicolons, commas and line breaks", () => {
    assert.equal(escapeText("A, B; C\\D\nE"), "A\\, B\; C\\\\D\\nE");
  });
});

describe("foldLine", () => {
  test("keeps every physical line within 75 octets and does not split letters", () => {
    const line = `LOCATION:${"Olaines pilsētas stadions, ".repeat(8)}`;
    const folded = foldLine(line);
    const physical = folded.split("\r\n");
    assert.ok(physical.length > 1);
    for (const piece of physical) assert.ok(new TextEncoder().encode(piece).length <= 75);
    assert.equal(physical.map((piece, index) => (index === 0 ? piece : piece.slice(1))).join(""), line);
  });

  test("leaves a short line as it is", () => {
    assert.equal(foldLine("SUMMARY:Treniņš"), "SUMMARY:Treniņš");
  });
});

describe("buildIcal", () => {
  const now = new Date("2026-11-22T10:00:00.000Z");
  const feed = buildIcal({
    name: "AFA Olaine WU12",
    domain: "afaolaine.lv",
    now,
    items: [
      { uid: "training-5", title: "WU12 treniņš", location: "Olaines pilsētas stadions", start: new Date("2026-11-24T16:00:00Z"), end: new Date("2026-11-24T17:30:00Z") },
      { uid: "event-2", title: "Sapulce", location: "", start: new Date("2026-11-25T16:00:00Z"), end: new Date("2026-11-25T17:00:00Z") },
      { uid: "game-9", title: "Bojāta", location: null, start: new Date("2026-11-26T16:00:00Z"), end: new Date("2026-11-26T16:00:00Z") },
    ],
  });

  test("is a calendar with CRLF line endings, a name and one event per valid item", () => {
    assert.ok(feed.startsWith("BEGIN:VCALENDAR\r\nVERSION:2.0\r\n"));
    assert.ok(feed.endsWith("END:VCALENDAR\r\n"));
    assert.ok(feed.includes("X-WR-CALNAME:AFA Olaine WU12\r\n"));
    assert.equal(feed.match(/BEGIN:VEVENT/g)?.length, 2);
  });

  test("gives each event a stable UID, UTC times, title and place, and no place line when there is none", () => {
    assert.ok(
      feed.includes(
        "BEGIN:VEVENT\r\nUID:training-5@afaolaine.lv\r\nDTSTAMP:20261122T100000Z\r\nDTSTART:20261124T160000Z\r\nDTEND:20261124T173000Z\r\nSUMMARY:WU12 treniņš\r\nLOCATION:Olaines pilsētas stadions\r\nEND:VEVENT\r\n",
      ),
    );
    assert.ok(feed.includes("SUMMARY:Sapulce\r\nEND:VEVENT"));
  });

  test("leaves out an item whose end is not after its start", () => {
    assert.ok(!feed.includes("game-9"));
  });
});
