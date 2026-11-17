import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { parseFixturesHtml } from "@/lib/fixtures";
import { FUTSAL_UPCOMING_URL, OTRA_LIGA_FIXTURES_URL, OTRA_LIGA_PAGE, readLffFixture } from "../../test/lff";

const page = readLffFixture("otra-liga-2026.html");
const futsalPage = readLffFixture("telpu-futbols-virsliga-2026.html");

function summary(html: string, url = OTRA_LIGA_FIXTURES_URL) {
  return parseFixturesHtml(html, url).map((fixture) => `${fixture.date} ${fixture.time} ${fixture.home} - ${fixture.away}`);
}

describe("parseFixturesHtml on the LFF season page", () => {
  test("reads only the requested tab, in page order", () => {
    assert.deepEqual(summary(page), [
      "2026-04-11 14:00 AFA Olaine - FK Iecava",
      "2026-04-11 16:00 FK Karosta - JFC Viola",
      "2026-04-18 14:00 FS Jelgava-2 - AFA Olaine",
      "2026-04-19 14:00 JFK Daugava / FK Union - FK Ķekava / Auda",
      "2026-05-23 19:00 AFA Olaine - FK Ķekava / Auda",
      "2026-07-19 18:00 FK Iecava - AFA Olaine",
    ]);
  });

  test("returns the full row for a played match, with Latvian letters and a slash kept in the club name", () => {
    const fixture = parseFixturesHtml(page, OTRA_LIGA_FIXTURES_URL).find((row) => row.date === "2026-05-23");
    assert.deepEqual(fixture, {
      date: "2026-05-23",
      time: "19:00",
      home: "AFA Olaine",
      away: "FK Ķekava / Auda",
      homeLogo: "https://lff.lv/files/images_comet/2d/7/_resized/2d72be9e0e3dc15d3a4350f9341b24bc14c143ec_110_110_withoutgrow.png",
      awayLogo: "https://lff.lv/files/images_comet/61/0/_resized/610f95281bad104d9f1a0a43cd36506912a5a52a_110_110_withoutgrow.png",
      stadium: "Olaines pilsētas stadions",
      played: true,
      homeScore: 2,
      awayScore: 4,
    });
    const jelgava = parseFixturesHtml(page, OTRA_LIGA_FIXTURES_URL).find((row) => row.home === "FS Jelgava-2");
    assert.deepEqual([jelgava?.homeScore, jelgava?.awayScore], [12, 1], "a double-digit score");
  });

  test("without a tab in the URL, reads every tab on the page", () => {
    // The final-tournament tab comes first on the page.
    assert.deepEqual(summary(page, OTRA_LIGA_PAGE).slice(0, 2), [
      "2026-09-26 15:00 FK Liepāja-2 / LFS - BFC Daugavpils-2",
      "2026-09-26 19:00 FK Salaspils - Rīgas Futbola skola",
    ]);
    assert.equal(summary(page, OTRA_LIGA_PAGE).length, 8);
  });

  // Current behaviour, flagged: a tab id that is not on the page silently falls back to the whole page,
  // so a stale ?tab= in a league source mixes matches from other competitions' tabs into the import.
  test("a tab that is not on the page falls back to the whole page", () => {
    assert.equal(summary(page, `${OTRA_LIGA_PAGE}?tab=content_1_9`).length, 8);
  });

  test("throws a clear error when the requested tab has no matches", () => {
    assert.throws(
      () => parseFixturesHtml(page, `${OTRA_LIGA_PAGE}?tab=content_1_5`),
      /LFF fixtures layout was not recognized \(matches=0, club links=0, requested tab=#tabContent_1_5\)/,
    );
  });
});

describe("parseFixturesHtml on the upcoming-matches layout", () => {
  test("takes the date from the heading row and the time from the matchday block", () => {
    assert.deepEqual(summary(futsalPage, FUTSAL_UPCOMING_URL), [
      "2026-11-14 17:00 Futbola Parks Academy - TFK Salaspils",
      "2026-11-15 14:00 Salaspils FA - FC Nikers",
      "2026-11-21 15:00 Squad/Samgus Aizkraukle - Futbola Parks Academy",
      "2026-11-22 14:00 TFK Salaspils - Salaspils FA",
    ]);
  });

  test("a match not yet played (score shown as -) has no score", () => {
    const fixtures = parseFixturesHtml(futsalPage, FUTSAL_UPCOMING_URL);
    assert.deepEqual(fixtures.map((row) => [row.played, row.homeScore, row.awayScore]), [
      [true, 2, 1],
      [true, 2, 3],
      [false, null, null],
      [false, null, null],
    ]);
  });
});

describe("parseFixturesHtml edge cases built from the real markup", () => {
  test("a missing logo gives null and a relative logo path is resolved against the page URL", () => {
    // Edited markup: LFF showed a logo for every club when the fixture was captured.
    const html = page
      .replace(/<img alt="" src="https:\/\/lff\.lv\/files\/images_comet\/2d\/7\/[^"]*" \/>/, "")
      .replace(/src="https:\/\/lff\.lv(\/files\/images_comet\/Club\/1\/_resized\/11982_[^"]*)"/, 'src="$1"');
    const fixture = parseFixturesHtml(html, OTRA_LIGA_FIXTURES_URL)[0];
    assert.equal(fixture.home, "AFA Olaine");
    assert.equal(fixture.homeLogo, null);
    assert.equal(fixture.awayLogo, "https://lff.lv/files/images_comet/Club/1/_resized/11982_-354029946_110_110_withoutgrow.png");
  });

  test("a row without a time keeps the match with time null", () => {
    const html = page.replace(/<div class="h7">[^<]*<\/div>/g, "");
    const fixtures = parseFixturesHtml(html, OTRA_LIGA_FIXTURES_URL);
    assert.equal(fixtures.length, 6);
    assert.ok(fixtures.every((fixture) => fixture.time === null));
  });

  // Current behaviour, flagged: a month name the parser does not know drops those rows without any error,
  // as long as some other row still parses.
  test("rows with an unknown month name are skipped while the rest still parse", () => {
    const html = page.replace(/<h6>apr<\/h6>/g, "<h6>xyz</h6>");
    assert.deepEqual(summary(html), [
      "2026-05-23 19:00 AFA Olaine - FK Ķekava / Auda",
      "2026-07-19 18:00 FK Iecava - AFA Olaine",
    ]);
  });

  test("a changed club markup or an empty page throws instead of returning matches without teams", () => {
    assert.throws(
      () => parseFixturesHtml(page.replace(/class="club"/g, 'class="side"'), OTRA_LIGA_FIXTURES_URL),
      /LFF fixtures layout was not recognized \(matches=6/,
    );
    assert.throws(() => parseFixturesHtml("<html><body></body></html>", OTRA_LIGA_FIXTURES_URL), /layout was not recognized \(matches=0/);
  });
});
