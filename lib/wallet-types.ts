// Private wallet (module 5): types. Server and client.
import type { Category } from "./catalog-types";
import type { FileRef, Totals, TxType } from "./transactions-types";
import type { RepeatUnit, UpcomingDate } from "./repeat-schedule";

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
  /** The picture to show (own site, else category, else parent category), or null = category icon. */
  logoUrl?: string | null;
  category: CategoryRef;
  files: FileRef[];
  recurringId: string | null;
  createdAt: string;
  updatedAt: string | null;
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
};

export type Contribution = { id: string; amount: string; date: string; note: string | null };

export type Goal = {
  id: string;
  name: string;
  target: string;
  deadline: string | null;
  saved: string;
  percent: number;
  contributions: Contribution[];
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
};

export type Dashboard = {
  /** Wallet balance (USD), e.g. "2749.75". */
  balance: string;
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

/** Wallet "Savings" card: totals over all goals (USD). */
export function savingsOf(goals: Goal[]): Savings {
  const saved = goals.reduce((sum, g) => sum + (Number(g.saved) || 0), 0);
  const target = goals.reduce((sum, g) => sum + (Number(g.target) || 0), 0);
  const percent = target > 0 ? Math.min(100, Math.floor((saved / target) * 100)) : 0;
  const open = goals.filter((g) => (Number(g.saved) || 0) < (Number(g.target) || 0));
  const dated = open.filter((g) => g.deadline).sort((a, b) => a.deadline!.localeCompare(b.deadline!));
  return { count: goals.length, saved, target, percent, next: dated[0] ?? open[0] ?? null };
}
