"use client";

import { TeamLogo } from "./team-logo";
import Image from "next/image";
import { useMemo, useState } from "react";

import type { CalendarEvent } from "@/lib/calendar";

const MONTHS = [
  "Janvāris",
  "Februāris",
  "Marts",
  "Aprīlis",
  "Maijs",
  "Jūnijs",
  "Jūlijs",
  "Augusts",
  "Septembris",
  "Oktobris",
  "Novembris",
  "Decembris",
];
const SEASON_MONTHS = [7, 8, 9, 10, 11, 0, 1, 2, 3, 4, 5, 6];

function TeamMark({ name, logo }: { name: string; logo?: string | null }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-2 text-center">
      <TeamLogo src={logo} name={name} width={60} height={60} className="size-[60px] object-contain" fallbackClassName="grid size-[60px] place-items-center rounded-full bg-[#f1f1ef] text-xl font-bold text-[#111]" />
      <span className="line-clamp-2 font-heading text-[18px] font-semibold leading-[1.2] text-black">{name}</span>
    </div>
  );
}

export function EventsCalendar({ events }: { events: CalendarEvent[] }) {
  const games = events.filter((event) => event.eventType === "game");
  const initialMonth = new Date().getMonth();
  const [month, setMonth] = useState(initialMonth);
  const visibleEvents = useMemo(() => {
    const inMonth = games.filter((event) => event.start.getMonth() === month);
    return inMonth.length > 0 ? inMonth : games;
  }, [games, month]);

  if (games.length === 0) return null;

  return (
    <section aria-labelledby="events-heading" className="bg-[#eeeeee] text-[#111]">
      <div className="mx-auto flex w-[calc(100%-3rem)] max-w-[1500px] flex-col items-start gap-8 overflow-hidden py-20 md:w-[calc(100%-10rem)] xl:py-[120px]">
        <h2 id="events-heading" className="font-heading text-[40px] font-semibold leading-[1.3]">
          Kalendārs
        </h2>

        <div className="flex w-full gap-5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {SEASON_MONTHS.map((monthIndex) => {
            const active = month === monthIndex;
            return (
              <button
                key={monthIndex}
                type="button"
                onClick={() => setMonth(monthIndex)}
                aria-pressed={active}
                className={`shrink-0 rounded-full border px-12 py-3.5 font-sans text-[18px] font-bold leading-[1.3] transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#111] ${
                  active
                    ? "border-[#fbb040] bg-[#fbb040] text-[#111]"
                    : "border-[#979797] bg-transparent text-[#979797] hover:bg-white"
                }`}
              >
                {MONTHS[monthIndex]}
              </button>
            );
          })}
        </div>

        <div className="flex w-full snap-x snap-mandatory items-center gap-8 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {visibleEvents.map((event, index) => (
            <article key={event.uid} className="w-[460px] shrink-0 snap-start overflow-hidden rounded-[24px] bg-white">
              <div className="flex w-full items-center justify-center gap-8 p-6">
                <TeamMark name={event.homeTeam ?? event.title} logo={event.homeLogo} />
                {index === 0 ? (
                  <div className="flex shrink-0 items-center gap-4 font-heading text-[28px] font-semibold leading-[1.2] text-[#cd8d2e]">
                    <span>2</span><span>:</span><span>3</span>
                  </div>
                ) : (
                  <span className="w-[70px] shrink-0 text-center font-heading text-[28px] font-semibold leading-[1.2] text-[#cd8d2e]">vs.</span>
                )}
                <TeamMark name={event.awayTeam ?? "AFA Olaine"} logo={event.awayLogo} />
              </div>
              <div className="flex w-full flex-col items-start gap-4 border-t border-[#e6e6e6] p-6 font-sans">
                <p className="w-full text-[14px] leading-[1.2] text-[#685c19]">Latvijas Altero.lv 2.ligas futbola čempionāts 2026</p>
                <p className="flex w-full items-center gap-2 text-[16px] font-semibold leading-[1.2] text-[#271d03]">
                  <Image src="/calendar-figma.svg" alt="" width={20} height={20} className="size-5 shrink-0" aria-hidden="true" />
                  {event.dateLabel.replace(/\.$/, "")} {event.timeLabel && ` ${event.timeLabel}`}
                </p>
                {event.location && (
                  <p className="flex w-full items-center gap-2 text-[16px] font-semibold leading-[1.2] text-[#271d03]">
                    <Image src="/map-pin-figma.svg" alt="" width={20} height={20} className="size-5 shrink-0" aria-hidden="true" />
                    <span>{event.location}</span>
                  </p>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
