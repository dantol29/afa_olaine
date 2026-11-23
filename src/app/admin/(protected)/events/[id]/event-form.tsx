"use client";

import Image from "next/image";
import { useActionState, useState } from "react";

import { CopyFormButton, CopyNotice, useFormCopy } from "@/components/admin/form-copy";
import { FormWithPreview } from "@/components/admin/form-preview";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { SuggestInput } from "@/components/admin/suggest-input";
import { TimeSelect } from "@/components/admin/time-select";
import { VenueLoad } from "@/components/admin/venue-load";
import { EventCard } from "@/components/event-card";
import { buildEventPreview } from "@/lib/admin-preview";
import { DEFAULT_DURATION_MINUTES, defaultEndTime } from "@/lib/admin-time";
import { handleImageInputChange } from "@/lib/client-image-resize";
import { MAX_BODY_LENGTH } from "@/lib/content-limits";
import { useUnsavedChangesGuard } from "@/components/admin/unsaved-changes";

import { createEvent, updateEvent } from "../actions";
import { DateField } from "@/components/admin/date-field";

export type EventFormValues = {
  title: string;
  date: string;
  /** Last day of a multi-day event; null for one day. */
  endDate: string | null;
  startTime: string;
  endTime: string;
  location: string;
  notes: string | null;
  /** Empty for a club-wide event. */
  teamIds: number[];
  /** Rich text shown on the event's page. */
  description: string | null;
  image: string | null;
  /** Gallery photo URLs, one per line. */
  gallery: string | null;
};
type TeamOption = { id: number; name: string };
/** Values used before, offered while typing, and the stripe the card preview draws. */
const FILE_INPUT_CLASS = "mt-1.5 block w-full text-sm text-club-navy file:mr-3 file:rounded-lg file:border-0 file:bg-club-gray-light file:px-3 file:py-2 file:text-sm file:font-semibold file:text-club-navy hover:file:bg-slate-200";

export type EventFormHints = { titles: string[]; locations: string[]; borderStripe: string };

