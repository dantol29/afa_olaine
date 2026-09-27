"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Award,
  ArrowUpRight,
  CalendarDays,
  Dumbbell,
  FileText,
  Handshake,
  ImageIcon,
  LogOut,
  Menu,
  MessageCircleQuestion,
  Newspaper,
  Settings,
  Trophy,
  UserRound,
  Users,
  Volleyball,
  X,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { logout } from "@/app/admin/login/actions";

const NAV_ITEMS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/admin/teams", label: "Komandas", icon: Users },
  { href: "/admin/players", label: "Spēlētāji", icon: UserRound },
  { href: "/admin/coaches", label: "Treneri", icon: Award },
  { href: "/admin/trainings", label: "Treniņi", icon: Dumbbell },
  { href: "/admin/events", label: "Notikumi", icon: CalendarDays },
  { href: "/admin/games", label: "Spēles", icon: Volleyball },
  { href: "/admin/league-sources", label: "Līgu avoti", icon: Trophy },
  { href: "/admin/club-pages", label: "Kluba lapas", icon: FileText },
  { href: "/admin/club-logos", label: "Klubu logo", icon: ImageIcon },
  { href: "/admin/partners", label: "Partneri", icon: Handshake },
  { href: "/admin/aptaujas", label: "Aptaujas", icon: MessageCircleQuestion },
  { href: "/admin/jaunumi", label: "Jaunumi", icon: Newspaper },
  { href: "/admin/site-settings", label: "Iestatījumi", icon: Settings },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <>
      <div>
        <Link href="/admin" onClick={onNavigate} className="flex items-center gap-3 border-b border-white/15 pb-7">
          <Image
            src="/hero-logo.png"
            alt="AFA Olaine"
            width={64}
            height={64}
            className="size-14 object-contain"
          />
          <span className="font-heading text-2xl font-semibold uppercase leading-none">AFA Olaine<span className="mt-1 block text-xs tracking-[0.18em] text-[#fbb040]">Administrācija</span></span>
        </Link>
        <nav aria-label="Administrācijas navigācija" className="mt-6 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex min-h-11 items-center gap-3 border-l-2 px-4 py-2 font-heading text-base font-medium uppercase transition-colors",
                  isActive
                    ? "border-[#fbb040] bg-[#fbb040]/10 text-[#fbb040]"
                    : "border-transparent text-white/65 hover:bg-white/5 hover:text-white",
                )}
              >
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="mt-8 border-t border-white/15 pt-6">
        <Link href="/" onClick={onNavigate} className="mb-4 flex items-center justify-between px-4 font-heading text-sm uppercase text-white/55 transition-colors hover:text-white">Atvērt mājaslapu<ArrowUpRight className="size-4" aria-hidden="true" /></Link>
        <form action={logout}>
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 border border-white/35 px-3 py-3 font-heading text-base font-semibold uppercase text-white transition-colors hover:border-[#fbb040] hover:text-[#fbb040]"
          >
            <LogOut className="size-4" aria-hidden="true" />
            Iziet
          </button>
        </form>
      </div>
    </>
  );
}

export function AdminSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-white/15 bg-[#111] px-6 py-3 lg:hidden">
        <Link href="/admin">
          <Image
            src="/hero-logo.png"
            alt="AFA Olaine"
            width={48}
            height={48}
            className="size-11 object-contain"
          />
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Atvērt izvēlni"
          className="grid size-11 place-items-center border border-white/30 text-white transition-colors hover:border-[#fbb040]"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col justify-between overflow-y-auto border-r border-white/15 bg-[#111] p-6 lg:flex">
        <SidebarContent />
      </aside>

      {/* Mobile slide-out menu */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/75"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 right-0 flex h-full w-[min(20rem,90vw)] flex-col justify-between overflow-y-auto border-l border-white/20 bg-[#111] p-6 shadow-xl">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Aizvērt izvēlni"
              className="absolute top-4 right-4 grid size-9 place-items-center text-white/65 transition-colors hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
