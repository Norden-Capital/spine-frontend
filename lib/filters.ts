// Search + filters for the company list and the wallet list (module 5).
// The filters live in the page address (?q=…&type=…), so a reload or a
// shared link keeps them. Query names = the backend's (docs/api-module5.md A).
// USD only: an old ?currency= in a link is dropped without a word.
import type { TxType } from "./transactions-types";

export type Filters = {
  q?: string;
  from?: string;
  to?: string;
  month?: string;
  categoryIds?: string[];
  type?: TxType;
  createdBy?: string;
  minAmount?: string;
  maxAmount?: string;
};

type Params = Record<string, string | string[] | undefined>;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() || undefined;
const list = (v: string | string[] | undefined) =>
  (Array.isArray(v) ? v : v ? [v] : []).flatMap((x) => x.split(",")).map((x) => x.trim()).filter(Boolean);

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;
const MONEY = /^\d{1,10}(\.\d{1,2})?$/;

/** Read filters from page search params (bad values are dropped). */
export function parseFilters(p: Params): Filters {
  const f: Filters = {};
  const q = one(p.q);
  if (q) f.q = q.slice(0, 100);
  const from = one(p.from);
  const to = one(p.to);
  if (from && DAY.test(from)) f.from = from;
  if (to && DAY.test(to)) f.to = to;
  const month = one(p.month);
  if (month && MONTH.test(month) && !f.from && !f.to) f.month = month;
  const cats = list(p.categoryIds);
  if (cats.length) f.categoryIds = cats;
  const type = one(p.type);
  if (type === "EXPENSE" || type === "INCOME") f.type = type;
  const by = one(p.createdBy);
  if (by) f.createdBy = by;
  const min = one(p.minAmount)?.replace(",", ".");
  const max = one(p.maxAmount)?.replace(",", ".");
  if (min && MONEY.test(min)) f.minAmount = min;
  if (max && MONEY.test(max)) f.maxAmount = max;
  return f;
}

/** Filters -> query string (without "?"), keys sorted. Lists as comma lists. */
export function filtersToQuery(f: Filters, extra: Record<string, string | number> = {}): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(f)) {
    if (v === undefined || v === "" || (Array.isArray(v) && v.length === 0)) continue;
    q.set(k, Array.isArray(v) ? v.join(",") : String(v));
  }
  for (const [k, v] of Object.entries(extra)) q.set(k, String(v));
  q.sort(); // same filters = same string, whatever the key order
  return q.toString();
}

/** Are any filters on, other than the month? */
export function hasFilters(f: Filters): boolean {
  return Object.entries(f).some(([k, v]) => k !== "month" && v !== undefined && (!Array.isArray(v) || v.length > 0));
}

// ---- dates -------------------------------------------------------------------

const utc = (day: string) => new Date(`${day}T00:00:00Z`);
const isoDay = (d: Date) => d.toISOString().slice(0, 10);

/** "YYYY-MM-DD" plus n days. */
export function addDays(day: string, n: number): string {
  const d = utc(day);
  d.setUTCDate(d.getUTCDate() + n);
  return isoDay(d);
}

export type DatePreset = "this-month" | "last-month" | "last-3-months" | "this-year";

export const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: "this-month", label: "This month" },
  { value: "last-month", label: "Last month" },
  { value: "last-3-months", label: "Last 3 months" },
  { value: "this-year", label: "This year" },
];

/** The period part of the filters: a month, or a from–to range. */
export type Period = { month?: string; from?: string; to?: string };

/**
 * What a preset means. "This month" / "Last month" = month mode (the
 * period bar keeps its arrows); the others = a range ending today.
 */
export function presetPeriod(p: DatePreset, today: string): Period {
  const month = today.slice(0, 7);
  if (p === "this-month") return { month };
  if (p === "last-month") {
    const d = utc(`${month}-01`);
    d.setUTCMonth(d.getUTCMonth() - 1);
    return { month: isoDay(d).slice(0, 7) };
  }
  if (p === "this-year") return { from: `${today.slice(0, 4)}-01-01`, to: today };
  const d = utc(today);
  d.setUTCMonth(d.getUTCMonth() - 3);
  return { from: addDays(isoDay(d), 1), to: today };
}

/** Which preset (if any) a period is. `month` empty = the current month. */
export function matchPreset(p: Period, today: string): DatePreset | undefined {
  return DATE_PRESETS.find(({ value }) => {
    const x = presetPeriod(value, today);
    if (x.month) return !p.from && !p.to && (p.month ?? today.slice(0, 7)) === x.month;
    return p.from === x.from && p.to === x.to;
  })?.value;
}

const SHORT = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

/** "12 Oct – 11 Nov 2026" (year on both ends only when they differ). */
export function rangeLabel(from?: string, to?: string, withYear = true): string {
  if (!from && !to) return "";
  const part = (day: string | undefined, year: boolean) =>
    day ? `${SHORT.format(utc(day))}${year ? ` ${day.slice(0, 4)}` : ""}` : "…";
  const splitYears = Boolean(from && to && from.slice(0, 4) !== to.slice(0, 4));
  return `${part(from, splitYears)} – ${part(to, withYear || splitYears)}`;
}

// ---- categories by kind ------------------------------------------------------

type Kinded = { kind?: "EXPENSE" | "INCOME" };

/** Does a category fit the chosen type? (No kind known = always fits.) */
export function fitsType(c: Kinded, type?: TxType): boolean {
  return !type || !c.kind || c.kind === type;
}

/**
 * Categories in groups for the filter grid: one group per kind when both
 * kinds are shown, else one group without a title.
 */
export function groupByKind<T extends Kinded>(list: T[], type?: TxType): { title?: string; items: T[] }[] {
  const shown = list.filter((c) => fitsType(c, type));
  const income = shown.filter((c) => c.kind === "INCOME");
  const expense = shown.filter((c) => c.kind !== "INCOME");
  if (type || !income.length || !expense.length) return [{ items: shown }];
  return [
    { title: "Expense", items: expense },
    { title: "Income", items: income },
  ];
}
