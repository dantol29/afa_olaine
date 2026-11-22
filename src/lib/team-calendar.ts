// The address of a team's calendar feed, shared by the route that serves it and the page that offers it.

/** The file name in `/kalendars/komanda/<team id>.ics`. */
export const TEAM_CALENDAR_FILE = /^(\d+)\.ics$/;

export function teamCalendarPath(teamId: number): string {
  return `/kalendars/komanda/${teamId}.ics`;
}

/** The same feed for the "webcal:" scheme, which opens the subscription dialog in Apple Calendar and Outlook. */
export function webcalUrl(httpsUrl: string): string {
  return httpsUrl.replace(/^https?:/, "webcal:");
}
