import Link from "next/link";
import { ChevronRight, House } from "lucide-react";

import type { Article } from "@/lib/jaunumi";

import { ArticleHeroImage } from "./article-hero-image";
import { ArticleShareButtons } from "./article-share-buttons";

export function ArticlePageContent({ article }: { article: Article }) {
  return (
    <article className="bg-[#050505] text-white">
      <section aria-label={article.title} className="relative isolate h-[68svh] min-h-[520px] overflow-hidden md:h-[76svh] md:min-h-[620px]">
        <ArticleHeroImage src={article.image} alt={article.title} />
        <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,0.55)_0%,rgba(5,5,5,0.08)_42%,rgba(5,5,5,0.76)_100%)]" />
        <nav aria-label="Atpakaļceļš" className="absolute inset-x-0 top-24 z-10 hidden md:top-28 md:block">
          <div className="mx-auto flex w-[calc(100%-3rem)] max-w-[1500px] items-center gap-3 pl-12 text-sm font-semibold text-white/80 md:w-[calc(100%-10rem)] md:pl-24">
            <Link href="/" aria-label="Sākums" className="transition-colors hover:text-[#fbb040] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"><House className="size-5" aria-hidden="true" /></Link>
            <ChevronRight className="size-4" aria-hidden="true" />
            <Link href="/jaunumi" className="font-heading text-base uppercase transition-colors hover:text-[#fbb040] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Jaunumi</Link>
          </div>
        </nav>
      </section>

      <div className="relative z-10 mx-auto -mt-24 w-full max-w-[860px] bg-[#050505] px-6 pb-9 pt-8 sm:px-10 md:-mt-28 md:pb-12 md:pt-10">
        <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1 font-sans text-sm font-semibold uppercase tracking-wide sm:text-base">
          <span className="text-[#fbb040]">{article.category}</span>
          <time className="text-white/65">{article.date}</time>
        </div>
        <h1 className="font-heading text-[34px] font-semibold uppercase leading-[0.96] tracking-[-0.02em] sm:text-[46px] lg:text-[56px]">{article.title}</h1>
        <div className="mt-7 flex justify-start">
          <ArticleShareButtons title={article.title} />
        </div>
      </div>

      <div className="mx-auto max-w-[860px] px-6 pb-20 pt-10 font-sans text-[18px] leading-[1.75] text-white/85 sm:px-10 sm:pb-28 sm:pt-14 sm:text-[20px]">
        {article.excerpt && <p className="mb-9 text-[22px] font-semibold leading-[1.5] text-white sm:text-[26px]">{article.excerpt}</p>}
        <div className="space-y-7">
          {article.body.map((paragraph, index) => <p key={`${index}-${paragraph.slice(0, 20)}`}>{paragraph}</p>)}
        </div>
      </div>
    </article>
  );
}
