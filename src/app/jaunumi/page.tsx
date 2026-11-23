import { pageMetadata } from "@/lib/page-metadata";

import { InnerPageHero } from "@/components/inner-page-hero";
import { NewsGrid } from "@/components/news-grid";
import { SiteEnding } from "@/components/site-ending";
import { SiteHeader } from "@/components/site-header";
import { getArticles } from "@/lib/jaunumi-server";
import { StructuredData } from "@/components/structured-data";
import { webPageData } from "@/lib/web-page-data";
import { absoluteSiteUrl } from "@/lib/site-url";
import { NEWS_CATEGORY_PARAM } from "@/lib/news-filters";
import { TEAM_FILTER_PARAM, firstSearchParam, type SearchParamValue } from "@/lib/url-state";

export const metadata = pageMetadata({
  title: "AFA Olaine jaunumi | Futbola kluba aktualitātes",
  description: "Lasi AFA Olaine jaunākos rakstus par komandām, spēlēm, akadēmiju un kluba notikumiem Olainē. Seko līdzi futbolistu sasniegumiem un gaidāmajiem pasākumiem.",
  path: "/jaunumi",
});

export default async function NewsPage({ searchParams }: { searchParams: Promise<Record<string, SearchParamValue>> }) {
  const params = await searchParams;
  const articles = await getArticles();

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <StructuredData data={webPageData({
        type: "CollectionPage",
        name: "AFA Olaine jaunumi",
        path: "/jaunumi",
        mainEntity: {
          "@type": "ItemList",
          itemListElement: articles.map((article, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: article.title,
            url: absoluteSiteUrl(article.path),
          })),
        },
      })} />
      <SiteHeader />
      <InnerPageHero title="Jaunumi" id="news-page-title" />
      <NewsGrid
        articles={articles}
        initialTeam={firstSearchParam(params[TEAM_FILTER_PARAM]) ?? null}
        initialCategory={firstSearchParam(params[NEWS_CATEGORY_PARAM]) ?? null}
      />
      <SiteEnding />
    </main>
  );
}
