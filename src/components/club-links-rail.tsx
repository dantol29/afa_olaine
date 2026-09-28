"use client";

import Image from "next/image";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { useState } from "react";
import { SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";

import { FullWidthGallery } from "./full-width-gallery";

const CLUB_LINKS = [
  { title: "Spēļu kalendārs", href: "/speles", image: "/match-stadium.jpg", position: "center" },
  { title: "Jaunumi", href: "/jaunumi", image: "/hero-team.png", position: "center" },
  { title: "Akadēmija", href: "/akademija", image: "/info-akademija.jpg", position: "52% center" },
  { title: "Treniņi", href: "/trenini", image: "/match-stadium.jpg", position: "center" },
  { title: "Kontakti", href: "/kontakti", image: "/match-stadium.jpg", position: "75% center" },
] as const;

export function ClubLinksRail() {
  const [swiper, setSwiper] = useState<SwiperType | null>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(CLUB_LINKS.length > 1);
  const updateNavigation = (instance: SwiperType) => {
    setCanScrollPrev(!instance.isBeginning);
    setCanScrollNext(!instance.isEnd);
  };

  return (
    <section aria-labelledby="club-links-heading" className="overflow-hidden bg-[#050505] pb-14 text-white xl:pb-20">
      <div className="mx-auto w-[calc(100%-3rem)] max-w-[1500px] md:w-[calc(100%-10rem)]">
        <div className="flex items-center gap-2 sm:gap-3">
          <h2 id="club-links-heading" className="font-heading text-[30px] font-semibold uppercase leading-none sm:text-[40px]">Info</h2>
          <button type="button" disabled={!canScrollPrev} onClick={() => swiper?.slidePrev()} aria-label="Iepriekšējās sadaļas" className="grid size-10 place-items-center border border-white/50 transition-colors hover:border-white hover:bg-white hover:text-[#050505] disabled:cursor-not-allowed disabled:border-white/25 disabled:text-white/40 disabled:hover:border-white/25 disabled:hover:bg-transparent disabled:hover:text-white/40 sm:size-11"><ArrowLeft className="size-4" aria-hidden="true" /></button>
          <button type="button" disabled={!canScrollNext} onClick={() => swiper?.slideNext()} aria-label="Nākamās sadaļas" className="grid size-10 place-items-center border border-white/50 transition-colors hover:border-white hover:bg-white hover:text-[#050505] disabled:cursor-not-allowed disabled:border-white/25 disabled:text-white/40 disabled:hover:border-white/25 disabled:hover:bg-transparent disabled:hover:text-white/40 sm:size-11"><ArrowRight className="size-4" aria-hidden="true" /></button>
        </div>
      </div>

      <FullWidthGallery
        className="mt-7 !overflow-visible sm:mt-8"
        slideWidth={(width) => width >= 1280 ? 400 : width >= 640 ? 360 : Math.round(width * 0.72)}
        spaceBetween={20}
        onSwiper={(instance) => { setSwiper(instance); updateNavigation(instance); }}
        onSlideChange={updateNavigation}
      >
        {CLUB_LINKS.map((item) => (
          <SwiperSlide key={item.title} className="!aspect-[10/9] !h-auto !w-[72vw] sm:!w-[360px] xl:!w-[400px]">
            <a href={item.href} className="group flex h-full flex-col overflow-hidden bg-[#19191b] text-white outline-offset-4 focus-visible:outline-2 focus-visible:outline-[#fbb040]">
              <div className="relative min-h-0 flex-1 overflow-hidden bg-[#19191b]">
                <Image src={item.image} alt="" fill sizes="(min-width: 1280px) 400px, (min-width: 640px) 360px, 72vw" className="object-cover transition-transform duration-500 group-hover:scale-105" style={{ objectPosition: item.position }} />
                <Image src="/hero-logo.png" alt="" width={56} height={56} className="absolute left-5 top-5 size-14 object-contain" />
              </div>
              <div className="flex min-h-[64px] shrink-0 items-center justify-between gap-3 px-4 py-3 sm:min-h-[68px] sm:px-5 sm:py-3">
                <span className="font-heading text-[22px] font-semibold uppercase leading-[0.9] sm:text-[26px]">{item.title}</span>
                <span className="grid size-10 shrink-0 place-items-center bg-white text-[#050505] transition-colors group-hover:bg-[#fbb040]" aria-hidden="true"><ArrowUpRight className="size-5" /></span>
              </div>
            </a>
          </SwiperSlide>
        ))}
      </FullWidthGallery>
    </section>
  );
}
