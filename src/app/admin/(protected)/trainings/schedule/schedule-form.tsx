"use client";

import { useActionState, useMemo, useState } from "react";

import { LocationInput } from "@/components/admin/location-input";
import { TimeSelect } from "@/components/admin/time-select";
import { useVenueBookings } from "@/components/admin/use-venue-bookings";
import { VenueClashNote, fkNote } from "@/components/admin/venue-load";
import { DEFAULT_DURATION_MINUTES, defaultEndTime } from "@/lib/admin-time";
import { isEndAfterStart } from "@/lib/time-range";
import { WEEKDAYS, findClash, scheduleDates, weekdayLabel, type ScheduleTraining } from "@/lib/training-schedule";
import { useUnsavedChangesGuard } from "@/components/admin/unsaved-changes";
import type { LocationHint } from "@/lib/venue";
import { findVenueClashes, worstLevel, type VenueClash } from "@/lib/venue-clash";

import { createTrainingSchedule } from "../actions";

type Option = { id: number; name: string };

const INPUT_CLASS = "mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red";

/** The schedule form: the fields shared by every training, then the dates they give, each with a tick. A date on
 *  which one of the chosen teams already trains at an overlapping time, or with a red venue clash (a game at the
 *  place, see src/lib/venue-clash.ts), starts unticked; an orange venue clash is shown but stays ticked. */
