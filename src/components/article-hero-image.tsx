"use client";

import Image from "next/image";
import { useState } from "react";

import { NEWS_PHOTO_POSITION_CLASS } from "@/lib/news-photo";

export function ArticleHeroImage({ src, alt }: { src: string; alt: string }) {
  const [imageSrc, setImageSrc] = useState(src || "/hero-team.png");

  return (
    <Image
      src={imageSrc}
      alt={alt}
      fill
      priority
      sizes="100vw"
      className={`object-cover ${NEWS_PHOTO_POSITION_CLASS}`}
      onError={() => setImageSrc("/hero-team.png")}
    />
  );
}
