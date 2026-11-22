"use client";

import { useActionState, useState } from "react";

import { LocationInput } from "@/components/admin/location-input";
import { TimeSelect } from "@/components/admin/time-select";
import { useVenueBookings } from "@/components/admin/use-venue-bookings";
import { VenueClashNote, fkNote } from "@/components/admin/venue-load";
import { DEFAULT_DURATION_MINUTES, defaultEndTime } from "@/lib/admin-time";
import { isEndAfterStart } from "@/lib/time-range";
import { findChangeClash, sameTeams, weekdayLabel, type ScheduleTraining } from "@/lib/training-schedule";
import { useUnsavedChangesGuard } from "@/components/admin/unsaved-changes";
import type { LocationHint } from "@/lib/venue";
import { findVenueClashes, worstLevel } from "@/lib/venue-clash";

import { changeSimilarTrainings, deleteSimilarTrainings } from "../actions";
import { formatDate } from "@/lib/date-display";
import { DateField } from "@/components/admin/date-field";

const DELETE_SUBMITTER = "delete";

/** "Līdzīgie treniņi": the repeats of this training (same weekday, start, end and teams) from its date up to a chosen
 *  date, each with a tick. The ticked ones can be moved to a new time and/or place, given another set of teams (to
 *  make them shared trainings), or deleted, after a confirmation. With a new time or teams, a repeat that would then
 *  overlap another training of one of its teams starts unticked; so does one that a new time or place would put next
 *  to a game (a red venue clash, see src/lib/venue-clash.ts). An orange venue clash is shown but stays ticked. */
export function SimilarTrainings({
  trainingId,
  date,
  teamIds,
  similar,
  laterTrainings,
  teamOptions,
  locations,
}: {
  trainingId: number;
  date: string;
  teamIds: number[];
  similar: ScheduleTraining[];
  laterTrainings: ScheduleTraining[];
  teamOptions: { id: number; name: string }[];
  locations: LocationHint[];
}) {
  const [changeState, changeAction, changePending] = useActionState(changeSimilarTrainings.bind(null, trainingId), undefined);
  const [deleteState, deleteAction, deletePending] = useActionState(deleteSimilarTrainings.bind(null, trainingId), undefined);
  const [until, setUntil] = useState(similar.at(-1)?.date ?? date);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [newTeamIds, setNewTeamIds] = useState<number[]>(teamIds);
  // Ticks the admin changed by hand, by training id; every other row follows its clash.
  const [ticks, setTicks] = useState<Record<number, boolean>>({});

  const timesSet = isEndAfterStart(startTime, endTime);
  const teamsChanged = newTeamIds.length > 0 && !sameTeams(newTeamIds, teamIds);
  const inRange = similar.filter((training) => training.date <= until);
  const changingIds = new Set(inRange.map((training) => training.id));
  const venue = useVenueBookings(date, until);
  const newPlace = location.trim();
  const movesVenue = timesSet || newPlace !== "";
  // The repeats move together, so their own current bookings are not in the way.
  const otherBookings =
    venue.status === "ready" ? venue.data.bookings.filter((booking) => !inRange.some((training) => booking.key === `afa:training-${training.id}`)) : [];
  const rows = inRange.map((training) => ({
    training,
    venueClashes: movesVenue
      ? findVenueClashes(
          {
            kind: "training",
            location: newPlace || training.location,
            date: training.date,
            startTime: timesSet ? startTime : training.startTime,
            endTime: timesSet ? endTime : training.endTime,
          },
          otherBookings,
        )
      : [],
    clash:
      timesSet || teamsChanged
        ? findChangeClash(
            training,
            timesSet ? startTime : training.startTime,
            timesSet ? endTime : training.endTime,
            newTeamIds,
            laterTrainings,
            changingIds,
          )
        : null,
  }));
  const isTicked = (row: (typeof rows)[number]) => ticks[row.training.id] ?? (row.clash === null && worstLevel(row.venueClashes) !== "red");
  const tickedCount = rows.filter(isTicked).length;
  const hasChange = timesSet || location.trim() !== "" || teamsChanged;
  const teamName = (id: number) => teamOptions.find((team) => team.id === id)?.name ?? "";
  const pending = changePending || deletePending;
  const error = changeState?.error ?? deleteState?.error;
  const unsavedFormRef = useUnsavedChangesGuard(pending, changeState ?? deleteState);

  function toggleTeam(id: number) {
    setNewTeamIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function changeStartTime(value: string) {
    setStartTime(value);
    if (!endTime) setEndTime(defaultEndTime(value, DEFAULT_DURATION_MINUTES.training));
  }

  return (
    <details className="mt-8 max-w-md rounded-xl border border-slate-200 p-4">
      <summary className="cursor-pointer text-sm font-semibold text-club-navy">Līdzīgie treniņi…</summary>
      <form ref={unsavedFormRef}
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
          Tā pati nedēļas diena ({weekdayLabel(date).toLowerCase()}), laiks un komandas, sākot no {formatDate(date)}. Vieta un treneri netiek salīdzināti.
        </p>
        <DateField name="until" label="Līdz (ieskaitot)" required min={date} value={until} onChange={setUntil} className="mt-3" />

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
                <span className="w-24 shrink-0 font-semibold">{formatDate(row.training.date)}</span>
                <span className="text-slate-500">
                  {row.training.startTime}–{row.training.endTime}, {row.training.location}
                  {row.training.id === trainingId && " (šis)"}
                  {row.clash && (
                    <span className="block text-xs font-semibold text-amber-700">
                      ⚠️ Pārklāsies ar {row.clash.teamIds.map(teamName).filter(Boolean).join(", ")}{" "}
                      {`${row.clash.startTime}–${row.clash.endTime}`}, {row.clash.location}
                    </span>
                  )}
                  <VenueClashNote clashes={row.venueClashes} />
                </span>
              </label>
            </li>
          ))}
        </ul>
        {movesVenue && venue.status === "failed" && <p className="mt-2 text-xs text-club-red">Vietas noslodzi neizdevās ielādēt.</p>}
        {movesVenue && venue.status === "ready" && fkNote(venue.data.fk) && <p className="mt-2 text-xs text-slate-500">{fkNote(venue.data.fk)}</p>}

        <fieldset className="mt-4 border-t border-slate-200 pt-4">
          <legend className="sr-only">Jaunais laiks, vieta un komandas</legend>
          <p className="text-xs text-slate-500">Mainīt: atstāj tukšu laiku vai vietu, ja tie paliek kā ir.</p>
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
          <LocationInput name="newLocation" label="Jauna vieta" value={location} onChange={setLocation} options={locations} className="mt-3" />
          <p className="mt-3 text-sm font-semibold text-club-navy">Komandas</p>
          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1.5">
            {teamOptions.map((team) => (
              <label key={team.id} className="flex items-center gap-2 text-sm text-club-navy">
                <input type="checkbox" name="newTeamIds" value={team.id} checked={newTeamIds.includes(team.id)} onChange={() => toggleTeam(team.id)} />
                {team.name}
              </label>
            ))}
          </div>
          {newTeamIds.length === 0 && <p className="mt-1 text-xs text-club-red">Jāizvēlas vismaz viena komanda.</p>}
        </fieldset>

        {error && <p className="mt-3 text-sm font-semibold text-club-red">{error}</p>}

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="submit"
            formAction={changeAction}
            disabled={pending || tickedCount === 0 || !hasChange || newTeamIds.length === 0}
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
