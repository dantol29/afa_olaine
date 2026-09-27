"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db/client";
import { teams } from "@/db/schema";
import { requireAdminSession } from "@/lib/auth";
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
  if (!name) return { error: "Nosaukums ir obligāts." };

  let groupPhotoUrl: string | null = null;
  try {
    const photo = teamPhoto(formData);
    if (photo) groupPhotoUrl = await saveUploadedPhoto(photo, "clubs");
    await db.insert(teams).values({ name, groupPhotoUrl, createdAt: Date.now() });
  } catch (error) {
    await deleteUploadedPhoto(groupPhotoUrl);
    return { error: error instanceof Error ? error.message : "Komandu neizdevās saglabāt." };
  }
  revalidatePath("/admin/teams");
  revalidatePath("/komandas");
  revalidatePath("/akademija");
  redirect("/admin/teams");
}

export async function updateTeam(
  id: number,
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  await requireAdminSession();

  const name = String(formData.get("name") ?? "").trim();
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
    await db.update(teams).set({ name, groupPhotoUrl }).where(eq(teams.id, id));
  } catch (error) {
    await deleteUploadedPhoto(uploadedPhotoUrl);
    return { error: error instanceof Error ? error.message : "Komandu neizdevās saglabāt." };
  }
  if (groupPhotoUrl !== existing.groupPhotoUrl) await deleteUploadedPhoto(existing.groupPhotoUrl);
  revalidatePath("/admin/teams");
  revalidatePath("/komandas");
  revalidatePath("/akademija");
  redirect("/admin/teams");
}

export async function deleteTeam(id: number) {
  await requireAdminSession();

  const [existing] = await db.select().from(teams).where(eq(teams.id, id));
  await db.delete(teams).where(eq(teams.id, id));
  await deleteUploadedPhoto(existing?.groupPhotoUrl ?? null);
  revalidatePath("/admin/teams");
  revalidatePath("/komandas");
  revalidatePath("/akademija");
}
