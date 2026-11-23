import assert from "node:assert/strict";
import { before, describe, test } from "node:test";

import { toDateKey } from "@/lib/calendar";
import { applySchema, insertEvent, insertTeam } from "../../../../../test/db";
import { GET } from "./route";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
let teamIds: { u8: number; u10: number; u12: number };

async function feedOf(teamId: number): Promise<string> {
  const response = await GET(new Request("http://localhost"), { params: Promise.resolve({ file: `${teamId}.ics` }) });
  assert.equal(response.status, 200);
  return response.text();
}

before(async () => {
  await applySchema();
  const [u8, u10, u12] = [await insertTeam({ name: "U8" }), await insertTeam({ name: "U10" }), await insertTeam({ name: "U12" })];
  teamIds = { u8: u8.id, u10: u10.id, u12: u12.id };
  const date = toDateKey(new Date(Date.now() + 5 * MS_PER_DAY));
  await insertEvent({ title: "Kluba svētki", date });
  await insertEvent({ title: "U8 turnīrs", date }, [u8.id]);
  await insertEvent({ title: "Kopīgs turnīrs", date }, [u8.id, u10.id]);
  await insertEvent({ title: "U12 nometne", date }, [u12.id]);
});

describe("team calendar feed", () => {
  test("has the team's events, events shared with other teams and club-wide events", async () => {
    const feed = await feedOf(teamIds.u8);
    for (const title of ["Kluba svētki", "U8 turnīrs", "Kopīgs turnīrs"]) assert.ok(feed.includes(`SUMMARY:${title}`), title);
    assert.ok(!feed.includes("U12 nometne"));
  });

  test("lists a shared event once for each of its teams", async () => {
    const feed = await feedOf(teamIds.u10);
    assert.equal(feed.split("SUMMARY:Kopīgs turnīrs").length - 1, 1);
    assert.ok(feed.includes("SUMMARY:Kluba svētki"));
    assert.ok(!feed.includes("U8 turnīrs"));
  });
});
