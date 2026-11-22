import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  addDays,
  clubsWithoutLogo,
  entriesWithBadTimes,
  gamesWithoutScore,
  minBirthYear,
  playersTooOld,
  playersWithoutTeam,
  possibleDuplicates,
  syncProblems,
  teamsRunningOutOfTrainings,
  upcomingClashes,
  type AttentionGame,
  type AttentionPlayer,
  type AttentionTraining,
} from "@/lib/admin-attention";

const TODAY = "2026-11-22";
const NOW = Date.parse("2026-11-22T12:00:00Z");
const HOUR = 60 * 60 * 1000;
const teamA = { id: 1, name: "WU12" };
const teamB = { id: 2, name: "2. liga" };

const game = (id: number, date: string, extra: Partial<AttentionGame> = {}): AttentionGame => ({
  id,
  teamId: 1,
  date,
  startTime: "12:00",
  endTime: "13:30",
  homeTeam: "AFA Olaine",
  awayTeam: "Salaspils",
  homeScore: null,
  awayScore: null,
  ...extra,
});
const training = (id: number, date: string, startTime = "18:00", endTime = "19:30", teamIds = [1]): AttentionTraining => ({ id, date, startTime, endTime, teamIds });
const player = (id: number, name: string, birthdate: string, teamIds = [1]): AttentionPlayer => ({ id, name, birthdate, teamIds });

test("addDays crosses months and goes back", () => {
  assert.equal(addDays("2026-11-22", 14), "2026-12-06");
  assert.equal(addDays("2026-03-01", -1), "2026-02-28");
});

describe("gamesWithoutScore", () => {
  test("lists played games missing either score, latest first", () => {
    const games = [game(1, "2026-11-01"), game(2, "2026-11-15", { homeScore: 2 }), game(3, "2026-11-20", { homeScore: 1, awayScore: 0 }), game(4, TODAY)];
    assert.deepEqual(gamesWithoutScore(games, TODAY).map((item) => item.id), [2, 1]);
  });
});

describe("syncProblems", () => {
  const ok = { job: "sync-fixtures", status: "success", lastSuccessAt: NOW - HOUR, needsReviewCount: 0, message: null, lastEmailError: null };

  test("a recent clean run is fine", () => {
    assert.deepEqual(syncProblems([ok], NOW), []);
  });

  test("names each problem", () => {
    assert.deepEqual(syncProblems([{ ...ok, status: "error", message: "LFF nav pieejams", needsReviewCount: 2, lastEmailError: "SMTP", lastSuccessAt: NOW - 49 * HOUR }], NOW), [
      {
        job: "sync-fixtures",
        problems: [
          "Kļūda: LFF nav pieejams",
          "2 spēles jāpārskata",
          "Paziņojuma e-pasts netika nosūtīts: SMTP",
          "Nav bijis veiksmīgas reizes vairāk nekā 48 stundas",
        ],
      },
    ]);
    assert.deepEqual(syncProblems([{ ...ok, lastSuccessAt: null }], NOW)[0].problems, ["Vēl nav bijis pilnībā veiksmīgas reizes"]);
  });
});

describe("teamsRunningOutOfTrainings", () => {
  test("a team that trained recently and has nothing in the next two weeks", () => {
    const trainings = [training(1, "2026-11-16"), training(2, "2026-12-10"), training(3, "2026-11-18", "18:00", "19:30", [2]), training(4, "2026-11-25", "18:00", "19:30", [2])];
    assert.deepEqual(teamsRunningOutOfTrainings([teamA, teamB], trainings, TODAY), [{ team: teamA, lastDate: "2026-11-16" }]);
  });

  test("a team with no recent trainings is left alone", () => {
    assert.deepEqual(teamsRunningOutOfTrainings([teamA], [training(1, "2026-10-01")], TODAY), []);
  });
});

