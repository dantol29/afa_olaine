import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { categoryCode, filterArticles, newsCategoryOptions, newsTeamOptions, parseCategoryParam } from "@/lib/news-filters";

const articles = [
  { category: "Klubs" as const },
  { category: "Spēles" as const, teamId: 3, team: "WU12", teamSort: 0 },
  { category: "Treniņi" as const, teamId: 1, team: "2. liga", teamSort: 1 },
  { category: "Spēles" as const, teamId: 1, team: "2. liga", teamSort: 1 },
];

describe("newsTeamOptions", () => {
  test("lists each team once in the admin team order and skips club-wide articles", () => {
    assert.deepEqual(newsTeamOptions(articles), [{ id: 3, name: "WU12" }, { id: 1, name: "2. liga" }]);
  });
});

describe("categories", () => {
  test("options are distinct and ordered", () => {
    assert.deepEqual(newsCategoryOptions(articles), ["Klubs", "Spēles", "Treniņi"]);
  });

  test("codes are ASCII and round-trip", () => {
    assert.equal(categoryCode("Spēles"), "speles");
    assert.equal(parseCategoryParam("speles", newsCategoryOptions(articles)), "Spēles");
  });

  test("unknown, unused or missing codes mean no filter", () => {
    const options = newsCategoryOptions(articles);
    assert.equal(parseCategoryParam("pasakumi", options), null);
    assert.equal(parseCategoryParam("Spēles", options), null);
    assert.equal(parseCategoryParam("nope", options), null);
    assert.equal(parseCategoryParam(null, options), null);
  });
});

describe("filterArticles", () => {
  test("no filters keeps everything, including club-wide articles", () => {
    assert.equal(filterArticles(articles, null, null).length, 4);
  });

  test("team and category combine", () => {
    assert.equal(filterArticles(articles, 1, null).length, 2);
    assert.equal(filterArticles(articles, 1, "Spēles").length, 1);
    assert.equal(filterArticles(articles, 3, "Treniņi").length, 0);
  });
});
