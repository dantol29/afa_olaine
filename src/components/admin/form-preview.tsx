import Image from "next/image";
import type { ReactNode } from "react";

import type { ClubHint } from "@/lib/admin-preview";
import { clubDisplay } from "@/lib/games";
import { cn } from "@/lib/utils";

/** An admin form with the public card it will produce: beside the form on wide screens, under it on narrow ones.
 *  The card does not follow the scroll: the admin main area scrolls sideways for wide tables, which stops sticky. */
export function FormWithPreview({ form, preview }: { form: ReactNode; preview: ReactNode }) {
  return (
    <div className="grid items-start gap-10 xl:grid-cols-[28rem_minmax(0,26rem)]">
      {form}
      <aside aria-label="Priekšskatījums" className="max-w-md">
        <h2 className="mb-3 text-sm font-semibold text-slate-500">Kā izskatīsies vietnē</h2>
        <div className="admin-card-preview">{preview}</div>
      </aside>
    </div>
  );
}

/** The club's logo, or its initials badge, before a club name in a suggestion list. */
export function ClubSuggestionIcon({ name, clubs }: { name: string; clubs: ReadonlyMap<string, ClubHint> }) {
  const club = clubDisplay(name, clubs.get(name)?.logo ?? null);
  if (club.logo) return <Image src={club.logo} alt="" width={20} height={20} className="h-5 w-5 shrink-0 object-contain" />;
  return (
    // In the card's site colors, so the badge in the list matches the one on the card.
    <span aria-hidden="true" className={cn("admin-card-preview flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[8px] font-extrabold text-white", club.color)}>
      {club.initials}
    </span>
  );
}
