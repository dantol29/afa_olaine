"use server";

import { revalidatePath, updateTag } from "next/cache";
import { PUBLIC_CONTENT_CACHE_TAG } from "@/lib/public-data-cache";

import { db } from "@/db/client";
import { siteSettings } from "@/db/schema";
import { requireAdminSession } from "@/lib/auth";
import { parseSettingsInput } from "@/lib/admin-input/site-settings";

const SETTINGS_ID = 1;

export async function updateSiteSettings(
  _prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  await requireAdminSession();

  const parsed = parseSettingsInput(formData);
  if ("error" in parsed) return parsed;

  await db
    .insert(siteSettings)
    .values({ id: SETTINGS_ID, ...parsed, updatedAt: Date.now() })
    .onConflictDoUpdate({
      target: siteSettings.id,
      set: { ...parsed, updatedAt: Date.now() },
    });

  // The footer renders on every public page via the root layout.
  updateTag(PUBLIC_CONTENT_CACHE_TAG);
  revalidatePath("/", "layout");

  return { success: true } as const;
}
