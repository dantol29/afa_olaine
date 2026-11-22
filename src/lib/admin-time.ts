// Time choices for the admin forms of games, trainings and events: whole hours in the club's working day and
// quarter-hour minutes. A saved time outside that grid (an LFF import at 18:10, say) is offered too, so opening a form
// never changes it.
import { addMinutesWithinDay } from "@/lib/time-range";

const FIRST_HOUR = 6;
const LAST_HOUR = 23;
const MINUTE_STEP = 15;

/** How long an item usually lasts, used to fill an empty end time once the start is chosen. */
export const DEFAULT_DURATION_MINUTES = {
  game: 90,
  training: 90,
  event: 180,
} as const;

const pad = (value: number) => String(value).padStart(2, "0");

/** Hour and minute of a "HH:MM" value; both empty when the value is empty or malformed. */
export function splitTime(value: string): { hour: string; minute: string } {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  return match ? { hour: match[1], minute: match[2] } : { hour: "", minute: "" };
}

function withCurrent(options: string[], current: string): string[] {
  return current && !options.includes(current) ? [...options, current].sort() : options;
}

/** "06" to "23", plus the saved hour when it is outside that range. */
export function hourOptions(currentHour: string): string[] {
  const hours = Array.from({ length: LAST_HOUR - FIRST_HOUR + 1 }, (_, index) => pad(FIRST_HOUR + index));
  return withCurrent(hours, currentHour);
}

/** "00", "15", "30", "45", plus the saved minute when it is off that grid. */
export function minuteOptions(currentMinute: string): string[] {
  const minutes = Array.from({ length: 60 / MINUTE_STEP }, (_, index) => pad(index * MINUTE_STEP));
  return withCurrent(minutes, currentMinute);
}

/** The end time filled in after the start is chosen; it never runs past the end of the day. */
export function defaultEndTime(startTime: string, durationMinutes: number): string {
  return addMinutesWithinDay(startTime, durationMinutes);
}
