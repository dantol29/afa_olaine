"use client";

import { useActionState, useState } from "react";

import { weekdayLabel, type ScheduleTraining } from "@/lib/training-schedule";

import { deleteSimilarTrainings } from "../actions";

/** "Dzēst līdzīgos": the repeats of this training (same weekday, start, end and teams) from its date up to a chosen
 *  date, each with a tick, deleted together after a confirmation. */
export function SimilarDelete({ trainingId, date, similar }: { trainingId: number; date: string; similar: ScheduleTraining[] }) {
  const [state, action, pending] = useActionState(deleteSimilarTrainings.bind(null, trainingId), undefined);
  const [until, setUntil] = useState(similar.at(-1)?.date ?? date);
  const [unticked, setUnticked] = useState<Set<number>>(new Set());

  const inRange = similar.filter((training) => training.date <= until);
  const ticked = inRange.filter((training) => !unticked.has(training.id));

  function toggle(id: number, checked: boolean) {
    setUnticked((current) => {
      const next = new Set(current);
      if (checked) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <details className="mt-8 max-w-md rounded-xl border border-slate-200 p-4">
      <summary className="cursor-pointer text-sm font-semibold text-club-red">Dzēst līdzīgos…</summary>
      <form
        action={action}
        onSubmit={(event) => {
          if (!window.confirm(`Dzēst ${ticked.length} treniņus? To nevar atsaukt.`)) event.preventDefault();
        }}
        className="mt-3"
      >
        <p className="text-xs text-slate-500">
          Tā pati nedēļas diena ({weekdayLabel(date).toLowerCase()}), laiks un komanda, sākot no {date}. Vieta un treneri netiek salīdzināti.
        </p>
        <label className="mt-3 block text-sm font-semibold text-club-navy">
          Līdz (ieskaitot)
          <input
            type="date"
            name="until"
            required
            min={date}
            value={until}
            onChange={(event) => setUntil(event.target.value)}
            className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
          />
        </label>

        <ul className="mt-3 divide-y divide-slate-100 rounded-lg bg-white text-sm">
          {inRange.map((training) => (
            <li key={training.id}>
              <label className="flex items-center gap-3 px-3 py-1.5 text-club-navy">
                <input
                  type="checkbox"
                  name="trainingIds"
                  value={training.id}
                  checked={!unticked.has(training.id)}
                  onChange={(event) => toggle(training.id, event.target.checked)}
                />
                <span className="w-24 font-semibold">{training.date}</span>
                <span className="text-slate-500">
                  {training.startTime}–{training.endTime}, {training.location}
                  {training.id === trainingId && " (šis)"}
                </span>
              </label>
            </li>
          ))}
        </ul>

        {state?.error && <p className="mt-3 text-sm font-semibold text-club-red">{state.error}</p>}

        <button
          type="submit"
          disabled={pending || ticked.length === 0}
          className="mt-4 rounded-lg border border-club-red px-4 py-2 text-sm font-semibold text-club-red transition hover:bg-club-red/10 disabled:opacity-50"
        >
          {pending ? "Dzēš..." : `Dzēst (${ticked.length})`}
        </button>
      </form>
    </details>
  );
}
