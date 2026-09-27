"use client";

import Image from "next/image";
import { ArrowLeft, ArrowRight, Eye } from "lucide-react";
import { useState } from "react";
import { SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";

import { FullWidthGallery } from "./full-width-gallery";
import { formatYouTubeViews } from "@/lib/youtube-view-count";

const CHANNEL_URL = "https://www.youtube.com/@AFA_Olaine/streams";
const streams = [
  { id: "kkYioTYu1HI", title: "AFA Olaine — JFK Daugava / FK Union", opponent: "JFK Daugava / FK Union", category: "Tiešraide", date: "05.09.2026" },
  { id: "wIuXMxdpbYc", title: "AFA Olaine — Dienvidkurzemes SS", opponent: "Dienvidkurzemes SS", category: "Tiešraide", date: "22.08.2026" },
  { id: "S15LkeE7UyI", title: "AFA Olaine — FK Karosta", opponent: "FK Karosta", category: "Tiešraide", date: "08.08.2026" },
  { id: "7LigWBJt-A8", title: "AFA Olaine — FS Jelgava-2", opponent: "FS Jelgava-2", category: "Tiešraide", date: "25.07.2026" },
  { id: "0p9H25btd6U", title: "JFK Daugava / FK Union — AFA Olaine", opponent: "JFK Daugava / FK Union", category: "Tiešraide", date: "05.07.2026" },
  { id: "UVirdPDo0H8", title: "AFA Olaine — JFC Viola", opponent: "JFC Viola", category: "Tiešraide", date: "27.06.2026" },
];

export function AfaOlaineTvRail({ stripe, bottomStripes, viewCounts, viewsAreSnapshot }: { stripe: string; bottomStripes: Record<string, string>; viewCounts: Record<string, number>; viewsAreSnapshot: boolean }) {
  const [swiper, setSwiper] = useState<SwiperType | null>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(true);
  const updateNavigation = (instance: SwiperType) => {
    setCanScrollPrev(!instance.isBeginning);
    setCanScrollNext(!instance.isEnd);
  };

  return (
    <section aria-labelledby="afa-olaine-tv-heading" className="overflow-hidden bg-[#050505] pb-14 text-white xl:pb-20">
      <div className="mx-auto flex w-[calc(100%-3rem)] max-w-[1500px] items-center justify-between gap-6 md:w-[calc(100%-10rem)]">
        <div className="flex items-center gap-3 sm:gap-5">
          <h2 id="afa-olaine-tv-heading" className="font-heading text-[30px] font-semibold uppercase leading-none sm:text-[40px]">AFA Olaine TV</h2>
          <button type="button" disabled={!canScrollPrev} onClick={() => swiper?.slidePrev()} aria-label="Iepriekšējie video" className="grid size-10 place-items-center border border-white/50 transition-colors hover:border-white hover:bg-white hover:text-[#050505] disabled:cursor-not-allowed disabled:border-white/25 disabled:text-white/40 sm:size-11"><ArrowLeft className="size-4" /></button>
          <button type="button" disabled={!canScrollNext} onClick={() => swiper?.slideNext()} aria-label="Nākamie video" className="grid size-10 place-items-center border border-white/50 transition-colors hover:border-white hover:bg-white hover:text-[#050505] disabled:cursor-not-allowed disabled:border-white/25 disabled:text-white/40 sm:size-11"><ArrowRight className="size-4" /></button>
        </div>
        <a href={CHANNEL_URL} target="_blank" rel="noreferrer" className="hidden border border-white/50 px-4 py-2.5 font-heading text-sm font-semibold uppercase tracking-wide transition-colors hover:border-white hover:bg-white hover:text-[#050505] sm:block">Visi video</a>
      </div>
      <FullWidthGallery className="mt-7 !overflow-visible sm:mt-8" slideWidth={(width) => width >= 1280 ? 400 : width >= 640 ? 360 : Math.round(width * 0.86)} spaceBetween={20} onSwiper={(instance) => { setSwiper(instance); updateNavigation(instance); }} onSlideChange={updateNavigation}>
        {streams.map((stream) => (
          <SwiperSlide key={stream.id} className="!aspect-[10/9] !h-auto !w-[86vw] sm:!w-[360px] xl:!w-[400px]">
            <a href={`https://www.youtube.com/watch?v=${stream.id}`} target="_blank" rel="noreferrer" className="group flex h-full flex-col overflow-hidden bg-[#19191b] text-white outline-offset-4 focus-visible:outline-2 focus-visible:outline-[#fbb040]">
              <div className="relative min-h-0 flex-1 overflow-hidden bg-[#19191b]">
                <img src={`https://i.ytimg.com/vi/${stream.id}/hqdefault.jpg`} alt="" className="size-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <Image src="/hero-logo.png" alt="" width={56} height={56} className="absolute left-5 top-5 size-14 object-contain" />
              </div>
              <div aria-hidden="true" className="h-1.5 shrink-0" style={{ backgroundImage: bottomStripes[stream.id] ?? stripe }} />
              <div className="flex min-h-[78px] shrink-0 flex-col justify-end gap-1 px-4 py-2.5 sm:min-h-[82px] sm:px-5">
                <div className="min-w-0">
                  <h3 className="line-clamp-2 font-heading text-[21px] font-semibold uppercase leading-[0.9] sm:text-[23px]">{stream.title}</h3>
                </div>
                <div className="mt-4 flex items-center justify-between gap-2 text-sm leading-none text-white/60">
                  <time>{stream.date}</time>
                  {viewCounts[stream.id] !== undefined && (
                    <span className="flex shrink-0 items-center gap-1" title={viewsAreSnapshot ? "Skatījumi pārbaudīti 25.09.2026" : undefined}>
                      <Eye aria-hidden="true" className="size-4" />
                      {formatYouTubeViews(viewCounts[stream.id])}
                    </span>
                  )}
                </div>
              </div>
            </a>
          </SwiperSlide>
        ))}
      </FullWidthGallery>
    </section>
  );
}
