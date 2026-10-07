import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ArticlePageContent } from "@/components/article-page-content";
import { SiteEnding } from "@/components/site-ending";
import { SiteHeader } from "@/components/site-header";
import { getArticleBySlug, getRelatedArticles } from "@/lib/jaunumi-server";
import { getSiteUrl } from "@/lib/site-url";
import { pageMetadata } from "@/lib/page-metadata";
import { StructuredData } from "@/components/structured-data";
import { BreadcrumbData } from "@/components/breadcrumb-data";

type ArticlePageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return { title: "Raksts nav atrasts | AFA Olaine" };

  return {
    ...pageMetadata({
      title: `${article.title} | AFA Olaine`,
      description: article.excerpt,
      path: `/jaunumi/${encodeURIComponent(article.slug)}`,
      image: article.image,
    }),
    openGraph: {
      type: "article",
      locale: "lv_LV",
      siteName: "AFA Olaine",
      url: `/jaunumi/${encodeURIComponent(article.slug)}`,
      title: article.title,
      description: article.excerpt,
      publishedTime: article.dateKey,
      images: [{ url: article.image, alt: article.title }],
    },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();
  const relatedArticles = await getRelatedArticles(article.slug, 3);
  const siteUrl = getSiteUrl();
  const structuredArticle = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "@id": `${siteUrl}/jaunumi/${encodeURIComponent(article.slug)}#article`,
    headline: article.title,
    description: article.excerpt,
    image: new URL(article.image, siteUrl).href,
    datePublished: article.dateKey,
    inLanguage: "lv-LV",
    articleSection: article.category,
    isPartOf: { "@id": `${siteUrl}/#website` },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${siteUrl}/jaunumi/${encodeURIComponent(article.slug)}` },
    author: article.authorName ? { "@type": "Person", name: article.authorName } : { "@type": "SportsOrganization", "@id": `${siteUrl}/#organization`, name: "AFA Olaine", url: siteUrl },
    publisher: {
      "@type": "SportsOrganization",
      "@id": `${siteUrl}/#organization`,
      name: "AFA Olaine",
      url: siteUrl,
      logo: { "@type": "ImageObject", url: `${siteUrl}/afaolaine-logo.png` },
    },
  };

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <StructuredData data={structuredArticle} />
      <BreadcrumbData items={[
        { name: "Sākums", path: "/" },
        { name: "Jaunumi", path: "/jaunumi" },
        { name: article.title, path: `/jaunumi/${encodeURIComponent(article.slug)}` },
      ]} />
      <SiteHeader />
      <ArticlePageContent article={article} />
      {relatedArticles.length > 0 && <section aria-labelledby="related-news-title" className="mx-auto w-[calc(100%-3rem)] max-w-[1500px] pb-16 md:w-[calc(100%-10rem)]">
        <h2 id="related-news-title" className="font-heading text-[30px] font-semibold uppercase leading-none sm:text-[40px]">Lasīt arī</h2>
        <div className="mt-7 grid gap-5 md:grid-cols-3">
          {relatedArticles.map((related) => <Link key={related.slug} href={`/jaunumi/${encodeURIComponent(related.slug)}`} className="block bg-[#19191b] p-5 transition-colors hover:text-[#fbb040] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#fbb040]">
            <p className="mb-3 font-sans text-sm text-white/60">{related.date}</p>
            <h3 className="font-heading text-[25px] font-semibold uppercase leading-tight">{related.title}</h3>
          </Link>)}
        </div>
      </section>}
      <SiteEnding />
    </main>
  );
}
