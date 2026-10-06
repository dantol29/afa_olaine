import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ArticlePageContent } from "@/components/article-page-content";
import { SiteEnding } from "@/components/site-ending";
import { SiteHeader } from "@/components/site-header";
import { getArticleBySlug } from "@/lib/jaunumi-server";
import { getSiteUrl } from "@/lib/site-url";

type ArticlePageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return { title: "Raksts nav atrasts | AFA Olaine" };

  return {
    title: `${article.title} | AFA Olaine`,
    description: article.excerpt,
    alternates: { canonical: `/jaunumi/${article.slug}` },
    openGraph: {
      type: "article",
      locale: "lv_LV",
      siteName: "AFA Olaine",
      url: `/jaunumi/${article.slug}`,
      title: article.title,
      description: article.excerpt,
      publishedTime: article.dateKey,
      images: [article.image],
    },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();
  const siteUrl = getSiteUrl();
  const structuredArticle = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.excerpt,
    image: new URL(article.image, siteUrl).href,
    datePublished: article.dateKey,
    inLanguage: "lv-LV",
    mainEntityOfPage: `${siteUrl}/jaunumi/${article.slug}`,
    author: article.authorName ? { "@type": "Person", name: article.authorName } : { "@id": `${siteUrl}/#organization` },
    publisher: { "@id": `${siteUrl}/#organization` },
  };

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredArticle).replace(/</g, "\\u003c") }} />
      <SiteHeader />
      <ArticlePageContent article={article} />
      <SiteEnding />
    </main>
  );
}
