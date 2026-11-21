"use server";

import { eq, max } from "drizzle-orm";
import { revalidatePath, updateTag } from "next/cache";
import { PUBLIC_CONTENT_CACHE_TAG } from "@/lib/public-data-cache";
import { redirect } from "next/navigation";

import { db } from "@/db/client";
import { teams } from "@/db/schema";
import { requireAdminSession } from "@/lib/auth";
import { parseTeamOrder } from "@/lib/admin-input/team-order";
import { deleteUploadedPhoto, saveUploadedPhoto } from "@/lib/uploads";

function teamPhoto(formData: FormData) {
  const value = formData.get("groupPhoto");
  return value instanceof File && value.size > 0 ? value : null;
}

export async function createTeam(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  await requireAdminSession();

  const name = String(formData.get("name") ?? "").trim();
  const isMain = formData.get("isMain") === "on";
  if (!name) return { error: "Nosaukums ir obligāts." };

  let groupPhotoUrl: string | null = null;
  try {
    const photo = teamPhoto(formData);
    if (photo) groupPhotoUrl = await saveUploadedPhoto(photo, "clubs");
    await db.transaction(async (tx) => {
      if (isMain) await tx.update(teams).set({ isMain: false }).where(eq(teams.isMain, true));
      // A new team goes to the end of the display order instead of jumping ahead of teams already ordered.
      const [{ lastSort }] = await tx.select({ lastSort: max(teams.sort) }).from(teams);
      await tx.insert(teams).values({ name, groupPhotoUrl, isMain, sort: (lastSort ?? -1) + 1, createdAt: Date.now() });
    });
  } catch (error) {
    await deleteUploadedPhoto(groupPhotoUrl);
    return { error: error instanceof Error ? error.message : "Komandu neizdevās saglabāt." };
  }
  updateTag(PUBLIC_CONTENT_CACHE_TAG);
  revalidatePath("/admin/teams");
  revalidatePath("/komanda");
  revalidatePath("/sitemap.xml");
  revalidatePath("/akademija");
  revalidatePath("/");
  redirect("/admin/teams");
}

export async function updateTeam(
  id: number,
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  await requireAdminSession();

  const name = String(formData.get("name") ?? "").trim();
  const isMain = formData.get("isMain") === "on";
  if (!name) return { error: "Nosaukums ir obligāts." };

  const [existing] = await db.select().from(teams).where(eq(teams.id, id));
  if (!existing) return { error: "Komanda nav atrasta." };
  let groupPhotoUrl = existing.groupPhotoUrl;
  let uploadedPhotoUrl: string | null = null;
  try {
    const photo = teamPhoto(formData);
    if (photo) {
      uploadedPhotoUrl = await saveUploadedPhoto(photo, "clubs");
      groupPhotoUrl = uploadedPhotoUrl;
    } else if (formData.get("removeGroupPhoto") === "on") {
      groupPhotoUrl = null;
    }
    await db.transaction(async (tx) => {
      if (isMain) await tx.update(teams).set({ isMain: false }).where(eq(teams.isMain, true));
      await tx.update(teams).set({ name, groupPhotoUrl, isMain }).where(eq(teams.id, id));
    });
  } catch (error) {
    await deleteUploadedPhoto(uploadedPhotoUrl);
    return { error: error instanceof Error ? error.message : "Komandu neizdevās saglabāt." };
  }
  if (groupPhotoUrl !== existing.groupPhotoUrl) await deleteUploadedPhoto(existing.groupPhotoUrl);
  updateTag(PUBLIC_CONTENT_CACHE_TAG);
  revalidatePath("/admin/teams");
  revalidatePath("/komanda");
  revalidatePath("/sitemap.xml");
  revalidatePath("/akademija");
  revalidatePath("/");
  redirect("/admin/teams");
}

export async function deleteTeam(id: number) {
  await requireAdminSession();

  const [existing] = await db.select().from(teams).where(eq(teams.id, id));
  await db.delete(teams).where(eq(teams.id, id));
  await deleteUploadedPhoto(existing?.groupPhotoUrl ?? null);
  updateTag(PUBLIC_CONTENT_CACHE_TAG);
  revalidatePath("/admin/teams");
  revalidatePath("/komanda");
  revalidatePath("/sitemap.xml");
  revalidatePath("/akademija");
}

/** Saves the display order of all teams from the admin team list in one request. */
export async function saveTeamOrder(teamIds: number[]): Promise<{ error?: string }> {
  await requireAdminSession();

  const currentTeams = await db.select({ id: teams.id }).from(teams);
  const parsed = parseTeamOrder(teamIds, currentTeams.map((team) => team.id));
  if ("error" in parsed) return parsed;

  try {
    await db.transaction(async (tx) => {
      for (const [position, id] of parsed.teamIds.entries()) {
        await tx.update(teams).set({ sort: position }).where(eq(teams.id, id));
      }
    });
  } catch {
    return { error: "Secību neizdevās saglabāt." };
  }
  updateTag(PUBLIC_CONTENT_CACHE_TAG);
  revalidatePath("/admin/teams");
  revalidatePath("/akademija");
  revalidatePath("/sitemap.xml");
  revalidatePath("/speles");
  revalidatePath("/");
  return {};
}
