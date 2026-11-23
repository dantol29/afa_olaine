import "server-only";
import { cachePublicData } from "@/lib/public-data-cache";
import { desc, eq, ne } from "drizzle-orm";

import { db } from "@/db/client";
import { articles } from "@/db/schema";
import { articleAddress, articleIdFromAddress, articlePath } from "@/lib/article-path";
import { formatArticleDate, type Article } from "@/lib/jaunumi";

type ArticleRow = typeof articles.$inferSelect;
type AuthorCoach =
  | { name: string; position: string; photoUrl: string | null }
  | null
  | undefined;

function rowToArticle(row: ArticleRow, team: { id: number; name: string; sort: number } | null, authorCoach: AuthorCoach): Article {
  const highlights = row.highlights?.split("\n").filter(Boolean);
  return {
    id: row.id,
    slug: row.slug,
    path: articlePath(row),
    title: row.title,
    excerpt: row.excerpt,
    date: formatArticleDate(row.date),
    dateKey: row.date,
    category: row.category,
    team: team?.name,
    teamId: team?.id,
    teamSort: team?.sort,
    image: row.image,
    authorName: authorCoach?.name ?? undefined,
    authorPosition: authorCoach?.position ?? undefined,
    authorAvatar: authorCoach?.photoUrl ?? undefined,
    body: row.body,
    highlights: highlights && highlights.length > 0 ? highlights : undefined,
  };
}

/** All articles for the /jaunumi directory, newest first. */
export const getArticles = cachePublicData("articles", async function getArticles(limit?: number): Promise<Article[]> {
  const rows = await db.query.articles.findMany({
    with: { team: true, authorCoach: true },
    orderBy: [desc(articles.date), desc(articles.createdAt)],
    ...(limit === undefined ? {} : { limit }),
  });
  return rows.map((row) => rowToArticle(row, row.team ?? null, row.authorCoach));
});

/** Public article data is shared across requests for 60 seconds and expires
 *  immediately after an admin content update. */
export const getArticleByAddress = cachePublicData("article-by-address",
  async (address: string): Promise<{ article: Article; isCurrentAddress: boolean } | null> => {
    const find = (where: ReturnType<typeof eq>) => db.query.articles.findFirst({ where, with: { team: true, authorCoach: true } });
    const toResult = (row: NonNullable<Awaited<ReturnType<typeof find>>>) => ({
      article: rowToArticle(row, row.team ?? null, row.authorCoach),
      isCurrentAddress: articleAddress(row) === address,
    });
    // The current address first: "<slug>-<id>" with the id of this very article.
    const id = articleIdFromAddress(address);
    const byId = id === null ? undefined : await find(eq(articles.id, id));
    if (byId && articleAddress(byId) === address) return toResult(byId);
    // An old address was the slug alone (which may itself end in a number, such as a year).
    const bySlug = await find(eq(articles.slug, address));
    if (bySlug) return toResult(bySlug);
    return byId ? toResult(byId) : null;
  },
);

/** Other recent articles shown on an article detail page. */
export const getRelatedArticles = cachePublicData("related-articles", async function getRelatedArticles(
  excludeSlug: string,
  limit: number = 4,
): Promise<{ slug: string; path: string; title: string; date: string; image: string }[]> {
  const rows = await db.query.articles.findMany({
    where: ne(articles.slug, excludeSlug),
    orderBy: [desc(articles.date), desc(articles.createdAt)],
    limit,
  });
  return rows.map((row) => ({
    slug: row.slug,
    path: articlePath(row),
    title: row.title,
    date: formatArticleDate(row.date),
    image: row.image,
  }));
});
