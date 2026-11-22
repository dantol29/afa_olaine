"use client";

import { CalendarPlus } from "lucide-react";
import { useState } from "react";

import { teamCalendarPath, webcalUrl } from "@/lib/team-calendar";

const COPIED_MESSAGE_MS = 2000;

/** Offers the selected team's calendar feed: a webcal link that opens the subscription dialog on iPhone, Mac and in
 *  Outlook, and the plain address to paste into Google Calendar, which has no such link. */
export function TeamCalendarSubscribe({ teamId, teamName, siteUrl }: { teamId: number; teamName: string; siteUrl: string }) {
  const [copyResult, setCopyResult] = useState<"copied" | "failed" | null>(null);
  const feedUrl = `${siteUrl}${teamCalendarPath(teamId)}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(feedUrl);
      setCopyResult("copied");
      setTimeout(() => setCopyResult(null), COPIED_MESSAGE_MS);
    } catch {
      // The browser may refuse the clipboard; the address is then shown to copy by hand.
      setCopyResult("failed");
    }
  }

  return (
    <div className="mt-6 bg-[#1b1b1b] p-5 font-sans text-sm sm:p-7 lg:p-5 xl:p-7">
      <h2 className="flex items-center gap-2 font-heading text-[22px] font-semibold uppercase leading-none">
        <CalendarPlus className="size-5 text-[#fbb040]" aria-hidden="true" />
        {teamName} kalendārs
      </h2>
      <p className="mt-3 text-white/70">Treniņi, spēles un pasākumi tavā telefona kalendārā. Izmaiņas parādās pašas.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href={webcalUrl(feedUrl)}
          className="bg-[#fbb040] px-4 py-2.5 font-semibold text-[#050505] transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Pievienot kalendāram
        </a>
        <button
          type="button"
          onClick={copy}
          className="border border-white/40 px-4 py-2.5 font-semibold text-white transition-colors hover:border-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Kopēt saiti
        </button>
      </div>
      {copyResult === "copied" && <p className="mt-2 font-semibold text-[#fbb040]">Saite nokopēta.</p>}
      {copyResult === "failed" && <p className="mt-2 break-all text-white/90">{feedUrl}</p>}
      <p className="mt-4 text-xs leading-relaxed text-white/55">
        iPhone un Outlook: „Pievienot kalendāram”. Google kalendārā: „Citi kalendāri” → „+” → „No URL” un ielīmē saiti. Telefons
        atjauno kalendāru pats — Google to dara retāk, līdz reizei dienā, tāpēc steidzamas izmaiņas skaties arī grupā.
      </p>
    </div>
  );
}
