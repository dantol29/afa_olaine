"use server";

import { eq } from "drizzle-orm";
import { revalidatePath, updateTag } from "next/cache";
import { PUBLIC_CONTENT_CACHE_TAG } from "@/lib/public-data-cache";
import { redirect } from "next/navigation";

import { db } from "@/db/client";
import { coachTeams, coaches } from "@/db/schema";
import { requireAdminSession } from "@/lib/auth";
import { parseCoachInput } from "@/lib/admin-input/coaches";
import { deleteUploadedPhoto, saveUploadedPhoto } from "@/lib/uploads";

async function syncCoachTeams(coachId: number, teamIds: number[]) {
  await db.delete(coachTeams).where(eq(coachTeams.coachId, coachId));
  if (teamIds.length > 0) {
    await db.insert(coachTeams).values(teamIds.map((teamId) => ({ coachId, teamId })));
  }
}

export async function createCoach(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  await requireAdminSession();

  const parsed = parseCoachInput(formData);
  if ("error" in parsed) return parsed;

  const photo = formData.get("photo");
  let photoUrl: string | null = null;
  if (photo instanceof File && photo.size > 0) {
    try {
      photoUrl = await saveUploadedPhoto(photo, "coaches");
    } catch (error) {
      return { error: (error as Error).message };
    }
  }

  const { teamIds, ...coachFields } = parsed;
  const [inserted] = await db
    .insert(coaches)
    .values({ ...coachFields, photoUrl, createdAt: Date.now() })
    .returning({ id: coaches.id });
  await syncCoachTeams(inserted.id, teamIds);

  updateTag(PUBLIC_CONTENT_CACHE_TAG);
  revalidatePath("/admin/coaches");
  revalidatePath("/treneri");
  redirect("/admin/coaches");
}

export async function updateCoach(
  id: number,
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  await requireAdminSession();

  const parsed = parseCoachInput(formData);
  if ("error" in parsed) return parsed;

  const photo = formData.get("photo");
  const removePhoto = formData.get("removePhoto") === "on";

  const { teamIds, ...coachFields } = parsed;
  const updates: typeof coachFields & { photoUrl?: string | null } = { ...coachFields };

  if (photo instanceof File && photo.size > 0) {
    let newPhotoUrl: string;
    try {
      newPhotoUrl = await saveUploadedPhoto(photo, "coaches");
    } catch (error) {
      return { error: (error as Error).message };
    }
    const [existing] = await db
      .select({ photoUrl: coaches.photoUrl })
      .from(coaches)
      .where(eq(coaches.id, id));
    await deleteUploadedPhoto(existing?.photoUrl ?? null);
    updates.photoUrl = newPhotoUrl;
  } else if (removePhoto) {
    const [existing] = await db
      .select({ photoUrl: coaches.photoUrl })
      .from(coaches)
      .where(eq(coaches.id, id));
    await deleteUploadedPhoto(existing?.photoUrl ?? null);
    updates.photoUrl = null;
  }

  await db.update(coaches).set(updates).where(eq(coaches.id, id));
  await syncCoachTeams(id, teamIds);

  updateTag(PUBLIC_CONTENT_CACHE_TAG);
  revalidatePath("/admin/coaches");
  revalidatePath("/treneri");
  redirect("/admin/coaches");
}

export async function deleteCoach(id: number) {
  await requireAdminSession();

  const [existing] = await db
    .select({ photoUrl: coaches.photoUrl })
    .from(coaches)
    .where(eq(coaches.id, id));
  await deleteUploadedPhoto(existing?.photoUrl ?? null);

  await db.delete(coaches).where(eq(coaches.id, id));
  updateTag(PUBLIC_CONTENT_CACHE_TAG);
  revalidatePath("/admin/coaches");
  revalidatePath("/treneri");
}
