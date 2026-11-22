"use client";

import { Copy } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const UNSAVED_COPY_WARNING = "Kopija tiks veidota no nesaglabātās versijas. Oriģināls netiks mainīts.";

/** Copy mode of an edit form: the same fields, with what is typed now, saved as a new record. The original record is
 *  left as saved. Unsaved edits are carried into the copy, after a warning. */
export function useFormCopy() {
  const [isCopy, setIsCopy] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  /** `onCopy` clears what a copy must not carry over; it runs only once the copy is confirmed. */
  function startCopy(onCopy?: () => void) {
    if (isDirty && !window.confirm(UNSAVED_COPY_WARNING)) return;
    onCopy?.();
    setIsCopy(true);
    window.scrollTo({ top: 0 });
  }

  return { isCopy, startCopy, markDirty: () => setIsDirty(true) };
}

export function CopyFormButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={() => onClick()}
      className="mt-6 ml-3 inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-club-navy transition hover:bg-club-gray-light"
    >
      <Copy aria-hidden="true" className="h-4 w-4" />
      Kopēt
    </button>
  );
}

export function CopyNotice() {
  return (
    <p className="mb-5 rounded-lg bg-club-gray-light px-4 py-3 text-sm text-club-navy">
      Šī ir kopija. Saglabājot tiks izveidots jauns ieraksts, oriģināls netiks mainīts.
    </p>
  );
}

/** The copy icon of an admin list row; it opens the new-record form filled from that row. */
export function CopyRowLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      aria-label={label}
      title="Kopēt"
      className="flex h-8 w-8 items-center justify-center rounded-lg text-club-navy transition hover:bg-club-gray-light"
    >
      <Copy className="h-4 w-4" />
    </Link>
  );
}
