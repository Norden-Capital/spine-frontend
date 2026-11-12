// Private wallet (module 5): types. Server and client.
import type { Category } from "./catalog-types";
import type { Currency, FileRef, Totals, TxType } from "./transactions-types";

export type WalletStatus = { hasPin: boolean; unlocked: boolean; lockedUntil: string | null };

export type CategoryRef = Pick<Category, "id" | "name" | "icon" | "archived" | "parentId">;

export type WalletTx = {
  id: string;
  type: TxType;
  amount: string;
  currency: Currency;
  date: string;
  description: string;
  /** The transaction's own website as a bare domain ("claude.ai"), or null. */
  website?: string | null;
  /** The picture to show (own site, else category, else parent category), or null = category icon. */
  logoUrl?: string | null;
  category: CategoryRef;
  tags: { id: string; name: string }[];
  files: FileRef[];
  recurringId: string | null;
  createdAt: string;
  updatedAt: string | null;
};

export type BudgetStatus = "OK" | "WARNING" | "EXCEEDED";

export type Budget = {
  id: string;
  currency: Currency;
  limit: string;
  /** null = a total budget for the currency. */
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
  currency: Currency;
  deadline: string | null;
  saved: string;
  percent: number;
  contributions: Contribution[];
};

export type Frequency = "WEEKLY" | "MONTHLY" | "YEARLY";

export type Recurring = {
  id: string;
  name: string;
  type: TxType;
  amount: string;
  currency: Currency;
  category: CategoryRef;
  description: string;
  frequency: Frequency;
  startDate: string;
  nextDate: string;
  active: boolean;
};

export type Dashboard = {
  balance: Partial<Record<Currency, string>>;
  thisMonth: Totals;
  budgets: Budget[];
  goals: Goal[];
  recent: WalletTx[];
};

export const FREQUENCY_LABEL: Record<Frequency, string> = { WEEKLY: "Every week", MONTHLY: "Every month", YEARLY: "Every year" };
