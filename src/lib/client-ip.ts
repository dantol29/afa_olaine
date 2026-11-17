/** The client IP to rate-limit by, from the X-Forwarded-For header.
 *
 *  The reverse proxy (Apache/Passenger) appends the real client IP as the
 *  LAST entry of X-Forwarded-For — any earlier entries are whatever the
 *  client itself sent and are fully attacker-controlled, so reading the
 *  first entry (as this used to) let anyone bypass the rate limit
 *  by sending a fresh fake value on every request. */
export function clientIpFromForwardedFor(forwardedFor: string | null): string {
  return forwardedFor?.split(",").map((part) => part.trim()).filter(Boolean).pop() ?? "unknown";
}
