import Image from "next/image";
import { TeamLogo } from "./team-logo";

import { MONTHS, type Team, type UpcomingGame } from "@/lib/games";

export type MatchCardGame = UpcomingGame & { homeScore?: number | null; awayScore?: number | null };

function dateLabel(game: UpcomingGame) {
  const month = MONTHS.indexOf(game.month) + 1;
  return `${game.day}.${String(month).padStart(2, "0")}.${game.year} ${game.time}`;
}

function MatchCrest({ team }: { team: Team }) {
  return <TeamLogo src={team.logo} name={team.name} width={62} height={62} className="size-[62px] object-contain" fallbackClassName="grid size-[62px] place-items-center rounded-full border border-white/45 font-heading text-lg text-white" />;
}

export function MatchCard({
  game,
  homeBorderStripe,
  awayBorderStripe,
  compact = false,
}: {
  game: MatchCardGame;
  homeBorderStripe: string;
  awayBorderStripe: string;
  compact?: boolean;
}) {
  return (
    <article
      className={`relative isolate flex overflow-hidden bg-[#151515] p-5 pb-3 text-white sm:p-6 sm:pb-4 ${compact ? "min-h-[360px] sm:min-h-[390px]" : "min-h-[400px] xl:min-h-[460px] xl:p-8 xl:pb-4"}`}
    >
      <div aria-hidden="true" className="absolute inset-x-0 top-0 z-10 h-1.5" style={{ backgroundImage: homeBorderStripe }} />
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 z-10 h-1.5" style={{ backgroundImage: awayBorderStripe }} />
      <span aria-hidden="true" className="pointer-events-none absolute left-6 top-5 -z-10 font-heading text-[96px] font-semibold uppercase leading-none tracking-[-0.08em] text-white/[0.07] sm:text-[132px]">
        {game.home.name.replace(/[^\p{L}\p{N}]/gu, "").slice(0, 3)}
      </span>
      <span aria-hidden="true" className="pointer-events-none absolute bottom-24 right-6 -z-10 font-heading text-[96px] font-semibold uppercase leading-none tracking-[-0.08em] text-white/[0.07] sm:text-[132px]">
        {game.away.name.replace(/[^\p{L}\p{N}]/gu, "").slice(0, 3)}
      </span>

      <div className="flex w-full flex-col">
        <div className="flex items-center justify-between gap-4 text-sm font-semibold">
          <span>{game.day}. {game.month}</span>
          {game.leagueLogoUrl ? <Image src={game.leagueLogoUrl} alt={game.league} width={138} height={72} className="h-12 w-auto object-contain brightness-0 invert" /> : <span className="font-heading text-sm font-semibold uppercase text-white/65">{game.league}</span>}
        </div>

        <div className={`mt-auto pb-4 sm:pb-5 ${compact ? "pt-12" : "pt-20"}`}>
          <div className="flex items-center gap-5">
            <MatchCrest team={game.home} />
            {game.homeScore != null && game.awayScore != null && (
              <span aria-label={`Rezultāts ${game.homeScore} pret ${game.awayScore}`} className="whitespace-nowrap font-heading text-[34px] font-semibold leading-none tabular-nums sm:text-[40px]">{game.homeScore} : {game.awayScore}</span>
            )}
            {(game.homeScore == null || game.awayScore == null) && <span className="h-10 w-px bg-white/70" />}
            <MatchCrest team={game.away} />
          </div>
          <h3 className={`mt-5 max-w-[520px] font-heading font-semibold uppercase leading-[0.98] ${compact ? "text-[24px] sm:text-[28px]" : "text-[24px] sm:text-[30px] xl:text-[36px]"}`}>
            {game.home.name}<br />{game.away.name}
          </h3>
          <p className="mt-4 font-sans text-[15px] font-semibold text-white sm:text-base">{dateLabel(game)}</p>
          <p className="mt-1 max-w-md font-sans text-sm text-white/80">{game.venue}</p>
        </div>
      </div>
    </article>
  );
}
