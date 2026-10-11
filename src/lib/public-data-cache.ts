import "server-only";

import { createHash } from "node:crypto";
import { unstable_cache } from "next/cache";
import { cache } from "react";

export const PUBLIC_CONTENT_CACHE_TAG = "afa-public-content";
const scope = createHash("sha256")
  .update(process.env.TURSO_DATABASE_URL ?? "file:./local.db")
  .digest("hex");

/** Short public data cache, separate from admin reads and scheduling feeds. */
export function cachePublicData<Args extends unknown[], Result>(
  key: string,
  load: (...args: Args) => Promise<Result>,
) {
  return cache(unstable_cache(load, ["afa-public-v1", scope, key], {
    revalidate: 60,
    tags: [PUBLIC_CONTENT_CACHE_TAG],
  }));
}
