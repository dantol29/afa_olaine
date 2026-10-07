import { desc } from "drizzle-orm";
import { db } from "@/db/client";
import { articles } from "@/db/schema";
import { absoluteSiteUrl, getSiteUrl } from "@/lib/site-url";

export const dynamic = "force-static";
export const revalidate = 3600;

function xml(value: string) {
  return value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

export async function GET() {
  const rows = await db.select({ slug: articles.slug, title: articles.title, excerpt: articles.excerpt, date: articles.date })
    .from(articles).orderBy(desc(articles.date), desc(articles.createdAt)).limit(50);
  const items = rows.map((article) => {
    const url = xml(absoluteSiteUrl(`/jaunumi/${encodeURIComponent(article.slug)}`));
    const date = new Date(`${article.date}T00:00:00Z`);
    const validDate = /^\d{4}-\d{2}-\d{2}$/.test(article.date) && !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === article.date;
    // The CMS stores a publication date, not a time. Do not invent a timestamp.
    return `<item><title>${xml(article.title)}</title><link>${url}</link><guid isPermaLink="true">${url}</guid><description>${xml(article.excerpt)}</description>${validDate ? `<dc:date>${xml(article.date)}</dc:date>` : ""}</item>`;
  }).join("\n");
  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
<channel><title>AFA Olaine jaunumi</title><link>${xml(getSiteUrl())}</link><description>AFA Olaine futbola kluba un akadēmijas jaunumi.</description><language>lv</language><atom:link href="${xml(absoluteSiteUrl('/feed.xml'))}" rel="self" type="application/rss+xml" />
${items}
</channel></rss>`;
  return new Response(feed, { headers: { "Content-Type": "application/rss+xml; charset=utf-8", "X-Content-Type-Options": "nosniff" } });
}
