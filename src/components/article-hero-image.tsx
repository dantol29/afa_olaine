"use client";

import Image from "next/image";
import { useState } from "react";

export function ArticleHeroImage({ src, alt }: { src: string; alt: string }) {
  const [imageSrc, setImageSrc] = useState(src || "/hero-team.png");

  return (
    <Image
      src={imageSrc}
      alt={alt}
      fill
      priority
      sizes="100vw"
      className="object-cover"
      onError={() => setImageSrc("/hero-team.png")}
    />
  );
}
