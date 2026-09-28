import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";

import { MatchCard, type MatchCardGame } from "../src/components/match-card";

const game: MatchCardGame = {
  id: 1,
  day: "28",
  month: "SEP",
  year: "2026",
  weekday: "Pirmdiena",
  time: "18:00",
  home: { name: "AFA Olaine" },
  away: { name: "FK Liepāja" },
  venue: "Olaines pilsētas stadions",
  league: "2. liga",
};
const stripes = {
  homeBorderStripe: "linear-gradient(90deg, red, white)",
  awayBorderStripe: "linear-gradient(90deg, blue, white)",
};

const gamesPageCard = renderToStaticMarkup(<MatchCard game={game} {...stripes} compact />);
assert.doesNotMatch(gamesPageCard, /Spēles diena/, "Spēles cards omit the lower action label");
assert.match(gamesPageCard, /linear-gradient\(90deg, blue, white\)/, "Spēles cards retain the away-team bottom stripe");

const homepageCard = renderToStaticMarkup(<MatchCard game={game} {...stripes} />);
assert.doesNotMatch(homepageCard, /Spēles diena/, "homepage match cards omit the lower label too");
assert.match(homepageCard, /linear-gradient\(90deg, blue, white\)/, "homepage match cards retain the away-team bottom stripe");

for (const [label, markup] of [["Spēles", gamesPageCard], ["homepage", homepageCard]] as const) {
  assert.match(
    markup,
    /<div aria-hidden="true" class="[^"]*\babsolute\b[^"]*\binset-x-0\b[^"]*\bbottom-0\b[^"]*" style="background-image:linear-gradient\(90deg, blue, white\)"><\/div>/,
    `${label} away-team stripe sits flush against the full bottom edge`,
  );
}

console.log("match cards omit the lower label and place the away-team stripe on the bottom edge");
