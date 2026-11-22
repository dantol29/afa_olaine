import { pageMetadata } from "@/lib/page-metadata";

import { InnerPageHero } from "@/components/inner-page-hero";
import { SiteEnding } from "@/components/site-ending";
import { SiteHeader } from "@/components/site-header";
import { TrainingSchedule } from "@/components/training-schedule";
import { toDateKey } from "@/lib/calendar";
import { TRAINING_DATE_PARAM, TRAINING_TEAM_PARAM } from "@/lib/training-filters";
import { getSiteUrl } from "@/lib/site-url";
import { getAllTrainingsFromDb } from "@/lib/trainings-server";
import { firstSearchParam, type SearchParamValue } from "@/lib/url-state";

export const dynamic = "force-dynamic";

export const metadata = pageMetadata({
  title: "AFA Olaine treniņi | Komandu grafiks Olainē",
  description: "Atrodi AFA Olaine komandu treniņu laikus, vietas un trenerus. Pārskati futbola nodarbību grafiku Olainē un izvēlies sev interesējošo komandu.",
  path: "/trenini",
});

export default async function TrainingsPage({ searchParams }: { searchParams: Promise<Record<string, SearchParamValue>> }) {
  const params = await searchParams;
  const trainings = await getAllTrainingsFromDb();

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <SiteHeader />
      <InnerPageHero title="Treniņi" id="trainings-page-title" />
      <TrainingSchedule
        trainings={trainings}
        todayKey={toDateKey(new Date())}
        initialTeam={firstSearchParam(params[TRAINING_TEAM_PARAM]) ?? null}
        initialDate={firstSearchParam(params[TRAINING_DATE_PARAM]) ?? null}
        siteUrl={getSiteUrl()}
      />
      <SiteEnding />
    </main>
  );
}
