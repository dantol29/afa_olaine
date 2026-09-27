import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";

import type { TrainingListItem } from "../src/lib/trainings-server";

const trainings: TrainingListItem[] = [
  {
    id: 1,
    day: "25",
    month: "SEPTEMBRIS",
    year: "2026",
    rawDate: "2026-09-25",
    startTime: "19:15",
    endTime: "20:15",
    location: "Olaines pilsētas stadions",
    teamName: "U14",
    coaches: [{ name: "Anna Bērziņa", photoUrl: null }],
    isPast: false,
  },
  {
    id: 2,
    day: "28",
    month: "SEPTEMBRIS",
    year: "2026",
    rawDate: "2026-09-28",
    startTime: "17:00",
    endTime: "18:00",
    location: "Olaines sporta halle",
    teamName: "U16",
    coaches: [],
    isPast: false,
  },
];

async function main() {
  const scheduleModule = await import("../src/components/training-schedule").catch(() => null);
  assert.ok(scheduleModule, "the public training schedule component must exist");
  assert.equal(typeof scheduleModule.toggleSelectedDate, "function", "the calendar can toggle an active date without a separate reset button");
  assert.equal(scheduleModule.toggleSelectedDate("2026-09-25", "2026-09-25"), null, "clicking the selected day returns to all trainings");
  assert.equal(scheduleModule.toggleSelectedDate(null, "2026-09-25"), "2026-09-25", "clicking a day filters trainings to it");

  const html = renderToStaticMarkup(<scheduleModule.TrainingSchedule trainings={trainings} todayKey="2026-09-25" />);
  assert.match(html, /Visas komandas/, "visitors can filter training by team");
  assert.match(html, /aria-pressed="true" class="[^"]*min-h-12[^"]*bg-white text-\[#050505\][^"]*">Visas komandas<\/button>/, "active team filter matches the Spēles tab styling");
  assert.match(html, /aria-pressed="false" class="[^"]*border border-white\/40[^"]*">U14<\/button>/, "inactive team filters match the Spēles tab styling");
  assert.doesNotMatch(html, /Treniņu kartīšu varianti|data-training-variant/, "the temporary comparison is removed");
  assert.match(html, /Septembris 2026/, "the month calendar is visible");
  assert.match(html, /Nākamais mēnesis/, "visitors can browse later months");
  assert.match(html, /Iepriekšējais mēnesis/, "visitors can browse earlier months");
  assert.doesNotMatch(html, /<h2[^>]*>Visi treniņi<\/h2>/, "the all-training view has no redundant title");
  assert.doesNotMatch(html, /aria-pressed="true"[^>]*>25/, "no calendar day is selected by default");
  assert.match(html, /U14/, "the first team's training is visible");
  assert.match(html, /19:15/, "training time is visible");
  assert.match(html, /Olaines pilsētas stadions/, "training location is visible");
  assert.match(html, /Anna Bērziņa/, "assigned coaches are visible");
  assert.match(html, /Olaines sporta halle/, "another day's training is also visible by default");
  assert.match(html, /25\. SEP/, "cards in the all-training view show the compact match-card date");
  assert.match(html, /grid-cols-\[repeat\(auto-fill,minmax\(220px,280px\)\)\]/, "training cards stay league-card width instead of stretching across the results pane");
  assert.match(html, /bg-\[#19191B\]/, "training cards reuse the league-card charcoal surface");
  const cardHtml = html.match(/<li class="flex min-h-\[280px\][\s\S]*?<\/li>/)?.[0] ?? "";
  assert.ok(cardHtml, "the selected day renders a training card");
  assert.match(cardHtml, /<time dateTime="2026-09-25"[^>]*class="[^"]*text-sm font-semibold[^"]*">25\. SEP<\/time>/, "the training date matches match-card styling in the top row");
  assert.doesNotMatch(cardHtml, />Treniņš</, "the redundant training label is not shown on cards");
  assert.match(cardHtml, /lucide-map-pin/, "a location icon replaces the visible venue label");
  assert.match(cardHtml, /lucide-user-round/, "a person icon replaces the visible coach label");
  assert.match(cardHtml, /<dt class="sr-only">Vieta<\/dt>/, "the icon-only venue keeps an accessible label");
  assert.match(cardHtml, /<dt class="sr-only">Treneris<\/dt>/, "the icon-only coach keeps an accessible label");

  const emptyHtml = renderToStaticMarkup(<scheduleModule.TrainingSchedule trainings={[]} todayKey="2026-09-25" />);
  assert.match(emptyHtml, /Treniņi nav ieplānoti/, "an empty schedule has a useful state");

  const { SiteHeader } = await import("../src/components/site-header");
  const headerHtml = renderToStaticMarkup(<SiteHeader />);
  assert.match(headerHtml, /href="\/trenini"[^>]*>Treniņi<\/a>/, "the main navigation should open the training page");

  console.log("training schedule shows a monthly calendar, selected-day details, and empty state");
}

void main();