export function ScheduleForm({
  today,
  teamOptions,
  coachOptions,
  locations,
  existing,
}: {
  today: string;
  teamOptions: Option[];
  coachOptions: Option[];
  locations: LocationHint[];
  existing: ScheduleTraining[];
}) {
  const [state, action, pending] = useActionState(createTrainingSchedule, undefined);
  const unsavedFormRef = useUnsavedChangesGuard(pending, state);
  const [teamIds, setTeamIds] = useState<number[]>([]);
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState("");
  const [location, setLocation] = useState("Olaines pilsētas stadions");
  // Ticks the admin changed by hand, by date; every other date follows its clash.
  const [ticks, setTicks] = useState<Record<string, boolean>>({});

  function changeStartTime(value: string) {
    setStartTime(value);
    if (!endTime) setEndTime(defaultEndTime(value, DEFAULT_DURATION_MINUTES.training));
  }

  function toggleTeam(id: number) {
    setTeamIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function toggleWeekday(day: number) {
    setWeekdays((current) => (current.includes(day) ? current.filter((item) => item !== day) : [...current, day]));
  }

  const timesReady = isEndAfterStart(startTime, endTime);
  const venue = useVenueBookings(from, to);
  const venueBookings = venue.status === "ready" ? venue.data.bookings : null;
  const plan = useMemo(() => {
    if (!from || !to) return { rows: [], error: null };
    const result = scheduleDates(from, to, weekdays);
    if ("error" in result) return { rows: [], error: result.error };
    return {
      error: null,
      rows: result.dates.map((date) => ({
        date,
        clash: teamIds.length > 0 && timesReady ? findClash(date, startTime, endTime, teamIds, existing) : null,
        venueClashes:
          timesReady && venueBookings && location.trim()
            ? findVenueClashes({ kind: "training", location, date, startTime, endTime }, venueBookings)
            : [],
      })),
    };
  }, [from, to, weekdays, teamIds, timesReady, startTime, endTime, existing, location, venueBookings]);

  const isTicked = (row: { date: string; clash: ScheduleTraining | null; venueClashes: VenueClash[] }) =>
    ticks[row.date] ?? (row.clash === null && worstLevel(row.venueClashes) !== "red");
  const tickedCount = plan.rows.filter(isTicked).length;

  return (
    <form ref={unsavedFormRef} action={action} className="max-w-2xl">
      <h1 className="mb-6 text-2xl font-extrabold text-club-navy">Treniņi pēc grafika</h1>

      <fieldset>
        <legend className="text-sm font-semibold text-club-navy">Komandas</legend>
        <p className="text-xs text-slate-500">Kopīgam treniņam atzīmē vairākas.</p>
        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1.5">
          {teamOptions.map((team) => (
            <label key={team.id} className="flex items-center gap-2 text-sm text-club-navy">
              <input type="checkbox" name="teamIds" value={team.id} checked={teamIds.includes(team.id)} onChange={() => toggleTeam(team.id)} />
              {team.name}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-4">
        <legend className="text-sm font-semibold text-club-navy">Treneri (nav obligāts)</legend>
        <div className="mt-1.5 flex flex-col gap-1.5">
          {coachOptions.map((coach) => (
            <label key={coach.id} className="flex items-center gap-2 text-sm text-club-navy">
              <input type="checkbox" name="coachIds" value={coach.id} />
              {coach.name}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-4">
        <legend className="text-sm font-semibold text-club-navy">Nedēļas dienas</legend>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {WEEKDAYS.map((weekday) => {
            const active = weekdays.includes(weekday.day);
            return (
              <button
                key={weekday.day}
                type="button"
                aria-pressed={active}
                title={weekday.label}
                onClick={() => toggleWeekday(weekday.day)}
                className={`h-9 min-w-11 rounded-lg border px-2 text-sm font-semibold transition ${
                  active ? "border-club-red bg-club-red text-white" : "border-slate-200 text-club-navy hover:border-club-red"
                }`}
              >
                {weekday.short}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-4 flex gap-4">
        <TimeSelect name="startTime" label="Sākuma laiks" value={startTime} onChange={changeStartTime} />
        <TimeSelect name="endTime" label="Beigu laiks" value={endTime} onChange={setEndTime} />
      </div>

      <div className="mt-4 flex gap-4">
        <label className="flex-1 text-sm font-semibold text-club-navy">
          No
          <input type="date" required min={today} value={from} onChange={(event) => setFrom(event.target.value)} className={INPUT_CLASS} />
        </label>
        <label className="flex-1 text-sm font-semibold text-club-navy">
          Līdz
          <input type="date" required min={from || today} value={to} onChange={(event) => setTo(event.target.value)} className={INPUT_CLASS} />
        </label>
      </div>

      <LocationInput name="location" label="Vieta" required value={location} onChange={setLocation} options={locations} className="mt-4" />

      <label className="mt-4 block text-sm font-semibold text-club-navy">
        Piezīmes (nav obligāts)
        <textarea name="notes" rows={2} className={INPUT_CLASS} />
      </label>

      <section className="mt-6">
        <h2 className="text-lg font-bold text-club-navy">Datumi</h2>
        {plan.error && <p className="mt-2 text-sm text-club-red">{plan.error}</p>}
        {!plan.error && plan.rows.length === 0 && (
          <p className="mt-2 text-sm text-slate-500">Izvēlies nedēļas dienas un periodu, lai redzētu datumus.</p>
        )}
        {plan.rows.length > 0 && (
          <ul className="mt-2 divide-y divide-slate-100 rounded-xl bg-white text-sm shadow-sm">
            {plan.rows.map((row) => (
              <li key={row.date}>
                <label className="flex items-center gap-3 px-4 py-2 text-club-navy">
                  <input
                    type="checkbox"
                    name="dates"
                    value={row.date}
                    checked={isTicked(row)}
                    onChange={(event) => setTicks((current) => ({ ...current, [row.date]: event.target.checked }))}
                  />
                  <span className="w-24 font-semibold">{row.date}</span>
                  <span className="w-28 text-slate-500">{weekdayLabel(row.date)}</span>
                  <span className="min-w-0">
                    {row.clash && (
                      <span className="block text-xs font-semibold text-amber-700">
                        ⚠️ Jau ir treniņš {row.clash.startTime}–{row.clash.endTime}, {row.clash.location}
                      </span>
                    )}
                    <VenueClashNote clashes={row.venueClashes} />
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}
        {plan.rows.length > 0 && !(teamIds.length > 0 && timesReady) && (
          <p className="mt-2 text-xs text-slate-500">Pārklāšanās ar esošajiem treniņiem tiks parādīta, kad izvēlēta komanda un laiks.</p>
        )}
        {plan.rows.length > 0 && venue.status === "failed" && <p className="mt-2 text-xs text-club-red">Vietas noslodzi neizdevās ielādēt.</p>}
        {plan.rows.length > 0 && venue.status === "ready" && fkNote(venue.data.fk) && (
          <p className="mt-2 text-xs text-slate-500">{fkNote(venue.data.fk)}</p>
        )}
      </section>

      {state?.error && <p className="mt-3 text-sm font-semibold text-club-red">{state.error}</p>}

      <button
        type="submit"
        disabled={pending || tickedCount === 0 || teamIds.length === 0}
        className="mt-6 rounded-lg bg-club-red px-4 py-2 text-sm font-semibold text-white transition hover:bg-club-red-dark disabled:opacity-50"
      >
        {pending ? "Saglabā..." : `Izveidot (${tickedCount})`}
      </button>
    </form>
  );
}
