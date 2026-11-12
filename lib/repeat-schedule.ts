// Repeat payments (wallet recurring + company repeat expenses): how often,
// the next dates, and how urgent the next one is. Server and client (no
// "use client" here, so server components can call these).
import type { DateFormat } from "./prefs";

export type RepeatUnit = "DAY" | "WEEK" | "MONTH" | "YEAR";

/** Status of one of the next dates (`upcoming` on every repeat item). */
export type UpcomingStatus = "UPCOMING" | "SKIPPED" | "PAUSED" | "DONE" | "DUE";
export type UpcomingDate = { date: string; status: UpcomingStatus };

/** Allowed `every` for each unit (same as the backend). */
export const REPEAT_LIMITS: Record<RepeatUnit, { min: number; max: number }> = {
  DAY: { min: 1, max: 365 },
  WEEK: { min: 1, max: 52 },
  MONTH: { min: 1, max: 24 },
  YEAR: { min: 1, max: 5 },
};

export const REPEAT_UNITS: RepeatUnit[] = ["DAY", "WEEK", "MONTH", "YEAR"];

/** The quick choices in the "How often" picker (Custom is the extra one). */
export const REPEAT_PRESETS: { unit: RepeatUnit; every: number }[] = [
  { unit: "WEEK", every: 1 },
  { unit: "WEEK", every: 2 },
  { unit: "MONTH", every: 1 },
  { unit: "MONTH", every: 3 },
  { unit: "MONTH", every: 6 },
  { unit: "YEAR", every: 1 },
];

const UNIT_WORD: Record<RepeatUnit, [string, string]> = {
  DAY: ["day", "days"],
  WEEK: ["week", "weeks"],
  MONTH: ["month", "months"],
  YEAR: ["year", "years"],
};

/** "day" / "days" for a unit and a count. */
export function unitWord(unit: RepeatUnit, count: number): string {
  return UNIT_WORD[unit][count === 1 ? 0 : 1];
}

/** "Weekly", "Every 2 weeks", "Monthly", "Every 3 months", "Yearly", "Every 10 days", "Daily"… */
export function repeatLabel(unit: RepeatUnit, every: number): string {
  if (every === 1) {
    return unit === "DAY" ? "Daily" : unit === "WEEK" ? "Weekly" : unit === "MONTH" ? "Monthly" : "Yearly";
  }
  return `Every ${every} ${unitWord(unit, every)}`;
}

/** True when unit/every is one of the quick choices. */
export function isPreset(unit: RepeatUnit, every: number): boolean {
  return REPEAT_PRESETS.some((p) => p.unit === unit && p.every === every);
}

/** Keep `every` inside the unit's limits (whole number). */
export function clampEvery(unit: RepeatUnit, every: number): number {
  const { min, max } = REPEAT_LIMITS[unit];
  if (!Number.isFinite(every)) return min;
  return Math.min(max, Math.max(min, Math.round(every)));
}

// ---------------------------------------------------------------------------
// Calendar days "YYYY-MM-DD" (no time zone: "today" comes from todayIn(zone)).

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function utc(day: string): number {
  const [y, m, d] = day.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

/** Days from `from` to `to` (to − from). */
export function daysBetween(from: string, to: string): number {
  return Math.round((utc(to) - utc(from)) / 86_400_000);
}

/** The day after `day`. */
export function nextDay(day: string): string {
  return new Date(utc(day) + 86_400_000).toISOString().slice(0, 10);
}

/**
 * Short day in words: "12 Feb" ("Feb 12" for MM/DD users). With `weekday`:
 * "Fri 27 Nov". The year is added when it is not the year of `today`.
 */
export function shortDay(
  day: string,
  opts: { dateFormat?: DateFormat; today?: string; weekday?: boolean } = {}
): string {
  const [y, m, d] = day.split("-").map(Number);
  if (!y || !m || !d) return day;
  const month = MONTHS[m - 1];
  let text = opts.dateFormat === "MM/DD/YYYY" ? `${month} ${d}` : `${d} ${month}`;
  if (opts.today && opts.today.slice(0, 4) !== day.slice(0, 4)) {
    text = opts.dateFormat === "MM/DD/YYYY" ? `${text}, ${y}` : `${text} ${y}`;
  }
  if (opts.weekday) text = `${WEEKDAYS[new Date(utc(day)).getUTCDay()]} ${text}`;
  return text;
}

export type DueState = "overdue" | "today" | "soon" | "week" | "later" | "paused";
export type DueInfo = { state: DueState; label: string };

/**
 * How urgent a date is, for <DueBadge>:
 * overdue "Overdue · 2 days" · today "Today" · soon "Tomorrow" / "In 3 days" ·
 * week "In 5 days" (4–7) · later "Fri 27 Nov" · paused "Paused" / "Paused until 1 Feb".
 * A pause wins over the date. null = no date and no pause (series finished).
 */
export function dueState(
  date: string | null | undefined,
  today: string,
  opts: { paused?: boolean; pausedUntil?: string | null; dateFormat?: DateFormat } = {}
): DueInfo | null {
  const fmt = { dateFormat: opts.dateFormat, today };
  if (opts.pausedUntil && opts.pausedUntil > today) {
    return { state: "paused", label: `Paused until ${shortDay(opts.pausedUntil, fmt)}` };
  }
  if (opts.paused) return { state: "paused", label: "Paused" };
  if (!date) return null;
  const n = daysBetween(today, date);
  if (n < 0) return { state: "overdue", label: `Overdue · ${-n} ${-n === 1 ? "day" : "days"}` };
  if (n === 0) return { state: "today", label: "Today" };
  if (n === 1) return { state: "soon", label: "Tomorrow" };
  if (n <= 3) return { state: "soon", label: `In ${n} days` };
  if (n <= 7) return { state: "week", label: `In ${n} days` };
  return { state: "later", label: shortDay(date, { ...fmt, weekday: true }) };
}
