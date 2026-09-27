"use client";

import { ArrowLeft, ArrowRight, MapPin, UserRound } from "lucide-react";
import { useState } from "react";

import type { TrainingListItem } from "@/lib/trainings-server";
import { MONTHS } from "@/lib/games";

const monthFormatter = new Intl.DateTimeFormat("lv-LV", { month: "long", timeZone: "UTC" });
const weekdays = ["Pr", "Ot", "Tr", "Ce", "Pk", "Se", "Sv"];

function dateFromKey(key: string) {
  return new Date(`${key}T12:00:00Z`);
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function displayMonth(date: Date) {
  const month = monthFormatter.format(date);
  return `${month[0].toUpperCase()}${month.slice(1)} ${date.getUTCFullYear()}`;
}

function displayDate(date: Date) {
  return `${date.getUTCDate()}. ${monthFormatter.format(date)} ${date.getUTCFullYear()}`;
}

function monthStart(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 12));
}

function changeMonth(date: Date, amount: number) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + amount, 1, 12));
}

function calendarDays(month: Date) {
  const first = monthStart(month);
  const offset = (first.getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
  const total = Math.ceil((offset + daysInMonth) / 7) * 7;
  return Array.from({ length: total }, (_, index) =>
    new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), index - offset + 1, 12)),
  );
}

export function toggleSelectedDate(currentDate: string | null, clickedDate: string) {
  return currentDate === clickedDate ? null : clickedDate;
}

