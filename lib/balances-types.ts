// Balances (company space): accounts the company tops up (an API, a toll
// pass, ads…). Spine guesses the balance from the cut and how often.
// Shared by server and client code. The API shape (BalanceApi.java) lives here only.
import type { DateFormat } from "./prefs";
import { daysBetween, shortDay } from "./repeat-schedule";
import { formatMoney, type PersonRef } from "./transactions-types";

/** DAY / WEEK / MONTH / YEAR = every N units; TIMES_A_MONTH = N times a month. */
export type BalanceUnit = "DAY" | "WEEK" | "MONTH" | "YEAR" | "TIMES_A_MONTH";
/** RED = empty or under the low limit; AMBER = empty within the warn days, or the next cut goes under the limit. */
export type BalanceUrgency = "RED" | "AMBER" | "GREEN";

export type BalanceCategory = {
  id: string;
  name: string;
  icon: string;
  archived?: boolean;
  parentId?: string | null;
  kind?: string;
};

export type Balance = {
  id: string;
  name: string;
  website: string | null;
  logoUrls: string[] | null;
  category: BalanceCategory;
  /** Each cut, decimal as text ("12.00"). */
  cut: string;
  unit: BalanceUnit;
  every: number;
  /** The next cut date after today, "YYYY-MM-DD". */
  nextCut: string;
  lowLimit: string | null;
  warnDays: number;
  note: string | null;
  /** The start point: the balance at the end of startDate (last create, recharge or fix). */
  startAmount: string;
  startDate: string;
  /** The guess for today, never below 0. */
  guess: string;
  /** guess / startAmount, 0–100 (the bar). */
  percent: number;
  perMonth: string;
  /** The cut date that takes the guess to $0 (past or today when empty); null = too far. */
  emptyDate: string | null;
  /** Days from today to emptyDate (0 or less when empty). */
  daysLeft: number | null;
  empty: boolean;
  /** The first date the guess is under the low limit. */
  lowFrom: string | null;
  urgency: BalanceUrgency;
  canEdit: boolean;
};

export type BalanceList = {
  summary: { count: number; perMonth: string; needRecharge: number; red: number; amber: number };
  /** Most urgent first. */
  items: Balance[];
};

export type BalanceHistoryType = "CREATED" | "RECHARGE" | "FIX" | "CUTS";

/**
 * CREATED / RECHARGE / FIX: amount (start amount, money added, real balance typed),
 * guessBefore (RECHARGE, FIX), startAfter, by; RECHARGE also transactionId.
 * CUTS: count, from / to (first and last cut date), each, total.
 */
export type BalanceHistoryItem = {
  type: BalanceHistoryType;
  date: string;
  amount: string | null;
  guessBefore: string | null;
  startAfter: string | null;
  transactionId: string | null;
  by: PersonRef | null;
  count: number | null;
  from: string | null;
  to: string | null;
  each: string | null;
  total: string | null;
};

/** History newest first. */
export type BalanceDetail = { balance: Balance; history: BalanceHistoryItem[] };

/** Body of POST and PUT /api/admin/balances. */
export type BalanceInput = {
  name: string;
  website: string | null;
  categoryId: string;
  cut: string;
  unit: BalanceUnit;
  every: number;
  nextCut: string | null;
  /** Create only: the balance now. Ignored on edit (use fix). */
  startAmount?: string;
  lowLimit: string | null;
  warnDays: number;
  note: string | null;
};

/** The page of one balance (read: everyone). */
export const balancePath = (id: string) => `/balances/${encodeURIComponent(id)}`;
/** Writes (create, edit, delete, recharge, fix): the owner, under /api/admin. */
export const balanceAdminPath = (id?: string) => (id ? `/admin/balances/${encodeURIComponent(id)}` : "/admin/balances");

/* ---------- how often ---------- */

