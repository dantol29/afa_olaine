import "server-only";
import { asc } from "drizzle-orm";

import { db } from "@/db/client";
import { partners } from "@/db/schema";
import { cachePublicData } from "@/lib/public-data-cache";

export type Partner = typeof partners.$inferSelect;

/** All partners, in display order — shared by the homepage marquee and
 *  the site footer. */
export async function getPartnersForAdmin(): Promise<Partner[]> {
  return db.select().from(partners).orderBy(asc(partners.id));
}

export const getPartners = cachePublicData("partners", getPartnersForAdmin);
