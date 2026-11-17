"use server";

import { eq } from "drizzle-orm";
import { revalidatePath, updateTag } from "next/cache";
import { PUBLIC_CONTENT_CACHE_TAG } from "@/lib/public-data-cache";
import { redirect } from "next/navigation";

import { db } from "@/db/client";
import { playerTeams, players } from "@/db/schema";
import { requireAdminSession } from "@/lib/auth";
import { parsePlayerInput } from "@/lib/admin-input/players";
import { deleteUploadedPhoto, saveUploadedPhoto } from "@/lib/uploads";

async function syncPlayerTeams(playerId: number, teamGoals: Map<number, number>) {
  await db.delete(playerTeams).where(eq(playerTeams.playerId, playerId));
  if (teamGoals.size > 0) {
    await db.insert(playerTeams).values(
      [...teamGoals.entries()].map(([teamId, goals]) => ({ playerId, teamId, goals })),
    );
  }
}

export async function createPlayer(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  await requireAdminSession();

  const parsed = parsePlayerInput(formData);
  if ("error" in parsed) return parsed;

  const photo = formData.get("photo");
  let photoUrl: string | null = null;
  if (photo instanceof File && photo.size > 0) {
    try {
      photoUrl = await saveUploadedPhoto(photo, "players");
    } catch (error) {
      return { error: (error as Error).message };
    }
  }

  const { teamGoals, ...playerFields } = parsed;
  const [inserted] = await db
    .insert(players)
    .values({ ...playerFields, photoUrl, createdAt: Date.now() })
    .returning({ id: players.id });
  await syncPlayerTeams(inserted.id, teamGoals);

  revalidatePath("/komanda/speletaji/[id]", "page");
  updateTag(PUBLIC_CONTENT_CACHE_TAG);
  revalidatePath("/admin/players");
  revalidatePath("/komanda");
  revalidatePath("/akademija");
  revalidatePath("/sitemap.xml");
  revalidatePath("/");
  redirect("/admin/players");
}

export async function updatePlayer(
  id: number,
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  await requireAdminSession();

  const parsed = parsePlayerInput(formData);
  if ("error" in parsed) return parsed;

  const photo = formData.get("photo");
  const removePhoto = formData.get("removePhoto") === "on";

  const { teamGoals, ...playerFields } = parsed;
  const updates: typeof playerFields & { photoUrl?: string | null } = { ...playerFields };

  if (photo instanceof File && photo.size > 0) {
    let newPhotoUrl: string;
    try {
      newPhotoUrl = await saveUploadedPhoto(photo, "players");
    } catch (error) {
      return { error: (error as Error).message };
    }
    const [existing] = await db
      .select({ photoUrl: players.photoUrl })
      .from(players)
      .where(eq(players.id, id));
    await deleteUploadedPhoto(existing?.photoUrl ?? null);
    updates.photoUrl = newPhotoUrl;
  } else if (removePhoto) {
    const [existing] = await db
      .select({ photoUrl: players.photoUrl })
      .from(players)
      .where(eq(players.id, id));
    await deleteUploadedPhoto(existing?.photoUrl ?? null);
    updates.photoUrl = null;
  }

  await db.update(players).set(updates).where(eq(players.id, id));
  await syncPlayerTeams(id, teamGoals);

  revalidatePath("/komanda/speletaji/[id]", "page");
  updateTag(PUBLIC_CONTENT_CACHE_TAG);
  revalidatePath("/admin/players");
  revalidatePath("/komanda");
  revalidatePath("/akademija");
  revalidatePath("/sitemap.xml");
  revalidatePath("/");
  redirect("/admin/players");
}

export async function deletePlayer(id: number) {
  await requireAdminSession();

  const [existing] = await db
    .select({ photoUrl: players.photoUrl })
    .from(players)
    .where(eq(players.id, id));
  await deleteUploadedPhoto(existing?.photoUrl ?? null);

  await db.delete(players).where(eq(players.id, id));
  revalidatePath("/komanda/speletaji/[id]", "page");
  updateTag(PUBLIC_CONTENT_CACHE_TAG);
  revalidatePath("/admin/players");
  revalidatePath("/komanda");
  revalidatePath("/akademija");
  revalidatePath("/sitemap.xml");
  revalidatePath("/");
}
