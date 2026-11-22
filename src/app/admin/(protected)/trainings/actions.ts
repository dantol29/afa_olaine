"use server";

import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db/client";
import { teams, trainingCoaches, trainingTeams, trainings } from "@/db/schema";
import { requireAdminSession } from "@/lib/auth";
import { parseTrainingInput } from "@/lib/admin-input/trainings";
import { parseSimilarChangeInput, parseSimilarSelectionInput, parseTrainingScheduleInput } from "@/lib/admin-input/training-schedule";
import { findSimilarTrainings, sameTeams } from "@/lib/training-schedule";
import { loadScheduleTrainings } from "@/lib/training-schedule-server";

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function syncTrainingCoaches(tx: Transaction, trainingId: number, coachIds: number[]) {
  await tx.delete(trainingCoaches).where(eq(trainingCoaches.trainingId, trainingId));
  if (coachIds.length > 0) {
    await tx.insert(trainingCoaches).values(coachIds.map((coachId) => ({ trainingId, coachId })));
  }
}

// A training may belong to several teams at once (a shared session); the form always sends the whole set.
async function syncTrainingTeams(tx: Transaction, trainingId: number, teamIds: number[]) {
  await tx.delete(trainingTeams).where(eq(trainingTeams.trainingId, trainingId));
  await tx.insert(trainingTeams).values(teamIds.map((teamId) => ({ trainingId, teamId })));
}

/** An error when a ticked team no longer exists (deleted in another tab), before anything is written. */
async function missingTeamError(teamIds: number[]): Promise<{ error: string } | null> {
  const found = await db.select({ id: teams.id }).from(teams).where(inArray(teams.id, teamIds));
  return found.length === teamIds.length ? null : { error: "Kāda no izvēlētajām komandām vairs nav atrodama." };
}

export async function createTraining(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  await requireAdminSession();

  const parsed = parseTrainingInput(formData);
  if ("error" in parsed) return parsed;

  const { teamIds, coachIds, ...trainingFields } = parsed;
  const missing = await missingTeamError(teamIds);
  if (missing) return missing;
  await db.transaction(async (tx) => {
    const [inserted] = await tx
      .insert(trainings)
      .values({ ...trainingFields, createdAt: Date.now() })
      .returning({ id: trainings.id });
    await syncTrainingTeams(tx, inserted.id, teamIds);
    await syncTrainingCoaches(tx, inserted.id, coachIds);
  });

  revalidatePath("/admin/trainings");
  revalidatePath("/trenini");
  redirect("/admin/trainings");
}

export async function updateTraining(
  id: number,
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  await requireAdminSession();

  const parsed = parseTrainingInput(formData);
  if ("error" in parsed) return parsed;

  const { teamIds, coachIds, ...trainingFields } = parsed;
  const missing = await missingTeamError(teamIds);
  if (missing) return missing;
  await db.transaction(async (tx) => {
    await tx.update(trainings).set(trainingFields).where(eq(trainings.id, id));
    await syncTrainingTeams(tx, id, teamIds);
    await syncTrainingCoaches(tx, id, coachIds);
  });

  revalidatePath("/admin/trainings");
  revalidatePath("/trenini");
  redirect("/admin/trainings");
}

export async function deleteTraining(id: number) {
  await requireAdminSession();

  await db.delete(trainings).where(eq(trainings.id, id));
  revalidatePath("/admin/trainings");
  revalidatePath("/trenini");
}

/** Creates one training per ticked date of a weekly schedule, all or none. */
export async function createTrainingSchedule(_prevState: { error?: string } | undefined, formData: FormData) {
  await requireAdminSession();

  const parsed = parseTrainingScheduleInput(formData);
  if ("error" in parsed) return parsed;

  const { teamIds, coachIds, dates, ...trainingFields } = parsed;
  const missing = await missingTeamError(teamIds);
  if (missing) return missing;
  const createdAt = Date.now();
  await db.transaction(async (tx) => {
    for (const date of dates) {
      const [inserted] = await tx
        .insert(trainings)
        .values({ ...trainingFields, date, createdAt })
        .returning({ id: trainings.id });
      await syncTrainingTeams(tx, inserted.id, teamIds);
      await syncTrainingCoaches(tx, inserted.id, coachIds);
    }
  });

  revalidatePath("/admin/trainings");
  revalidatePath("/trenini");
  redirect("/admin/trainings");
}

/** The ticked ids, if every one is still a repeat of the source training up to the until-date; whatever ids the page
 *  sent, only such trainings are changed or deleted. */
async function checkedSimilarIds(sourceId: number, until: string, ids: number[]): Promise<{ ids: number[]; sourceTeamIds: number[] } | { error: string }> {
  const all = await loadScheduleTrainings();
  const source = all.find((training) => training.id === sourceId);
  if (!source) return { error: "Treniņš vairs nav atrasts." };
  const allowed = new Set(findSimilarTrainings(source, until, all).map((training) => training.id));
  if (!ids.every((id) => allowed.has(id))) return { error: "Saraksts ir mainījies. Atver treniņu vēlreiz un pārbaudi." };
  return { ids, sourceTeamIds: source.teamIds };
}

/** Moves the ticked repeats of a training to a new time and/or place, and/or gives them another set of teams. */
export async function changeSimilarTrainings(
  sourceId: number,
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  await requireAdminSession();

  const parsed = parseSimilarChangeInput(formData);
  if ("error" in parsed) return parsed;
  const checked = await checkedSimilarIds(sourceId, parsed.until, parsed.ids);
  if ("error" in checked) return checked;
  const teamsChange = !sameTeams(parsed.teamIds, checked.sourceTeamIds);
  if (!teamsChange && Object.keys(parsed.changes).length === 0) return { error: "Norādi jauno laiku, vietu vai komandas." };
  if (teamsChange) {
    const missing = await missingTeamError(parsed.teamIds);
    if (missing) return missing;
  }

  await db.transaction(async (tx) => {
    if (Object.keys(parsed.changes).length > 0) await tx.update(trainings).set(parsed.changes).where(inArray(trainings.id, checked.ids));
    if (teamsChange) for (const id of checked.ids) await syncTrainingTeams(tx, id, parsed.teamIds);
  });
  revalidatePath("/admin/trainings");
  revalidatePath("/trenini");
  redirect("/admin/trainings");
}

/** Deletes the ticked repeats of a training. */
export async function deleteSimilarTrainings(
  sourceId: number,
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  await requireAdminSession();

  const parsed = parseSimilarSelectionInput(formData);
  if ("error" in parsed) return parsed;
  const checked = await checkedSimilarIds(sourceId, parsed.until, parsed.ids);
  if ("error" in checked) return checked;

  await db.delete(trainings).where(inArray(trainings.id, checked.ids));
  revalidatePath("/admin/trainings");
  revalidatePath("/trenini");
  redirect("/admin/trainings");
}
