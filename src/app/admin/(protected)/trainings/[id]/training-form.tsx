"use client";

import { useActionState, useState } from "react";

import { CopyFormButton, CopyNotice, useFormCopy } from "@/components/admin/form-copy";
import { LocationInput } from "@/components/admin/location-input";
import { TimeSelect } from "@/components/admin/time-select";
import { VenueLoad } from "@/components/admin/venue-load";
import { DEFAULT_DURATION_MINUTES, defaultEndTime } from "@/lib/admin-time";
import { useUnsavedChangesGuard } from "@/components/admin/unsaved-changes";
import type { LocationHint } from "@/lib/venue";

import { createTraining, updateTraining } from "../actions";
import { DateField } from "@/components/admin/date-field";
import { usePublishPlannedEntry } from "@/components/admin/planned-booking";

export type TrainingFormValues = {
  teamIds: number[];
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  notes: string | null;
  trainingCoaches: { coachId: number }[];
};
type TeamOption = { id: number; name: string };
type CoachOption = { id: number; name: string };

export function TrainingForm(
  props:
    | { mode: "create"; teamOptions: TeamOption[]; coachOptions: CoachOption[]; locations: LocationHint[]; copyOf?: TrainingFormValues }
    | { mode: "edit"; trainingId: number; training: TrainingFormValues; teamOptions: TeamOption[]; coachOptions: CoachOption[]; locations: LocationHint[] },
) {
  const copy = useFormCopy();
  // Both actions are set up so an edit form can turn into a copy (a create) without losing what is typed.
  const [createState, createAction, createPending] = useActionState(createTraining, undefined);
  const [updateState, updateAction, updatePending] = useActionState(
    props.mode === "edit" ? updateTraining.bind(null, props.trainingId) : createTraining,
    undefined,
  );
  const isCreate = props.mode === "create" || copy.isCopy;
  const isCopy = copy.isCopy || (props.mode === "create" && props.copyOf !== undefined);
  const state = isCreate ? createState : updateState;
  const pending = isCreate ? createPending : updatePending;
  const unsavedFormRef = useUnsavedChangesGuard(pending, state);
  const training = props.mode === "edit" ? props.training : props.copyOf ?? null;
  const selectedTeamIds = new Set(training?.teamIds ?? []);
  const selectedCoachIds = new Set(training?.trainingCoaches.map((tc) => tc.coachId) ?? []);
  const [date, setDate] = useState(training?.date ?? "");
  const [startTime, setStartTime] = useState(training?.startTime ?? "");
  const [endTime, setEndTime] = useState(training?.endTime ?? "");
  const [location, setLocation] = useState(training?.location ?? "Olaines pilsētas stadions");
  usePublishPlannedEntry({
    eventType: "training",
    title: isCreate ? "Jaunais treniņš" : "Šis treniņš",
    location,
    date,
    startTime,
    endTime,
    editedUid: props.mode === "edit" && !copy.isCopy ? `training-${props.trainingId}` : undefined,
  });

  // Picking a suggestion fires no input event, so it marks the form as edited here.
  function changeLocation(value: string) {
    copy.markDirty();
    setLocation(value);
  }

  function changeStartTime(value: string) {
    setStartTime(value);
    if (!endTime) setEndTime(defaultEndTime(value, DEFAULT_DURATION_MINUTES.training));
  }

  return (
    <form ref={unsavedFormRef} action={isCreate ? createAction : updateAction} onInput={copy.markDirty} className="max-w-md">
      <h1 className="mb-6 text-2xl font-extrabold text-club-navy">
        {isCreate ? `Jauns treniņš${isCopy ? " (kopija)" : ""}` : "Rediģēt treniņu"}
      </h1>
      {isCopy && <CopyNotice />}

      <fieldset>
        <legend className="text-sm font-semibold text-club-navy">Komandas</legend>
        <p className="text-xs text-slate-500">Kopīgam treniņam atzīmē vairākas.</p>
        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1.5">
          {props.teamOptions.map((team) => (
            <label key={team.id} className="flex items-center gap-2 text-sm text-club-navy">
              <input type="checkbox" name="teamIds" value={team.id} defaultChecked={selectedTeamIds.has(team.id)} />
              {team.name}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-4">
        <legend className="text-sm font-semibold text-club-navy">Treneri (nav obligāts)</legend>
        <div className="mt-1.5 flex flex-col gap-1.5">
          {props.coachOptions.map((coach) => (
            <label key={coach.id} className="flex items-center gap-2 text-sm text-club-navy">
              <input
                type="checkbox"
                name="coachIds"
                value={coach.id}
                defaultChecked={selectedCoachIds.has(coach.id)}
              />
              {coach.name}
            </label>
          ))}
        </div>
      </fieldset>

      <DateField
        name="date"
        label="Datums"
        required
        value={date}
        onChange={(value) => {
          copy.markDirty();
          setDate(value);
        }}
        className="mt-4"
      />

      <div className="mt-4 flex gap-4">
        <TimeSelect name="startTime" label="Sākuma laiks" value={startTime} onChange={changeStartTime} />
        <TimeSelect name="endTime" label="Beigu laiks" value={endTime} onChange={setEndTime} />
      </div>

      <LocationInput name="location" label="Vieta" required value={location} onChange={changeLocation} options={props.locations} className="mt-4" />
      <VenueLoad
        planned={{ kind: "training", location, date, startTime, endTime }}
        excludeKey={props.mode === "edit" && !copy.isCopy ? `afa:training-${props.trainingId}` : undefined}
      />

      <label className="mt-4 block text-sm font-semibold text-club-navy">
        Piezīmes (nav obligāts)
        <textarea
          name="notes"
          rows={3}
          defaultValue={training?.notes ?? ""}
          className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
        />
      </label>

      {state?.error && <p className="mt-3 text-sm font-semibold text-club-red">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="mt-6 rounded-lg bg-club-red px-4 py-2 text-sm font-semibold text-white transition hover:bg-club-red-dark disabled:opacity-50"
      >
        {pending ? "Saglabā..." : "Saglabāt"}
      </button>
      {!isCreate && <CopyFormButton onClick={copy.startCopy} />}
    </form>
  );
}
