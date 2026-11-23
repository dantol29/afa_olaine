import Image from "next/image";
import Link from "next/link";

import { formatEventSpan } from "@/lib/event-dates";
import { MONTHS } from "@/lib/games";
import type { ScheduleEvent } from "@/lib/schedule";
import { yearUnlessCurrent } from "@/lib/date-display";

// Events share the match card frame so the two sit in one grid. Both stripes take AFA Olaine's crest colors, as the
// AFA side of a game card does.
const EVENT_ACCENT = "#fbb040";

function dateLabel(event: ScheduleEvent) {
  if (event.rawEndDate) return formatEventSpan(event.rawDate, event.startTime, event.rawEndDate, event.endTime);
  const month = MONTHS.indexOf(event.month) + 1;
  // The admin preview shows a card before its date is picked.
  const monthText = month > 0 ? String(month).padStart(2, "0") : "--";
  return `${event.day}.${monthText}.${yearUnlessCurrent(event.year)} ${event.startTime}–${event.endTime}`;
}

export function EventCard({ event, borderStripe }: { event: ScheduleEvent; borderStripe: string }) {
  // No teams says nothing: the event may be a town event that only takes the place.
  const teamLabel = event.teams.map((team) => team.name).join(", ");
  // One team names the watermark; several teams or none show the club. Keeps the hyphen so "U10-2" does
  // not read as "U102".
  const watermark = (event.teams.length === 1 ? event.teams[0].name : "AFA").replace(/[^\p{L}\p{N}-]/gu, "").slice(0, 5);

  return (
    <article className="group relative isolate flex min-h-[360px] overflow-hidden bg-[#151515] p-5 pb-3 text-white sm:min-h-[390px] sm:p-6 sm:pb-4">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 z-10 h-1.5" style={{ backgroundImage: borderStripe }} />
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 z-10 h-1.5" style={{ backgroundImage: borderStripe }} />
      <span aria-hidden="true" className="pointer-events-none absolute bottom-24 right-6 -z-10 font-heading text-[96px] font-semibold uppercase leading-none tracking-[-0.08em] text-white/[0.07] sm:text-[132px]">
        {watermark}
      </span>

      <div className="flex w-full flex-col">
        <div className="flex items-center justify-between gap-4 text-sm font-semibold">
          <span>{event.day}. {event.month}</span>
          <span className="font-heading text-sm font-semibold uppercase text-white/65">Pasākums</span>
        </div>

        <div className="mt-auto pb-4 pt-12 sm:pb-5">
          <Image src="/hero-logo.png" alt="AFA Olaine" width={62} height={62} className="size-[62px] object-contain" />
          <h3 className="mt-5 line-clamp-3 max-w-[520px] font-heading text-[24px] font-semibold uppercase leading-[0.98] sm:text-[28px]">
            {event.href ? (
              // The link covers the whole card, so the card opens the event's page wherever it is clicked.
              <Link href={event.href} className="transition-colors after:absolute after:inset-0 after:z-20 group-hover:text-[#fbb040] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:-outline-offset-4 focus-visible:after:outline-[#fbb040]">
                {event.title}
              </Link>
            ) : event.title}
          </h3>
          <p className="mt-4 font-sans text-[15px] font-semibold text-white sm:text-base">
            {teamLabel && (
              <>
                <span style={{ color: EVENT_ACCENT }}>{teamLabel}</span>
                <span className="text-white/50"> · </span>
              </>
            )}
            {dateLabel(event)}
          </p>
          <p className="mt-1 max-w-md font-sans text-sm text-white/80">{event.location}</p>
        </div>
      </div>
    </article>
  );
}
