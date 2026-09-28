import assert from "node:assert/strict";
import { load } from "cheerio";
import { renderToStaticMarkup } from "react-dom/server";

async function main() {
  const academy = await import("../src/components/academy-content").catch(() => null);
  assert.ok(academy, "the academy has a dedicated team-list view");

  const teams = academy.selectAcademyTeams([
    { id: 1, name: "2. liga", groupPhotoUrl: "/hero-team.png", players: [{ id: 1, name: "Senior", number: 1, position: "Vārtsargs" }] },
    { id: 2, name: "U16", groupPhotoUrl: "/info-akademija.jpg", players: [{ id: 2, name: "Anna Bērziņa", number: 8, position: "Pussargs" }] },
    { id: 3, name: "U14", groupPhotoUrl: null, players: [] },
  ]);
  assert.deepEqual(teams.map((team: { id: number }) => team.id), [2, 3], "the first team is excluded while academy teams remain");

  const html = renderToStaticMarkup(<academy.AcademyContent teams={teams} />);
  const $ = load(html);
  assert.equal($('section[aria-label="Akadēmijas komandas"] article').length, 2, "each academy team gets one straightforward section");
  assert.equal($('img[alt="U16 komandas kopbilde"]').attr("src"), "/info-akademija.jpg", "a team's own group photo appears when available");
  assert.match(html, /Anna Bērziņa/, "players assigned to a team are listed");
  assert.doesNotMatch(html, /Senior/, "first-team players are not shown");
  assert.match(html, /Komandas foto tiks pievienots/, "missing group photos have an honest empty state");
  assert.match(html, /Sastāvs tiks papildināts/, "teams without assigned players have an honest empty state");
  assert.doesNotMatch(html, /swiper|carousel/, "the academy does not use a gallery");

  console.log("academy lists youth teams with real data or empty states");
}

void main();
