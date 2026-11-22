"use client";

import Image from "next/image";
import { useState } from "react";

export function TeamLogo({ src, name, width, height, className, fallbackClassName, fallbackText = "?" }: {
  src?: string | null;
  name: string;
  width: number;
  height: number;
  className: string;
  fallbackClassName: string;
  /** Shown instead of a missing or broken logo, such as the club's initials. */
  fallbackText?: string;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  return !src || failedSrc === src ? (
    <span className={fallbackClassName} role="img" aria-label={`${name} — logotips nav pieejams`}>{fallbackText}</span>
  ) : (
    <Image src={src} alt={name} width={width} height={height} className={className} onError={() => setFailedSrc(src)} />
  );
}
