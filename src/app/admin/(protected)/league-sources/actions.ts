"use server";

import { eq } from "drizzle-orm";
import { revalidatePath, updateTag } from "next/cache";
import { PUBLIC_CONTENT_CACHE_TAG } from "@/lib/public-data-cache";
import { redirect } from "next/navigation";

import { db } from "@/db/client";
import { leagueSources } from "@/db/schema";
import { requireAdminSession } from "@/lib/auth";
import { parseLeagueSourceInput } from "@/lib/admin-input/league-sources";
import { deleteUploadedPhoto, saveUploadedPhoto } from "@/lib/uploads";

export async function createLeagueSource(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  await requireAdminSession();

  const parsed = parseLeagueSourceInput(formData);
  if ("error" in parsed) return parsed;

  const logo = formData.get("logo");
  let logoUrl: string | null = null;
  if (logo instanceof File && logo.size > 0) {
    try {
      logoUrl = await saveUploadedPhoto(logo, "leagues");
    } catch (error) {
      return { error: (error as Error).message };
    }
  }
  try {
    await db.insert(leagueSources).values({ ...parsed, logoUrl, createdAt: Date.now() });
  } catch (error) {
    await deleteUploadedPhoto(logoUrl);
    throw error;
  }
  updateTag(PUBLIC_CONTENT_CACHE_TAG);
  revalidatePath("/admin/league-sources");
  revalidatePath("/");
  revalidatePath("/speles");
  redirect("/admin/league-sources");
}

export async function updateLeagueSource(
  id: number,
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  await requireAdminSession();

  const parsed = parseLeagueSourceInput(formData);
  if ("error" in parsed) return parsed;

  const [existing] = await db.select().from(leagueSources).where(eq(leagueSources.id, id));
  if (!existing) return { error: "Līgas avots nav atrasts." };

  const logo = formData.get("logo");
  let logoUrl = existing.logoUrl;
  let uploadedLogo: string | null = null;
  if (logo instanceof File && logo.size > 0) {
    try {
      uploadedLogo = await saveUploadedPhoto(logo, "leagues");
      logoUrl = uploadedLogo;
    } catch (error) {
      return { error: (error as Error).message };
    }
  } else if (formData.get("removeLogo") === "on") {
    logoUrl = null;
  }

  try {
    await db.update(leagueSources).set({ ...parsed, logoUrl }).where(eq(leagueSources.id, id));
  } catch (error) {
    await deleteUploadedPhoto(uploadedLogo);
    throw error;
  }
  if (logoUrl !== existing.logoUrl) await deleteUploadedPhoto(existing.logoUrl);
  updateTag(PUBLIC_CONTENT_CACHE_TAG);
  revalidatePath("/admin/league-sources");
  revalidatePath(`/admin/league-sources/${id}`);
  revalidatePath("/");
  revalidatePath("/speles");
  redirect("/admin/league-sources");
}

export async function deleteLeagueSource(id: number) {
  await requireAdminSession();

  const [existing] = await db.select({ logoUrl: leagueSources.logoUrl }).from(leagueSources).where(eq(leagueSources.id, id));
  await db.delete(leagueSources).where(eq(leagueSources.id, id));
  await deleteUploadedPhoto(existing?.logoUrl ?? null);
  updateTag(PUBLIC_CONTENT_CACHE_TAG);
  revalidatePath("/admin/league-sources");
  revalidatePath("/");
  revalidatePath("/speles");
}
