import type { Metadata } from "next";
import { pageMetadata } from "@/lib/page-metadata";
import { notFound } from "next/navigation";
import { getPublishedClubPages } from "@/lib/club-pages-server";
import { sanitizeRichText } from "@/lib/rich-text";
import { SiteHeader } from "@/components/site-header";
import { InnerPageHero } from "@/components/inner-page-hero";
import { SiteEnding } from "@/components/site-ending";
import { StructuredData } from "@/components/structured-data";
import { webPageData } from "@/lib/web-page-data";
import { parseClubPageMedia } from "@/lib/club-page-media";
import { ClubPageGallery } from "@/components/club-page-gallery";
import { ArrowUpRight } from "lucide-react";

type PageProps = { params: Promise<{ slug: string }> };

async function getPage(params: PageProps["params"]) {
  const { slug } = await params;
  const page = (await getPublishedClubPages()).find((item) => item.slug === slug);
  if (!page) notFound();
  return page;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const page = await getPage(params);
  return pageMetadata({
    title: `${page.title} | AFA Olaine`,
    description: page.description,
    path: `/klubs/${encodeURIComponent(page.slug)}`,
    image: parseClubPageMedia(page.images).photos[0]?.src,
  });
}

export default async function CustomClubPage({ params }: PageProps) {
  const page = await getPage(params);
  const media = parseClubPageMedia(page.images);
  const sidebar = media.layout === "sidebar" && media.photos.length > 0;
  return <main className="min-h-screen bg-[#050505] text-white">
    <StructuredData data={webPageData({ name: page.title, description: page.description, path: `/klubs/${encodeURIComponent(page.slug)}`, dateModified: new Date(page.updatedAt).toISOString() })} />
    <SiteHeader />
    <InnerPageHero title={page.title} id="custom-page-title" />
    <div className={`mx-auto grid w-[calc(100%-3rem)] max-w-[1500px] gap-10 pb-16 pt-10 md:w-[calc(100%-10rem)] md:pb-24 md:pt-16 ${sidebar ? "lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]" : ""}`}>
      <article className="min-w-0 max-w-[75ch] font-sans text-lg leading-relaxed">
        <p className="mb-8 text-xl text-white/75">{page.description}</p>
        <div className="rich-page-content custom-page-body" dangerouslySetInnerHTML={{ __html: sanitizeRichText(page.body) }} />
        {media.actions.length > 0 && <div className="mt-8 flex flex-wrap gap-3">{media.actions.map((action, index) => <a key={index} href={action.href} target={action.newTab ? "_blank" : undefined} rel={action.newTab ? "noopener noreferrer" : undefined} className={`inline-flex min-h-12 max-w-full items-center justify-center gap-3 border px-5 py-3 text-center font-heading text-base font-semibold uppercase leading-snug transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#fbb040] ${action.style === "primary" ? "border-[#fbb040] bg-[#fbb040] text-black hover:border-white hover:bg-white" : "border-white/50 text-white hover:border-[#fbb040] hover:bg-[#fbb040] hover:text-black"}`}>
          <span className="min-w-0 break-words">{action.label}</span><ArrowUpRight className="size-4 shrink-0" aria-hidden="true" />{action.newTab && <span className="sr-only"> (atveras jaunā cilnē)</span>}
        </a>)}</div>}
      </article>
      {media.photos.length > 0 && <div className={sidebar ? "min-w-0" : "min-w-0 border-t border-white/15 pt-10"}><ClubPageGallery photos={media.photos} title={page.title} layout={media.layout} /></div>}
    </div>
    <SiteEnding />
  </main>;
}
