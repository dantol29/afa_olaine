import type { Metadata } from "next";

import { InnerPageHero } from "@/components/inner-page-hero";
import { NewsGrid } from "@/components/news-grid";
import { SiteEnding } from "@/components/site-ending";
import { SiteHeader } from "@/components/site-header";
import { getArticles } from "@/lib/jaunumi-server";

export const metadata: Metadata = {
  title: "AFA Olaine jaunumi | Futbola kluba aktualitātes",
  description: "Lasi AFA Olaine jaunākos rakstus par komandām, spēlēm, akadēmiju un kluba notikumiem Olainē. Seko līdzi futbolistu sasniegumiem un gaidāmajiem pasākumiem.",
  alternates: { canonical: "/jaunumi" },
};

export default async function NewsPage() {
  const articles = await getArticles();

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <SiteHeader />
      <InnerPageHero title="Jaunumi" id="news-page-title" />
      <NewsGrid articles={articles} />
      <SiteEnding />
    </main>
  );
}
