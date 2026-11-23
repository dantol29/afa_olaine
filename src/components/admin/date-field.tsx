"use client";

import { useState } from "react";
import { Popover } from "@base-ui/react/popover";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

import { CalendarMonthGrid, MONTHS } from "@/components/calendar-month-grid";
import { formatFullDate } from "@/lib/date-display";
import { cn } from "@/lib/utils";

// An admin date picked only from a calendar, shown as "05.12.2026". The browser's own date field shows the order of
// its language (12/05/2026 in English), and typing into it invites mistakes, so it is not used. The value goes to the
// form as a date key ("YYYY-MM-DD") under `name`, like the browser's field did, so the server actions are unchanged.

/** Years offered around today and the current value; admin dates are near the present. */
const YEARS_BACK = 2;
const YEARS_AHEAD = 3;

function todayKey(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Riga", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

export function DateField({ name, label, hint, value, onChange, min, required, className }: {
  /** Omit for a field that only drives the page (it then sends nothing with the form). */
  name?: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  min?: string;
  required?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState({ year: 0, month: 0 });

  function openAt(dateKey: string) {
    setShown({ year: Number(dateKey.slice(0, 4)), month: Number(dateKey.slice(5, 7)) - 1 });
  }

  function moveMonth(delta: number) {
    const date = new Date(Date.UTC(shown.year, shown.month + delta, 1));
    setShown({ year: date.getUTCFullYear(), month: date.getUTCMonth() });
  }

  const thisYear = Number(todayKey().slice(0, 4));
  const years = new Set<number>();
  for (let year = thisYear - YEARS_BACK; year <= thisYear + YEARS_AHEAD; year++) years.add(year);
  years.add(shown.year);
  const navClass = "flex size-9 shrink-0 items-center justify-center rounded-lg text-club-navy hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-club-red";
  const selectClass = "h-9 min-w-0 rounded-lg bg-slate-100 px-2 text-sm focus-visible:outline-2 focus-visible:outline-club-red";

  return (
    <div className={cn("relative block text-sm font-semibold text-club-navy", className)}>
      <span>{label}</span>
      {/* Carries the value and, when required, the browser's "fill this in" check; people use the button. */}
      {name && (
        <input
          name={name}
          value={value}
          required={required}
          onChange={() => {}}
          tabIndex={-1}
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-3 h-px w-px opacity-0"
        />
      )}
      <Popover.Root
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (nextOpen) openAt(value || (min && min > todayKey() ? min : todayKey()));
        }}
      >
        <Popover.Trigger
          aria-label={`${label}: ${value ? formatFullDate(value) : "nav izvēlēts"}`}
          className="admin-field mt-1.5 flex w-full items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm font-normal tabular-nums text-club-navy outline-none focus-visible:border-club-red data-popup-open:border-club-red"
        >
          <span className={value ? undefined : "text-slate-400"}>{value ? formatFullDate(value) : "dd.mm.gggg"}</span>
          <CalendarDays className="size-4 shrink-0 text-slate-500" aria-hidden="true" />
        </Popover.Trigger>
        <Popover.Portal>
          {/* The popup renders outside the admin page, so it takes the admin's dark colours itself. */}
          <Popover.Positioner sideOffset={6} align="start" className="admin-theme z-50">
            <Popover.Popup className="w-[320px] max-w-[calc(100vw-32px)] rounded-2xl border border-slate-200 bg-white p-4 text-club-navy shadow-xl outline-none">
              <Popover.Title className="sr-only">{label}</Popover.Title>
              <div className="mb-3 flex items-center gap-1">
                <button type="button" aria-label="Iepriekšējais mēnesis" onClick={() => moveMonth(-1)} className={navClass}>
                  <ChevronLeft className="size-4" />
                </button>
                <select aria-label="Mēnesis" value={shown.month} onChange={(event) => setShown({ ...shown, month: Number(event.target.value) })} className={cn(selectClass, "flex-1")}>
                  {MONTHS.map((monthLabel, index) => <option key={monthLabel} value={index}>{monthLabel}</option>)}
                </select>
                <select aria-label="Gads" value={shown.year} onChange={(event) => setShown({ ...shown, year: Number(event.target.value) })} className={selectClass}>
                  {[...years].sort((a, b) => a - b).map((year) => <option key={year} value={year}>{year}</option>)}
                </select>
                <button type="button" aria-label="Nākamais mēnesis" onClick={() => moveMonth(1)} className={navClass}>
                  <ChevronRight className="size-4" />
                </button>
              </div>
              <CalendarMonthGrid
                year={shown.year}
                month={shown.month}
                selectedKey={value || null}
                minKey={min}
                onPick={(dateKey) => {
                  onChange(dateKey);
                  setOpen(false);
                }}
              />
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
      {hint && <span className="mt-1 block text-xs font-normal text-slate-500">{hint}</span>}
    </div>
  );
}
