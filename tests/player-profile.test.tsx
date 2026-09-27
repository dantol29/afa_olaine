import assert from "node:assert/strict";
import { load } from "cheerio";
import { renderToStaticMarkup } from "react-dom/server";

async function main() {
  const profileModule = await import("../src/components/player-profile-content").catch(() => null);
  assert.ok(profileModule, "a public player profile view exists");

  const html = renderToStaticMarkup(<profileModule.PlayerProfileContent player={{
    id: 69,
    name: "Arsenijs Kolosovs",
    number: 17,
    position: "Vārtsargs",
    birthdate: "20.06.2009.",
    photoUrl: "/player-cutouts/nikoloz-gujabidze.png",
    teams: [{ name: "AFA Olaine", goals: 2 }],
  }} />);
  const $ = load(html);

  assert.equal($("h1").text(), "Arsenijs Kolosovs", "the player's real name is the page title");
  assert.equal($('nav[aria-label="Atpakaļceļš"] a[href="/komanda"]').length, 1, "the breadcrumb returns to the team page");
  assert.match(html, /17/, "the jersey number is visible in the hero");
  assert.match(html, /Vārtsargs/, "the player's position is visible");
  assert.match(html, /20\.06\.2009\./, "the real birth date is visible");
  assert.match(html, /AFA Olaine/, "the real team is visible");
  assert.match(html, /Gūtie vārti/, "the available season goal tally is labelled");
  assert.doesNotMatch(html, /Augums|Svars|Pilsonība|Aizvadītās spēles/, "unavailable biographical and appearance data is not invented");

  console.log("player profile uses the reference layout with available roster facts");
}

void main();
