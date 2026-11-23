"use server";

import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db/client";
import { eventTeams, events, teams } from "@/db/schema";
import { requireAdminSession } from "@/lib/auth";
import { parseEventInput } from "@/lib/admin-input/events";

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

// The form always sends the whole set of ticked teams; none means the whole club.
async function syncEventTeams(tx: Transaction, eventId: number, teamIds: number[]) {
  await tx.delete(eventTeams).where(eq(eventTeams.eventId, eventId));
  if (teamIds.length > 0) await tx.insert(eventTeams).values(teamIds.map((teamId) => ({ eventId, teamId })));
}

/** An error when a ticked team no longer exists (deleted in another tab), before anything is written. */
async function missingTeamError(teamIds: number[]): Promise<{ error: string } | null> {
  if (teamIds.length === 0) return null;
  const found = await db.select({ id: teams.id }).from(teams).where(inArray(teams.id, teamIds));
  return found.length === teamIds.length ? null : { error: "Kāda no izvēlētajām komandām vairs nav atrodama." };
}

/** Events show on the homepage block and /speles together with games, so those refresh with the admin list. */
function revalidateEventPages() {
  revalidatePath("/admin/events");
  revalidatePath("/");
  revalidatePath("/speles");
}

export async function createEvent(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  await requireAdminSession();

  const parsed = parseEventInput(formData);
  if ("error" in parsed) return parsed;

  const { teamIds, ...eventFields } = parsed;
  const missing = await missingTeamError(teamIds);
  if (missing) return missing;
  await db.transaction(async (tx) => {
    const [inserted] = await tx.insert(events).values({ ...eventFields, createdAt: Date.now() }).returning({ id: events.id });
    await syncEventTeams(tx, inserted.id, teamIds);
  });
  revalidateEventPages();
  redirect("/admin/events");
}

export async function updateEvent(
  id: number,
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  await requireAdminSession();

  const parsed = parseEventInput(formData);
  if ("error" in parsed) return parsed;

  const { teamIds, ...eventFields } = parsed;
  const missing = await missingTeamError(teamIds);
  if (missing) return missing;
  await db.transaction(async (tx) => {
    await tx.update(events).set(eventFields).where(eq(events.id, id));
    await syncEventTeams(tx, id, teamIds);
  });
  revalidateEventPages();
  redirect("/admin/events");
}

export async function deleteEvent(id: number) {
  await requireAdminSession();

  await db.delete(events).where(eq(events.id, id));
  revalidateEventPages();
}
