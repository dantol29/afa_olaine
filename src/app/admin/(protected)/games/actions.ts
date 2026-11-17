"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db/client";
import { games } from "@/db/schema";
import { requireAdminSession } from "@/lib/auth";
import { parseGameInput } from "@/lib/admin-input/games";

export async function createGame(_prevState: { error?: string } | undefined, formData: FormData) {
  await requireAdminSession();

  const parsed = parseGameInput(formData);
  if ("error" in parsed) return parsed;

  await db.insert(games).values({ ...parsed, source: "manual", createdAt: Date.now() });
  revalidatePath("/admin/games");
  revalidatePath("/");
  redirect("/admin/games");
}

export async function updateGame(
  id: number,
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  await requireAdminSession();

  const parsed = parseGameInput(formData);
  if ("error" in parsed) return parsed;

  await db.update(games).set(parsed).where(eq(games.id, id));
  revalidatePath("/admin/games");
  revalidatePath("/");
  redirect("/admin/games");
}

export async function deleteGame(id: number) {
  await requireAdminSession();

  await db.delete(games).where(eq(games.id, id));
  revalidatePath("/admin/games");
  revalidatePath("/");
}
