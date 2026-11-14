// Private wallet (module 5): types. Server and client.
import type { Category } from "./catalog-types";
import { formatMoney, signedMoney, type Currency, type FileRef, type Totals, type TxType } from "./transactions-types";
import type { RepeatUnit, UpcomingDate } from "./repeat-schedule";

// ---- currency (MAD / USD) ---------------------------------------------------
// Each wallet item has its own currency. Totals are in the person's default
// currency, converted with their own rate: 1 USD = usdRate MAD.

export type WalletCurrency = Currency;

/** The currency of a wallet item or answer; missing/unknown = USD (older answers). */
export function walletCurrencyOf(value: string | null | undefined): WalletCurrency {
  return value === "MAD" ? "MAD" : "USD";
}

/** The rate as a number (1 USD = rate MAD); a bad value = 10 (the default). */
export function rateOf(value: string | number | null | undefined): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 10;
}

/** Wallet money with its currency: "$1,234.00" / "1,234.00 MAD" (sign like formatMoney). */
export function walletMoney(amount: string | number, currency: string | null | undefined, sign?: "+" | "-"): string {
  return formatMoney(amount, sign, walletCurrencyOf(currency));
}

/** Wallet money with a direction: "+$20.00", "−2,000.00 MAD" (like signedMoney). */
export function walletSigned(
  amount: string | number,
  direction: "in" | "out" | "net",
  currency: string | null | undefined
): string {
  return signedMoney(amount, direction, walletCurrencyOf(currency));
}

/** A balance (a state, not a move): no "+", a "−" stays when below 0. */
export function walletBalance(amount: string | number, currency: string | null | undefined): string {
  return walletMoney(amount, currency, Number(amount) < 0 ? "-" : undefined);
}

/** Convert an amount between the two currencies (USD→MAD = × rate, MAD→USD = ÷ rate). Not rounded. */
export function convertMoney(amount: number, from: WalletCurrency, to: WalletCurrency, usdRate: number): number {
  if (from === to) return amount;
  return from === "USD" ? amount * usdRate : amount / usdRate;
}

const RATE = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4, useGrouping: false });

/** "10.00", "10.125" (2 to 4 decimals). */
export function formatRate(rate: number): string {
  return RATE.format(rate);
}

/** "1 USD = 10.00 MAD". */
export function usdRateText(usdRate: number): string {
  return `1 USD = ${formatRate(usdRate)} MAD`;
}

/**
 * Balance card footer: how the other currency is counted. Default MAD:
 * "USD counted at" / "1 USD = 10.00 MAD"; default USD: "MAD counted at" / "1 MAD = 0.10 USD".
 */
export function rateFooter(defaultCurrency: WalletCurrency, usdRate: number): { label: string; value: string } {
  return defaultCurrency === "MAD"
    ? { label: "USD counted at", value: usdRateText(usdRate) }
    : { label: "MAD counted at", value: `1 MAD = ${formatRate(1 / usdRate)} USD` };
}

export type WalletStatus = { hasPin: boolean; unlocked: boolean; lockedUntil: string | null };

export type CategoryRef = Pick<Category, "id" | "name" | "icon" | "archived" | "parentId" | "kind">;

export type WalletTx = {
  id: string;
  type: TxType;
  amount: string;
  date: string;
  description: string;
  /** The transaction's own website as a bare domain ("claude.ai"), or null. */
  website?: string | null;
  /** Logo URLs to try in order (own site, else category, else parent category), absolute http/https. Empty = category icon. */
  logoUrls?: string[] | null;
  category: CategoryRef;
  files: FileRef[];
  recurringId: string | null;
  createdAt: string;
  updatedAt: string | null;
  /** This transaction's own currency (missing = USD, older answers). */
  currency?: WalletCurrency;
};

export type BudgetStatus = "OK" | "WARNING" | "EXCEEDED";

export type Budget = {
  id: string;
  limit: string;
  /** null = a total budget (all spending). */
  category: CategoryRef | null;
  spent: string;
  percent: number;
  status: BudgetStatus;
  /** The budget's currency: limit, spent and alerts are in it (spent is converted into it). */
  currency?: WalletCurrency;
};

