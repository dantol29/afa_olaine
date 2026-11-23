import assert from "node:assert/strict";
import { test } from "node:test";

import { areSimilarVenues, groupSimilarVenues, type VenueUsage } from "./venue-names";

function usage(name: string, trainings = 0, games = 0): VenueUsage {
  return { name, trainings, games, events: 0, lffGames: 0 };
}

test("areSimilarVenues: same after normalization, or the shorter name's words all in the longer", () => {
  assert.ok(areSimilarVenues("Olaines pilsētas stadions", "olaines pilsētas stadions."));
  assert.ok(areSimilarVenues("Olaines stadions", "Olaines pilsētas stadions"));
  assert.ok(areSimilarVenues("Futbola centrs Rūpnīca", 'Futbola centrs "Rūpnīca", Rīga, Sāremas iela 1D'));
  assert.ok(!areSimilarVenues("Stadions", "Iecavas stadions"));
  assert.ok(!areSimilarVenues("Olaines sporta nams", "Jaunolaines Sporta nams, Meža iela 2b"));
  assert.ok(!areSimilarVenues("Iecavas stadions", "Olaines pilsētas stadions"));
});

test("groupSimilarVenues joins chains, puts groups first and the most used name first", () => {
  const groups = groupSimilarVenues([
    usage("Iecavas stadions", 1, 4),
    usage("Olaines stadions", 0, 1),
    usage("Olaines pilsētas stadions", 13, 14),
    usage("olaines pilsētas stadions.", 1),
    usage("Futbola centrs Rūpnīca", 0, 1),
    usage('Futbola centrs "Rūpnīca", Rīga, Sāremas iela 1D', 1),
  ]);
  assert.deepEqual(
    groups.map((group) => group.map((item) => item.name)),
    [
      ["Olaines pilsētas stadions", "olaines pilsētas stadions.", "Olaines stadions"],
      ['Futbola centrs "Rūpnīca", Rīga, Sāremas iela 1D', "Futbola centrs Rūpnīca"],
      ["Iecavas stadions"],
    ],
  );
});
