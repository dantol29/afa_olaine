import "server-only";

import { parseYouTubeDurations, parseYouTubeViewCounts, verifiedYouTubeViewCounts } from "./youtube-view-count";

export async function getYouTubeViewCounts(): Promise<{ counts: Record<string, number>; durations: Record<string, string>; snapshot: boolean }> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return { counts: verifiedYouTubeViewCounts, durations: {}, snapshot: true };

  const params = new URLSearchParams({
    part: "statistics,contentDetails",
    id: Object.keys(verifiedYouTubeViewCounts).join(","),
    key: apiKey,
  });

  try {
    const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?${params}`, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) throw new Error(`YouTube API returned ${response.status}`);
    const data = await response.json();
    const liveCounts = parseYouTubeViewCounts(data);
    if (Object.keys(liveCounts).length === 0) throw new Error("YouTube API returned no view counts");
    return { counts: { ...verifiedYouTubeViewCounts, ...liveCounts }, durations: parseYouTubeDurations(data), snapshot: false };
  } catch (error) {
    console.error("Could not refresh YouTube view counts", error);
    return { counts: verifiedYouTubeViewCounts, durations: {}, snapshot: true };
  }
}
