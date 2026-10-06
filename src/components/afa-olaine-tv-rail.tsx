"use client";

import { ArrowRight, Eye, Play } from "lucide-react";
import { useState } from "react";

import { formatYouTubeViews } from "@/lib/youtube-view-count";

const CHANNEL_URL = "https://www.youtube.com/@AFA_Olaine/streams";
const streams = [
  { id: "kkYioTYu1HI", title: "AFA Olaine — JFK Daugava / FK Union", date: "05.09.2026" },
  { id: "wIuXMxdpbYc", title: "AFA Olaine — Dienvidkurzemes SS", date: "22.08.2026" },
  { id: "S15LkeE7UyI", title: "AFA Olaine — FK Karosta", date: "08.08.2026" },
  { id: "7LigWBJt-A8", title: "AFA Olaine — FS Jelgava-2", date: "25.07.2026" },
];

function isoDate(date: string) {
  return date.split(".").reverse().join("-");
}

export function AfaOlaineTvRail({ viewCounts, durations, viewsAreSnapshot }: { viewCounts: Record<string, number>; durations: Record<string, string>; viewsAreSnapshot: boolean }) {
  const [activeVideoId, setActiveVideoId] = useState(streams[0].id);
  const featured = streams.find((video) => video.id === activeVideoId) ?? streams[0];

  return (
    <section aria-labelledby="afa-olaine-tv-heading" className="bg-[#050505] pb-14 text-white xl:pb-20">
      <div className="mx-auto w-[calc(100%-3rem)] max-w-[1500px] md:w-[calc(100%-10rem)]">
        <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
          <h2 id="afa-olaine-tv-heading" className="font-heading text-[30px] font-semibold uppercase leading-none sm:text-[40px]">
            AFA Olaine <span className="text-[#fbb040]">TV</span>
          </h2>
          <a href={CHANNEL_URL} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 border border-white/50 px-4 py-2.5 font-heading text-sm font-semibold uppercase tracking-wide transition-colors hover:border-[#fbb040] hover:text-[#fbb040] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fbb040]">
            Visi video <ArrowRight className="size-4" aria-hidden="true" />
          </a>
        </div>

        <div className="mt-7 grid gap-7 sm:mt-8 lg:grid-cols-[minmax(0,747px)_minmax(280px,1fr)] lg:gap-8">
          <div className="min-w-0">
          <div className="aspect-video w-full overflow-hidden bg-[#19191b]">
            <iframe
              key={featured.id}
              src={`https://www.youtube-nocookie.com/embed/${featured.id}?rel=0&playsinline=1`}
              title={`AFA Olaine TV: ${featured.title}`}
              width="1280"
              height="720"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
              className="h-full w-full border-0"
            />
          </div>
          <div className="mt-5 flex flex-col gap-3">
            <h3 className="font-sans text-[20px] font-semibold leading-snug sm:text-[24px]">{featured.title}</h3>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 font-sans text-sm text-white/75 sm:text-base">
              <time dateTime={isoDate(featured.date)}>{featured.date}</time>
              {viewCounts[featured.id] !== undefined && <span className="inline-flex items-center gap-1.5" title={viewsAreSnapshot ? "Skatījumi pārbaudīti 25.09.2026" : undefined}><Eye className="size-4" aria-hidden="true" />{formatYouTubeViews(viewCounts[featured.id])}</span>}
            </div>
          </div>

          </div>

          <nav aria-label="AFA Olaine TV video izlase" className="min-w-0">
            <ol className="divide-y divide-white/15">
              {streams.map((video) => {
                const isActive = video.id === featured.id;
                return (
                  <li key={video.id}>
                    <button
                      type="button"
                      onClick={() => setActiveVideoId(video.id)}
                      aria-label={`Skatīties AFA Olaine TV: ${video.title}`}
                      aria-pressed={isActive}
                      className="group flex w-full cursor-pointer items-center gap-4 py-4 text-left outline-offset-4 transition-colors first:pt-3 hover:bg-white/[0.04] focus-visible:outline-2 focus-visible:outline-[#fbb040] motion-reduce:transition-none"
                    >
                      <span className="relative block aspect-video w-[112px] shrink-0 overflow-hidden bg-[#19191b] sm:w-[144px] lg:w-[128px]">
                        <img src={`https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`} alt="" loading="lazy" className="size-full object-cover" />
                        {durations[video.id] && <span className="absolute bottom-1 right-1 bg-black/85 px-1.5 py-0.5 text-[11px] tabular-nums text-white">{durations[video.id]}</span>}
                        {isActive && <span className="absolute inset-0 grid place-items-center bg-black/35"><Play className="size-6 fill-[#fbb040] text-[#fbb040]" aria-hidden="true" /></span>}
                      </span>
                      <span className="flex min-w-0 flex-col gap-2">
                        <span className={`font-sans text-base font-semibold leading-snug transition-colors group-hover:text-[#fbb040] sm:text-lg motion-reduce:transition-none ${isActive ? "text-[#fbb040]" : "text-white"}`}>{video.title}</span>
                        <time dateTime={isoDate(video.date)} className="font-sans text-sm text-white/65">{video.date}</time>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>
        </div>
      </div>
    </section>
  );
}
