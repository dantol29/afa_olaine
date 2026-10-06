/** Counts verified on the public YouTube watch pages on 25 September 2026. */
export const verifiedYouTubeViewCounts: Record<string, number> = {
  kkYioTYu1HI: 459,
  wIuXMxdpbYc: 342,
  S15LkeE7UyI: 259,
  "7LigWBJt-A8": 257,
  "0p9H25btd6U": 231,
  UVirdPDo0H8: 222,
};

type VideosListResponse = {
  items?: { id?: string; statistics?: { viewCount?: string }; contentDetails?: { duration?: string } }[];
};

export function parseYouTubeViewCounts(data: VideosListResponse): Record<string, number> {
  return Object.fromEntries((data.items ?? []).flatMap((item) => {
    const count = Number(item.statistics?.viewCount);
    return item.id && item.statistics?.viewCount && Number.isSafeInteger(count) && count >= 0
      ? [[item.id, count]]
      : [];
  }));
}

export function formatYouTubeViews(count: number): string {
  return `${new Intl.NumberFormat("lv-LV").format(count)} ${count === 1 ? "skatījums" : "skatījumi"}`;
}

export function parseYouTubeDurations(data: VideosListResponse): Record<string, string> {
  return Object.fromEntries((data.items ?? []).flatMap((item) => {
    const match = /^P(?:(\d+)D)?T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(item.contentDetails?.duration ?? "");
    if (!item.id || !match || (!match[1] && !match[2] && !match[3] && !match[4])) return [];
    const hours = Number(match[1] ?? 0) * 24 + Number(match[2] ?? 0);
    const minutes = Number(match[3] ?? 0);
    const seconds = Number(match[4] ?? 0);
    const duration = hours > 0
      ? `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
      : `${minutes}:${String(seconds).padStart(2, "0")}`;
    return [[item.id, duration]];
  }));
}
