import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { parseStandingsHtml } from "@/lib/standings";
import { OTRA_LIGA_FIXTURES_URL, OTRA_LIGA_SCORERS_URL, OTRA_LIGA_STANDINGS_URL, readLffFixture } from "../../test/lff";

const page = readLffFixture("otra-liga-2026.html");

describe("parseStandingsHtml", () => {
  test("picks the table that contains AFA Olaine, skipping an earlier table without it", () => {
    const rows = parseStandingsHtml(page, OTRA_LIGA_STANDINGS_URL);
    assert.deepEqual(rows.map((row) => [row.pos, row.team, row.isOlaine]), [
      [1, "FK Liepāja-2 / LFS", false],
      [5, "FK Ķekava / Auda", false],
      [7, "AFA Olaine", true],
      [10, "FK Iecava", false],
    ]);
  });

  test("reads every number column, including a negative goal difference", () => {
    const olaine = parseStandingsHtml(page, OTRA_LIGA_STANDINGS_URL).find((row) => row.isOlaine);
    assert.deepEqual(olaine, {
      pos: 7,
      team: "AFA Olaine",
      logo: "https://lff.lv/files/images_comet/2d/7/_resized/2d72be9e0e3dc15d3a4350f9341b24bc14c143ec_110_110_withoutgrow.png",
      played: 18,
      wins: 6,
      draws: 1,
      losses: 11,
      goalsFor: 37,
      goalsAgainst: 56,
      goalDiff: -19,
      points: 19,
      isOlaine: true,
    });
  });

  test("reads a goal difference written with a plus sign", () => {
    const leader = parseStandingsHtml(page, OTRA_LIGA_STANDINGS_URL)[0];
    assert.equal(leader.goalDiff, 69);
    assert.equal(leader.points, 48);
  });

  test("without AFA Olaine on the page, returns the first table", () => {
    const rows = parseStandingsHtml(page.replace(/AFA Olaine/g, "AFA Riga"), OTRA_LIGA_STANDINGS_URL);
    assert.deepEqual(rows.map((row) => row.team), ["BFC Daugavpils-2", "FK Liepāja-2 / LFS"]);
  });

  test("a missing logo gives null and a relative logo path is resolved against the page URL", () => {
    // Edited markup: LFF showed a logo for every club when the fixture was captured.
    const html = page
      .replace(/(<div class="tr row"><div><span>7<\/span><\/div><div><div class="logo">)<img [^>]*>/, "$1")
      .replace(/(<div class="tr row"><div><span>5<\/span><\/div><div><div class="logo"><img alt="" src=")https:\/\/lff\.lv/, "$1");
    const rows = parseStandingsHtml(html, OTRA_LIGA_STANDINGS_URL);
    assert.equal(rows.find((row) => row.isOlaine)?.logo, null);
    assert.equal(
      rows.find((row) => row.team === "FK Ķekava / Auda")?.logo,
      "https://lff.lv/files/images_comet/61/0/_resized/610f95281bad104d9f1a0a43cd36506912a5a52a_110_110_withoutgrow.png",
    );
  });

  test("a URL pointing at a tab without a table throws a clear error", () => {
    assert.throws(() => parseStandingsHtml(page, OTRA_LIGA_FIXTURES_URL), /LFF standings layout was not recognized \(tables=0/);
    assert.throws(() => parseStandingsHtml(page, OTRA_LIGA_SCORERS_URL), /LFF standings layout was not recognized/);
  });

  test("a table that lost a number column throws instead of shifting values into the wrong fields", () => {
    const html = page.replace(/<div>[+-]\d+<\/div>/g, "");
    assert.throws(() => parseStandingsHtml(html, OTRA_LIGA_STANDINGS_URL), /LFF standings layout was not recognized \(tables=2/);
  });
});
