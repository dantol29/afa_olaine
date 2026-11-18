"use server";

import { eq } from "drizzle-orm";
import { revalidatePath, updateTag } from "next/cache";

import { db } from "@/db/client";
import { leagueSources } from "@/db/schema";
import { requireAdminSession } from "@/lib/auth";
import { PUBLIC_CONTENT_CACHE_TAG } from "@/lib/public-data-cache";
import { syncTopScorersForSource } from "@/lib/top-scorers-sync";

export type TopScorersSyncState = Awaited<ReturnType<typeof syncTopScorersForSource>> | undefined;

/** Runs from the page's button, not while the page renders: Next only allows cache revalidation in Server Actions and
 *  Route Handlers, and a sync on every page view would also change goals on a mere visit or prefetch. */
export async function syncTopScorers(_prevState: TopScorersSyncState, formData: FormData): Promise<TopScorersSyncState> {
  await requireAdminSession();

  const sourceId = Number(formData.get("sourceId"));
  const [source] = Number.isInteger(sourceId)
    ? await db.select().from(leagueSources).where(eq(leagueSources.id, sourceId))
    : [];
  if (!source?.topScorersUrl) {
    return { updated: 0, unmatched: [], details: [], error: "Šim līgas avotam nav norādīts vārtu guvēju URL." };
  }

  const result = await syncTopScorersForSource({ teamId: source.teamId, topScorersUrl: source.topScorersUrl });
  if (result.error) console.error(`Failed to fetch top scorers from ${source.topScorersUrl}:`, result.error);
  if (result.updated > 0) {
    updateTag(PUBLIC_CONTENT_CACHE_TAG);
    revalidatePath("/");
    revalidatePath("/komanda");
    revalidatePath("/komanda/speletaji/[id]", "page");
  }
  return result;
}
