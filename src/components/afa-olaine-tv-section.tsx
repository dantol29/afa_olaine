import { getYouTubeViewCounts } from "@/lib/youtube-view-count-server";

import { AfaOlaineTvRail } from "./afa-olaine-tv-rail";

export async function AfaOlaineTvSection() {
  const { counts: viewCounts, durations, snapshot: viewsAreSnapshot } = await getYouTubeViewCounts();
  return <AfaOlaineTvRail viewCounts={viewCounts} durations={durations} viewsAreSnapshot={viewsAreSnapshot} />;
}
