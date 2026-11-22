// A team's schedule as an iCalendar (RFC 5545) feed that phone calendars subscribe to. Pure, so the route and the tests
// share it. Times are written in UTC, which every calendar app shows in its own time zone.

export type IcalItem = { uid: string; title: string; location: string | null; start: Date; end: Date };

/** Apple Calendar and Outlook honour these; Google decides on its own how often to refresh. */
const REFRESH_INTERVAL = "PT1H";
/** RFC 5545 limits a content line to 75 octets; longer ones continue on lines starting with a space. */
const MAX_LINE_OCTETS = 75;
const CRLF = "\r\n";

/** "20261124T160000Z" */
export function icalTime(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/** Escapes a TEXT value: backslash, semicolon, comma and line breaks. */
export function escapeText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** Splits a line into 75-octet pieces without cutting a multi-byte character. */
export function foldLine(line: string): string {
  const encoder = new TextEncoder();
  const pieces: string[] = [];
  let current = "";
  let currentOctets = 0;
  for (const char of line) {
    const octets = encoder.encode(char).length;
    // Continuation lines start with a space, which counts toward their 75 octets.
    const limit = pieces.length === 0 ? MAX_LINE_OCTETS : MAX_LINE_OCTETS - 1;
    if (currentOctets + octets > limit) {
      pieces.push(current);
      current = "";
      currentOctets = 0;
    }
    current += char;
    currentOctets += octets;
  }
  pieces.push(current);
  return pieces.join(`${CRLF} `);
}

/** The whole feed. Items whose end is not after their start are left out, as in the calendar shared with FK. */
export function buildIcal({ name, domain, items, now }: { name: string; domain: string; items: readonly IcalItem[]; now: Date }): string {
  const stamp = icalTime(now);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//AFA Olaine//Komandas kalendārs//LV",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeText(name)}`,
    "X-WR-TIMEZONE:Europe/Riga",
    `REFRESH-INTERVAL;VALUE=DURATION:${REFRESH_INTERVAL}`,
    `X-PUBLISHED-TTL:${REFRESH_INTERVAL}`,
    ...items
      .filter((item) => item.end.getTime() > item.start.getTime())
      .flatMap((item) => [
        "BEGIN:VEVENT",
        `UID:${item.uid}@${domain}`,
        `DTSTAMP:${stamp}`,
        `DTSTART:${icalTime(item.start)}`,
        `DTEND:${icalTime(item.end)}`,
        `SUMMARY:${escapeText(item.title)}`,
        ...(item.location?.trim() ? [`LOCATION:${escapeText(item.location.trim())}`] : []),
        "END:VEVENT",
      ]),
    "END:VCALENDAR",
  ];
  return lines.map(foldLine).join(CRLF) + CRLF;
}
