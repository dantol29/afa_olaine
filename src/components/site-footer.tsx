import Image from "next/image";
import Link from "next/link";
import { Mail } from "lucide-react";

const footerLinks = [
  { label: "Sākums", href: "/" },
  { label: "Jaunumi", href: "/jaunumi" },
  { label: "Spēles", href: "/speles" },
  { label: "Treniņi", href: "/trenini" },
  { label: "Akadēmija", href: "/akademija" },
  { label: "Kontakti", href: "/kontakti" },
];

export function SiteFooter() {
  return (
    <footer id="contact" className="bg-[#050505] text-white">
      <div className="relative overflow-hidden">
        <div className="relative mx-auto w-[calc(100%-3rem)] max-w-[1500px] md:w-[calc(100%-10rem)]">
          <div className="pointer-events-none absolute -bottom-16 left-[2%] hidden h-[330px] w-[330px] opacity-[0.055] lg:block lg:-bottom-20 lg:left-[7%] lg:h-[420px] lg:w-[420px]" aria-hidden="true">
            <Image src="/afaolaine-logo-outline.png" alt="" fill sizes="420px" className="object-contain" />
          </div>

          <div className="relative grid grid-cols-1 gap-x-6 gap-y-12 py-12 sm:grid-cols-2 sm:py-16 lg:grid-cols-[1.05fr_1fr_1fr_auto] lg:gap-10 lg:py-20">
        <div>
          <Link href="/" aria-label="AFA Olaine sākumlapa" className="font-heading text-[25px] font-semibold uppercase leading-none transition-colors hover:text-white/70 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:text-[21px]">AFA Olaine</Link>
          <p className="mt-5 font-sans text-[18px] leading-[1.4] text-[#999] sm:text-[15px]">Futbola klubs<br />Olaine, Latvija</p>
          <p className="mt-5 font-sans text-[18px] leading-[1.4] text-[#999] sm:text-[15px]">Anno 2013</p>
        </div>

        <div>
          <h2 className="font-heading text-[25px] font-semibold uppercase leading-none sm:text-[21px]">Kontakti</h2>
          <div className="mt-6 flex flex-col items-start gap-5 font-sans text-[18px] leading-[1.4] text-[#999] sm:mt-5 sm:gap-3 sm:text-[15px]">
            <a href="tel:+37129332883" className="transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">+371 29332883</a>
            <a href="mailto:info@afaolaine.lv" className="transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">info@afaolaine.lv</a>
          </div>
        </div>

        <nav aria-label="Kājenes navigācija">
          <h2 className="font-heading text-[25px] font-semibold uppercase leading-none sm:text-[21px]">Citi</h2>
          <ul className="mt-6 space-y-5 font-sans text-[18px] leading-[1.4] text-[#999] sm:mt-5 sm:space-y-3 sm:text-[15px]">
            {footerLinks.map(({ label, href }) => (
              <li key={label}>
                <Link href={href} className="transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">{label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="AFA Olaine sociālie tīkli" className="flex items-start justify-start gap-7 pt-1 sm:gap-5 sm:pt-0 lg:justify-end">
          <a href="https://www.facebook.com/afaolaine.sievietes/" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="grid size-6 place-items-center transition-opacity hover:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
            <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden="true"><path d="M14.5 24V13.1h3.7l.55-4.3H14.5V6.1c0-1.25.35-2.1 2.13-2.1H19V.2A31 31 0 0 0 15.5 0C12.1 0 9.7 2.1 9.7 6v2.8H6v4.3h3.7V24h4.8Z" /></svg>
          </a>
          <a href="https://www.instagram.com/afa.olaine/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="grid size-6 place-items-center transition-opacity hover:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
            <Image src="/footer-instagram.svg" alt="" width={20} height={20} className="size-5 object-contain" />
          </a>
          <a href="https://www.youtube.com/@afaolaine" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="grid size-6 place-items-center transition-opacity hover:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
            <svg viewBox="0 0 24 24" className="size-6" aria-hidden="true"><rect x="1" y="4.5" width="22" height="15" rx="4" fill="currentColor" /><path d="m10 8.5 6 3.5-6 3.5v-7Z" fill="#050505" /></svg>
          </a>
          <a href="mailto:info@afaolaine.lv" aria-label="E-pasts" className="grid size-6 place-items-center transition-opacity hover:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
            <Mail className="size-5" aria-hidden="true" />
          </a>
        </nav>
          </div>
        </div>
      </div>

      <div className="relative border-t border-white/20">
        <div className="mx-auto flex w-[calc(100%-3rem)] max-w-[1500px] flex-col gap-4 py-5 font-sans text-[14px] leading-5 text-[#999] sm:flex-row sm:items-center sm:justify-between md:w-[calc(100%-10rem)]">
          <p>© 2026. ALL RIGHTS RESERVED</p>
          <a href="https://42days.eu/lv" target="_blank" rel="noopener noreferrer" className="flex w-fit items-center gap-2 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
            <span>Izstrādājis</span>
            <Image src="/42logo-white.webp" alt="42days" width={42} height={28} className="h-6 w-9 object-contain" />
          </a>
        </div>
      </div>
    </footer>
  );
}
