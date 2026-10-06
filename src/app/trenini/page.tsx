import type { Metadata } from "next";

import { InnerPageHero } from "@/components/inner-page-hero";
import { SiteEnding } from "@/components/site-ending";
import { SiteHeader } from "@/components/site-header";
import { TrainingSchedule } from "@/components/training-schedule";
import { toDateKey } from "@/lib/calendar";
import { getAllTrainingsFromDb } from "@/lib/trainings-server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "AFA Olaine treniņi | Komandu grafiks Olainē",
  description: "Atrodi AFA Olaine komandu treniņu laikus, vietas un trenerus. Pārskati futbola nodarbību grafiku Olainē un izvēlies sev interesējošo komandu.",
  alternates: { canonical: "/trenini" },
};

export default async function TrainingsPage() {
  const trainings = await getAllTrainingsFromDb();

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <SiteHeader />
      <InnerPageHero title="Treniņi" id="trainings-page-title" />
      <TrainingSchedule trainings={trainings} todayKey={toDateKey(new Date())} />
      <SiteEnding />
    </main>
  );
}