export const UNIT_LIMITS: Record<BalanceUnit, { min: number; max: number }> = {
  DAY: { min: 1, max: 365 },
  WEEK: { min: 1, max: 52 },
  MONTH: { min: 1, max: 24 },
  YEAR: { min: 1, max: 5 },
  TIMES_A_MONTH: { min: 1, max: 31 },
};

/** Quick choices (chips), like the repeat expenses. */
export const FREQUENCY_PRESETS: { label: string; unit: BalanceUnit; every: number }[] = [
  { label: "Every day", unit: "DAY", every: 1 },
  { label: "Every week", unit: "WEEK", every: 1 },
  { label: "Once a month", unit: "MONTH", every: 1 },
];

const MONTH_DAYS = 30.44;
const MONTH_WEEKS = 4.35;

/** "Every day", "Every 3 days", "Every week", "Once a month", "8 times a month"… */
export function frequencyLabel(unit: BalanceUnit, every: number): string {
  const n = every;
  switch (unit) {
    case "TIMES_A_MONTH":
      return n === 1 ? "Once a month" : n === 2 ? "Twice a month" : `${n} times a month`;
    case "DAY":
      return n === 1 ? "Every day" : `Every ${n} days`;
    case "WEEK":
      return n === 1 ? "Every week" : `Every ${n} weeks`;
    case "MONTH":
      return n === 1 ? "Once a month" : `Every ${n} months`;
    case "YEAR":
      return n === 1 ? "Every year" : `Every ${n} years`;
  }
}

/** Short word for the "Each cut" tile: "daily", "weekly", "8× a month"… */
export function frequencyShort(unit: BalanceUnit, every: number): string {
  const n = every;
  switch (unit) {
    case "TIMES_A_MONTH":
      return n === 1 ? "monthly" : `${n}× a month`;
    case "DAY":
      return n === 1 ? "daily" : `every ${n} days`;
    case "WEEK":
      return n === 1 ? "weekly" : `every ${n} weeks`;
    case "MONTH":
      return n === 1 ? "monthly" : `every ${n} months`;
    case "YEAR":
      return n === 1 ? "yearly" : `every ${n} years`;
  }
}

function utc(day: string): Date {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}
const iso = (d: Date) => d.toISOString().slice(0, 10);

function addDays(day: string, n: number): string {
  return iso(new Date(utc(day).getTime() + n * 86_400_000));
}

/** Like Java plusMonths: the day is clamped to the month's last day. */
function addMonths(day: string, n: number): string {
  const d = utc(day);
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + n;
  const last = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  return iso(new Date(Date.UTC(y, m, Math.min(d.getUTCDate(), last))));
}

/** The k-th cut date of the series that starts at `anchor` (same as BalanceMath.cut). */
export function cutDate(anchor: string, unit: BalanceUnit, every: number, k: number): string {
  const n = Math.max(1, every);
  switch (unit) {
    case "DAY":
      return addDays(anchor, k * n);
    case "WEEK":
      return addDays(anchor, 7 * k * n);
    case "MONTH":
      return addMonths(anchor, k * n);
    case "YEAR":
      return addMonths(anchor, 12 * k * n);
    case "TIMES_A_MONTH":
      return addDays(anchor, Math.round((k * MONTH_DAYS) / n));
  }
}

/** Cost a month (same as BalanceMath.perMonth). */
export function monthlyCost(cut: number, unit: BalanceUnit, every: number): number {
  const n = Math.max(1, every);
  const v =
    unit === "DAY"
      ? (cut * MONTH_DAYS) / n
      : unit === "WEEK"
        ? (cut * MONTH_WEEKS) / n
        : unit === "MONTH"
          ? cut / n
          : unit === "YEAR"
            ? cut / (12 * n)
            : cut * n;
  return Math.round(v * 100) / 100;
}

/**
 * Preview of the empty date for a new start: `balance` today, the series starts
 * at `nextCut` (after today). The ceil(balance / cut)-th cut; today when 0.
 */
