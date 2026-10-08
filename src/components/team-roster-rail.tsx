"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useState } from "react";
import { SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import { FullWidthGallery } from "./full-width-gallery";

export type TeamShowcasePlayer = {
  id: number;
  name: string;
  position: string;
  number: number | null;
  imageUrl: string | null;
};

export function TeamRosterRail({ players, title = "Komanda", sectionId = "komanda", showViewAll = true, profileHrefBase = "/komanda/speletaji" }: { players: TeamShowcasePlayer[]; title?: string; sectionId?: string; showViewAll?: boolean; profileHrefBase?: string | null }) {
  const [swiper, setSwiper] = useState<SwiperType | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(players.length > 1);
  const selectedPlayer = players[selectedIndex];

  const updateNavigation = (instance: SwiperType) => {
    setCanScrollPrev(!instance.isBeginning);
    setCanScrollNext(!instance.isEnd);
  };

  return (
    <section id={sectionId} aria-labelledby={`${sectionId}-heading`} className="relative isolate z-0 overflow-hidden bg-[#050505] py-14 text-white xl:py-20">
      <div className="relative z-40 mx-auto w-[calc(100%-3rem)] max-w-[1500px] md:w-[calc(100%-10rem)]">
        <div className="relative flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col items-start sm:flex-row sm:items-center sm:gap-3">
            <h2 id={`${sectionId}-heading`} className="font-heading text-[32px] font-semibold uppercase leading-none sm:text-[42px]">{title}</h2>
            <div className="mt-5 flex items-center gap-2 sm:mt-0">
              <button type="button" disabled={!canScrollPrev} onClick={() => swiper?.slidePrev()} aria-label="Iepriekšējie spēlētāji" className="grid size-11 place-items-center border border-white/50 transition-colors hover:border-white hover:bg-white hover:text-[#050505] disabled:cursor-not-allowed disabled:border-white/25 disabled:text-white/40 disabled:hover:border-white/25 disabled:hover:bg-transparent disabled:hover:text-white/40">
                <ArrowLeft className="size-4" aria-hidden="true" />
              </button>
              <button type="button" disabled={!canScrollNext} onClick={() => swiper?.slideNext()} aria-label="Nākamie spēlētāji" className="grid size-11 place-items-center border border-white/50 transition-colors hover:border-white hover:bg-white hover:text-[#050505] disabled:cursor-not-allowed disabled:border-white/25 disabled:text-white/40 disabled:hover:border-white/25 disabled:hover:bg-transparent disabled:hover:text-white/40">
                <ArrowRight className="size-4" aria-hidden="true" />
              </button>
            </div>
          </div>
          {showViewAll && <a href="/komanda" className="absolute right-0 top-0 shrink-0 border border-white/50 px-3 py-2.5 font-heading text-xs font-semibold uppercase tracking-wide transition-colors hover:border-white hover:bg-white hover:text-[#050505] sm:static sm:px-4 sm:text-sm">Visa komanda</a>}
        </div>
      </div>

      <div className="relative z-0">
        <FullWidthGallery
        className="mt-5 !overflow-visible pb-0 pt-8 sm:mt-20 sm:pb-10 sm:pt-28"
        slideWidth={(width) => width >= 640 ? 280 : 260}
        onSwiper={(instance) => {
          setSwiper(instance);
          setSelectedIndex(instance.activeIndex);
          updateNavigation(instance);
        }}
        onSlideChange={(instance) => {
          setSelectedIndex(instance.activeIndex);
          updateNavigation(instance);
        }}
        onResize={updateNavigation}
        >
        {players.map((player, index) => (
          <SwiperSlide key={player.id} className={`!h-[420px] !w-[260px] sm:!h-[460px] sm:!w-[280px] ${selectedIndex === index ? "!z-30" : "!z-0"} ${index > 0 ? "-ml-7 sm:-ml-10" : ""}`}>
            <article className={`relative h-full min-w-0 transition-transform duration-[420ms] ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${index === 0 ? "origin-bottom-left" : "origin-bottom"} ${selectedIndex === index ? "z-10 scale-[1.16] sm:scale-[1.23]" : "scale-[0.94]"}`}>
              <button
                type="button"
                aria-label={`Rādīt ${player.name} profilu`}
                aria-pressed={selectedIndex === index}
                onClick={() => {
                  setSelectedIndex(index);
                  swiper?.slideTo(index);
                }}
                className="relative block h-full w-full cursor-pointer text-left"
              >
                {player.imageUrl ? (
                  <Image src={player.imageUrl} alt={player.name} fill sizes="(min-width: 640px) 280px, 260px" className={`object-contain object-bottom transition-[filter] duration-300 motion-reduce:transition-none ${selectedIndex === index ? "brightness-100" : "brightness-[0.55] sm:brightness-[0.82]"}`} />
                ) : (
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_32%,#333_0%,#111_50%,#050505_100%)]" />
                )}
              </button>
                <div className={`pointer-events-none absolute left-[86%] top-12 z-20 hidden items-start whitespace-nowrap transition-[transform,opacity] duration-[360ms] ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none sm:flex ${selectedIndex === index ? "translate-x-0 opacity-100 delay-75 motion-reduce:delay-0" : "translate-x-3 opacity-0"}`}>
                  {player.number !== null && <p className="font-heading text-[94px] font-semibold leading-[0.82] tracking-[-0.08em] text-white sm:text-[142px]">{player.number}</p>}
                  <div className={`${player.number !== null ? "ml-8 sm:ml-10" : "ml-0"} pt-1 sm:pt-2`}>
                    <h3 className="font-heading text-[22px] font-semibold uppercase leading-[0.88] sm:text-[30px]">{player.name}</h3>
                    <p className="mt-2 text-sm text-white/90 sm:text-base">{player.position}</p>
                    {profileHrefBase ? (
                      <Link href={`${profileHrefBase}/${player.id}`} tabIndex={selectedIndex === index ? 0 : -1} aria-hidden={selectedIndex !== index} className={`${selectedIndex === index ? "pointer-events-auto" : "pointer-events-none"} swiper-no-swiping mt-3 inline-flex bg-white px-3 py-2 font-heading text-[11px] font-semibold uppercase tracking-wide text-[#050505] hover:bg-[#fbb040] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:px-4 sm:text-xs`}>Profils</Link>
                    ) : (
                      <span className="mt-3 inline-flex bg-white px-3 py-2 font-heading text-[11px] font-semibold uppercase tracking-wide text-[#050505] sm:px-4 sm:text-xs">Profils</span>
                    )}
                  </div>
                </div>
            </article>
          </SwiperSlide>
        ))}
        </FullWidthGallery>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-[30%] bg-gradient-to-t from-[#050505] via-[#050505]/65 to-transparent" />
      </div>
      {selectedPlayer && (
        <div className="relative z-30 mx-auto -mt-[120px] w-[calc(100%-3rem)] sm:hidden">
          <div key={selectedPlayer.id} className="site-player-info-enter flex min-h-[96px] items-end gap-5">
            {selectedPlayer.number !== null && <span className="font-heading text-[78px] font-semibold leading-[0.85] tracking-[-0.06em]">{selectedPlayer.number}</span>}
            <div className="min-w-0 pb-1">
              <h3 className="font-heading text-[27px] font-semibold uppercase leading-[0.95]">{selectedPlayer.name}</h3>
              <p className="mt-1 text-[18px] text-white/85">{selectedPlayer.position}</p>
            </div>
          </div>
          {profileHrefBase ? (
            <Link href={`${profileHrefBase}/${selectedPlayer.id}`} className="mt-5 grid h-12 w-full place-items-center border border-white font-heading text-sm font-semibold uppercase hover:bg-white hover:text-[#050505] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Profils</Link>
          ) : (
            <span className="mt-5 grid h-12 w-full place-items-center border border-white font-heading text-sm font-semibold uppercase">Profils</span>
          )}
        </div>
      )}
    </section>
  );
}
