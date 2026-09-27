import "server-only";

import { parseYouTubeViewCounts, verifiedYouTubeViewCounts } from "./youtube-view-count";

export async function getYouTubeViewCounts(): Promise<{ counts: Record<string, number>; snapshot: boolean }> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return { counts: verifiedYouTubeViewCounts, snapshot: true };

  const params = new URLSearchParams({
    part: "statistics",
    id: Object.keys(verifiedYouTubeViewCounts).join(","),
    key: apiKey,
  });

  try {
    const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?${params}`, {
      next: { revalidate: 3600 },
    });
    if (!response.ok) throw new Error(`YouTube API returned ${response.status}`);
    const liveCounts = parseYouTubeViewCounts(await response.json());
    if (Object.keys(liveCounts).length === 0) throw new Error("YouTube API returned no view counts");
    return { counts: { ...verifiedYouTubeViewCounts, ...liveCounts }, snapshot: false };
  } catch (error) {
    console.error("Could not refresh YouTube view counts", error);
    return { counts: verifiedYouTubeViewCounts, snapshot: true };
  }
}
