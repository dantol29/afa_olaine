import "server-only";
import { cachePublicData } from "@/lib/public-data-cache";
import { asc } from "drizzle-orm";
import { db } from "@/db/client";
import { leagueSources } from "@/db/schema";

export const getLeagueSourceMetadata = cachePublicData("league-source-metadata", async () => db.select({
  id: leagueSources.id,
  teamId: leagueSources.teamId,
  label: leagueSources.label,
  logoUrl: leagueSources.logoUrl,
  isMainLeague: leagueSources.isMainLeague,
}).from(leagueSources).orderBy(asc(leagueSources.displayOrder), asc(leagueSources.id)));

type LeagueMetadata = Awaited<ReturnType<typeof getLeagueSourceMetadata>>;
export function leagueLogoForGame(sources: LeagueMetadata, teamId: number, label: string | null) {
  const normalize = (value: string) => value.trim().toLocaleLowerCase("lv").replace(/\s+/g, " ");
  return sources.find((source) => source.teamId === teamId && label && normalize(source.label) === normalize(label))?.logoUrl ?? null;
}
