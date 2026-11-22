"use client";

import Image from "next/image";
import { useActionState, useState } from "react";

import { SuggestInput } from "@/components/admin/suggest-input";
import { useUnsavedChangesGuard } from "@/components/admin/unsaved-changes";
import { afaCount, type VenueUsage } from "@/lib/venue-names";

import { renameVenue } from "./actions";

const LOGO_SIZE = 18;

function plural(count: number, one: string, many: string) {
  return `${count} ${count % 10 === 1 && count % 100 !== 11 ? one : many}`;
}

function usageText(usage: VenueUsage): string {
  const parts = [
    usage.trainings > 0 && plural(usage.trainings, "treniņš", "treniņi"),
    usage.games > 0 && plural(usage.games, "spēle", "spēles"),
    usage.events > 0 && plural(usage.events, "notikums", "notikumi"),
    usage.lffGames > 0 && `🔒 ${plural(usage.lffGames, "LFF spēle", "LFF spēles")}`,
  ].filter(Boolean);
  return parts.join(", ");
}

function renamableCount(usage: VenueUsage) {
  return usage.trainings + usage.games + usage.events;
}

/** The place names in groups of similar ones, each with where it is used and, for AFA's, a way to rename it. */
export function VenueGroups({ groups }: { groups: VenueUsage[][] }) {
  const allNames = groups.flat().map((usage) => usage.name);
  return (
    <div className="mt-6 space-y-4">
      {groups.map((group) => (
        <section key={group[0].name} className="rounded-xl bg-white shadow-sm">
          {group.length > 1 && (
            <p className="border-b border-slate-100 px-4 pt-3 pb-2 text-xs font-semibold text-amber-600">
              Līdzīgi nosaukumi — varbūt tā ir viena vieta?
            </p>
          )}
          <ul className="divide-y divide-slate-100 text-sm">
            {group.map((usage) => (
              <VenueRow key={usage.name} usage={usage} suggestion={group.find((other) => other.name !== usage.name)?.name ?? ""} names={allNames} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function VenueRow({ usage, suggestion, names }: { usage: VenueUsage; suggestion: string; names: string[] }) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [to, setTo] = useState(suggestion);
  const [state, action, pending] = useActionState(renameVenue, undefined);
  const unsavedFormRef = useUnsavedChangesGuard(pending, state);
  const count = renamableCount(usage);

  if (state?.renamed) {
    return (
      <li className="px-4 py-3 text-emerald-600">
        Pārdēvēts: „{state.renamed.from}” → „{state.renamed.to}” ({state.renamed.count} ieraksti).
      </li>
    );
  }

  return (
    <li className="px-4 py-3 text-club-navy">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="flex w-10 shrink-0 gap-1">
          {afaCount(usage) > 0 && <Image src="/afaolaine-logo.png" alt="AFA" width={LOGO_SIZE} height={LOGO_SIZE} className="object-contain" />}
          {usage.fk > 0 && <Image src="/fk-olaine-crest.png" alt="FK" width={LOGO_SIZE} height={LOGO_SIZE} className="object-contain" />}
        </span>
        <span className="min-w-0 flex-1 font-semibold">{usage.name}</span>
        {count > 0 && !isRenaming && (
          <button type="button" onClick={() => setIsRenaming(true)} className="shrink-0 font-semibold text-club-red hover:underline">
            Pārdēvēt…
          </button>
        )}
      </div>
      <p className="mt-0.5 pl-13 text-xs text-slate-500">
        {[afaCount(usage) > 0 && `AFA: ${usageText(usage)}`, usage.fk > 0 && `FK: ${plural(usage.fk, "ieraksts", "ieraksti")}`].filter(Boolean).join(" · ")}
      </p>
      {isRenaming && (
        <form
          ref={unsavedFormRef}
          action={action}
          onSubmit={(event) => {
            if (!window.confirm(`Pārdēvēt „${usage.name}” uz „${to.trim()}” ${plural(count, "AFA ierakstam", "AFA ierakstiem")}?`)) event.preventDefault();
          }}
          className="mt-2 flex flex-wrap items-end gap-3 pl-13"
        >
          <input type="hidden" name="from" value={usage.name} />
          <SuggestInput name="to" label="Jaunais nosaukums" required value={to} onChange={setTo} options={names.filter((name) => name !== usage.name)} className="min-w-64 flex-1" />
          <button
            type="submit"
            disabled={pending || !to.trim() || to.trim() === usage.name}
            className="rounded-lg bg-club-red px-4 py-2 text-sm font-semibold text-white transition hover:bg-club-red-dark disabled:opacity-50"
          >
            {pending ? "Saglabā..." : `Pārdēvēt (${count})`}
          </button>
          <button type="button" onClick={() => setIsRenaming(false)} className="py-2 text-sm font-semibold text-slate-500 hover:text-club-navy">
            Atcelt
          </button>
          {state?.error && <p className="basis-full text-sm font-semibold text-club-red">{state.error}</p>}
          {usage.lffGames > 0 && <p className="basis-full text-xs text-slate-500">LFF spēles ({usage.lffGames}) paliks ar šo nosaukumu.</p>}
        </form>
      )}
    </li>
  );
}
