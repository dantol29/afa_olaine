"use client";

import Image from "next/image";

import type { LocationHint, VenueSource } from "@/lib/venue";

import { SuggestInput } from "./suggest-input";

const SOURCE_LOGOS: Record<VenueSource, { src: string; alt: string }> = {
  afa: { src: "/afaolaine-logo.png", alt: "AFA" },
  fk: { src: "/fk-olaine-crest.png", alt: "FK" },
};
const LOGO_SIZE = 18;

/** The place field of the admin forms. Each suggestion shows which club writes the place exactly this way, so two
 *  spellings of one place are easy to tell apart until they are made one. */
export function LocationInput({
  options,
  ...field
}: {
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly LocationHint[];
  required?: boolean;
  className?: string;
}) {
  const sourcesByName = new Map(options.map((option) => [option.name, option.sources]));
  return (
    <SuggestInput
      {...field}
      options={options.map((option) => option.name)}
      iconFor={(name) => (
        <span className="flex w-10 shrink-0 gap-1" title={(sourcesByName.get(name) ?? []).map((source) => SOURCE_LOGOS[source].alt).join(" + ")}>
          {(sourcesByName.get(name) ?? []).map((source) => (
            <Image key={source} src={SOURCE_LOGOS[source].src} alt={SOURCE_LOGOS[source].alt} width={LOGO_SIZE} height={LOGO_SIZE} className="object-contain" />
          ))}
        </span>
      )}
    />
  );
}