export function guessEmptyDate(balance: number, cut: number, nextCut: string, unit: BalanceUnit, every: number, today: string): string | null {
  if (!(cut > 0) || !nextCut) return null;
  if (balance <= 0) return today;
  return cutDate(nextCut, unit, every, Math.ceil(balance / cut) - 1);
}

/** The default "Next cut": one step after today (BalanceMath.oneStepAfter). */
export function defaultNextCut(today: string, unit: BalanceUnit, every: number): string {
  return cutDate(today, unit, every, 1);
}

/* ---------- words ---------- */

type Fmt = { dateFormat?: DateFormat; today: string };

/** "7 days", "1 day", "7 weeks", "3 months". */
export function inWords(days: number): string {
  if (days <= 31) return `${days} ${days === 1 ? "day" : "days"}`;
  if (days < 120) return `${Math.round(days / 7)} weeks`;
  return `${Math.round(days / MONTH_DAYS)} months`;
}

/** "~Sat 21 Nov" */
export function aboutDay(day: string, fmt: Fmt): string {
  return `~${shortDay(day, { ...fmt, weekday: true })}`;
}

const daysLeftOf = (b: Pick<Balance, "emptyDate" | "daysLeft">, today: string) =>
  b.daysLeft ?? (b.emptyDate ? daysBetween(today, b.emptyDate) : null);

/** The gray line under a row: "Runs out in 7 days · ~Sat 21 Nov" / "Empty since ~Thu 12 Nov" / "Empty ~Mon 23 Nov". */
export function runsOutLine(b: Pick<Balance, "emptyDate" | "daysLeft" | "empty" | "urgency">, fmt: Fmt): string {
  const days = daysLeftOf(b, fmt.today);
  if (!b.emptyDate || days === null) return "Lasts a long time";
  if (b.empty || days <= 0) return days < 0 ? `Empty since ${aboutDay(b.emptyDate, fmt)}` : "Empty today";
  if (b.urgency === "RED") return `Empty ${aboutDay(b.emptyDate, fmt)}`;
  return `Runs out in ${inWords(days)} · ${aboutDay(b.emptyDate, fmt)}`;
}

/** The hero line (white text): "Runs out in 7 days" / "Empty" / "Below your limit". */
export function heroStatus(b: Pick<Balance, "emptyDate" | "daysLeft" | "empty" | "urgency">, today: string): string {
  if (b.empty) return "Empty";
  if (b.urgency === "RED") return "Below your limit";
  const days = daysLeftOf(b, today);
  if (days === null) return "Lasts a long time";
  return `Runs out in ${inWords(Math.max(0, days))}`;
}

/** The status text on the right of a row (no pill). null = GREEN. */
export function statusText(
  b: Pick<Balance, "emptyDate" | "daysLeft" | "empty" | "urgency" | "lowLimit">,
  today: string
): { tone: "red" | "amber"; label: string } | null {
  if (b.urgency === "RED") {
    if (b.empty) return { tone: "red", label: "Empty" };
    return { tone: "red", label: b.lowLimit ? `Below ${formatMoney(b.lowLimit)}` : "Low" };
  }
  if (b.urgency === "AMBER") {
    const days = daysLeftOf(b, today);
    if (days === null) return { tone: "amber", label: "Low soon" };
    return { tone: "amber", label: days <= 0 ? "Today" : days === 1 ? "Tomorrow" : `In ${inWords(days)}` };
  }
  return null;
}

/** Bar fill 0…1 (the server's percent). */
export const barValue = (b: Pick<Balance, "percent">) => Math.min(1, Math.max(0, (b.percent ?? 0) / 100));

/** Most urgent first: red, then amber, then by empty date (no date last). */
export function byUrgency(a: Balance, b: Balance): number {
  const rank = (u: BalanceUrgency) => (u === "RED" ? 0 : u === "AMBER" ? 1 : 2);
  return (
    rank(a.urgency) - rank(b.urgency) ||
    (a.emptyDate ?? "9999").localeCompare(b.emptyDate ?? "9999") ||
    a.name.localeCompare(b.name)
  );
}
