import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { articles, clubPages } from "@/db/schema";

/** Appends "-2", "-3", etc. until the slug doesn't collide with another
 *  article — so two articles with the same (or similarly-worded) title
 *  never fight over one URL, with no admin input needed. */
export async function ensureUniqueArticleSlug(baseSlug: string, excludeId?: number): Promise<string> {
  let candidate = baseSlug;
  for (let suffix = 2; ; suffix++) {
    const [existing] = await db
      .select({ id: articles.id })
      .from(articles)
      .where(eq(articles.slug, candidate));
    if (!existing || existing.id === excludeId) return candidate;
    candidate = `${baseSlug}-${suffix}`;
  }
}

/** Club page slugs are chosen by the admin, so a collision is reported instead of renamed. */
export async function isClubPageSlugTaken(slug: string, excludedId?: number) {
  const [existing] = await db.select({ id: clubPages.id }).from(clubPages).where(eq(clubPages.slug, slug));
  return Boolean(existing && existing.id !== excludedId);
}
