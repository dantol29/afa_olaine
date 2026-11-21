import { pageMetadata } from "@/lib/page-metadata";
import { SiteHeader } from "@/components/site-header";
import { SiteEnding } from "@/components/site-ending";
import { GamesTabs } from "@/components/games-tabs";
import { InnerPageHero } from "@/components/inner-page-hero";
import { splitSchedule } from "@/lib/schedule";
import { getEventBorderStripe, getScheduleCardEntries } from "@/lib/schedule-server";
import { TEAM_FILTER_PARAM, firstSearchParam, type SearchParamValue } from "@/lib/url-state";

export const metadata = pageMetadata({
  title: "AFA Olaine spēles | Kalendārs un rezultāti",
  description: "Apskati AFA Olaine gaidāmās spēles un aizvadīto maču rezultātus. Spēļu datumi, pretinieki un norises vietas vienuviet futbola līdzjutējiem.",
  path: "/speles",
});

export default async function GamesPage({ searchParams }: { searchParams: Promise<Record<string, SearchParamValue>> }) {
  const params = await searchParams;
  const [entries, eventBorderStripe] = await Promise.all([getScheduleCardEntries(), getEventBorderStripe()]);
  const { upcoming, past } = splitSchedule(entries);

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <SiteHeader />
      <InnerPageHero title="Spēles" id="games-page-title" />
      <div className="mx-auto w-[calc(100%-3rem)] max-w-[1500px] pb-20 md:w-[calc(100%-10rem)] xl:pb-28">
        <GamesTabs upcoming={upcoming} past={past} eventBorderStripe={eventBorderStripe} initialTeam={firstSearchParam(params[TEAM_FILTER_PARAM]) ?? null} />
      </div>
      <SiteEnding />
    </main>
  );
}
