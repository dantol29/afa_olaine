"use client";

import { hourOptions, minuteOptions, splitTime } from "@/lib/admin-time";

const SELECT_CLASS = "w-full rounded-lg border border-slate-200 px-2 py-2 text-sm text-club-navy outline-none focus:border-club-red disabled:opacity-50";

/** Hour and minute lists instead of a free time field, so only quarter hours can be picked. The form still receives
 *  one "HH:MM" value under `name`, as the server expects. Minutes unlock once an hour is chosen. */
export function TimeSelect({
  name,
  label,
  value,
  onChange,
}: {
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const { hour, minute } = splitTime(value);

  return (
    <fieldset className="flex-1 text-sm font-semibold text-club-navy">
      <legend>{label}</legend>
      <div className="mt-1.5 flex items-center gap-1.5">
        <select
          aria-label={`${label}: stundas`}
          required
          value={hour}
          onChange={(event) => onChange(`${event.target.value}:${minute || "00"}`)}
          className={SELECT_CLASS}
        >
          <option value="" disabled>--</option>
          {hourOptions(hour).map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
        <span aria-hidden="true">:</span>
        <select
          aria-label={`${label}: minūtes`}
          required
          disabled={!hour}
          value={minute}
          onChange={(event) => onChange(`${hour}:${event.target.value}`)}
          className={SELECT_CLASS}
        >
          <option value="" disabled>--</option>
          {minuteOptions(minute).map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      </div>
      <input type="hidden" name={name} value={value} />
    </fieldset>
  );
}
