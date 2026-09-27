"use client";

import Image from "next/image";
import { Link2, Send } from "lucide-react";
import { useState } from "react";

export function ArticleShareButtons({ title }: { title: string }) {
  const [copyStatus, setCopyStatus] = useState("");

  function openShare(platform: "facebook" | "telegram") {
    const pageUrl = encodeURIComponent(window.location.href);
    const shareUrl = platform === "facebook"
      ? `https://www.facebook.com/sharer/sharer.php?u=${pageUrl}`
      : `https://t.me/share/url?url=${pageUrl}&text=${encodeURIComponent(title)}`;
    window.open(shareUrl, "_blank", "noopener,noreferrer,width=640,height=480");
  }

  async function copyLink(status = "Saite nokopēta") {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopyStatus(status);
    } catch {
      setCopyStatus("Saiti neizdevās nokopēt");
    }
  }

  async function shareOnInstagram() {
    if (navigator.share) {
      try {
        await navigator.share({ title, url: window.location.href });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    await copyLink("Saite nokopēta — ielīmē to Instagram");
  }

  const buttonClass = "grid size-9 place-items-center border border-white/35 text-white transition-colors hover:border-[#fbb040] hover:bg-[#fbb040] hover:text-[#050505] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fbb040]";

  return (
    <div className="flex items-center gap-2" role="group" aria-label="Dalīties ar rakstu">
      <button type="button" aria-label="Kopīgot Facebook" onClick={() => openShare("facebook")} className={buttonClass}>
        <Image src="/article-facebook.svg" alt="" width={18} height={18} className="size-[18px]" />
      </button>
      <button type="button" aria-label="Kopīgot Telegram" onClick={() => openShare("telegram")} className={buttonClass}>
        <Send className="size-[18px]" strokeWidth={1.8} aria-hidden="true" />
      </button>
      <button type="button" aria-label="Kopīgot Instagram" onClick={shareOnInstagram} className={buttonClass}>
        <Image src="/footer-instagram.svg" alt="" width={18} height={18} className="size-[18px]" />
      </button>
      <button type="button" aria-label="Kopēt raksta saiti" onClick={() => void copyLink()} className={buttonClass}>
        <Link2 className="size-[18px]" aria-hidden="true" />
      </button>
      <span role="status" className="sr-only" aria-live="polite">{copyStatus}</span>
    </div>
  );
}
