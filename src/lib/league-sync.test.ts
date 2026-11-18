import assert from "node:assert/strict";
import { before, describe, test } from "node:test";

import { and, asc, eq } from "drizzle-orm";

import { clubLogoNames, clubLogos, games } from "@/db/schema";
import { syncLeagueSource } from "@/lib/league-sync";
import { applySchema, db, insertClubLogo, insertGame, insertTeam } from "../../test/db";
import { FUTSAL_UPCOMING_URL, mockFetch, OTRA_LIGA_FIXTURES_URL, readLffFixture } from "../../test/lff";

const page = readLffFixture("otra-liga-2026.html");
const LABEL = "2. līga";

/** The four AFA Olaine matches in the fixture's fixtures tab, in the format of describeGame. */
const OLAINE_GAMES = [
  "2026-04-11 14:00-15:30 AFA Olaine - FK Iecava 3:0 @ Olaines pilsētas stadions",
  "2026-04-18 14:00-15:30 FS Jelgava-2 - AFA Olaine 12:1 @ FK Jelgava Sporta bāzes mākslīgais laukums",
  "2026-05-23 19:00-20:30 AFA Olaine - FK Ķekava / Auda 2:4 @ Olaines pilsētas stadions",
  "2026-07-19 18:00-19:30 FK Iecava - AFA Olaine 3:2 @ Iecavas stadions",
];

async function teamGames(teamId: number) {
  return db.select().from(games).where(eq(games.teamId, teamId)).orderBy(asc(games.date), asc(games.id));
}

function describeGame(game: typeof games.$inferSelect) {
  return `${game.date} ${game.startTime}-${game.endTime} ${game.homeTeam} - ${game.awayTeam} ${game.homeScore ?? "-"}:${game.awayScore ?? "-"} @ ${game.location}`;
}

/** Each test gets its own team, so games imported by one test never affect another. */
let teamCount = 0;
async function newSource() {
  const team = await insertTeam({ name: `Pieaugušie ${++teamCount}` });
  return { teamId: team.id, label: LABEL, url: OTRA_LIGA_FIXTURES_URL };
}

/** Edits one match row of the fixture (found by its LFF match id) to model a state LFF did not show at capture time. */
function editMatch(html: string, matchId: string, edit: (row: string) => string) {
  return html.replace(new RegExp(`<div class="tr match [^"]*" data-id="${matchId}">.*`), edit);
}
const OLAINE_KEKAVA_MATCH = "23536966"; // 2026-05-23 19:00 AFA Olaine - FK Ķekava / Auda, 2:4

before(async () => {
  await applySchema();
});

