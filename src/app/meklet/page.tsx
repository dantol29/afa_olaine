import type { Metadata } from "next";

import { InnerPageHero } from "@/components/inner-page-hero";
import { PublicSearchContent } from "@/components/public-search-content";
import { SiteEnding } from "@/components/site-ending";
import { SiteHeader } from "@/components/site-header";
import { searchSite } from "@/lib/search-server";

export const metadata: Metadata = {
  title: "Meklēt | AFA Olaine",
  description: "Meklē AFA Olaine jaunumus, spēlētājus, trenerus un komandas.",
};

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q.trim() : "";
  const results = await searchSite(query);

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <SiteHeader />
      <InnerPageHero title="Meklēt" id="search-page-title" />
      <PublicSearchContent query={query} results={results} />
      <SiteEnding />
    </main>
  );
}
