import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

export function AdminLoginView({
  formAction,
  pending,
  error,
}: {
  formAction: (formData: FormData) => void;
  pending: boolean;
  error?: string;
}) {
  return (
    <main aria-labelledby="admin-login-title" className="admin-theme relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-[#050505] text-white">
      <Image
        data-admin-login-hero
        src="/match-stadium.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="-z-20 object-cover object-center"
      />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(0,0,0,.55)_0%,rgba(0,0,0,.1)_34%,rgba(0,0,0,.25)_58%,#050505_100%)]" />

      <header className="mx-auto flex w-full max-w-[1180px] items-center justify-between gap-5 px-6 py-6 sm:px-10">
        <Link href="/" aria-label="Atpakaļ uz AFA Olaine sākumlapu" className="inline-flex items-center gap-3">
          <Image src="/hero-logo.png" alt="AFA Olaine" width={72} height={72} className="size-14 object-contain sm:size-16" />
          <span className="font-heading text-xl font-semibold uppercase tracking-wide sm:text-2xl">AFA Olaine</span>
        </Link>
        <Link href="/" className="inline-flex min-h-11 items-center gap-2 border border-white/55 px-4 font-heading text-sm font-medium uppercase transition-colors hover:border-white hover:bg-white hover:text-[#050505]">
          <ArrowLeft className="size-4" aria-hidden="true" />
          <span className="hidden sm:inline">Uz sākumlapu</span>
          <span className="sm:hidden">Atpakaļ</span>
        </Link>
      </header>

      <div className="mx-auto mt-auto w-full max-w-[1180px] px-4 pt-20 sm:px-10">
        <div data-admin-login-panel className="grid gap-9 bg-[#050505] px-7 py-9 sm:px-10 sm:py-10 lg:grid-cols-[1fr_360px] lg:items-start lg:gap-14 lg:px-12 lg:py-12">
          <div>
            <h1 id="admin-login-title" className="font-heading text-[clamp(2.8rem,5vw,5rem)] font-semibold uppercase leading-[0.94]">Administrācija</h1>
            <p className="mt-5 max-w-md text-base text-white/60">Pārvaldi kluba saturu vienuviet.</p>
          </div>

          <form action={formAction} className="w-full">
            <label htmlFor="admin-password" className="block font-heading text-sm font-medium uppercase tracking-wide text-white/75">Parole</label>
            <input
              id="admin-password"
              type="password"
              name="password"
              required
              autoFocus
              autoComplete="current-password"
              className="mt-2 h-12 w-full border border-white/40 bg-[#171717] px-4 text-white outline-none transition-colors focus:border-[#fbb040]"
            />
            {error && <p role="alert" className="mt-3 text-sm font-semibold text-[#fbb040]">{error}</p>}
            <button type="submit" disabled={pending} className="mt-4 flex h-12 w-full items-center justify-between bg-[#fbb040] px-5 font-heading text-lg font-semibold uppercase text-[#050505] transition-colors hover:bg-white disabled:opacity-50">
              {pending ? "Ielogojas..." : "Ielogoties"}
              <ArrowRight className="size-5" aria-hidden="true" />
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
