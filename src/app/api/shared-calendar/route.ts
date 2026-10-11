import { createHash, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import { getScheduleForRange } from "@/lib/calendar";
import { getSiteUrl } from "@/lib/site-url";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const headers = { "Cache-Control": "private, no-store" };

function parseDate(value: string | null): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  // Noon UTC stays on the same calendar date in Europe/Riga.
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? date : null;
}

function hash(value: string) {
  return createHash("sha256").update(value).digest();
}

function absoluteLogo(value: string | null | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value, `${getSiteUrl()}/`);
    return ["https:", "http:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const secret = process.env.SHARED_CALENDAR_SECRET;
  if (!secret) return NextResponse.json({ error: "Shared calendar is not configured" }, { status: 503, headers });

  const authorization = request.headers.get("authorization") ?? "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!token || !timingSafeEqual(hash(token), hash(secret))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers });
  }

  const from = parseDate(request.nextUrl.searchParams.get("from"));
  const to = parseDate(request.nextUrl.searchParams.get("to"));
  if (!from || !to || to < from || to.getTime() - from.getTime() > 365 * 86400000) {
    return NextResponse.json({ error: "Provide from and to dates (YYYY-MM-DD), with a range of at most 366 days" }, { status: 400, headers });
  }

  try {
    const schedule = await getScheduleForRange(from, to);
    return NextResponse.json({
      version: 1,
      club: "AFA Olaine",
      timezone: "Europe/Riga",
      generatedAt: new Date().toISOString(),
      events: schedule.map((event) => ({
        ...event,
        uid: `afa-olaine:${event.uid}`,
        club: "AFA Olaine",
        readOnly: true,
        homeLogo: absoluteLogo(event.homeLogo),
        awayLogo: absoluteLogo(event.awayLogo),
      })),
    }, { headers });
  } catch (error) {
    console.error("Unable to load shared calendar", error);
    return NextResponse.json({ error: "Unable to load calendar" }, { status: 503, headers });
  }
}