export function TrainingSchedule({ trainings, todayKey }: { trainings: TrainingListItem[]; todayKey: string }) {
  const sorted = [...trainings].sort((a, b) => a.rawDate.localeCompare(b.rawDate) || a.startTime.localeCompare(b.startTime));
  const [team, setTeam] = useState("__all__");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [visibleMonth, setVisibleMonth] = useState(() => monthStart(dateFromKey(todayKey)));
  const teamOptions = [...new Set(sorted.map((training) => training.teamName))].sort((a, b) => a.localeCompare(b, "lv"));
  const filtered = team === "__all__" ? sorted : sorted.filter((training) => training.teamName === team);
  const visibleItems = selectedDate ? filtered.filter((training) => training.rawDate === selectedDate) : filtered;
  const trainingCounts = new Map<string, number>();
  for (const training of filtered) trainingCounts.set(training.rawDate, (trainingCounts.get(training.rawDate) ?? 0) + 1);

  function selectTeam(nextTeam: string) {
    setTeam(nextTeam);
    setSelectedDate(null);
  }

  function navigateMonth(amount: number) {
    setVisibleMonth(changeMonth(visibleMonth, amount));
    setSelectedDate(null);
  }

  function selectDay(day: Date) {
    setSelectedDate((currentDate) => toggleSelectedDate(currentDate, dateKey(day)));
    setVisibleMonth(monthStart(day));
  }

  return (
    <section aria-label="Treniņu grafiks" className="mx-auto w-[calc(100%-3rem)] max-w-[1500px] pb-20 pt-6 text-white md:w-[calc(100%-10rem)] sm:pt-8 xl:pb-28">
      <div className="mb-8 flex gap-2 overflow-x-auto sm:mb-10 sm:gap-3" role="group" aria-label="Filtrēt pēc komandas">
        {["__all__", ...teamOptions].map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={team === option}
            onClick={() => selectTeam(option)}
            className={`min-h-12 shrink-0 px-4 py-3 font-heading text-[18px] font-semibold uppercase leading-none transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:px-7 sm:text-[22px] ${team === option ? "bg-white text-[#050505]" : "border border-white/40 text-white hover:border-white"}`}
          >
            {option === "__all__" ? "Visas komandas" : option}
          </button>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(350px,440px)] lg:gap-12">
        <div className="order-2 min-w-0 lg:order-1">
          {visibleItems.length > 0 ? (
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(220px,280px))] gap-5 sm:gap-6" aria-label={selectedDate ? "Izvēlētās dienas treniņi" : "Visi treniņi"}>
              {visibleItems.map((training) => (
                <li key={training.id} className="flex min-h-[280px] min-w-0 flex-col bg-[#19191B] p-5 sm:min-h-[300px] sm:p-6">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-heading text-[57px] font-semibold leading-none tabular-nums text-white sm:text-[64px]">{training.startTime}</span>
                    <time dateTime={training.rawDate} aria-label={displayDate(dateFromKey(training.rawDate))} className="text-sm font-semibold text-white">
                      {dateFromKey(training.rawDate).getUTCDate()}. {MONTHS[dateFromKey(training.rawDate).getUTCMonth()]}
                    </time>
                  </div>
                  <p className="mt-1 font-sans text-lg font-medium text-white/80">Līdz {training.endTime}</p>
                  <div className="mt-auto pt-7">
                    <h3 className="font-heading text-[25px] font-semibold uppercase leading-none sm:text-[29px]">{training.teamName}</h3>
                    <dl className="mt-3 space-y-2 border-t border-white/20 pt-3 font-sans text-sm leading-snug">
                      <div><dt className="sr-only">Vieta</dt><dd className="flex items-start gap-2 text-white/90"><MapPin className="mt-0.5 size-4 shrink-0 text-[#fbb040]" aria-hidden="true" />{training.location}</dd></div>
                      {training.coaches.length > 0 && <div><dt className="sr-only">Treneris</dt><dd className="flex items-start gap-2 text-white/90"><UserRound className="mt-0.5 size-4 shrink-0 text-[#fbb040]" aria-hidden="true" />{training.coaches.map((coach) => coach.name).join(", ")}</dd></div>}
                    </dl>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="border border-white/20 px-6 py-10 sm:px-8 sm:py-12">
              <p className="font-heading text-[26px] font-semibold uppercase sm:text-[32px]">{filtered.length === 0 ? "Treniņi nav ieplānoti" : "Šajā datumā treniņu nav"}</p>
              <p className="mt-2 font-sans text-sm text-white/60 sm:text-base">Izvēlies kalendārā citu dienu vai komandu.</p>
            </div>
          )}
        </div>

        <div className="order-1 self-start bg-[#1b1b1b] p-5 sm:p-7 lg:order-2" aria-label="Treniņu kalendārs">
          <div className="mb-6 flex items-center justify-between gap-3">
            <h2 className="font-heading text-[29px] font-semibold uppercase leading-none sm:text-[35px]">{displayMonth(visibleMonth)}</h2>
            <div className="flex gap-2">
              <button type="button" aria-label="Iepriekšējais mēnesis" onClick={() => navigateMonth(-1)} className="grid size-10 place-items-center border border-white/35 transition-colors hover:border-white hover:bg-white hover:text-[#050505] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fbb040]"><ArrowLeft className="size-4" aria-hidden="true" /></button>
              <button type="button" aria-label="Nākamais mēnesis" onClick={() => navigateMonth(1)} className="grid size-10 place-items-center border border-white/35 transition-colors hover:border-white hover:bg-white hover:text-[#050505] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fbb040]"><ArrowRight className="size-4" aria-hidden="true" /></button>
            </div>
          </div>
          <div className="grid grid-cols-7 text-center" aria-label={displayMonth(visibleMonth)}>
            {weekdays.map((day) => <div key={day} className="pb-3 font-sans text-[11px] font-semibold uppercase tracking-wide text-white/45 sm:text-xs">{day}</div>)}
            {calendarDays(visibleMonth).map((day) => {
              const key = dateKey(day);
              const count = trainingCounts.get(key) ?? 0;
              const isCurrentMonth = day.getUTCMonth() === visibleMonth.getUTCMonth();
              const isSelected = key === selectedDate;
              return (
                <button
                  key={key}
                  type="button"
                  aria-label={`${displayDate(day)}${count ? `, ${count} treniņ${count === 1 ? "š" : "i"}` : ""}`}
                  aria-pressed={isSelected}
                  onClick={() => selectDay(day)}
                  className={`relative mx-auto flex size-10 flex-col items-center justify-center rounded-full font-sans text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fbb040] sm:size-12 sm:text-base ${isSelected ? "bg-[#fbb040] text-[#050505]" : isCurrentMonth ? "text-white hover:bg-white/15" : "text-white/25 hover:bg-white/10"}`}
                >
                  {day.getUTCDate()}
                  {count > 0 && <span className={`absolute bottom-1 size-1 rounded-full ${isSelected ? "bg-[#050505]" : "bg-[#fbb040]"}`} aria-hidden="true" />}
                </button>
              );
            })}
          </div>
          <div className="mt-5 flex items-center gap-2 border-t border-white/15 pt-4 font-sans text-xs text-white/60"><span className="size-1.5 rounded-full bg-[#fbb040]" /> Dienas ar treniņiem</div>
        </div>
      </div>
    </section>
  );
}
