"use client";

import Link from "next/link";
import { Search, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { SearchResults } from "@/lib/search-server";

export function SiteSearch({ className = "", onOpen }: { className?: string; onOpen?: () => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const id = useId();
  const term = query.trim();

  useEffect(() => {
    if (!open || !dialog.current) return;
    const element = dialog.current;
    const previousOverflow = document.body.style.overflow;
    element.showModal();
    document.body.style.overflow = "hidden";
    input.current?.focus();
    return () => { element.close(); document.body.style.overflow = previousOverflow; trigger.current?.focus(); };
  }, [open]);

  useEffect(() => {
    if (!open || term.length < 2) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(term)}`, { signal: controller.signal });
        if (!response.ok) throw new Error("Search failed");
        const data: SearchResults = await response.json();
        if (!controller.signal.aborted) { setResults(data); setLoading(false); }
      } catch {
        if (!controller.signal.aborted) { setError(true); setLoading(false); }
      }
    }, 250);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [open, term]);

  function updateQuery(value: string) {
    setQuery(value);
    if (value.trim() === term) return;
    setResults(null);
    setError(false);
    setLoading(value.trim().length >= 2);
  }

  const groups = results ? [
    { title: "Jaunumi", items: results.articles.map((item) => ({ key: item.slug, title: item.title, detail: item.excerpt, href: `/jaunumi/${item.slug}` })) },
    { title: "Spēlētāji", items: results.players.map((item) => ({ key: String(item.id), title: item.name, detail: item.teamName, href: `/komanda/speletaji/${item.id}` })) },
    { title: "Treneri", items: results.coaches.map((item) => ({ key: String(item.id), title: item.name, detail: item.position, href: "/komanda?skats=treneri" })) },
    { title: "Komandas", items: results.teams.map((item) => ({ key: String(item.id), title: item.name, detail: null, href: item.id === 1 ? "/komanda" : `/akademija#team-${item.id}` })) },
  ].filter((group) => group.items.length > 0) : [];

  return <>
    <button ref={trigger} type="button" aria-label="Meklēt" aria-haspopup="dialog" aria-expanded={open} onClick={() => { onOpen?.(); setResults(null); setError(false); setLoading(term.length >= 2); setOpen(true); }} className={`${className} cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#fbb040]`}><Search className="size-6" aria-hidden="true" /></button>
    {open && createPortal(
      <dialog ref={dialog} aria-labelledby={`${id}-heading`} onCancel={() => setOpen(false)} className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none overflow-y-auto border-0 bg-[#050505] p-0 text-white backdrop:bg-black/70 selection:bg-[#fbb040] selection:text-[#050505]">
        <div className="site-overlay-enter mx-auto w-[calc(100%-3rem)] max-w-[960px] py-6 sm:py-10">
          <div className="mb-8 flex items-center justify-between gap-4">
            <h2 id={`${id}-heading`} className="font-heading text-3xl font-semibold uppercase sm:text-4xl">Meklēt</h2>
            <button type="button" aria-label="Aizvērt meklēšanu" onClick={() => setOpen(false)} className="grid size-11 cursor-pointer place-items-center hover:text-[#fbb040] focus-visible:outline-2 focus-visible:outline-[#fbb040]"><X className="size-7" aria-hidden="true" /></button>
          </div>
          <form role="search" onSubmit={(event) => event.preventDefault()} className="flex items-center gap-3 border-b border-white/40 pb-4 focus-within:border-[#fbb040]">
            <Search className="size-6 shrink-0 text-[#fbb040]" aria-hidden="true" />
            <label htmlFor={`${id}-query`} className="sr-only">Meklēt vietnē</label>
            <input ref={input} id={`${id}-query`} type="search" value={query} onChange={(event) => updateQuery(event.target.value)} placeholder="Jaunumi, spēlētāji, komandas…" autoComplete="off" className="min-w-0 flex-1 bg-transparent py-2 font-sans text-lg text-white caret-[#fbb040] outline-none placeholder:text-white/60 sm:text-2xl [&::-webkit-search-cancel-button]:appearance-none" />
            {query && <button type="button" aria-label="Notīrīt meklēšanu" onClick={() => { updateQuery(""); input.current?.focus(); }} className="grid size-11 shrink-0 cursor-pointer place-items-center text-white/65 hover:text-[#fbb040] focus-visible:outline-2 focus-visible:outline-[#fbb040]"><X className="size-5" aria-hidden="true" /></button>}
          </form>
          <div className="mt-6 text-sm text-white/65" role="status" aria-live="polite">
            {term.length < 2 ? "Ievadi vismaz divus burtus, lai meklētu." : loading ? "Meklē…" : error ? "Neizdevās ielādēt rezultātus. Mēģini mainīt meklēšanas vārdu." : results && groups.length === 0 ? "Nekas nav atrasts. Mēģini citu meklēšanas vārdu." : results ? `Rezultāti: ${groups.reduce((count, group) => count + group.items.length, 0)}` : null}
          </div>
          {!loading && !error && term.length >= 2 && <div className="mt-8 grid gap-x-12 gap-y-8 sm:grid-cols-2">{groups.map((group) => <section key={group.title} aria-label={group.title}>
            <h3 className="mb-3 font-heading text-2xl font-semibold uppercase text-[#fbb040]">{group.title}</h3>
            <ul className="divide-y divide-white/15 border-t border-white/15">{group.items.map((item) => <li key={item.key}><Link href={item.href} onClick={() => setOpen(false)} className="block py-4 hover:text-[#fbb040] focus-visible:outline-2 focus-visible:outline-[#fbb040]"><span className="font-sans text-lg font-semibold">{item.title}</span>{item.detail && <span className="mt-1 line-clamp-2 block text-sm text-white/65">{item.detail}</span>}</Link></li>)}</ul>
          </section>)}</div>}
        </div>
      </dialog>, document.body)}
  </>;
}
