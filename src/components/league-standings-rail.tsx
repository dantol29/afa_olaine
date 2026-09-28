"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useState } from "react";
import { SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";

import { initialStandingCardIndex } from "@/lib/league-standings-cards";
import { FullWidthGallery } from "./full-width-gallery";

type StandingCard = { pos: number; team: string; logo: string | null; played: number; points: number; isOlaine: boolean };

export function LeagueStandingsRail({ url, standings }: { url: string; standings: StandingCard[] }) {
  const [swiper, setSwiper] = useState<SwiperType | null>(null);
  const initialCardIndex = initialStandingCardIndex(standings);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const updateNavigation = (instance: SwiperType) => {
    setCanScrollPrev(!instance.isBeginning);
    setCanScrollNext(!instance.isEnd);
  };

  return (
    <section aria-labelledby="league-table-heading" className="overflow-hidden bg-[#050505] pb-5 pt-2 text-white xl:pb-8 xl:pt-4">
      <div className="mx-auto w-[calc(100%-3rem)] max-w-[1500px] md:w-[calc(100%-10rem)]">
        <p className="mb-20 flex items-center justify-center gap-[0.12em] whitespace-nowrap font-heading text-[42px] font-semibold uppercase leading-none tracking-[-0.03em] text-white min-[390px]:text-[48px] sm:text-[72px] lg:text-[96px] xl:mb-28">
          Anno <span className="bg-gradient-to-r from-[#fbb040] via-white to-[#fbb040] bg-clip-text text-transparent">2013</span>
        </p>
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-3 sm:gap-5">
            <h2 id="league-table-heading" className="font-heading text-[32px] font-semibold uppercase leading-none sm:text-[42px]">Tabula</h2>
            <div className="hidden items-center gap-2 sm:flex">
              <button type="button" disabled={!canScrollPrev} onClick={() => swiper?.slidePrev()} aria-label="Iepriekšējās komandas" className="grid size-11 place-items-center border border-white/50 transition-colors hover:border-white hover:bg-white hover:text-[#050505] disabled:cursor-not-allowed disabled:border-white/25 disabled:text-white/40 disabled:hover:border-white/25 disabled:hover:bg-transparent disabled:hover:text-white/40"><ArrowLeft className="size-4" aria-hidden="true" /></button>
              <button type="button" disabled={!canScrollNext} onClick={() => swiper?.slideNext()} aria-label="Nākamās komandas" className="grid size-11 place-items-center border border-white/50 transition-colors hover:border-white hover:bg-white hover:text-[#050505] disabled:cursor-not-allowed disabled:border-white/25 disabled:text-white/40 disabled:hover:border-white/25 disabled:hover:bg-transparent disabled:hover:text-white/40"><ArrowRight className="size-4" aria-hidden="true" /></button>
            </div>
          </div>
          <Link href={url} target="_blank" rel="noreferrer" className="shrink-0 border border-white/50 px-3 py-2.5 font-heading text-xs font-semibold uppercase tracking-wide transition-colors hover:border-white hover:bg-white hover:text-[#050505] sm:px-4 sm:text-sm">Visa tabula</Link>
        </div>
      </div>

      <FullWidthGallery
        className="mt-10 !overflow-visible"
        slideWidth={(width) => width >= 640 ? 280 : 230}
        spaceBetween={32}
        endOffset={0}
        freeMode
        onSwiper={(instance) => {
          setSwiper(instance);
          instance.slideTo(initialCardIndex, 0);
          updateNavigation(instance);
        }}
        onSlideChange={updateNavigation}
      >
        {standings.map((team) => (
          <SwiperSlide key={`${team.pos}-${team.team}`} className="!h-[260px] !w-[230px] sm:!h-[300px] sm:!w-[280px]">
            <article className={`relative flex h-full min-w-0 flex-col overflow-hidden p-5 sm:p-6 ${team.isOlaine ? "bg-[linear-gradient(135deg,#8a6019,#3c2608)]" : "bg-[#19191B]"}`}>
              {team.isOlaine && team.logo && <Image src="/afaolaine-logo-outline.png" alt="" fill aria-hidden="true" className="pointer-events-none object-contain p-5 opacity-[0.3]" />}
              <span className="relative z-10 font-heading text-[64px] font-semibold leading-none text-white sm:text-[76px]">{team.pos}</span>
              {team.logo ? <Image src={team.logo} alt="" width={64} height={64} className="absolute right-5 top-6 z-10 size-[52px] object-contain sm:right-6 sm:top-7 sm:size-[64px]" /> : <span className="absolute right-5 top-6 z-10 grid size-[52px] place-items-center rounded-full border border-white/30 font-heading text-sm sm:right-6 sm:top-7 sm:size-[64px]">{team.team.slice(0, 2).toUpperCase()}</span>}
              <h3 className="relative z-10 mt-auto max-w-[190px] font-heading text-[24px] font-semibold uppercase leading-[0.98] sm:text-[29px]">{team.team}</h3>
              <dl className="relative z-10 mt-3 grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 text-[18px] leading-none sm:text-[21px]"><dt className="text-white/85">Punkti</dt><dd className="font-semibold">{team.points}</dd><dt className="text-white/65">Spēles</dt><dd className="text-white/80">{team.played}</dd></dl>
            </article>
          </SwiperSlide>
        ))}
      </FullWidthGallery>
    </section>
  );
}
