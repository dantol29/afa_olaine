"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db/client";
import { games } from "@/db/schema";
import { requireAdminSession } from "@/lib/auth";

function parseGameInput(formData: FormData) {
  const teamId = Number(formData.get("teamId"));
  const homeTeam = String(formData.get("homeTeam") ?? "").trim();
  const awayTeam = String(formData.get("awayTeam") ?? "").trim();
  const date = String(formData.get("date") ?? "").trim();
  const startTime = String(formData.get("startTime") ?? "").trim();
  const endTime = String(formData.get("endTime") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const league = String(formData.get("league") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const parseScore = (name: "homeScore" | "awayScore") => {
    const raw = String(formData.get(name) ?? "").trim();
    if (!raw) return null;
    const score = Number(raw);
    return Number.isInteger(score) && score >= 0 ? score : undefined;
  };
  const homeScore = parseScore("homeScore");
  const awayScore = parseScore("awayScore");

  if (!teamId) return { error: "Jāizvēlas komanda." } as const;
  if (!homeTeam) return { error: "Mājinieki ir obligāti." } as const;
  if (!awayTeam) return { error: "Viesi ir obligāti." } as const;
  if (!date) return { error: "Datums ir obligāts." } as const;
  if (!startTime) return { error: "Sākuma laiks ir obligāts." } as const;
  if (!endTime) return { error: "Beigu laiks ir obligāts." } as const;
  if (!location) return { error: "Vieta ir obligāta." } as const;
  if (homeScore === undefined || awayScore === undefined) return { error: "Rezultātam jābūt veselam skaitlim no 0." } as const;

  return {
    teamId,
    homeTeam,
    awayTeam,
    homeScore,
    awayScore,
    date,
    startTime,
    endTime,
    location,
    league: league || null,
    notes: notes || null,
  } as const;
}

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
