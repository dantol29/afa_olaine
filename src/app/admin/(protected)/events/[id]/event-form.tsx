"use client";

import { useActionState, useState } from "react";

import { CopyFormButton, CopyNotice, useFormCopy } from "@/components/admin/form-copy";
import { TimeSelect } from "@/components/admin/time-select";
import { DEFAULT_DURATION_MINUTES, defaultEndTime } from "@/lib/admin-time";

import { createEvent, updateEvent } from "../actions";

export type EventFormValues = {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  notes: string | null;
  teamId: number | null;
};
type TeamOption = { id: number; name: string };

export function EventForm(
  props:
    | { mode: "create"; teamOptions: TeamOption[]; copyOf?: EventFormValues }
    | { mode: "edit"; eventId: number; event: EventFormValues; teamOptions: TeamOption[] },
) {
  const copy = useFormCopy();
  // Both actions are set up so an edit form can turn into a copy (a create) without losing what is typed.
  const [createState, createAction, createPending] = useActionState(createEvent, undefined);
  const [updateState, updateAction, updatePending] = useActionState(
    props.mode === "edit" ? updateEvent.bind(null, props.eventId) : createEvent,
    undefined,
  );
  const isCreate = props.mode === "create" || copy.isCopy;
  const isCopy = copy.isCopy || (props.mode === "create" && props.copyOf !== undefined);
  const state = isCreate ? createState : updateState;
  const pending = isCreate ? createPending : updatePending;
  const event = props.mode === "edit" ? props.event : props.copyOf ?? null;
  const [startTime, setStartTime] = useState(event?.startTime ?? "");
  const [endTime, setEndTime] = useState(event?.endTime ?? "");

  function changeStartTime(value: string) {
    setStartTime(value);
    if (!endTime) setEndTime(defaultEndTime(value, DEFAULT_DURATION_MINUTES.event));
  }

  return (
    <form action={isCreate ? createAction : updateAction} onInput={copy.markDirty} className="max-w-md">
      <h1 className="mb-6 text-2xl font-extrabold text-club-navy">
        {isCreate ? `Jauns notikums${isCopy ? " (kopija)" : ""}` : "Rediģēt notikumu"}
      </h1>
      {isCopy && <CopyNotice />}

      <label className="block text-sm font-semibold text-club-navy">
        Nosaukums
        <input
          type="text"
          name="title"
          required
          defaultValue={event?.title ?? ""}
          className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
        />
      </label>

      <label className="mt-4 block text-sm font-semibold text-club-navy">
        Datums
        <input
          type="date"
          name="date"
          required
          defaultValue={event?.date ?? ""}
          className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
        />
      </label>

      <div className="mt-4 flex gap-4">
        <TimeSelect name="startTime" label="Sākuma laiks" value={startTime} onChange={changeStartTime} />
        <TimeSelect name="endTime" label="Beigu laiks" value={endTime} onChange={setEndTime} />
      </div>

      <label className="mt-4 block text-sm font-semibold text-club-navy">
        Vieta
        <input
          type="text"
          name="location"
          required
          defaultValue={event?.location ?? ""}
          className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
        />
      </label>

      <label className="mt-4 block text-sm font-semibold text-club-navy">
        Komanda (nav obligāta — atstāj tukšu visam klubam)
        <select
          name="teamId"
          defaultValue={event?.teamId ?? ""}
          className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
        >
          <option value="">Viss klubs</option>
          {props.teamOptions.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
      </label>

      <label className="mt-4 block text-sm font-semibold text-club-navy">
        Piezīmes (nav obligāts)
        <textarea
          name="notes"
          rows={3}
          defaultValue={event?.notes ?? ""}
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
