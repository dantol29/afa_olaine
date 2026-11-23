import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { buildEventPreview, buildGamePreview, type ClubHint, type GamePreviewValues } from "@/lib/admin-preview";

const AFA: ClubHint = { name: "AFA Olaine", logo: "/logos/afa.png", stripe: "linear-gradient(90deg, #111 0%, #222 100%)" };
const clubs = new Map([[AFA.name, AFA]]);
const leagueLogos = [{ teamId: 1, label: "Virslīga", logoUrl: "/logos/virsliga.png" }];

const emptyGame: GamePreviewValues = { teamId: null, homeTeam: "", awayTeam: "", homeScore: "", awayScore: "", date: "", startTime: "", location: "", league: "" };

describe("buildGamePreview", () => {
  test("shows placeholders for an empty form", () => {
    const { game, homeBorderStripe } = buildGamePreview(emptyGame, clubs, leagueLogos);
    assert.equal(game.home.name, "Mājinieki");
    assert.equal(game.away.name, "Viesi");
    assert.equal(game.home.initials, "?");
    assert.deepEqual([game.day, game.month, game.year, game.time], ["--", "---", "----", "--:--"]);
    assert.equal(game.venue, "Vieta");
    assert.equal(game.league, "Draudzības spēle");
    assert.equal(homeBorderStripe, "linear-gradient(#fbb040, #fbb040)");
  });

  test("uses the logo and stripe of a known club and initials for an unknown one", () => {
    const { game, homeBorderStripe, awayBorderStripe } = buildGamePreview({ ...emptyGame, homeTeam: "AFA Olaine ", awayTeam: "FK Ventspils" }, clubs, leagueLogos);
    assert.equal(game.home.logo, AFA.logo);
    assert.equal(homeBorderStripe, AFA.stripe);
    assert.equal(game.away.logo, undefined);
    assert.equal(game.away.initials, "FV");
    assert.equal(awayBorderStripe, "linear-gradient(#fbb040, #fbb040)");
  });

  test("fills the date, league logo and a complete score", () => {
    const { game } = buildGamePreview(
      { ...emptyGame, teamId: 1, date: "2026-11-29", startTime: "11:00", league: "virslīga", homeScore: "2", awayScore: "0" },
      clubs,
      leagueLogos,
    );
    assert.deepEqual([game.day, game.month, game.year, game.time], ["29", "NOV", "2026", "11:00"]);
    assert.equal(game.leagueLogoUrl, "/logos/virsliga.png");
    assert.deepEqual([game.homeScore, game.awayScore], [2, 0]);
  });

  test("ignores a score that is not a whole number", () => {
    const { game } = buildGamePreview({ ...emptyGame, homeScore: "-1", awayScore: "" }, clubs, leagueLogos);
    assert.deepEqual([game.homeScore, game.awayScore], [null, null]);
  });
});

describe("buildEventPreview", () => {
  const teams = [{ id: 3, name: "U8 meitenes" }];

  test("shows placeholders and no teams for an empty form", () => {
    const event = buildEventPreview({ title: " ", date: "", endDate: "", startTime: "", endTime: "", location: "", teamIds: [] }, teams);
    assert.equal(event.title, "Nosaukums");
    assert.deepEqual(event.teams, []);
    assert.deepEqual([event.startTime, event.endTime], ["--:--", "--:--"]);
  });

  test("shows the chosen team and date", () => {
    const event = buildEventPreview({ title: "Lidl WU8 posms 4", date: "2026-12-06", endDate: "", startTime: "10:00", endTime: "13:00", location: "Ogre", teamIds: [3] }, teams);
    assert.deepEqual(event.teams.map((team) => team.name), ["U8 meitenes"]);
    assert.deepEqual([event.day, event.month, event.year], ["06", "DEC", "2026"]);
  });
});
