"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import type { Article, ArticleCategory } from "@/lib/jaunumi";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const fallbackImages: Record<ArticleCategory, string> = {
  Klubs: "/hero-team.png",
  Komandas: "/hero-team.png",
  Spēles: "/match-stadium.jpg",
  Treniņi: "/info-akademija.jpg",
  Pasākumi: "/hero-team.png",
};

function NewsImage({ article }: { article: Article }) {
  const [src, setSrc] = useState(article.image || fallbackImages[article.category]);

  return (
    <Image
      src={src}
      alt={article.title}
      fill
      sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
      className="object-cover transition-transform duration-300 ease-out motion-reduce:transition-none group-hover:scale-[1.03] motion-reduce:group-hover:scale-100"
      onError={() => setSrc(fallbackImages[article.category])}
    />
  );
}

function Filter({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  const selectedValue = value || "__all__";

  return (
    <div className="min-w-0">
      <Select<string> value={selectedValue} onValueChange={(nextValue) => onChange(nextValue === "__all__" ? "" : nextValue ?? "")}>
        <SelectTrigger
          aria-label={label}
          className={`min-h-12 w-full rounded-none px-4 py-3 font-heading text-[18px] font-semibold uppercase leading-none sm:w-auto sm:px-7 sm:text-[22px] ${value ? "border border-white bg-white text-[#050505] hover:bg-white" : "border border-white/40 bg-[#050505] text-white hover:border-white hover:bg-[#050505]"} focus-visible:ring-2 focus-visible:ring-[#fbb040]`}
        >
          <SelectValue>{(current: string) => current === "__all__" ? label : current}</SelectValue>
        </SelectTrigger>
        <SelectContent sideOffset={4} className="rounded-none border border-white/40 bg-[#121212] p-1 text-white shadow-xl">
          <SelectItem value="__all__" className="min-h-10 rounded-none font-heading text-[18px] uppercase data-highlighted:bg-white data-highlighted:text-[#050505] data-selected:text-[#fbb040] [&_svg]:text-[#fbb040]">
            {label}
          </SelectItem>
          {options.map((option) => (
            <SelectItem key={option} value={option} className="min-h-10 rounded-none font-heading text-[18px] uppercase data-highlighted:bg-white data-highlighted:text-[#050505] data-selected:text-[#fbb040] [&_svg]:text-[#fbb040]">
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function NewsGrid({ articles }: { articles: Article[] }) {
  const [section, setSection] = useState("");
  const [category, setCategory] = useState("");

  const sections = [...new Set(articles.map((article) => article.team ?? "Klubs"))].sort((a, b) => a.localeCompare(b, "lv"));
  const categories = [...new Set(articles.map((article) => article.category))].sort((a, b) => a.localeCompare(b, "lv"));
  const visibleArticles = articles.filter((article) =>
    (!section || (article.team ?? "Klubs") === section) &&
    (!category || article.category === category),
  );

  return (
    <section aria-label="Jaunumu saraksts" className="bg-[#050505] pb-16 pt-6 text-white sm:pt-8 xl:pb-24">
      <div className="mx-auto w-[calc(100%-3rem)] max-w-[1500px] md:w-[calc(100%-10rem)]">
        <div className="mb-8 grid grid-cols-2 gap-2 sm:mb-10 sm:flex sm:gap-3">
          <Filter label="Komanda" value={section} options={sections} onChange={setSection} />
          <Filter label="Kategorija" value={category} options={categories} onChange={setCategory} />
        </div>

        {visibleArticles.length > 0 ? (
          <div key={`${section}:${category}`} className="site-panel-enter grid gap-6 md:grid-cols-2 xl:grid-cols-3 xl:gap-x-7 xl:gap-y-10">
            {visibleArticles.map((article) => (
              <Link key={article.slug} href={`/jaunumi/${article.slug}`} className="group block min-w-0 bg-[#19191b] text-white outline-offset-4 focus-visible:outline-2 focus-visible:outline-[#fbb040]">
                <article className="h-full">
                  <div className="relative aspect-video overflow-hidden bg-[#19191b]">
                    <NewsImage article={article} />
                    <span aria-hidden="true" className="absolute bottom-0 left-0 z-10 h-6 w-12 bg-[#19191b]"><span className="absolute right-0 top-0 h-3 w-6 bg-[#fbb040]" /><span className="absolute bottom-0 left-0 h-3 w-6 bg-[#050505]" /></span>
                  </div>
                  <div className="relative min-h-[132px] px-4 pb-5 pt-4 sm:min-h-[146px] sm:px-5">
                    <p className="flex flex-wrap gap-x-2 font-sans text-sm leading-5"><span className="font-semibold text-[#fbb040]">{article.category}</span><time dateTime={article.dateKey} className="text-white/60">{article.date}</time></p>
                    <h2 className="mt-3 line-clamp-3 font-heading text-[25px] font-semibold uppercase leading-[1.03] sm:text-[28px]">{article.title}</h2>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        ) : (
          <p className="py-14 text-base text-white/70">Šiem filtriem jaunumu nav.</p>
        )}
      </div>
    </section>
  );
}
