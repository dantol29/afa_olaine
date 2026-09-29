"use client";

import { NavigationMenu } from "@base-ui/react/navigation-menu";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { RefObject } from "react";

import { SiteNavLink } from "./site-nav-link";

export function ClubNav({ mobile = false, onNavigate, onOpenChange, portalContainer }: { mobile?: boolean; onNavigate?: () => void; onOpenChange?: (open: boolean) => void; portalContainer?: RefObject<HTMLElement | null> }) {
  const pathname = usePathname();
  const isCurrent = ["/komanda", "/akademija"].some((path) => pathname === path || pathname?.startsWith(`${path}/`));

  if (mobile) {
    return (
      <details data-club-nav className="group border-b border-white/15">
        <summary
          data-current={isCurrent ? "true" : undefined}
          className={`flex cursor-pointer list-none items-center justify-center py-4 transition-colors hover:text-[#fbb040] [&::-webkit-details-marker]:hidden ${isCurrent ? "text-[#fbb040]" : ""}`}
        >
          Klubs
        </summary>
        <div className="flex flex-col pb-3">
          <SiteNavLink href="/komanda" onClick={onNavigate} className="py-2">Komanda</SiteNavLink>
          <SiteNavLink href="/akademija" onClick={onNavigate} className="py-2">Akadēmija</SiteNavLink>
        </div>
      </details>
    );
  }

  return (
    <NavigationMenu.Root data-club-nav render={<div />} className="relative" onValueChange={(value) => onOpenChange?.(value !== null)}>
      <NavigationMenu.List className="list-none">
        <NavigationMenu.Item>
          <NavigationMenu.Trigger
            data-current={isCurrent ? "true" : undefined}
            className={`flex items-center py-2 font-inherit uppercase transition-colors hover:text-[#fbb040] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white data-[popup-open]:text-[#fbb040] ${isCurrent ? "text-[#fbb040]" : ""}`}
          >
            Klubs
          </NavigationMenu.Trigger>
          <NavigationMenu.Content className="w-full">
            <div className="mx-auto grid min-h-[280px] w-[calc(100%-3rem)] max-w-[1500px] grid-cols-[180px_1fr] gap-10 py-10 md:w-[calc(100%-10rem)]">
              <h2 className="font-heading text-[40px] font-semibold uppercase leading-none text-white">Klubs</h2>
              <div className="flex flex-col items-start gap-5 pt-1 font-heading text-[18px] font-semibold uppercase tracking-wide text-white/65">
                <NavigationMenu.Link render={<Link href="/komanda" />} aria-current={pathname?.startsWith("/komanda") ? "page" : undefined} className="transition-colors hover:text-[#fbb040] focus-visible:text-[#fbb040] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Komanda</NavigationMenu.Link>
                <NavigationMenu.Link render={<Link href="/akademija" />} aria-current={pathname?.startsWith("/akademija") ? "page" : undefined} className="transition-colors hover:text-[#fbb040] focus-visible:text-[#fbb040] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Akadēmija</NavigationMenu.Link>
              </div>
            </div>
          </NavigationMenu.Content>
        </NavigationMenu.Item>
      </NavigationMenu.List>
      <NavigationMenu.Portal container={portalContainer}>
        <NavigationMenu.Positioner sideOffset={0} collisionAvoidance={{ side: "none" }} className="!left-0 z-[40] !w-screen">
          <NavigationMenu.Popup className="w-full border-t border-white/10 bg-[#090909] shadow-[0_24px_50px_rgba(0,0,0,0.55)]">
            <NavigationMenu.Viewport className="w-full" />
          </NavigationMenu.Popup>
        </NavigationMenu.Positioner>
      </NavigationMenu.Portal>
    </NavigationMenu.Root>
  );
}
