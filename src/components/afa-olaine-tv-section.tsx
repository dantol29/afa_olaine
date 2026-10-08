import { getYouTubeViewCounts } from "@/lib/youtube-view-count-server";

import { AfaOlaineTvRail } from "./afa-olaine-tv-rail";

export async function AfaOlaineTvSection() {
  const { durations } = await getYouTubeViewCounts();
  return <AfaOlaineTvRail durations={durations} />;
}
