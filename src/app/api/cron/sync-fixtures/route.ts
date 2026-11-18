import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { cronJobStatuses, leagueSources } from "@/db/schema";
import type { UnrecognizedRows } from "@/lib/fixtures";
import { syncLeagueSource, type ReviewNeededGame } from "@/lib/league-sync";
import { sendNotificationEmail } from "@/lib/mailer";
import { getStandings } from "@/lib/standings";
import { getSiteSettings } from "@/lib/site-settings";
import { getSiteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  Pragma: "no-cache",
};

const SITE_URL = getSiteUrl();

type SourceSyncResult = {
  id: number;
  label: string;
  reviewNeeded: ReviewNeededGame[];
  unrecognized?: UnrecognizedRows;
  standingsError: string | null;
};

/** Signs that the LFF layout may have changed: match rows the parser could not read (those matches are missing from
 *  the site) and a standings table that could not be read or has no AFA Olaine (the home page then hides the table).
 *  One line per problem, for the job's status message and the e-mail. */
function describeAttention(source: SourceSyncResult): string[] {
  const lines: string[] = [];
  if (source.unrecognized) {
    const samples = source.unrecognized.samples.map((sample) => `"${sample}"`).join("; ");
    lines.push(`${source.label}: ${source.unrecognized.count} LFF spēļu rindas netika atpazītas un nav importētas (piemēri: ${samples})`);
  }
  if (source.standingsError) lines.push(`${source.label}: tabulu neizdevās nolasīt: ${source.standingsError}`);
  return lines;
}

/** Reads the source's standings the way the home page does, so a table the page would hide is reported here. */
async function checkStandings(standingsUrl: string | null): Promise<string | null> {
  if (!standingsUrl) return null;
  try {
    await getStandings(standingsUrl);
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}

/** Sends one email when games need review or the LFF layout may have changed.
 *  Returns the failure reason to persist in cronJobStatuses.lastEmailError,
 *  or null when either no email was needed or it sent successfully — so an
 *  SMTP problem is visible in the admin UI, not just server logs. */
async function notifyAdmin(bySource: SourceSyncResult[]): Promise<string | null> {
  const withChanges = bySource.filter((source) => source.reviewNeeded.length > 0);
  const totalCount = withChanges.reduce((sum, source) => sum + source.reviewNeeded.length, 0);
  const attentionLines = bySource.flatMap(describeAttention);
  if (totalCount === 0 && attentionLines.length === 0) return null;

  const settings = await getSiteSettings();
  const attentionText = attentionLines.length === 0 ? [] : [
    "LFF sinhronizācijai vajadzīga uzmanība — iespējams, LFF ir mainījis lapas izkārtojumu:",
    ...attentionLines.map((line) => `  - ${line}`),
    "",
    `Neatpazītās spēles ievadi manuāli vai pārbaudi līgas avotu (${SITE_URL}/admin/league-sources) un ziņo izstrādātājam.`,
    "",
  ];
  const reviewText = totalCount === 0 ? [] : [
    `LFF sinhronizācija atrada ${totalCount} jau importētu spēli(es), kurām LFF tagad rāda citu laiku vai stadionu.`,
    "Šīs izmaiņas NAV automātiski piemērotas — apskati un apstiprini katrā līgas avota \"Ielādēt spēles\" lapā.",
    "",
  ];
  const lines = withChanges.flatMap((source) => [
    `${source.label} (${SITE_URL}/admin/league-sources/${source.id}/import):`,
    ...source.reviewNeeded.map((game) => {
      const changes: string[] = [];
      if (game.oldStartTime !== game.newStartTime) {
        changes.push(`laiks ${game.oldStartTime} → ${game.newStartTime}`);
      }
      if (game.oldLocation !== game.newLocation) {
        changes.push(`stadions "${game.oldLocation}" → "${game.newLocation}"`);
      }
      return `  - ${game.date} ${game.homeTeam} - ${game.awayTeam}: ${changes.join(", ")}`;
    }),
    "",
  ]);

  const result = await sendNotificationEmail({
    to: settings.email,
    subject: attentionLines.length > 0
      ? "AFA Olaine: LFF sinhronizācijai vajadzīga uzmanība"
      : `AFA Olaine: ${totalCount} spēlei(ēm) LFF dati atšķiras no datubāzes`,
    text: [...attentionText, ...reviewText, ...lines].join("\n"),
  });

  return result.sent ? null : result.error;
}

/** Hit on a schedule (e.g. a daily cPanel Cron Job) to pull in any new
 *  fixtures for every league source, with no admin review step — see
 *  syncLeagueSource. Requires `Authorization: Bearer <CRON_SECRET>` (or,
 *  only when no Bearer header is sent, the legacy `?secret=` query
 *  parameter) so this isn't a public, unauthenticated way to write to the
 *  database. Without CRON_SECRET every request is rejected. */
async function runSync(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  const secret = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : request.nextUrl.searchParams.get("secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE_HEADERS });
  }

  const startedAt = Date.now();
  await db.insert(cronJobStatuses).values({
    job: "sync-fixtures",
    status: "running",
    startedAt,
  }).onConflictDoUpdate({
    target: cronJobStatuses.job,
    set: {
      status: "running",
      startedAt,
      finishedAt: null,
      importedCount: 0,
      needsReviewCount: 0,
      message: null,
      lastEmailError: null,
    },
  });

  try {
    const sources = await db.select().from(leagueSources);
    const results = await Promise.all(
      sources.map(async (source) => ({
        id: source.id,
        label: source.label,
        ...(await syncLeagueSource(source)),
        standingsError: await checkStandings(source.standingsUrl),
      })),
    );
    const importedCount = results.reduce((sum, result) => sum + result.imported, 0);
    const needsReviewCount = results.reduce((sum, result) => sum + result.reviewNeeded.length, 0);
    const errors = results.filter((result) => result.error);
    const finishedAt = Date.now();
    const attentionLines = results.flatMap(describeAttention);
    // Unread rows or an unusable table are not a failed run, but they must not show as "Veiksmīgi" either.
    const status = errors.length === 0
      ? attentionLines.length === 0 ? "success" : "partial"
      : errors.length === results.length ? "error" : "partial";
    const messageLines = [...errors.map((result) => `${result.label}: ${result.error}`), ...attentionLines];
    const message = messageLines.length ? messageLines.join("\n") : null;

    const lastEmailError = await notifyAdmin(results);

    await db.update(cronJobStatuses).set({
      status,
      finishedAt,
      lastSuccessAt: status === "success" ? finishedAt : undefined,
      importedCount,
      needsReviewCount,
      message,
      lastEmailError,
    }).where(eq(cronJobStatuses.job, "sync-fixtures"));

    return NextResponse.json(
      {
        status,
        recordedAt: new Date(finishedAt).toISOString(),
        importedCount,
        needsReviewCount,
        lastEmailError,
        results,
      },
      { headers: NO_STORE_HEADERS },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await db.update(cronJobStatuses).set({
      status: "error",
      finishedAt: Date.now(),
      message,
    }).where(eq(cronJobStatuses.job, "sync-fixtures"));
    return NextResponse.json(
      { status: "error", recordedAt: new Date().toISOString(), error: message },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }
}

// GET remains available for existing cron configurations. POST is preferred
// because hosting/CDN caches cannot replay a previous successful response.
export const GET = runSync;
export const POST = runSync;
