import Link from "next/link";
import { Search } from "lucide-react";

import type { SearchResults } from "@/lib/search-server";

export function PublicSearchContent({ query, results }: { query: string; results: SearchResults }) {
  const hasResults = Object.values(results).some((items) => items.length > 0);

  return (
    <section className="mx-auto w-[calc(100%-3rem)] max-w-[1500px] py-12 md:w-[calc(100%-10rem)] md:py-20">
      <form action="/meklet" method="get" role="search" className="flex max-w-3xl border border-white/40 focus-within:border-[#fbb040]">
        <label htmlFor="site-search-query" className="sr-only">Meklēt vietnē</label>
        <input id="site-search-query" name="q" type="search" defaultValue={query} minLength={2} autoFocus placeholder="Meklēt jaunumus, spēlētājus, komandas..." className="min-w-0 flex-1 bg-transparent px-4 py-4 text-base text-white outline-none placeholder:text-white/45 md:px-6" />
        <button type="submit" aria-label="Meklēt" className="grid w-14 shrink-0 place-items-center bg-[#fbb040] text-[#050505] transition-colors hover:bg-white"><Search className="size-5" aria-hidden="true" /></button>
      </form>

      {query.trim().length < 2 ? (
        <p className="mt-10 text-white/60">Ievadi vismaz divus burtus, lai meklētu.</p>
      ) : !hasResults ? (
        <p className="mt-10 text-white/60">Nekas nav atrasts. Mēģini citu meklēšanas vārdu.</p>
      ) : (
        <div className="mt-12 grid gap-x-12 gap-y-12 lg:grid-cols-2">
          {results.articles.length > 0 && <div>
            <h2 className="mb-4 font-heading text-3xl font-semibold uppercase">Jaunumi</h2>
            <ul className="divide-y divide-white/15 border-t border-white/15">{results.articles.map((article) => <li key={article.slug}><Link href={`/jaunumi/${article.slug}`} className="block py-4 hover:text-[#fbb040]"><span className="font-heading text-xl uppercase">{article.title}</span><span className="mt-1 block text-sm text-white/55">{article.excerpt}</span></Link></li>)}</ul>
          </div>}
          {results.players.length > 0 && <div>
            <h2 className="mb-4 font-heading text-3xl font-semibold uppercase">Spēlētāji</h2>
            <ul className="divide-y divide-white/15 border-t border-white/15">{results.players.map((player) => <li key={player.id}><Link href={`/komanda/speletaji/${player.id}`} className="flex items-baseline justify-between gap-4 py-4 hover:text-[#fbb040]"><span className="font-heading text-xl uppercase">{player.name}</span><span className="text-sm text-white/55">{player.teamName}</span></Link></li>)}</ul>
          </div>}
          {results.coaches.length > 0 && <div>
            <h2 className="mb-4 font-heading text-3xl font-semibold uppercase">Treneri</h2>
            <ul className="divide-y divide-white/15 border-t border-white/15">{results.coaches.map((coach) => <li key={coach.id}><Link href="/komanda?skats=treneri" className="flex items-baseline justify-between gap-4 py-4 hover:text-[#fbb040]"><span className="font-heading text-xl uppercase">{coach.name}</span><span className="text-sm text-white/55">{coach.position}</span></Link></li>)}</ul>
          </div>}
          {results.teams.length > 0 && <div>
            <h2 className="mb-4 font-heading text-3xl font-semibold uppercase">Komandas</h2>
            <ul className="divide-y divide-white/15 border-t border-white/15">{results.teams.map((team) => <li key={team.id}><Link href={team.id === 1 ? "/komanda" : `/akademija#team-${team.id}`} className="block py-4 font-heading text-xl uppercase hover:text-[#fbb040]">{team.name}</Link></li>)}</ul>
          </div>}
        </div>
      )}
    </section>
  );
}
