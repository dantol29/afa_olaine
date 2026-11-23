import Link from "next/link";
import { CalendarDays, ChevronRight, Clock, House, MapPin, Users } from "lucide-react";

import { formatDate } from "@/lib/date-display";
import { formatEventSpan } from "@/lib/event-dates";
import type { EventPage } from "@/lib/event-page-server";
import { sanitizeRichText } from "@/lib/rich-text";

import { ArticleHeroImage } from "./article-hero-image";
import { ArticleShareButtons } from "./article-share-buttons";
import { ClubPageGallery } from "./club-page-gallery";

/** An event's own page, laid out like a news article: photo on top, the facts, the description, the gallery. Without
 *  a main photo the page starts with a short dark band instead. */
export function EventPageContent({ event }: { event: EventPage }) {
  // Several days: the start time goes with the first day and the end time with the last, in one line.
  const when = event.endDate
    ? [{ icon: CalendarDays, label: "Laiks", text: formatEventSpan(event.date, event.startTime, event.endDate, event.endTime) }]
    : [
        { icon: CalendarDays, label: "Datums", text: formatDate(event.date) },
        { icon: Clock, label: "Laiks", text: `${event.startTime}–${event.endTime}` },
      ];
  // No teams says nothing: the event may be a town event that only takes the place.
  const teams = event.teams.length > 0
    ? [{ icon: Users, label: event.teams.length > 1 ? "Komandas" : "Komanda", text: event.teams.map((team) => team.name).join(", ") }]
    : [];
  const facts = [...when, { icon: MapPin, label: "Vieta", text: event.location }, ...teams];

  return (
    <article className="bg-[#050505] text-white">
      <section aria-label={event.title} data-site-hero className={event.image ? "relative isolate h-[56svh] min-h-[440px] overflow-hidden md:h-[64svh] md:min-h-[540px]" : "relative isolate h-[260px] overflow-hidden md:h-[320px]"}>
        {event.image && (
          <>
            <ArticleHeroImage src={event.image} alt={event.title} />
            <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,0.55)_0%,rgba(5,5,5,0.08)_42%,rgba(5,5,5,0.76)_100%)]" />
          </>
        )}
        <nav aria-label="Atpakaļceļš" className="absolute inset-x-0 top-24 z-10 hidden md:top-28 md:block">
          <div className="mx-auto flex w-[calc(100%-3rem)] max-w-[1500px] items-center gap-3 pl-12 text-sm font-semibold text-white/80 md:w-[calc(100%-10rem)] md:pl-24">
            <Link href="/" aria-label="Sākums" className="transition-colors hover:text-[#fbb040] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"><House className="size-5" aria-hidden="true" /></Link>
            <ChevronRight className="size-4" aria-hidden="true" />
            <Link href="/speles" className="font-heading text-base uppercase transition-colors hover:text-[#fbb040] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Spēles</Link>
          </div>
        </nav>
      </section>

      <div className="relative z-10 mx-auto -mt-24 w-full max-w-[860px] bg-[#050505] px-6 pb-9 pt-8 sm:px-10 md:-mt-28 md:pb-12 md:pt-10">
        <p className="mb-4 font-sans text-sm font-semibold uppercase tracking-wide text-[#fbb040] sm:text-base">Pasākums</p>
        <h1 className="font-heading text-[34px] font-semibold uppercase leading-[0.96] tracking-[-0.02em] sm:text-[46px] lg:text-[56px]">{event.title}</h1>
        <dl className="mt-7 grid gap-4 font-sans text-[16px] sm:grid-cols-2 sm:text-[17px]">
          {facts.map(({ icon: Icon, label, text }) => (
            <div key={label} className="flex items-start gap-3">
              <Icon className="mt-0.5 size-5 shrink-0 text-[#fbb040]" aria-hidden="true" />
              <div>
                <dt className="sr-only">{label}</dt>
                <dd className="text-white/85">{text}</dd>
              </div>
            </div>
          ))}
        </dl>
        <div className="mt-7 flex justify-start">
          <ArticleShareButtons title={event.title} />
        </div>
      </div>

      {event.description && (
        <div className="mx-auto max-w-[860px] px-6 pb-20 pt-6 font-sans text-[18px] leading-[1.75] text-white/85 sm:px-10 sm:pb-28 sm:pt-10 sm:text-[20px]">
          <div className="rich-page-content custom-page-body article-body" dangerouslySetInnerHTML={{ __html: sanitizeRichText(event.description) }} />
        </div>
      )}
      {event.gallery.length > 0 && (
        <div className="mx-auto w-[calc(100%-3rem)] max-w-[1500px] pb-20 md:w-[calc(100%-10rem)] sm:pb-28">
          <ClubPageGallery title={event.title} layout="gallery" photos={event.gallery.map((src) => ({ src, alt: "", caption: "" }))} />
        </div>
      )}
    </article>
  );
}
