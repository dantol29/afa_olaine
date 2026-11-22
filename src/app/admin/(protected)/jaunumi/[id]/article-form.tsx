"use client";

import Image from "next/image";
import { useActionState, useState } from "react";

import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { articleBodyToEditorHtml } from "@/lib/article-body";
import { handleImageInputChange } from "@/lib/client-image-resize";
import { MAX_BODY_LENGTH } from "@/lib/content-limits";
import { useUnsavedChangesGuard } from "@/components/admin/unsaved-changes";
import { createArticle, updateArticle } from "../actions";
import { DateField } from "@/components/admin/date-field";

const CATEGORIES = ["Klubs", "Komandas", "Spēles", "Treniņi", "Pasākumi"] as const;

type Article = {
  id: number;
  title: string;
  excerpt: string;
  date: string;
  category: (typeof CATEGORIES)[number];
  teamId: number | null;
  authorCoachId: number | null;
  image: string;
  body: string;
  highlights: string | null;
};
type TeamOption = { id: number; name: string };
type CoachOption = { id: number; name: string };

export function ArticleForm(
  props:
    | { mode: "create"; teamOptions: TeamOption[]; coachOptions: CoachOption[] }
    | { mode: "edit"; article: Article; teamOptions: TeamOption[]; coachOptions: CoachOption[] },
) {
  const action =
    props.mode === "create" ? createArticle : updateArticle.bind(null, props.article.id);
  const [state, formAction, pending] = useActionState(action, undefined);
  const unsavedFormRef = useUnsavedChangesGuard(pending, state);
  const article = props.mode === "edit" ? props.article : null;
  const [date, setDate] = useState(article?.date ?? "");

  const highlightUrls = article?.highlights?.split("\n").filter(Boolean) ?? [];

  return (
    <form ref={unsavedFormRef} action={formAction} className="max-w-2xl">
      <h1 className="mb-6 text-2xl font-extrabold text-club-navy">
        {props.mode === "create" ? "Jauns raksts" : "Rediģēt rakstu"}
      </h1>

      <label className="block text-sm font-semibold text-club-navy">
        Virsraksts
        <input
          type="text"
          name="title"
          required
          defaultValue={article?.title ?? ""}
          className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
        />
      </label>

      <label className="mt-4 block text-sm font-semibold text-club-navy">
        Ievads
        <textarea
          name="excerpt"
          required
          rows={2}
          defaultValue={article?.excerpt ?? ""}
          className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
        />
      </label>

      <div className="mt-4 flex gap-4">
        <DateField name="date" label="Datums" required value={date} onChange={setDate} className="flex-1" />

        <label className="block flex-1 text-sm font-semibold text-club-navy">
          Kategorija
          <select
            name="category"
            required
            defaultValue={article?.category ?? ""}
            className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
          >
            <option value="" disabled>
              Izvēlies...
            </option>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="mt-4 block text-sm font-semibold text-club-navy">
        Komanda (nav obligāts)
        <select
          name="teamId"
          defaultValue={article?.teamId ?? ""}
          className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
        >
          <option value="">—</option>
          {props.teamOptions.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
      </label>

      <label className="mt-4 block text-sm font-semibold text-club-navy">
        Autors (nav obligāts)
        <select
          name="authorCoachId"
          defaultValue={article?.authorCoachId ?? ""}
          className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
        >
          <option value="">—</option>
          {props.coachOptions.map((coach) => (
            <option key={coach.id} value={coach.id}>
              {coach.name}
            </option>
          ))}
        </select>
        <p className="mt-1.5 text-xs text-slate-400">
          Autora vārds un foto rakstā tiek ņemti no izvēlētā trenera profila.
        </p>
      </label>

      <div className="mt-4">
        <span className="block text-sm font-semibold text-club-navy">Attēls</span>
        {article?.image && (
          <Image
            src={article.image}
            alt={article.title}
            width={120}
            height={80}
            className="mt-1.5 h-20 w-32 rounded-lg object-cover"
          />
        )}
        <input
          type="file"
          onChange={handleImageInputChange}
          name="image"
          accept="image/*"
          required={props.mode === "create"}
          className="mt-1.5 block w-full text-sm text-club-navy file:mr-3 file:rounded-lg file:border-0 file:bg-club-gray-light file:px-3 file:py-2 file:text-sm file:font-semibold file:text-club-navy hover:file:bg-slate-200"
        />
      </div>

      <div className="mt-4 text-sm font-semibold text-club-navy">
        Raksta teksts
        <RichTextEditor
          name="body"
          label="Raksta teksts"
          placeholder="Raksti ziņas tekstu…"
          defaultValue={articleBodyToEditorHtml(article?.body ?? "")}
          maxLength={MAX_BODY_LENGTH}
          requiredMessage="Raksta teksts ir obligāts."
        />
        <span className="mt-1 block text-xs font-normal text-slate-400">Jauna rindkopa: Enter. Jauna rinda tajā pašā rindkopā: Shift + Enter.</span>
      </div>

      <div className="mt-4">
        <span className="block text-sm font-semibold text-club-navy">
          Galerija (nav obligāts)
        </span>
        {highlightUrls.length > 0 && (
          <div className="mt-1.5 flex gap-2">
            {highlightUrls.map((url) => (
              <Image
                key={url}
                src={url}
                alt=""
                width={60}
                height={60}
                className="h-14 w-14 rounded-lg object-cover"
              />
            ))}
          </div>
        )}
        <input
          type="file"
          onChange={handleImageInputChange}
          name="highlights"
          accept="image/*"
          multiple
          className="mt-1.5 block w-full text-sm text-club-navy file:mr-3 file:rounded-lg file:border-0 file:bg-club-gray-light file:px-3 file:py-2 file:text-sm file:font-semibold file:text-club-navy hover:file:bg-slate-200"
        />
        <p className="mt-1 text-xs text-slate-400">Jaunu attēlu augšupielāde aizstās esošos.</p>
        {highlightUrls.length > 0 && (
          <label className="mt-2 flex items-center gap-2 text-sm text-club-navy">
            <input type="checkbox" name="removeHighlights" />
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
    </form>
  );
}
