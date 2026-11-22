import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { DEFAULT_BORDER_COLOR, smoothLogoStripe, solidStripe } from "@/lib/logo-color-core";

const stripeCache = new Map<string, Promise<string>>();

async function logoBuffer(logo: string) {
  if (logo.startsWith("/") && !logo.startsWith("//")) {
    const publicDirectory = path.resolve(process.cwd(), "public");
    const assetPath = path.resolve(publicDirectory, `.${logo}`);
    if (!assetPath.startsWith(`${publicDirectory}${path.sep}`)) throw new Error("Invalid local logo path");
    return readFile(assetPath);
  }

  const response = await fetch(logo, { signal: AbortSignal.timeout(2000), next: { revalidate: 86400 } });
  if (!response.ok) throw new Error(`Could not fetch logo: ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

async function extractLogoStripe(logo: string) {
  const source = await logoBuffer(logo);
  const { data, info } = await sharp(source)
    .resize(240, 64, { fit: "fill" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return smoothLogoStripe(data, info.width, info.height, 14, DEFAULT_BORDER_COLOR);
}

/** Maps the center line of a crest to a cached, crisp CSS border stripe; a club without a usable logo gets a solid
 *  stripe in the fallback color. */
export function getLogoBorderStripe(logo?: string, fallback = DEFAULT_BORDER_COLOR): Promise<string> {
  if (!logo) return Promise.resolve(solidStripe(fallback));
  const cached = stripeCache.get(logo);
  if (cached) return cached;

  const stripe = extractLogoStripe(logo)
    .then((value) => (value.startsWith("linear-gradient") ? value : solidStripe(value)))
    .catch(() => solidStripe(fallback));
  stripeCache.set(logo, stripe);
  return stripe;
}
