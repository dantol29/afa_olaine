"use server";

import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db/client";
import { trainingCoaches, trainingTeams, trainings } from "@/db/schema";
import { requireAdminSession } from "@/lib/auth";
import { parseTrainingInput } from "@/lib/admin-input/trainings";
import { parseSimilarDeleteInput, parseTrainingScheduleInput } from "@/lib/admin-input/training-schedule";
import { findSimilarTrainings } from "@/lib/training-schedule";
import { loadScheduleTrainings } from "@/lib/training-schedule-server";

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function syncTrainingCoaches(tx: Transaction, trainingId: number, coachIds: number[]) {
  await tx.delete(trainingCoaches).where(eq(trainingCoaches.trainingId, trainingId));
  if (coachIds.length > 0) {
    await tx.insert(trainingCoaches).values(coachIds.map((coachId) => ({ trainingId, coachId })));
  }
}

// The form picks one team; the shared schema allows several per training.
async function syncTrainingTeam(tx: Transaction, trainingId: number, teamId: number) {
  await tx.delete(trainingTeams).where(eq(trainingTeams.trainingId, trainingId));
  await tx.insert(trainingTeams).values({ trainingId, teamId });
}

export async function createTraining(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  await requireAdminSession();

  const parsed = parseTrainingInput(formData);
  if ("error" in parsed) return parsed;

  const { teamId, coachIds, ...trainingFields } = parsed;
  await db.transaction(async (tx) => {
    const [inserted] = await tx
      .insert(trainings)
      .values({ ...trainingFields, createdAt: Date.now() })
      .returning({ id: trainings.id });
    await syncTrainingTeam(tx, inserted.id, teamId);
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

  const { teamId, coachIds, ...trainingFields } = parsed;
  await db.transaction(async (tx) => {
    await tx.update(trainings).set(trainingFields).where(eq(trainings.id, id));
    await syncTrainingTeam(tx, id, teamId);
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

  const { teamId, coachIds, dates, ...trainingFields } = parsed;
  const createdAt = Date.now();
  await db.transaction(async (tx) => {
    for (const date of dates) {
      const [inserted] = await tx
        .insert(trainings)
        .values({ ...trainingFields, date, createdAt })
        .returning({ id: trainings.id });
      await syncTrainingTeam(tx, inserted.id, teamId);
      await syncTrainingCoaches(tx, inserted.id, coachIds);
    }
  });

  revalidatePath("/admin/trainings");
  revalidatePath("/trenini");
  redirect("/admin/trainings");
}

/** Deletes the ticked repeats of a training. Only trainings that are still its repeats up to the until-date are
 *  deleted, whatever ids the page sent. */
export async function deleteSimilarTrainings(
  sourceId: number,
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  await requireAdminSession();

  const parsed = parseSimilarDeleteInput(formData);
  if ("error" in parsed) return parsed;

  const all = await loadScheduleTrainings();
  const source = all.find((training) => training.id === sourceId);
  if (!source) return { error: "Treniņš vairs nav atrasts." };
  const allowed = new Set(findSimilarTrainings(source, parsed.until, all).map((training) => training.id));
  const ids = parsed.ids.filter((id) => allowed.has(id));
  if (ids.length !== parsed.ids.length) return { error: "Saraksts ir mainījies. Atver treniņu vēlreiz un pārbaudi." };

  await db.delete(trainings).where(inArray(trainings.id, ids));
  revalidatePath("/admin/trainings");
  revalidatePath("/trenini");
  redirect("/admin/trainings");
}
