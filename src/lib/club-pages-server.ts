import "server-only";
import { cachePublicData } from "@/lib/public-data-cache";

import { asc, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { clubPages } from "@/db/schema";

export const getPublishedClubPages = cachePublicData("published-club-pages", async function getPublishedClubPages() {
  return db
    .select({
      title: clubPages.title,
      slug: clubPages.slug,
      description: clubPages.description,
      body: clubPages.body,
      images: clubPages.images,
      updatedAt: clubPages.updatedAt,
    })
    .from(clubPages)
    .where(eq(clubPages.isPublished, true))
    .orderBy(asc(clubPages.displayOrder), asc(clubPages.title));
});
