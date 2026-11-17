"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db/client";
import { trainingCoaches, trainingTeams, trainings } from "@/db/schema";
import { requireAdminSession } from "@/lib/auth";
import { parseTrainingInput } from "@/lib/admin-input/trainings";

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
