import { ScheduleCard } from "./games-tabs";
import { pickHomeEntries, splitSchedule } from "@/lib/schedule";
import { getEventBorderStripe, getScheduleCardEntries } from "@/lib/schedule-server";

const HOME_CARD_COUNT = 3;

export async function UpcomingGamesSection() {
  const [schedule, eventBorderStripe] = await Promise.all([getScheduleCardEntries(), getEventBorderStripe()]);
  const { upcoming, past } = splitSchedule(schedule);
  // With nothing planned, the block shows the latest results instead; events have no result, so only games.
  const entries = upcoming.length > 0
    ? pickHomeEntries(upcoming, HOME_CARD_COUNT)
    : past.filter((entry) => entry.kind === "game").slice(0, HOME_CARD_COUNT);

  return (
    <section aria-label="Tuvākās spēles un pasākumi" className="bg-[#050505]">
      <div id="upcoming-games-heading" className="mx-auto grid w-[calc(100%-3rem)] max-w-[1500px] grid-cols-1 gap-5 pb-20 pt-40 md:w-[calc(100%-10rem)] md:grid-cols-2 xl:grid-cols-3 xl:gap-7 xl:pb-28 xl:pt-44">
        {entries.map((entry) => <ScheduleCard key={entry.key} entry={entry} eventBorderStripe={eventBorderStripe} />)}
        {Array.from({ length: Math.max(0, HOME_CARD_COUNT - entries.length) }, (_, index) => (
          <div key={`empty-game-${index}`} className="flex min-h-[360px] items-center justify-center border border-dotted border-white/15 px-6 py-12 text-center sm:min-h-[390px]">
            <p className="text-sm text-white/40">Spēle vēl nav ieplānota</p>
          </div>
        ))}
      </div>
    </section>
  );
}
