import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { buildWeekText, defaultWeekStart, weekStart, type WeekItem } from "@/lib/week-text";

describe("weekStart", () => {
  test("gives the Monday of the week, Sunday belonging to the week before it", () => {
    assert.equal(weekStart("2026-11-23"), "2026-11-23");
    assert.equal(weekStart("2026-11-26"), "2026-11-23");
    assert.equal(weekStart("2026-11-22"), "2026-11-16");
    assert.equal(weekStart("2027-01-01"), "2026-12-28");
  });
});

describe("defaultWeekStart", () => {
  test("opens this week on weekdays and the next one from Saturday", () => {
    assert.equal(defaultWeekStart("2026-11-20"), "2026-11-16");
    assert.equal(defaultWeekStart("2026-11-21"), "2026-11-23");
    assert.equal(defaultWeekStart("2026-11-22"), "2026-11-23");
  });
});

describe("buildWeekText", () => {
  const items: WeekItem[] = [
    { kind: "game", date: "2026-11-28", startTime: "12:00", endTime: "13:30", location: "Salaspils stadions", homeTeam: "AFA Olaine", awayTeam: "Salaspils" },
    { kind: "training", date: "2026-11-23", startTime: "18:00", endTime: "19:30", location: " Olaines stadions " },
    { kind: "event", date: "2026-11-23", startTime: "17:00", endTime: "17:30", location: "", title: "Vecāku sapulce" },
    { kind: "training", date: "2026-11-30", startTime: "18:00", endTime: "19:30", location: "Olaines stadions" },
  ];

  test("lists the week's items in time order, each with weekday, date, time and place", () => {
    assert.equal(
      buildWeekText("WU12", "2026-11-23", items),
      [
        "WU12 — grafiks 23.11.–29.11.",
        "P 23.11. 17:00–17:30 Vecāku sapulce",
        "P 23.11. 18:00–19:30 Treniņš, Olaines stadions",
        "S 28.11. 12:00 Spēle: AFA Olaine – Salaspils, Salaspils stadions",
      ].join("\n"),
    );
  });

  test("lists a multi-day event with its first and last day in every week it overlaps", () => {
    const tournament: WeekItem = {
      kind: "event", date: "2026-12-05", endDate: "2026-12-07", startTime: "10:00", endTime: "16:00", location: "Ogre", title: "Turnīrs",
    };
    assert.equal(buildWeekText("WU12", "2026-11-30", [tournament]).split("\n")[1], "S 05.12. 10:00 – P 07.12. 16:00 Turnīrs, Ogre");
    assert.equal(buildWeekText("WU12", "2026-12-07", [tournament]).split("\n")[1], "S 05.12. 10:00 – P 07.12. 16:00 Turnīrs, Ogre");
    assert.equal(buildWeekText("WU12", "2026-12-14", [tournament]).split("\n")[1], "Šajā nedēļā nav ierakstu.");
  });

  test("says so when the week has nothing", () => {
    assert.equal(buildWeekText("WU12", "2026-12-07", items), "WU12 — grafiks 07.12.–13.12.\nŠajā nedēļā nav ierakstu.");
  });
});
