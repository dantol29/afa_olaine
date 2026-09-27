"use client";

import Image from "next/image";
import { Play, ArrowLeft, ArrowRight } from "lucide-react";
import { useState } from "react";
import { SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";

import { FullWidthGallery } from "./full-width-gallery";

const TIKTOK_PROFILE_URL = "https://www.tiktok.com/@afa.olaine";
const reels = [
  { id: "back-to-school", image: "/social/tiktok/back-to-school.png" }, { id: "training", image: "/social/tiktok/training.png" }, { id: "family-day", image: "/social/tiktok/family-day.png" },
  { id: "celebration", image: "/social/tiktok/celebration.png" }, { id: "teammates", image: "/social/tiktok/teammates.png" }, { id: "matchday", image: "/social/tiktok/matchday.png" },
];

export function TiktokVideosRail() {
  const [swiper, setSwiper] = useState<SwiperType | null>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(true);
  const updateNavigation = (instance: SwiperType) => {
    setCanScrollPrev(!instance.isBeginning);
    setCanScrollNext(!instance.isEnd);
  };

  return (
    <section aria-labelledby="tiktok-heading" className="overflow-hidden bg-[#050505] pb-14 text-white xl:pb-20">
      <div className="mx-auto flex w-[calc(100%-3rem)] max-w-[1500px] items-center gap-3 md:w-[calc(100%-10rem)] sm:gap-5">
        <h2 id="tiktok-heading" className="font-heading text-[30px] font-semibold uppercase leading-none sm:text-[40px]">TikTok</h2>
        <button type="button" disabled={!canScrollPrev} onClick={() => swiper?.slidePrev()} aria-label="Iepriekšējie video" className="grid size-10 place-items-center border border-white/50 transition-colors hover:border-white hover:bg-white hover:text-[#050505] disabled:cursor-not-allowed disabled:border-white/25 disabled:text-white/40 disabled:hover:border-white/25 disabled:hover:bg-transparent disabled:hover:text-white/40 sm:size-11"><ArrowLeft className="size-4" /></button>
        <button type="button" disabled={!canScrollNext} onClick={() => swiper?.slideNext()} aria-label="Nākamie video" className="grid size-10 place-items-center border border-white/50 transition-colors hover:border-white hover:bg-white hover:text-[#050505] disabled:cursor-not-allowed disabled:border-white/25 disabled:text-white/40 disabled:hover:border-white/25 disabled:hover:bg-transparent disabled:hover:text-white/40 sm:size-11"><ArrowRight className="size-4" /></button>
      </div>
      <FullWidthGallery
        className="mt-7 !overflow-visible sm:mt-8"
        slideWidth={(width) => width >= 1280 ? 320 : width >= 640 ? 280 : Math.round(width * 0.8)}
        spaceBetween={24}
        onSwiper={(instance) => { setSwiper(instance); updateNavigation(instance); }}
        onSlideChange={updateNavigation}
      >
        {reels.map((reel) => (
          <SwiperSlide key={reel.id} className="!h-[360px] !w-[80vw] !rounded-none sm:!h-[420px] sm:!w-[280px] xl:!w-[320px]">
            <a href={TIKTOK_PROFILE_URL} target="_blank" rel="noreferrer" aria-label={`Skatīt AFA Olaine TikTok video: ${reel.id}`} className="group relative block h-full !rounded-none overflow-hidden bg-[#2b2d30] outline-offset-4 focus-visible:outline-2 focus-visible:outline-white">
              <Image src={reel.image} alt="" fill sizes="(min-width: 1280px) 320px, (min-width: 640px) 280px, 80vw" className="object-cover" />
              <span className="absolute inset-0 grid place-items-center bg-black/0 transition-colors group-hover:bg-black/15"><Play className="size-12" strokeWidth={2} fill="currentColor" /></span>
            </a>
          </SwiperSlide>
        ))}
      </FullWidthGallery>
    </section>
  );
}
