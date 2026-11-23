"use server";

import { eq } from "drizzle-orm";
import { revalidatePath, updateTag } from "next/cache";
import { PUBLIC_CONTENT_CACHE_TAG } from "@/lib/public-data-cache";
import { redirect } from "next/navigation";

import { db } from "@/db/client";
import { articles } from "@/db/schema";
import { requireAdminSession } from "@/lib/auth";
import { parseArticleInput } from "@/lib/admin-input/articles";
import { ensureUniqueArticleSlug } from "@/lib/admin-slugs";
import { deleteUploadedPhoto, saveUploadedPhoto } from "@/lib/uploads";

function parseHighlightFiles(formData: FormData): File[] {
  return formData
    .getAll("highlights")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);
}

export async function createArticle(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  await requireAdminSession();

  const parsed = parseArticleInput(formData);
  if ("error" in parsed) return parsed;

  const { baseSlug, ...articleFields } = parsed;
  const slug = await ensureUniqueArticleSlug(baseSlug);

  const image = formData.get("image");
  if (!(image instanceof File) || image.size === 0) {
    return { error: "Attēls ir obligāts." };
  }
  let imageUrl: string;
  try {
    imageUrl = await saveUploadedPhoto(image, "articles");
  } catch (error) {
    return { error: (error as Error).message };
  }

  const highlightFiles = parseHighlightFiles(formData);
  const highlightUrls: string[] = [];
  try {
    for (const file of highlightFiles) {
      highlightUrls.push(await saveUploadedPhoto(file, "articles"));
    }
  } catch (error) {
    return { error: (error as Error).message };
  }

  await db.insert(articles).values({
    ...articleFields,
    slug,
    image: imageUrl,
    highlights: highlightUrls.length > 0 ? highlightUrls.join("\n") : null,
    createdAt: Date.now(),
  });

  revalidatePath("/jaunumi/[slug]", "page");
  updateTag(PUBLIC_CONTENT_CACHE_TAG);
  revalidatePath("/admin/jaunumi");
  revalidatePath("/jaunumi");
  revalidatePath("/sitemap.xml");
  revalidatePath("/feed.xml");
  revalidatePath("/");
  redirect("/admin/jaunumi");
}

export async function updateArticle(
  id: number,
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  await requireAdminSession();

  const parsed = parseArticleInput(formData);
  if ("error" in parsed) return parsed;

  const [existing] = await db.select().from(articles).where(eq(articles.id, id));
  if (!existing) return { error: "Raksts nav atrasts." };

  // The slug is locked at creation and never re-derived from an edited
  // title — otherwise renaming an article would break its published URL.
  const { baseSlug, ...articleFields } = parsed;

  const image = formData.get("image");
  let imageUrl = existing.image;
  if (image instanceof File && image.size > 0) {
    try {
      imageUrl = await saveUploadedPhoto(image, "articles");
    } catch (error) {
      return { error: (error as Error).message };
    }
    await deleteUploadedPhoto(existing.image);
  }

  const removeHighlights = formData.get("removeHighlights") === "on";
  const highlightFiles = parseHighlightFiles(formData);
  let highlights = existing.highlights;
  if (removeHighlights || highlightFiles.length > 0) {
    if (existing.highlights) {
      for (const url of existing.highlights.split("\n").filter(Boolean)) {
        await deleteUploadedPhoto(url);
      }
    }
    highlights = null;
  }
  if (highlightFiles.length > 0) {
    const highlightUrls: string[] = [];
    try {
      for (const file of highlightFiles) {
        highlightUrls.push(await saveUploadedPhoto(file, "articles"));
      }
    } catch (error) {
      return { error: (error as Error).message };
    }
    highlights = highlightUrls.join("\n");
  }

  await db
    .update(articles)
    .set({ ...articleFields, image: imageUrl, highlights })
    .where(eq(articles.id, id));

  revalidatePath("/jaunumi/[slug]", "page");
  updateTag(PUBLIC_CONTENT_CACHE_TAG);
  revalidatePath("/admin/jaunumi");
  revalidatePath("/jaunumi");
  revalidatePath("/sitemap.xml");
  revalidatePath("/feed.xml");
  revalidatePath("/");
  redirect("/admin/jaunumi");
}

export async function deleteArticle(id: number) {
  await requireAdminSession();

  const [existing] = await db.select().from(articles).where(eq(articles.id, id));
  if (existing) {
    await deleteUploadedPhoto(existing.image);
    if (existing.highlights) {
      for (const url of existing.highlights.split("\n").filter(Boolean)) {
        await deleteUploadedPhoto(url);
      }
    }
  }

  await db.delete(articles).where(eq(articles.id, id));
  revalidatePath("/jaunumi/[slug]", "page");
  updateTag(PUBLIC_CONTENT_CACHE_TAG);
  revalidatePath("/admin/jaunumi");
  revalidatePath("/jaunumi");
  revalidatePath("/sitemap.xml");
  revalidatePath("/feed.xml");
  revalidatePath("/");
}
