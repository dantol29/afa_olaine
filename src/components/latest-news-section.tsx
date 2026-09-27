import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import type { Article } from "@/lib/jaunumi";

export function LatestNewsSection({ articles, showAll = false }: { articles: Article[]; showAll?: boolean }) {
  const visibleArticles = showAll ? articles : articles.slice(0, 5);
  if (visibleArticles.length === 0 && !showAll) return null;

  return (
    <section id="jaunumi" aria-label={showAll ? "Visi jaunumi" : undefined} aria-labelledby={showAll ? undefined : "latest-news-heading"} className="bg-[#050505] pb-16 pt-6 text-white xl:pb-24 xl:pt-10">
      <div className="mx-auto w-[calc(100%-3rem)] max-w-[1500px] md:w-[calc(100%-10rem)]">
        {!showAll && <div className="mb-8 flex items-center justify-between gap-6 sm:mb-10">
          <h2 id="latest-news-heading" className="font-heading text-[32px] font-semibold uppercase leading-none sm:text-[42px]">Jaunumi</h2>
          <Link href="/jaunumi" className="shrink-0 border border-white/50 px-3 py-2.5 font-heading text-xs font-semibold uppercase tracking-wide transition-colors hover:border-white hover:bg-white hover:text-[#050505] sm:px-4 sm:text-sm">
            Visi jaunumi
          </Link>
        </div>}

        <div className="space-y-5 sm:space-y-7">
          {visibleArticles.length === 0 && <p className="py-14 text-base text-white/70">Jaunumu vēl nav.</p>}
          {visibleArticles.map((article) => (
            <Link key={article.slug} href={`/jaunumi/${article.slug}`} className="group grid overflow-hidden bg-white text-[#050505] outline-offset-4 focus-visible:outline-2 focus-visible:outline-white md:grid-cols-2">
              <div className="relative aspect-[16/10] overflow-hidden bg-[#19191b] md:aspect-auto md:min-h-[320px]">
                <Image src={article.image} alt="" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                <span aria-hidden="true" className="absolute bottom-0 left-0 h-1.5 w-16 bg-[#fbb040]" />
              </div>
              <article className="relative flex min-h-[220px] flex-col px-5 py-6 sm:min-h-[250px] sm:px-8 sm:py-8 lg:px-10 lg:py-10">
                <p className="pr-12 text-sm font-semibold"><span className="text-[#d88a13]">{article.category}</span><span className="ml-3 text-[#5d5d5d]">{article.date}</span></p>
                <h3 className="mt-5 max-w-[24ch] font-heading text-[30px] font-semibold uppercase leading-[0.93] sm:text-[38px] lg:text-[46px]">{article.title}</h3>
                <span aria-hidden="true" className="absolute right-5 top-6 grid size-10 place-items-center bg-[#050505] text-white transition-colors group-hover:bg-[#fbb040] group-hover:text-[#050505] sm:right-8 sm:top-8"><ArrowUpRight className="size-5" /></span>
              </article>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
