import type { MetadataRoute } from "next";
import { asc, desc } from "drizzle-orm";

import { db } from "@/db/client";
import { articles, players, teams } from "@/db/schema";
import { getPublishedClubPages } from "@/lib/club-pages-server";
import { absoluteSiteUrl, getSiteUrl } from "@/lib/site-url";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const pages = ["", "/jaunumi", "/komanda", "/akademija", "/speles", "/trenini", "/kontakti"];
  const [articleRows, playerRows, customPages, teamRows] = await Promise.all([
    db.select({ slug: articles.slug, image: articles.image }).from(articles).orderBy(desc(articles.date)),
    db.select({ id: players.id, photoUrl: players.photoUrl }).from(players),
    getPublishedClubPages(),
    db.select({ groupPhotoUrl: teams.groupPhotoUrl }).from(teams).orderBy(asc(teams.id)),
  ]);
  const imagesFor = (images: (string | null | undefined)[]) => [...new Set(images.flatMap((image) => {
    if (!image?.trim()) return [];
    try {
      const url = new URL(absoluteSiteUrl(image.trim()));
      return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password ? [url.href] : [];
    } catch {
      return [];
    }
  }))].slice(0, 1000);

  return [
    ...pages.map((path) => ({
      url: `${siteUrl}${path}`,
      ...(path === "/akademija" ? { images: imagesFor(teamRows.slice(1).map((team) => team.groupPhotoUrl)) } : {}),
    })),
    ...articleRows.map((article) => ({
      url: `${siteUrl}/jaunumi/${encodeURIComponent(article.slug)}`,
      images: imagesFor([article.image]),
    })),
    ...playerRows.map((player) => ({
      url: `${siteUrl}/komanda/speletaji/${player.id}`,
      images: imagesFor([player.id === 67 ? "/player-cutouts/nikoloz-gujabidze.png" : player.photoUrl]),
    })),
    ...customPages.map((page) => ({
      url: `${siteUrl}/klubs/${encodeURIComponent(page.slug)}`,
      lastModified: new Date(page.updatedAt),
      images: imagesFor(page.images?.split("\n") ?? []),
    })),
  ];
}
