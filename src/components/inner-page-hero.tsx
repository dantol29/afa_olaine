import Image from "next/image";
import Link from "next/link";
import { ChevronRight, House } from "lucide-react";

export function InnerPageHero({ title, id }: { title: string; id: string }) {
  return (
    <section
      aria-labelledby={id}
      className="relative isolate flex min-h-[400px] items-end overflow-hidden pt-24 md:min-h-[460px] md:pt-28"
      style={{
        background: "radial-gradient(ellipse 42% 85% at 22% 105%, rgba(158,151,135,0.34), transparent 72%), radial-gradient(ellipse 44% 95% at 54% 108%, rgba(153,92,24,0.54), transparent 73%), radial-gradient(ellipse 42% 90% at 82% 106%, rgba(251,176,64,0.43), transparent 72%), linear-gradient(180deg, #050505 0%, #090807 48%, #15110b 100%)",
      }}
    >
      <Image src="/afaolaine-logo-outline.png" alt="" width={1254} height={1254} priority className="pointer-events-none absolute left-[72%] top-[60%] size-[340px] max-w-none -translate-x-1/2 -translate-y-1/2 object-contain opacity-20 md:left-[57%] md:top-[65%] md:size-[520px]" />
      <nav aria-label="Atpakaļceļš" className="absolute inset-x-0 top-24 z-10 hidden md:top-28 md:block">
        <div className="mx-auto flex w-[calc(100%-3rem)] max-w-[1500px] items-center gap-3 pl-12 text-sm font-semibold text-white/65 md:w-[calc(100%-10rem)] md:pl-24">
          <Link href="/" aria-label="Sākums" className="transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"><House className="size-5" aria-hidden="true" /></Link>
          <ChevronRight className="size-4" aria-hidden="true" />
          <span aria-current="page" className="font-heading text-base uppercase text-white/80">{title}</span>
        </div>
      </nav>
      <div className="relative z-10 mx-auto w-[calc(100%-3rem)] max-w-[1500px] pb-32 md:w-[calc(100%-10rem)] md:pb-36">
        <h1 id={id} className="font-heading text-[58px] font-semibold uppercase leading-[0.9] tracking-[-0.035em] sm:text-[72px] lg:text-[88px]">{title}</h1>
      </div>
    </section>
  );
}
