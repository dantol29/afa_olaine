"use client";

import { useActionState, useState } from "react";

import { SuggestInput } from "@/components/admin/suggest-input";
import { TimeSelect } from "@/components/admin/time-select";
import { DEFAULT_DURATION_MINUTES, defaultEndTime } from "@/lib/admin-time";
import { isEndAfterStart } from "@/lib/time-range";
import { findChangeClash, weekdayLabel, type ScheduleTraining } from "@/lib/training-schedule";

import { changeSimilarTrainings, deleteSimilarTrainings } from "../actions";

const DELETE_SUBMITTER = "delete";

/** "Līdzīgie treniņi": the repeats of this training (same weekday, start, end and teams) from its date up to a chosen
 *  date, each with a tick. The ticked ones can be moved to a new time and/or place, or deleted, after a confirmation.
 *  With a new time, a repeat that would then overlap another training of the team starts unticked. */
export function SimilarTrainings({
  trainingId,
  date,
  similar,
  teamTrainings,
  locations,
}: {
  trainingId: number;
  date: string;
  similar: ScheduleTraining[];
  teamTrainings: ScheduleTraining[];
  locations: string[];
}) {
  const [changeState, changeAction, changePending] = useActionState(changeSimilarTrainings.bind(null, trainingId), undefined);
  const [deleteState, deleteAction, deletePending] = useActionState(deleteSimilarTrainings.bind(null, trainingId), undefined);
  const [until, setUntil] = useState(similar.at(-1)?.date ?? date);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  // Ticks the admin changed by hand, by training id; every other row follows its clash.
  const [ticks, setTicks] = useState<Record<number, boolean>>({});

  const timesSet = isEndAfterStart(startTime, endTime);
  const inRange = similar.filter((training) => training.date <= until);
  const changingIds = new Set(inRange.map((training) => training.id));
  const rows = inRange.map((training) => ({
    training,
    clash: timesSet ? findChangeClash(training, startTime, endTime, teamTrainings, changingIds) : null,
  }));
  const isTicked = (row: (typeof rows)[number]) => ticks[row.training.id] ?? row.clash === null;
  const tickedCount = rows.filter(isTicked).length;
  const hasChange = timesSet || location.trim() !== "";
  const pending = changePending || deletePending;
  const error = changeState?.error ?? deleteState?.error;

  function changeStartTime(value: string) {
    setStartTime(value);
    if (!endTime) setEndTime(defaultEndTime(value, DEFAULT_DURATION_MINUTES.training));
  }

  return (
    <details className="mt-8 max-w-md rounded-xl border border-slate-200 p-4">
      <summary className="cursor-pointer text-sm font-semibold text-club-navy">Līdzīgie treniņi…</summary>
      <form
        onSubmit={(event) => {
          const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
          const message =
            submitter?.value === DELETE_SUBMITTER
              ? `Dzēst ${tickedCount} treniņus? To nevar atsaukt.`
              : `Mainīt ${tickedCount} treniņus?`;
          if (!window.confirm(message)) event.preventDefault();
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
          {rows.map((row) => (
            <li key={row.training.id}>
              <label className="flex items-start gap-3 px-3 py-1.5 text-club-navy">
                <input
                  type="checkbox"
                  name="trainingIds"
                  value={row.training.id}
                  checked={isTicked(row)}
                  onChange={(event) => setTicks((current) => ({ ...current, [row.training.id]: event.target.checked }))}
                  className="mt-0.5"
                />
                <span className="w-24 shrink-0 font-semibold">{row.training.date}</span>
                <span className="text-slate-500">
                  {row.training.startTime}–{row.training.endTime}, {row.training.location}
                  {row.training.id === trainingId && " (šis)"}
                  {row.clash && (
                    <span className="block text-xs font-semibold text-amber-700">
                      ⚠️ Pārklāsies ar {row.clash.startTime}–{row.clash.endTime}, {row.clash.location}
                    </span>
                  )}
                </span>
              </label>
            </li>
          ))}
        </ul>

        <fieldset className="mt-4 border-t border-slate-200 pt-4">
          <legend className="sr-only">Jaunais laiks un vieta</legend>
          <p className="text-xs text-slate-500">Mainīt: atstāj tukšu to, kas paliek kā ir.</p>
          <div className="mt-2 flex gap-4">
            <TimeSelect name="newStartTime" label="Jauns sākums" value={startTime} onChange={changeStartTime} required={false} />
            <TimeSelect name="newEndTime" label="Jaunas beigas" value={endTime} onChange={setEndTime} required={false} />
          </div>
          {(startTime || endTime) && (
            <button
              type="button"
              onClick={() => {
                setStartTime("");
                setEndTime("");
              }}
              className="mt-1 text-xs font-semibold text-slate-500 hover:text-club-navy"
            >
              Notīrīt laiku
            </button>
          )}
          <SuggestInput name="newLocation" label="Jauna vieta" value={location} onChange={setLocation} options={locations} className="mt-3" />
        </fieldset>

        {error && <p className="mt-3 text-sm font-semibold text-club-red">{error}</p>}

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="submit"
            formAction={changeAction}
            disabled={pending || tickedCount === 0 || !hasChange}
            className="rounded-lg bg-club-red px-4 py-2 text-sm font-semibold text-white transition hover:bg-club-red-dark disabled:opacity-50"
          >
            {changePending ? "Saglabā..." : `Mainīt (${tickedCount})`}
          </button>
          <button
            type="submit"
            value={DELETE_SUBMITTER}
            formAction={deleteAction}
            disabled={pending || tickedCount === 0}
            className="rounded-lg border border-club-red px-4 py-2 text-sm font-semibold text-club-red transition hover:bg-club-red/10 disabled:opacity-50"
          >
            {deletePending ? "Dzēš..." : `Dzēst (${tickedCount})`}
          </button>
        </div>
      </form>
    </details>
  );
}
