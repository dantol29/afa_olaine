import type { Metadata } from "next";
import { pageMetadata } from "@/lib/page-metadata";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getPublishedClubPages } from "@/lib/club-pages-server";
import { sanitizeRichText } from "@/lib/rich-text";
import { SiteHeader } from "@/components/site-header";
import { InnerPageHero } from "@/components/inner-page-hero";
import { SiteEnding } from "@/components/site-ending";
import { StructuredData } from "@/components/structured-data";
import { webPageData } from "@/lib/web-page-data";

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
    image: page.images?.split("\n").find((image) => image.trim())?.trim(),
  });
}

export default async function CustomClubPage({ params }: PageProps) {
  const page = await getPage(params);
  const images = page.images?.split("\n").filter(Boolean) ?? [];
  return <main className="min-h-screen bg-[#050505] text-white">
    <StructuredData data={webPageData({ name: page.title, description: page.description, path: `/klubs/${encodeURIComponent(page.slug)}`, dateModified: new Date(page.updatedAt).toISOString() })} />
    <SiteHeader />
    <InnerPageHero title={page.title} id="custom-page-title" />
    <div className={`mx-auto grid w-[calc(100%-3rem)] max-w-[1500px] gap-10 pb-16 md:w-[calc(100%-10rem)] md:pb-24 ${images.length ? "lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]" : ""}`}>
      <article className="min-w-0 max-w-[75ch] font-sans text-lg leading-relaxed">
        <p className="mb-8 text-xl text-white/75">{page.description}</p>
        <div className="rich-page-content custom-page-body" dangerouslySetInnerHTML={{ __html: sanitizeRichText(page.body) }} />
      </article>
      {images.length > 0 && <div className="grid content-start gap-6">{images.map((src, index) => <Image key={`${src}-${index}`} src={src} alt={`${page.title} — attēls ${index + 1}`} width={960} height={720} sizes="(min-width: 1024px) 40vw, 100vw" className="h-auto w-full object-contain" />)}</div>}
    </div>
    <SiteEnding />
  </main>;
}