describe("upcomingClashes", () => {
  test("finds overlapping trainings and games of one team, each pair once", () => {
    const trainings = [
      training(1, "2026-11-23", "18:00", "19:30", [1, 2]),
      training(2, "2026-11-23", "19:00", "20:30", [1, 2]),
      training(3, "2026-11-23", "19:30", "21:00", [1]),
      training(4, "2026-12-30", "18:00", "19:30", [1]),
      training(5, "2026-12-30", "18:00", "19:30", [1]),
    ];
    const games = [game(9, "2026-11-24", { startTime: "18:30", endTime: "20:00" }), game(10, "2026-11-24", { teamId: 2, startTime: "18:30", endTime: "20:00" })];
    const clashes = upcomingClashes([teamA, teamB], [...trainings, training(6, "2026-11-24", "18:00", "19:00", [1])], games, TODAY);
    assert.deepEqual(
      clashes.map((clash) => `${clash.date} ${clash.teamName} ${clash.first.kind}-${clash.first.id}/${clash.second.kind}-${clash.second.id}`),
      ["2026-11-23 WU12 training-1/training-2", "2026-11-23 WU12 training-2/training-3", "2026-11-24 WU12 training-6/game-9"],
    );
  });
});

describe("players", () => {
  test("without a team", () => {
    assert.deepEqual(playersWithoutTeam([player(1, "Anna Ozola", "04.04.2015."), player(2, "Ieva Lapa", "01.01.2015.", [])]).map((item) => item.id), [2]);
  });

  test("youth team age limit from the name", () => {
    assert.equal(minBirthYear("U12", 2026), 2015);
    assert.equal(minBirthYear("WU10", 2026), 2017);
    assert.equal(minBirthYear("U12-1", 2027), 2016);
    assert.equal(minBirthYear("2. liga", 2026), null);
  });

  test("lists only players older than their youth team allows", () => {
    const players = [player(1, "Vecāks", "31.12.2014."), player(2, "Der", "01.01.2015."), player(3, "Jaunāks", "01.01.2018."), player(4, "Līga", "01.01.1990.", [2])];
    assert.deepEqual(playersTooOld([teamA, teamB], players, TODAY).map((item) => [item.player.id, item.minYear]), [[1, 2015]]);
  });

  test("possible duplicates share a name in any word order and a birthdate", () => {
    const players = [player(1, "Toms Egle", "13.02.2009."), player(2, "egle toms", "13.02.2009."), player(3, "Toms Egle", "13.02.2010.")];
    assert.deepEqual(possibleDuplicates(players).map((group) => group.map((item) => item.id)), [[1, 2]]);
  });
});

describe("clubsWithoutLogo", () => {
  test("names in the coming games with no logo, each once with its first game", () => {
    const games = [game(1, "2026-11-30", { awayTeam: "Salaspils" }), game(2, "2026-12-05", { homeTeam: "Salaspils", awayTeam: "" }), game(3, "2027-02-01", { awayTeam: "Tālais" }), game(4, "2026-11-01", { awayTeam: "Vecais" })];
    const logos = new Map([["AFA Olaine", "/logo.png"], ["Salaspils", null]]);
    assert.deepEqual(clubsWithoutLogo(games, logos, TODAY).map((item) => [item.name, item.game.id]), [["Salaspils", 1]]);
  });
});

describe("entriesWithBadTimes", () => {
  test("lists games, trainings and events whose end is not after the start", () => {
    const entries = entriesWithBadTimes(
      [game(1, "2026-11-30", { startTime: "23:00", endTime: "00:30" })],
      [training(2, "2026-11-25", "18:00", "18:00"), training(3, "2026-11-26")],
      [{ id: 4, title: "Turnīrs", date: "2026-11-20", startTime: "10:00", endTime: "09:00" }],
    );
    assert.deepEqual(entries.map((entry) => `${entry.kind}-${entry.id}`), ["event-4", "training-2", "game-1"]);
  });
});
