"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db/client";
import { leagueSources } from "@/db/schema";
import { requireAdminSession } from "@/lib/auth";
import { deleteUploadedPhoto, saveUploadedPhoto } from "@/lib/uploads";

function parseLeagueSourceInput(formData: FormData) {
  const teamId = Number(formData.get("teamId"));
  const label = String(formData.get("label") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();
  const standingsUrl = String(formData.get("standingsUrl") ?? "").trim();
  const topScorersUrl = String(formData.get("topScorersUrl") ?? "").trim();
  const displayOrderRaw = String(formData.get("displayOrder") ?? "").trim();
  const displayOrder = displayOrderRaw ? Number(displayOrderRaw) : 0;
  const isMainLeague = formData.get("isMainLeague") === "on";

  if (!teamId) return { error: "Jāizvēlas komanda." } as const;
  if (!label) return { error: "Nosaukums ir obligāts." } as const;
  if (!url) return { error: "URL ir obligāts." } as const;
  if (!Number.isInteger(displayOrder)) return { error: "Secībai jābūt veselam skaitlim." } as const;

  try {
    new URL(url);
  } catch {
    return { error: "Nederīgs spēļu saraksta URL." } as const;
  }

  if (standingsUrl) {
    try {
      new URL(standingsUrl);
    } catch {
      return { error: "Nederīgs tabulas URL." } as const;
    }
  }

  if (topScorersUrl) {
    try {
      new URL(topScorersUrl);
    } catch {
      return { error: "Nederīgs vārtu guvēju URL." } as const;
    }
  }

  return {
    teamId,
    label,
    url,
    standingsUrl: standingsUrl || null,
    topScorersUrl: topScorersUrl || null,
    displayOrder,
    isMainLeague,
  } as const;
}

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
  revalidatePath("/admin/league-sources");
  revalidatePath("/");
  revalidatePath("/speles");
}
