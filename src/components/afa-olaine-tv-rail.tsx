import { Play } from "lucide-react";

const CHANNEL_URL = "https://www.youtube.com/@AFA_Olaine/streams";
const streams = [
  { id: "kkYioTYu1HI", title: "JFK Daugava / FK Union", date: "05.09.2026" },
  { id: "wIuXMxdpbYc", title: "Dienvidkurzemes SS", date: "22.08.2026" },
  { id: "S15LkeE7UyI", title: "FK Karosta", date: "08.08.2026" },
];

function isoDate(date: string) {
  return date.split(".").reverse().join("-");
}

export function AfaOlaineTvRail({ durations }: { durations: Record<string, string> }) {
  return (
    <section aria-labelledby="afa-olaine-tv-heading" className="relative isolate z-0 overflow-hidden bg-[#050505] pb-14 text-white xl:pb-20">
      <div className="relative z-10 mx-auto flex w-[calc(100%-3rem)] max-w-[1500px] flex-wrap items-center justify-between gap-x-6 gap-y-4 md:w-[calc(100%-10rem)]">
        <h2 id="afa-olaine-tv-heading" className="font-heading text-[32px] font-semibold uppercase leading-none sm:text-[42px]">AFA Olaine <span className="text-[#fbb040]">TV</span></h2>
        <a href={CHANNEL_URL} target="_blank" rel="noopener noreferrer" className="shrink-0 border border-white/50 px-3 py-2.5 font-heading text-xs font-semibold uppercase tracking-wide transition-colors hover:border-white hover:bg-white hover:text-[#050505] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:px-4 sm:text-sm">Visi video</a>
      </div>
      <div className="mx-auto mt-7 grid w-[calc(100%-3rem)] max-w-[1500px] gap-5 sm:mt-8 sm:grid-cols-2 md:w-[calc(100%-10rem)] lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)] lg:grid-rows-2 xl:gap-7">
        {streams.map((video, index) => {
          const featured = index === 0;
          return (
            <article key={video.id} className={`min-w-0 ${featured ? "sm:col-span-2 lg:col-span-1 lg:row-span-2" : ""}`}>
              <a href={`https://www.youtube.com/watch?v=${video.id}`} target="_blank" rel="noopener noreferrer" aria-label={`Skatīties YouTube: AFA Olaine — ${video.title}`} className={`site-tv-card group flex h-full flex-col overflow-hidden bg-[#19191b] outline-offset-4 focus-visible:outline-2 focus-visible:outline-[#fbb040] ${featured ? "" : "lg:flex-row"}`}>
                <div className={`relative aspect-video shrink-0 overflow-hidden ${featured ? "" : "lg:aspect-auto lg:w-[46%]"}`}>
                  <img src={`/social/youtube/${video.id}-match.jpg`} alt="" width={480} height={360} loading="lazy" className="size-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03] motion-reduce:transform-none motion-reduce:transition-none" />
                  <span className={`site-tv-play absolute bottom-4 left-4 grid place-items-center bg-[#fbb040] text-[#050505] ${featured ? "size-12 sm:size-14" : "size-10"}`}><Play className="ml-0.5 size-5 fill-current" aria-hidden="true" /></span>
                  {durations[video.id] && <span className="absolute right-3 top-3 bg-[#050505]/85 px-2 py-1 text-xs tabular-nums text-white">{durations[video.id]}</span>}
                </div>
                <div className={`flex min-w-0 flex-1 flex-col p-5 ${featured ? "sm:p-7" : "xl:p-6"}`}>
                  <h3 className={`font-heading font-semibold uppercase leading-[1.05] transition-colors group-hover:text-[#fbb040] ${featured ? "text-[28px] sm:text-[36px]" : "text-[24px] xl:text-[28px]"}`}>{video.title}</h3>
                  <time dateTime={isoDate(video.date)} className="mt-auto pt-4 font-sans text-sm tabular-nums text-white/65">{video.date}</time>
                </div>
              </a>
            </article>
          );
        })}
      </div>
    </section>
  );
}