describe("syncLeagueSource", () => {
  test("imports every AFA Olaine match with a time, and nothing else", async (t) => {
    mockFetch(t, page);
    const source = await newSource();
    const result = await syncLeagueSource(source);

    assert.deepEqual(result, { imported: 4, reviewNeeded: [] });
    const rows = await teamGames(source.teamId);
    assert.deepEqual(rows.map(describeGame), OLAINE_GAMES);
    for (const row of rows) {
      assert.equal(row.source, "lff");
      assert.equal(row.league, LABEL);
      assert.equal(row.leagueSourceId, null); // Not set by the sync; games are tied to a source by label only.
      assert.equal(row.notes, null);
      assert.ok(row.createdAt > 0);
    }
  });

  test("a second run inserts no duplicates and reports nothing to review", async (t) => {
    mockFetch(t, page);
    const source = await newSource();
    await syncLeagueSource(source);
    assert.deepEqual(await syncLeagueSource(source), { imported: 0, reviewNeeded: [] });
    assert.equal((await teamGames(source.teamId)).length, 4);
  });

  test("a match not yet played is imported without a score, and the score is filled in once LFF shows it", async (t) => {
    // Edited markup: every AFA Olaine match was already played when the fixture was captured.
    const beforeKickOff = editMatch(page, OLAINE_KEKAVA_MATCH, (row) =>
      row.replace(/<span class="res1">\d+<\/span>/, '<span class="res1">-</span>').replace(/<span class="res2">\d+<\/span>/, '<span class="res2">-</span>'),
    );
    const source = await newSource();
    mockFetch(t, beforeKickOff);
    await syncLeagueSource(source);
    let game = (await teamGames(source.teamId)).find((row) => row.date === "2026-05-23");
    assert.deepEqual([game?.homeScore, game?.awayScore], [null, null]);

    t.mock.restoreAll();
    mockFetch(t, page);
    assert.deepEqual(await syncLeagueSource(source), { imported: 0, reviewNeeded: [] });
    game = (await teamGames(source.teamId)).find((row) => row.date === "2026-05-23");
    assert.deepEqual([game?.homeScore, game?.awayScore], [2, 4]);
  });

  test("a corrected score on LFF overwrites the saved one", async (t) => {
    mockFetch(t, page);
    const source = await newSource();
    await syncLeagueSource(source);
    await db.update(games).set({ homeScore: 1, awayScore: 1 }).where(and(eq(games.teamId, source.teamId), eq(games.date, "2026-05-23")));

    await syncLeagueSource(source);
    const game = (await teamGames(source.teamId)).find((row) => row.date === "2026-05-23");
    assert.deepEqual([game?.homeScore, game?.awayScore], [2, 4]);
  });

  test("a saved score is kept when LFF stops showing one", async (t) => {
    const source = await newSource();
    mockFetch(t, page);
    await syncLeagueSource(source);
    t.mock.restoreAll();
    mockFetch(t, editMatch(page, OLAINE_KEKAVA_MATCH, (row) => row.replace(/<span class="res(\d)">\d+<\/span>/g, '<span class="res$1">-</span>')));

    await syncLeagueSource(source);
    const game = (await teamGames(source.teamId)).find((row) => row.date === "2026-05-23");
    assert.deepEqual([game?.homeScore, game?.awayScore], [2, 4]);
  });

  test("a changed time or venue is reported for review but never applied", async (t) => {
    mockFetch(t, page);
    const source = await newSource();
    await syncLeagueSource(source);
    const [first] = await teamGames(source.teamId);
    await db.update(games).set({ startTime: "13:00", endTime: "14:30", location: "Jaunolaine" }).where(eq(games.id, first.id));

    const result = await syncLeagueSource(source);
    assert.deepEqual(result, {
      imported: 0,
      reviewNeeded: [{
        date: "2026-04-11",
        homeTeam: "AFA Olaine",
        awayTeam: "FK Iecava",
        oldStartTime: "13:00",
        newStartTime: "14:00",
        oldLocation: "Jaunolaine",
        newLocation: "Olaines pilsētas stadions",
      }],
    });
    const saved = (await teamGames(source.teamId))[0];
    assert.deepEqual([saved.startTime, saved.endTime, saved.location], ["13:00", "14:30", "Jaunolaine"]);
  });

  test("a late kick-off ends at 23:59 instead of wrapping past midnight", async (t) => {
    // Edited markup: no AFA Olaine match started this late when the fixture was captured.
    mockFetch(t, editMatch(page, OLAINE_KEKAVA_MATCH, (row) => row.replace('<div class="h7">19:00</div>', '<div class="h7">23:00</div>')));
    const source = await newSource();
    await syncLeagueSource(source);
    const game = (await teamGames(source.teamId)).find((row) => row.date === "2026-05-23");
    assert.deepEqual([game?.startTime, game?.endTime], ["23:00", "23:59"]);
  });

  test("an AFA Olaine match without a time is not imported", async (t) => {
    mockFetch(t, editMatch(page, OLAINE_KEKAVA_MATCH, (row) => row.replace('<div class="h7">19:00</div>', "")));
    const source = await newSource();
    assert.equal((await syncLeagueSource(source)).imported, 3);
    assert.ok((await teamGames(source.teamId)).every((row) => row.date !== "2026-05-23"));
  });

  test("a game entered by hand with the same teams on the same date is not imported again", async (t) => {
    const source = await newSource();
    await insertGame(source.teamId, { homeTeam: "AFA Olaine", awayTeam: "FK Iecava", date: "2026-04-11", startTime: "14:00", endTime: "15:30" });
    // Same pairing on another date, entered by hand: a different match, so the LFF one is still imported.
    await insertGame(source.teamId, { homeTeam: "FS Jelgava-2", awayTeam: "AFA Olaine", date: "2026-04-17" });
    mockFetch(t, page);

    assert.deepEqual(await syncLeagueSource(source), { imported: 3, reviewNeeded: [] });
    const rows = await teamGames(source.teamId);
    assert.deepEqual(rows.filter((row) => row.date === "2026-04-11").map((row) => row.source), ["manual"]);
    assert.deepEqual(rows.filter((row) => row.homeTeam === "FS Jelgava-2").map((row) => [row.date, row.source]), [
      ["2026-04-17", "manual"],
      ["2026-04-18", "lff"],
    ]);
    assert.deepEqual(await syncLeagueSource(source), { imported: 0, reviewNeeded: [] }, "and not on a later run either");
  });

  // Kept on purpose: skipping the moved match would hide its new date. The manual import screen warns about it.
  test("a match LFF moves to another date is imported again next to the old date", async (t) => {
    const source = await newSource();
    mockFetch(t, page);
    await syncLeagueSource(source);
    t.mock.restoreAll();
    mockFetch(t, editMatch(page, OLAINE_KEKAVA_MATCH, (row) => row.replace("<h5>23</h5>", "<h5>24</h5>")));

    assert.deepEqual(await syncLeagueSource(source), { imported: 1, reviewNeeded: [] });
    const rows = await teamGames(source.teamId);
    assert.deepEqual(rows.filter((row) => row.awayTeam === "FK Ķekava / Auda").map((row) => row.date), ["2026-05-23", "2026-05-24"]);
  });

  test("match rows the parser cannot read are returned with the result", async (t) => {
    mockFetch(t, editMatch(page, OLAINE_KEKAVA_MATCH, (row) => row.replace("<h6>mai</h6>", "<h6>maijā?</h6>")));
    const source = await newSource();
    const result = await syncLeagueSource(source);

    assert.equal(result.imported, 3);
    assert.equal(result.unrecognized?.count, 1);
    assert.match(result.unrecognized?.samples[0] ?? "", /AFA Olaine.*FK Ķekava \/ Auda/);
    assert.ok((await teamGames(source.teamId)).every((row) => row.date !== "2026-05-23"));
  });

  test("a league source URL whose tab is gone is an error and imports nothing", async (t) => {
    mockFetch(t, page.replace('id="tabContent_1_2"', 'id="tabContent_1_7"'));
    const source = await newSource();
    const result = await syncLeagueSource(source);
    assert.equal(result.imported, 0);
    assert.match(result.error ?? "", /LFF page has no tab #tabContent_1_2/);
    assert.equal((await teamGames(source.teamId)).length, 0);
  });

  test("records LFF logos for clubs that have none, and keeps a logo the admin already set", async (t) => {
    // Earlier tests in this file already recorded logos; start this one from none.
    await db.delete(clubLogoNames);
    await db.delete(clubLogos);
    await insertClubLogo("/uploads/club-logos/iecava.png", ["FK Iecava"]);
    mockFetch(t, page);
    await syncLeagueSource(await newSource());

    const logos = await db
      .select({ name: clubLogoNames.name, logoUrl: clubLogos.logoUrl })
      .from(clubLogoNames)
      .innerJoin(clubLogos, eq(clubLogoNames.clubLogoId, clubLogos.id));
    const logoByName = new Map(logos.map((row) => [row.name, row.logoUrl]));
    assert.equal(logoByName.get("FK Iecava"), "/uploads/club-logos/iecava.png");
    assert.equal(logoByName.get("FK Ķekava / Auda"), "https://lff.lv/files/images_comet/61/0/_resized/610f95281bad104d9f1a0a43cd36506912a5a52a_110_110_withoutgrow.png");
    assert.ok(logoByName.has("AFA Olaine"));
    assert.equal(logoByName.has("FK Karosta"), false, "clubs outside AFA Olaine matches are not recorded");
    assert.equal(logos.filter((row) => row.name === "FK Iecava").length, 1);
  });

  test("a page without AFA Olaine matches reports an error and imports nothing", async (t) => {
    mockFetch(t, readLffFixture("telpu-futbols-virsliga-2026.html"));
    const source = { ...(await newSource()), url: FUTSAL_UPCOMING_URL };
    assert.deepEqual(await syncLeagueSource(source), {
      imported: 0,
      reviewNeeded: [],
      error: "LFF returned 4 fixtures, but none with a valid time matched AFA Olaine",
    });
    assert.equal((await teamGames(source.teamId)).length, 0);
  });

  test("a failed fetch is returned as an error instead of throwing", async (t) => {
    mockFetch(t, new Response("", { status: 500 }));
    const source = await newSource();
    assert.deepEqual(await syncLeagueSource(source), {
      imported: 0,
      reviewNeeded: [],
      error: "Failed to fetch LFF fixtures: HTTP 500",
    });
    assert.equal((await teamGames(source.teamId)).length, 0);
  });
});
