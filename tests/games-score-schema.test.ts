import assert from "node:assert/strict";

import { articles, games } from "../src/db/schema";
import { parseFixturesHtml } from "../src/lib/fixtures";
import { initialStandingCardIndex, leagueCardRows } from "../src/lib/league-standings-cards";
import { middleLogoStripe, smoothLogoStripe } from "../src/lib/logo-color-core";
import { loopSponsorTickerItems, splitSponsorTickerItems, sponsorTickerItems } from "../src/lib/sponsor-ticker";
import { orderTeamShowcasePlayers } from "../src/lib/team-showcase";
import { groupTeamPagePlayers } from "../src/lib/team-page";
import { parseLffRosterHtml } from "../src/lib/lff-roster";

assert.ok("homeScore" in games, "games schema must store the home score");
assert.ok("awayScore" in games, "games schema must store the away score");
assert.ok(!("quoteText" in articles), "articles schema must not store quote text");
assert.ok(!("quoteAuthor" in articles), "articles schema must not store quote authors");
assert.ok(!("quoteRole" in articles), "articles schema must not store quote roles");

const [completedFixture] = parseFixturesHtml(
  `<div class="tr match" data-date="2026-09-19" data-time="14:00">
    <div class="date"><span class="h8">2026</span><span class="h6">Sep</span><span class="h5">19</span><span class="h7">14:00</span></div>
    <div class="club"><a href="/klubi/1">AFA Olaine</a><span class="result">2</span></div>
    <div class="club"><a href="/klubi/2">FK Liepāja</a><span class="result">3</span></div>
  </div>`,
  "https://lff.lv/fixtures",
);

assert.equal(completedFixture.homeScore, 2, "LFF parser must retain the home score");
assert.equal(completedFixture.awayScore, 3, "LFF parser must retain the away score");

assert.equal(
  middleLogoStripe(Buffer.from([
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  ]), 3, 3),
  "linear-gradient(90deg, #ff0000 0% 33.333%, #00ff00 33.333% 66.667%, #0000ff 66.667% 100%)",
  "crest border must map the logo's horizontal middle pixel row",
);

assert.equal(
  middleLogoStripe(Buffer.from([
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 255, 0, 0, 255, 0, 255, 0, 255,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  ]), 3, 3),
  "linear-gradient(90deg, #ff0000 0% 50%, #00ff00 50% 100%)",
  "transparent crest pixels must be stretched away instead of becoming empty border gaps",
);

assert.equal(
  smoothLogoStripe(Buffer.from([
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  ]), 3, 3, 3),
  "linear-gradient(90deg, #ff0000 0%, #00ff00 50%, #0000ff 100%)",
  "crest stripe must interpolate a small set of color samples rather than expose every source pixel",
);

assert.deepEqual(
  sponsorTickerItems([
    { id: 2, name: "Partneris A", logoUrl: "/a.png", needsWhite: false },
    { id: 3, name: "Partneris B", logoUrl: "/b.png", needsWhite: true },
  ]).map((item) => item.name),
  ["Altero.lv 2. līga", "Partneris A", "Partneris B"],
  "sponsor ticker must lead with the Altero.lv 2. līga mark before database partners",
);

assert.deepEqual(
  splitSponsorTickerItems(sponsorTickerItems([
    { id: 2, name: "Partneris A", logoUrl: "/a.png", needsWhite: false },
  ])),
  {
    staticItem: { id: 0, name: "Altero.lv 2. līga", logoUrl: "/altero-liga.png", needsWhite: true },
    movingItems: [{ id: 2, name: "Partneris A", logoUrl: "/a.png", needsWhite: false }],
  },
  "the league mark must stay outside the moving sponsor items",
);

assert.deepEqual(
  loopSponsorTickerItems([
    { id: 2, name: "Partneris A", logoUrl: "/a.png", needsWhite: false },
    { id: 3, name: "Partneris B", logoUrl: "/b.png", needsWhite: false },
  ], 3).map((item) => item.id),
  [2, 3, 2, 3, 2, 3],
  "ticker must repeat the moving sponsors enough times to prevent an empty rail",
);

assert.deepEqual(
  leagueCardRows([
    { pos: 3, team: "Trešā" },
    { pos: 1, team: "Pirmā" },
    { pos: 2, team: "Otrā" },
  ], 2).map((row) => row.pos),
  [1, 2],
  "league cards must show the highest-ranked teams first and respect the card limit",
);

assert.equal(
  initialStandingCardIndex([
    { isOlaine: false },
    { isOlaine: false },
    { isOlaine: true },
  ]),
  2,
  "the standings rail must open at AFA Olaine rather than at the first-ranked team",
);

assert.deepEqual(
  orderTeamShowcasePlayers([
    { id: 1, photoUrl: null },
    { id: 2, photoUrl: "/uploads/players/featured.jpg" },
    { id: 3, photoUrl: null },
  ]).map((player) => player.id),
  [2, 1, 3],
  "the team showcase must lead with a player who has an available profile photo",
);

assert.deepEqual(
  groupTeamPagePlayers([
    { name: "Pussargs", position: "Pussargs" },
    { name: "Vārtsargs", position: "Vārtsargs" },
    { name: "Bez pozīcijas", position: null },
    { name: "Aizsargs", position: "Aizsargs" },
  ]).map((group) => [group.label, group.players.map((player) => player.name)]),
  [["Vārtsargi", ["Vārtsargs"]], ["Aizsargi", ["Aizsargs"]], ["Pussargi", ["Pussargs"]], ["Spēlētāji", ["Bez pozīcijas"]]],
  "the team page must group players by role in the published order",
);

assert.deepEqual(
  parseLffRosterHtml(
    `<div class="tr th2"><div><span>Vārtsargi</span></div></div><div class="tr player"><div class="photo"><img src="/files/player.jpg" /></div><div class="playerData"><span class="name">Patriks Balodis</span><span class="description">Dzimšanas datums: 03.12.2001.</span></div></div>`,
    "https://lff.lv/klubi/afa-olaine-13841/?cid=23536781",
  ),
  [{ name: "Patriks Balodis", birthdate: "03.12.2001.", photoUrl: "https://lff.lv/files/player.jpg", position: "Vārtsargs" }],
  "the LFF roster parser must retain player names, birth dates, profile images, and positions",
);

console.log("games score columns are available");
