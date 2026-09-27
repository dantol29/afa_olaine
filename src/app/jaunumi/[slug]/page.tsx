import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ArticlePageContent } from "@/components/article-page-content";
import { SiteEnding } from "@/components/site-ending";
import { SiteHeader } from "@/components/site-header";
import { getArticleBySlug } from "@/lib/jaunumi-server";

type ArticlePageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return { title: "Raksts nav atrasts | AFA Olaine" };

  return {
    title: `${article.title} | AFA Olaine`,
    description: article.excerpt,
    openGraph: { title: article.title, description: article.excerpt, images: [article.image] },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <SiteHeader />
      <ArticlePageContent article={article} />
      <SiteEnding />
    </main>
  );
}
