"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db/client";
import { events } from "@/db/schema";
import { requireAdminSession } from "@/lib/auth";
import { parseEventInput } from "@/lib/admin-input/events";

export async function createEvent(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  await requireAdminSession();

  const parsed = parseEventInput(formData);
  if ("error" in parsed) return parsed;

  await db.insert(events).values({ ...parsed, createdAt: Date.now() });
  revalidatePath("/admin/events");
  redirect("/admin/events");
}

export async function updateEvent(
  id: number,
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  await requireAdminSession();

  const parsed = parseEventInput(formData);
  if ("error" in parsed) return parsed;

  await db.update(events).set(parsed).where(eq(events.id, id));
  revalidatePath("/admin/events");
  redirect("/admin/events");
}

export async function deleteEvent(id: number) {
  await requireAdminSession();

  await db.delete(events).where(eq(events.id, id));
  revalidatePath("/admin/events");
}
