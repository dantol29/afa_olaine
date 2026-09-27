import * as cheerio from "cheerio";

import { absoluteLffUrl, normalizeLffText } from "@/lib/lff-fetch";

export type LffRosterPlayer = {
  name: string;
  birthdate: string;
  photoUrl: string | null;
  position: string | null;
};

const POSITION_LABELS: Record<string, string> = {
  Vārtsargi: "Vārtsargs",
  Aizsargi: "Aizsargs",
  Pussargi: "Pussargs",
  Uzbrucēji: "Uzbrucējs",
};

/** Extracts the published roster from an LFF club competition page. */
export function parseLffRosterHtml(html: string, pageUrl: string): LffRosterPlayer[] {
  const $ = cheerio.load(html);
  const seen = new Set<string>();
  const roster: LffRosterPlayer[] = [];

  $(".tr.player").each((_, element) => {
    const row = $(element);
    const name = normalizeLffText(row.find(".playerData .name").first().text());
    const birthdate = normalizeLffText(row.find(".playerData .description").first().text()).match(/Dzimšanas datums:\s*(\d{2}\.\d{2}\.\d{4}\.)/)?.[1] ?? "";
    const photoUrl = absoluteLffUrl(row.find(".photo img").first().attr("src"), pageUrl);
    const groupHeading = normalizeLffText(row.prevAll(".tr.th2").first().text());
    const position = POSITION_LABELS[groupHeading] ?? null;
    const key = name.toLocaleLowerCase("lv");

    if (!name || !birthdate || seen.has(key)) return;
    seen.add(key);
    roster.push({ name, birthdate, photoUrl, position });
  });

  if (roster.length === 0) throw new Error("LFF roster layout was not recognized");
  return roster;
}
