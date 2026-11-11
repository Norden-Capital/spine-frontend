// Shared by the server page and the client chart (not in a "use client" file,
// so the server can call these).

/** One day of sign-ins from GET /api/me/sign-ins. Only days with data are sent. */
export type SignInDay = { date: string; ok: number; failed: number };

/** The chart shows 26 weeks (about 6 months). */
export const WEEKS = 26;

/** "YYYY-MM-DD" + n days, in plain calendar math (UTC). */
export function addDays(day: string, n: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** The Sunday that starts the first of the 26 week columns ending this week. */
export function chartStart(today: string): string {
  const weekday = new Date(`${today}T00:00:00Z`).getUTCDay();
  return addDays(today, -weekday - (WEEKS - 1) * 7);
}