export function EventForm(
  props: { teamOptions: TeamOption[]; hints: EventFormHints } & (
    | { mode: "create"; copyOf?: EventFormValues }
    | { mode: "edit"; eventId: number; event: EventFormValues }
  ),
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
  const unsavedFormRef = useUnsavedChangesGuard(pending, state);
  const event = props.mode === "edit" ? props.event : props.copyOf ?? null;
  // Photos belong to the saved event only; a copy (new event) starts without them.
  const savedPhotos = props.mode === "edit" && !copy.isCopy ? props.event : null;
  const savedImage = savedPhotos?.image ?? null;
  const savedGallery = savedPhotos?.gallery?.split("\n").filter(Boolean) ?? [];
  const [title, setTitle] = useState(event?.title ?? "");
  const [date, setDate] = useState(event?.date ?? "");
  const [isMultiDay, setIsMultiDay] = useState(Boolean(event?.endDate));
  const [endDate, setEndDate] = useState(event?.endDate ?? "");
  const [startTime, setStartTime] = useState(event?.startTime ?? "");
  const [endTime, setEndTime] = useState(event?.endTime ?? "");
  const [location, setLocation] = useState(event?.location ?? "");
  const [teamIds, setTeamIds] = useState<number[]>(event?.teamIds ?? []);
  const preview = buildEventPreview(
    { title, date, endDate: isMultiDay ? endDate : "", startTime, endTime, location, teamIds },
    props.teamOptions,
  );
  // Picking a suggestion fires no input event, so it marks the form as edited here.
  const edit = (set: (value: string) => void) => (value: string) => {
    copy.markDirty();
    set(value);
  };

  function changeStartTime(value: string) {
    setStartTime(value);
    if (!endTime) setEndTime(defaultEndTime(value, DEFAULT_DURATION_MINUTES.event));
  }

  const form = (
    <form ref={unsavedFormRef} action={isCreate ? createAction : updateAction} onInput={copy.markDirty} className="max-w-md">
      <h1 className="mb-6 text-2xl font-extrabold text-club-navy">
        {isCreate ? `Jauns notikums${isCopy ? " (kopija)" : ""}` : "Rediģēt notikumu"}
      </h1>
      {isCopy && <CopyNotice />}

      <SuggestInput name="title" label="Nosaukums" required value={title} onChange={edit(setTitle)} options={props.hints.titles} />

      <DateField name="date" label="Datums" required value={date} onChange={edit(setDate)} className="mt-4" />

      <label className="mt-2 flex items-center gap-2 text-sm text-club-navy">
        <input type="checkbox" checked={isMultiDay} onChange={(changeEvent) => setIsMultiDay(changeEvent.target.checked)} />
        Vairākas dienas
      </label>
      {isMultiDay && (
        <DateField
          name="endDate"
          label="Beigu datums"
          hint="Sākuma laiks ir pirmajā dienā, beigu laiks — pēdējā."
          required
          min={date || undefined}
          value={endDate}
          onChange={edit(setEndDate)}
          className="mt-2"
        />
      )}

      <div className="mt-4 flex gap-4">
        <TimeSelect name="startTime" label="Sākuma laiks" value={startTime} onChange={changeStartTime} />
        <TimeSelect name="endTime" label="Beigu laiks" value={endTime} onChange={setEndTime} />
      </div>

      <SuggestInput name="location" label="Vieta" required value={location} onChange={edit(setLocation)} options={props.hints.locations} className="mt-4" />
      <VenueLoad
        planned={{ kind: "event", location, date, startTime, endTime, endDate: isMultiDay && endDate && endDate !== date ? endDate : undefined }}
        excludeKey={props.mode === "edit" && !copy.isCopy ? `event-${props.eventId}` : undefined}
      />

      <fieldset className="mt-4">
        <legend className="text-sm font-semibold text-club-navy">Komandas</legend>
        <p className="text-xs text-slate-500">Nav obligātas — ja neviena nav atzīmēta, notikums ir visam klubam.</p>
        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1.5">
          {props.teamOptions.map((team) => (
            <label key={team.id} className="flex items-center gap-2 text-sm text-club-navy">
              <input
                type="checkbox"
                name="teamIds"
                value={team.id}
                checked={teamIds.includes(team.id)}
                onChange={(changeEvent) =>
                  setTeamIds((current) => (changeEvent.target.checked ? [...current, team.id] : current.filter((id) => id !== team.id)))
                }
              />
              {team.name}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="mt-4 block text-sm font-semibold text-club-navy">
        Piezīmes (nav obligāts)
        <textarea
          name="notes"
          rows={3}
          defaultValue={event?.notes ?? ""}
          className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
        />
      </label>

      <div className="mt-4 text-sm font-semibold text-club-navy">
        Apraksts (nav obligāts)
        <RichTextEditor
          name="description"
          label="Apraksts"
          placeholder="Ko dalībniekiem un vecākiem būtu jāzina par notikumu…"
          defaultValue={event?.description ?? ""}
          maxLength={MAX_BODY_LENGTH}
        />
        <span className="mt-1 block text-xs font-normal text-slate-400">Redzams notikuma lapā. Jauna rindkopa: Enter. Jauna rinda tajā pašā rindkopā: Shift + Enter.</span>
      </div>

      <div className="mt-4">
        <span className="block text-sm font-semibold text-club-navy">Galvenais attēls (nav obligāts)</span>
        {/* A copy starts without photos: files are not copied. */}
        {savedImage && <Image src={savedImage} alt="" width={120} height={80} className="mt-1.5 h-20 w-32 rounded-lg object-cover" />}
        <input type="file" onChange={handleImageInputChange} name="image" accept="image/*" className={FILE_INPUT_CLASS} />
        {savedImage && (
          <label className="mt-2 flex items-center gap-2 text-sm text-club-navy">
            <input type="checkbox" name="removeImage" />
            Noņemt attēlu
          </label>
        )}
      </div>

      <div className="mt-4">
        <span className="block text-sm font-semibold text-club-navy">Galerija (nav obligāta)</span>
        {savedGallery.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-2">
            {savedGallery.map((url) => <Image key={url} src={url} alt="" width={60} height={60} className="h-14 w-14 rounded-lg object-cover" />)}
          </div>
        )}
        <input type="file" onChange={handleImageInputChange} name="gallery" accept="image/*" multiple className={FILE_INPUT_CLASS} />
        <p className="mt-1 text-xs text-slate-400">Jaunu attēlu augšupielāde aizstās esošos.</p>
        {savedGallery.length > 0 && (
          <label className="mt-2 flex items-center gap-2 text-sm text-club-navy">
            <input type="checkbox" name="removeGallery" />
            Noņemt esošos attēlus
          </label>
        )}
      </div>

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

  return <FormWithPreview form={form} preview={<EventCard event={preview} borderStripe={props.hints.borderStripe} />} />;
}
