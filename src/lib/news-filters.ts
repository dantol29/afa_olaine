// Pure rules for the public /jaunumi filters, shared by the server page and the client component so both read a
// URL such as ?komanda=3&kategorija=speles the same way. A value that does not match anything means "no filter".
import { compareLatvian, sortByName } from "@/lib/ordering";
import type { ArticleCategory } from "@/lib/jaunumi";
import { parseIdParam } from "@/lib/url-state";

export const NEWS_CATEGORY_PARAM = "kategorija";

/** Plain-ASCII URL codes for the categories, so a link does not carry Latvian letters. */
const CATEGORY_CODES: Record<ArticleCategory, string> = {
  Klubs: "klubs",
  Komandas: "komandas",
  Spēles: "speles",
  Treniņi: "trenini",
  Pasākumi: "pasakumi",
};

type FilterableArticle = { category: ArticleCategory; teamId?: number; team?: string };

export function categoryCode(category: ArticleCategory): string {
  return CATEGORY_CODES[category];
}

/** The category for a URL code, or null when it is missing, unknown or not used by any article. */
export function parseCategoryParam(value: string | null | undefined, options: readonly ArticleCategory[]): ArticleCategory | null {
  return options.find((category) => CATEGORY_CODES[category] === value) ?? null;
}

/** Every distinct team that has an article, in Latvian name order. Club-wide articles have no team and are not listed. */
export function newsTeamOptions(articles: readonly FilterableArticle[]): { id: number; name: string }[] {
  const teamsById = new Map<number, { id: number; name: string }>();
  for (const article of articles) {
    if (article.teamId !== undefined && article.team) teamsById.set(article.teamId, { id: article.teamId, name: article.team });
  }
  return sortByName([...teamsById.values()], (team) => team.name);
}

/** Every distinct category that has an article, in Latvian label order. */
export function newsCategoryOptions(articles: readonly FilterableArticle[]): ArticleCategory[] {
  return [...new Set(articles.map((article) => article.category))].sort(compareLatvian);
}

export const parseNewsTeamParam = parseIdParam;

export function filterArticles<T extends FilterableArticle>(articles: readonly T[], teamId: number | null, category: ArticleCategory | null): T[] {
  return articles.filter((article) => (teamId === null || article.teamId === teamId) && (category === null || article.category === category));
}
