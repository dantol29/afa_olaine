"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db/client";
import { events, games, trainings } from "@/db/schema";
import { requireAdminSession } from "@/lib/auth";

export type RenameVenueState = { error?: string; renamed?: { from: string; to: string; count: number } } | undefined;

/** Writes the trainings, events and manual games at one place with another name, in one transaction. Games from
 *  LFF keep LFF's name: the LFF sync compares it and would report every renamed game as changed. */
export async function renameVenue(_previous: RenameVenueState, formData: FormData): Promise<RenameVenueState> {
  await requireAdminSession();
  const from = String(formData.get("from") ?? "");
  const to = String(formData.get("to") ?? "").trim();
  if (!from) return { error: "Nav norādīts, kuru vietu pārdēvēt." };
  if (!to) return { error: "Jāievada jaunais nosaukums." };
  if (to === from) return { error: "Jaunais nosaukums ir tāds pats kā esošais." };

  const count = await db.transaction(async (tx) => {
    const changed = await Promise.all([
      tx.update(trainings).set({ location: to }).where(eq(trainings.location, from)).returning({ id: trainings.id }),
      tx.update(events).set({ location: to }).where(eq(events.location, from)).returning({ id: events.id }),
      tx
        .update(games)
        .set({ location: to })
        .where(and(eq(games.location, from), eq(games.source, "manual")))
        .returning({ id: games.id }),
    ]);
    return changed.reduce((sum, rows) => sum + rows.length, 0);
  });
  if (count === 0) return { error: "Ar šo nosaukumu vairs nav neviena ieraksta, ko mainīt." };

  // Places show on every schedule, calendar and form.
  revalidatePath("/", "layout");
  return { renamed: { from, to, count } };
}
