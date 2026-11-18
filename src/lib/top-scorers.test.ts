import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { parseTopScorersHtml } from "@/lib/top-scorers";
import { OTRA_LIGA_SCORERS_URL, readLffFixture } from "../../test/lff";

const page = readLffFixture("otra-liga-2026.html");

describe("parseTopScorersHtml", () => {
  test("reads rank, name, club and goals of every row, marking AFA Olaine players", () => {
    const rows = parseTopScorersHtml(page, OTRA_LIGA_SCORERS_URL);
    assert.deepEqual(rows.map((row) => [row.rank, row.name, row.club, row.goals, row.isOlaine]), [
      [1, "Roberts Untulis", "FK Liepāja-2 / LFS", 24, false],
      [6, "Kārlis Pūriņš", "FK Ķekava / Auda", 14, false],
      [32, "Konstantīns Fjodorovs", "AFA Olaine", 6, true],
      [59, "Elmārs Ģēģers", "AFA Olaine", 4, true],
      [140, "Ņikita Ponomarjovs", "AFA Olaine", 2, true],
    ]);
  });

  test("keeps photo and club logo URLs absolute", () => {
    const row = parseTopScorersHtml(page, OTRA_LIGA_SCORERS_URL)[2];
    assert.equal(row.photoUrl, "https://lff.lv/files/images_comet/cf/1/_resized/cf1c7b13063fccaeb40fcd8a3bb650d5e0e2f969_140_0.jpg");
    assert.equal(row.clubLogo, "https://lff.lv/files/images_comet/2d/7/_resized/2d72be9e0e3dc15d3a4350f9341b24bc14c143ec_110_110_withoutgrow.png");
  });

  test("a missing photo gives null and a relative photo path is resolved against the page URL", () => {
    // Edited markup: LFF showed a photo for every scorer when the fixture was captured.
    const html = page
      .replace(/<div class="photo"><img alt="" src="https:\/\/lff\.lv\/files\/images_comet\/15\/d\/[^"]*" \/><\/div>/, '<div class="photo"></div>')
      .replace(/src="https:\/\/lff\.lv(\/files\/images_comet\/4f\/3\/[^"]*)"/, 'src="$1"');
    const [first, second] = parseTopScorersHtml(html, OTRA_LIGA_SCORERS_URL);
    assert.equal(first.photoUrl, null);
    assert.equal(second.photoUrl, "https://lff.lv/files/images_comet/4f/3/_resized/4f32ca7dd9e3112aad506783036f701cbd051604_140_0.png");
  });

  test("skips a row whose goals are not a number", () => {
    const html = page.replace("<div><span>24</span></div>", "<div><span>-</span></div>");
    const rows = parseTopScorersHtml(html, OTRA_LIGA_SCORERS_URL);
    assert.equal(rows.length, 4);
    assert.equal(rows[0].name, "Kārlis Pūriņš");
  });

  test("skips a row whose goals cell is empty instead of reading it as 0", () => {
    const html = page.replace("<span>AFA Olaine</span></div><div><span>6</span></div>", "<span>AFA Olaine</span></div><div><span> </span></div>");
    const rows = parseTopScorersHtml(html, OTRA_LIGA_SCORERS_URL);
    assert.deepEqual(rows.map((row) => row.name), ["Roberts Untulis", "Kārlis Pūriņš", "Elmārs Ģēģers", "Ņikita Ponomarjovs"]);
  });

  test("a page without the scorers list throws a clear error", () => {
    assert.throws(
      () => parseTopScorersHtml(page.replace(/goalscorers/g, "scorers"), OTRA_LIGA_SCORERS_URL),
      /LFF top scorers layout was not recognized/,
    );
  });
});