/** One money move of a goal: ADD = from the balance into the goal, TAKE_OUT = back to the balance. */
export type MovementType = "ADD" | "TAKE_OUT";

/** One movement (amount always positive, newest first). */
export type Contribution = { id: string; type: MovementType; amount: string; date: string; note: string | null };

export type Goal = {
  id: string;
  name: string;
  target: string;
  deadline: string | null;
  saved: string;
  percent: number;
  contributions: Contribution[];
  /** The goal's currency: target, saved and its money moves are in it. */
  currency?: WalletCurrency;
};

export type Recurring = {
  id: string;
  name: string;
  type: TxType;
  amount: string;
  category: CategoryRef;
  description: string;
  /** How often: every `every` `unit`s (e.g. MONTH / 3). */
  unit: RepeatUnit;
  every: number;
  startDate: string;
  /** Next date that is really added (skipped dates left out). */
  nextDate: string | null;
  /** false = paused with no end. */
  active: boolean;
  /** Paused until this day ("YYYY-MM-DD"), then it goes on by itself. */
  pausedUntil: string | null;
  /** The next 6 dates from my today, with their status. */
  upcoming: UpcomingDate[];
  /** The item's currency: the transactions it makes use it. */
  currency?: WalletCurrency;
};

export type Dashboard = {
  /** AVAILABLE balance (in `currency`), e.g. "2749.75": income − expenses − money in goals. Can be below 0. */
  balance: string;
  /** All money now in goals (every goal's saved, converted into `currency`). */
  savedInGoals?: string;
  /** The default currency all totals here are in (balance, savedInGoals, thisMonth). */
  currency?: WalletCurrency;
  /** The rate used for the totals: 1 USD = usdRate MAD, e.g. "10.00". */
  usdRate?: string;
  thisMonth: Totals;
  budgets: Budget[];
  goals: Goal[];
  recent: WalletTx[];
};

export type Savings = {
  count: number;
  /** Sum of every goal's saved money, e.g. 1850. */
  saved: number;
  /** Sum of every goal's target. */
  target: number;
  /** saved / target, 0–100 (whole number). */
  percent: number;
  /** The goal to work on next: not reached yet, closest deadline first, else the first one. null = all reached. */
  next: Goal | null;
};

/** Where goal sums go: the default currency and the rate (1 USD = usdRate MAD). */
export type TotalsIn = { currency: WalletCurrency; usdRate: number };

/** A goal amount converted into the totals currency (no `to` = as is). */
function inTotals(amount: string, goal: Goal, to?: TotalsIn): number {
  const n = Number(amount) || 0;
  return to ? convertMoney(n, walletCurrencyOf(goal.currency), to.currency, to.usdRate) : n;
}

/** Money moved into goals in a month ("YYYY-MM"): ADD moves only (the Savings card's "In"), in `to`'s currency. */
export function movedIntoGoals(goals: Goal[], month: string, to?: TotalsIn): number {
  return goals
    .flatMap((g) => (g.contributions ?? []).map((c) => ({ g, c })))
    .filter(({ c }) => c.type !== "TAKE_OUT" && c.date.startsWith(month))
    .reduce((sum, { g, c }) => sum + inTotals(c.amount, g, to), 0);
}

/** Wallet "Savings" card: totals over all goals, in `to`'s currency (goals in the other one are converted). */
export function savingsOf(goals: Goal[], to?: TotalsIn): Savings {
  const saved = goals.reduce((sum, g) => sum + inTotals(g.saved, g, to), 0);
  const target = goals.reduce((sum, g) => sum + inTotals(g.target, g, to), 0);
  const percent = target > 0 ? Math.min(100, Math.floor((saved / target) * 100)) : 0;
  const open = goals.filter((g) => (Number(g.saved) || 0) < (Number(g.target) || 0));
  const dated = open.filter((g) => g.deadline).sort((a, b) => a.deadline!.localeCompare(b.deadline!));
  return { count: goals.length, saved, target, percent, next: dated[0] ?? open[0] ?? null };
}
