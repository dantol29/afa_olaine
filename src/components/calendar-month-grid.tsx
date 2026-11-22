"use client";

import { cn } from "@/lib/utils";

// One month of day buttons, Monday first, shared by the site's "Pāriet uz datumu" and the admin date fields. Days are
// date keys ("YYYY-MM-DD") built in UTC, so no time zone shifts a day.

export const MONTHS = ["Janvāris", "Februāris", "Marts", "Aprīlis", "Maijs", "Jūnijs", "Jūlijs", "Augusts", "Septembris", "Oktobris", "Novembris", "Decembris"];
const WEEKDAYS = ["P", "O", "T", "C", "P", "S", "Sv"];

export function dateKeyOf(year: number, month: number, day: number): string {
  return new Date(Date.UTC(year, month, day)).toISOString().slice(0, 10);
}

/** `month` is 0-based. Days before `minKey` are shown but cannot be picked. */
export function CalendarMonthGrid({ year, month, selectedKey, minKey, onPick }: {
  year: number;
  month: number;
  selectedKey: string | null;
  minKey?: string;
  onPick: (dateKey: string) => void;
}) {
  const firstDay = new Date(Date.UTC(year, month, 1));
  const offset = (firstDay.getUTCDay() + 6) % 7;
  const days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

  return (
    <div className="grid grid-cols-7 text-center">
      {WEEKDAYS.map((label, index) => <span key={index} aria-hidden="true" className="py-2 text-xs text-slate-500">{label}</span>)}
      {Array.from({ length: offset }, (_, index) => <span key={`blank-${index}`} />)}
      {Array.from({ length: days }, (_, index) => {
        const day = index + 1;
        const key = dateKeyOf(year, month, day);
        const selected = key === selectedKey;
        const label = new Date(`${key}T12:00:00Z`).toLocaleDateString("lv-LV", { timeZone: "UTC", day: "numeric", month: "long", year: "numeric" });
        return (
          <button
            key={day}
            type="button"
            aria-pressed={selected}
            aria-label={label}
            disabled={minKey !== undefined && key < minKey}
            onClick={() => onPick(key)}
            className={cn(
              "flex h-11 items-center justify-center rounded-lg text-sm tabular-nums focus-visible:outline-2 focus-visible:outline-club-red disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent",
              selected ? "bg-club-red font-semibold text-white" : "hover:bg-slate-100",
            )}
          >
            {day}
          </button>
        );
      })}
    </div>
  );
}
