"use server";

import { eq } from "drizzle-orm";
import { revalidatePath, updateTag } from "next/cache";
import { PUBLIC_CONTENT_CACHE_TAG } from "@/lib/public-data-cache";
import { redirect } from "next/navigation";

import { db } from "@/db/client";
import { clubPages } from "@/db/schema";
import { requireAdminSession } from "@/lib/auth";
import { parseMediaInput, parsePageInput } from "@/lib/admin-input/club-pages";
import { isClubPageSlugTaken } from "@/lib/admin-slugs";
import { deleteUploadedPhoto, saveUploadedPhoto } from "@/lib/uploads";
import { parseClubPageMedia, serializeClubPageMedia } from "@/lib/club-page-media";

function uploadedImages(formData: FormData) {
  return formData.getAll("images")
    .filter((value): value is File => value instanceof File && value.size > 0);
}

async function saveImages(files: File[]) {
  const urls: string[] = [];
  try {
    for (const file of files) urls.push(await saveUploadedPhoto(file, "club-pages"));
    return urls;
  } catch (error) {
    await Promise.all(urls.map((url) => deleteUploadedPhoto(url)));
    throw error;
  }
}

function revalidateClubPages(slugs: string[]) {
  revalidatePath("/", "layout");
  updateTag(PUBLIC_CONTENT_CACHE_TAG);
  revalidatePath("/admin/club-pages");
  revalidatePath("/sitemap.xml");
  for (const slug of slugs) revalidatePath(`/klubs/${slug}`);
}

export async function createClubPage(
  _previous: { error?: string } | undefined,
  formData: FormData,
) {
  await requireAdminSession();
  const parsed = parsePageInput(formData);
  if ("error" in parsed) return parsed;
  if (await isClubPageSlugTaken(parsed.slug)) return { error: `Saite "${parsed.slug}" jau tiek izmantota.` };

  const files = uploadedImages(formData);
  const media = parseMediaInput(formData, parseClubPageMedia(null), files);
  if ("error" in media) return media;
  let imageUrls: string[];
  try {
    imageUrls = await saveImages(files);
  } catch (error) {
    return { error: (error as Error).message };
  }

  const now = Date.now();
  try {
    await db.insert(clubPages).values({
      ...parsed,
      images: serializeClubPageMedia({ layout: media.layout, actions: media.actions, photos: imageUrls.map((src, index) => ({ src, ...media.newDetails[index] })) }),
      createdAt: now,
      updatedAt: now,
    });
  } catch (error) {
    await Promise.all(imageUrls.map(deleteUploadedPhoto));
    throw error;
  }
  revalidateClubPages([parsed.slug]);
  redirect("/admin/club-pages");
}

export async function updateClubPage(
  id: number,
  _previous: { error?: string } | undefined,
  formData: FormData,
) {
  await requireAdminSession();
  const parsed = parsePageInput(formData);
  if ("error" in parsed) return parsed;
  if (await isClubPageSlugTaken(parsed.slug, id)) return { error: `Saite "${parsed.slug}" jau tiek izmantota.` };

  const [existing] = await db.select().from(clubPages).where(eq(clubPages.id, id));
  if (!existing) return { error: "Lapa nav atrasta." };
  const currentMedia = parseClubPageMedia(existing.images);
  const files = uploadedImages(formData);
  const media = parseMediaInput(formData, currentMedia, files);
  if ("error" in media) return media;
  let newImages: string[];
  try {
    newImages = await saveImages(files);
  } catch (error) {
    return { error: (error as Error).message };
  }
  const photos = [...media.retained, ...newImages.map((src, index) => ({ src, ...media.newDetails[index] }))];
  try {
    await db.update(clubPages).set({
      ...parsed,
      images: serializeClubPageMedia({ layout: media.layout, actions: media.actions, photos }),
      updatedAt: Date.now(),
    }).where(eq(clubPages.id, id));
  } catch (error) {
    await Promise.all(newImages.map(deleteUploadedPhoto));
    throw error;
  }
  await Promise.all(currentMedia.photos.filter(photo => !photos.some(retained => retained.src === photo.src)).map(photo => deleteUploadedPhoto(photo.src)));
  revalidateClubPages([existing.slug, parsed.slug]);
  redirect("/admin/club-pages");
}

export async function deleteClubPage(id: number) {
  await requireAdminSession();
  const [existing] = await db.select().from(clubPages).where(eq(clubPages.id, id));
  await db.delete(clubPages).where(eq(clubPages.id, id));
  if (existing?.images) await Promise.all(parseClubPageMedia(existing.images).photos.map(photo => deleteUploadedPhoto(photo.src)));
  revalidateClubPages(existing ? [existing.slug] : []);
}
