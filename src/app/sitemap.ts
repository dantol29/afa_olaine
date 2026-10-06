import type { MetadataRoute } from "next";
import { desc } from "drizzle-orm";

import { db } from "@/db/client";
import { articles } from "@/db/schema";
import { getSiteUrl } from "@/lib/site-url";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const pages = ["", "/jaunumi", "/komanda", "/akademija", "/speles", "/trenini", "/kontakti"];
  const articleRows = await db
    .select({ slug: articles.slug, date: articles.date })
    .from(articles)
    .orderBy(desc(articles.date));

  return [
    ...pages.map((path) => ({ url: `${siteUrl}${path}` })),
    ...articleRows.map((article) => ({
      url: `${siteUrl}/jaunumi/${encodeURIComponent(article.slug)}`,
      lastModified: article.date,
    })),
  ];
}
