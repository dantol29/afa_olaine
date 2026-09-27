"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Swiper } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import { FreeMode, Mousewheel } from "swiper/modules";
import "swiper/css";

export function useFullWidthGalleryOffsets(slideWidth: number | ((width: number) => number)) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const updateWidth = () => setWidth(window.innerWidth);
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  const before = width >= 768 ? Math.max(80, (width - 1500) / 2) : 24;
  const resolvedSlideWidth = typeof slideWidth === "function" ? slideWidth(width) : slideWidth;
  return { before, after: Math.max(0, width - before - resolvedSlideWidth) };
}

export function FullWidthGallery({ children, slideWidth, className, spaceBetween = 0, endOffset, freeMode = false, onSwiper, onSlideChange, onResize }: {
  children: ReactNode;
  slideWidth: number | ((width: number) => number);
  className?: string;
  spaceBetween?: number;
  endOffset?: number;
  freeMode?: boolean;
  onSwiper?: (instance: SwiperType) => void;
  onSlideChange?: (instance: SwiperType) => void;
  onResize?: (instance: SwiperType) => void;
}) {
  const { before, after } = useFullWidthGalleryOffsets(slideWidth);
  const resolvedEndOffset = endOffset ?? after;

  return (
    <Swiper
      key={`${before}-${resolvedEndOffset}`}
      className={className}
      slidesPerView="auto"
      spaceBetween={spaceBetween}
      modules={[FreeMode, Mousewheel]}
      mousewheel={{ forceToAxis: true, releaseOnEdges: true }}
      freeMode={freeMode ? { enabled: true, sticky: false, momentum: true } : false}
      slidesOffsetBefore={before}
      slidesOffsetAfter={resolvedEndOffset}
      grabCursor
      onSwiper={onSwiper}
      onSlideChange={onSlideChange}
      onResize={onResize}
    >
      {children}
    </Swiper>
  );
}
